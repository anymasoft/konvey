//! Sidecar — manages the Python backend process and JSON-RPC communication.
//!
//! In production: launches the packaged exe `binaries/konvey-backend-<target>.exe`
//! (Tauri Sidecar convention).
//!
//! In development: if env var KONVEY_SIDECAR_MODE=dev, launches
//! `python -m konvey_backend` from `backend/` directory (faster iteration —
//! no need to rebuild exe on every backend change).

use std::collections::HashMap;
use std::process::Stdio;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

use anyhow::{anyhow, Context, Result};
use serde_json::{json, Value};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, ChildStdin, Command};
use tokio::sync::{oneshot, Mutex};

/// Pending requests keyed by JSON-RPC id, waiting for stdout response.
type PendingMap = Arc<Mutex<HashMap<u64, oneshot::Sender<Value>>>>;

pub struct Sidecar {
    child: Child,
    stdin: ChildStdin,
    pending: PendingMap,
    next_id: AtomicU64,
}

impl Sidecar {
    /// Find the backend/ directory relative to the running konvey.exe.
    /// In dev mode the exe lives in src-tauri/target/debug/, and backend/ is two levels up.
    /// We walk up the tree looking for a folder named "backend" with src/konvey_backend/__init__.py.
    fn find_backend_dir() -> Option<std::path::PathBuf> {
        if let Ok(env_dir) = std::env::var("KONVEY_BACKEND_DIR") {
            let p = std::path::PathBuf::from(env_dir);
            if p.exists() {
                return Some(p);
            }
        }
        let exe = std::env::current_exe().ok()?;
        let mut p = exe.parent()?.to_path_buf();
        for _ in 0..8 {
            let candidate = p.join("backend");
            if candidate.join("src").join("konvey_backend").join("__init__.py").exists() {
                return Some(candidate);
            }
            p = p.parent()?.to_path_buf();
        }
        None
    }

    pub async fn start(_app: &tauri::AppHandle) -> Result<Self> {
        let dev_mode =
            std::env::var("KONVEY_SIDECAR_MODE").unwrap_or_default().to_lowercase() == "dev";

        let mut child = if dev_mode {
            // Dev: run Python from backend/ directory.
            // CRITICAL: use venv python (system python may lack konvey_backend / lxml / pydantic).
            // dev.ps1 sets KONVEY_SIDECAR_PYTHON pointing to backend/.venv/Scripts/python.exe.
            let python = std::env::var("KONVEY_SIDECAR_PYTHON")
                .unwrap_or_else(|_| "python".to_string());

            let backend_dir = Self::find_backend_dir()
                .ok_or_else(|| anyhow!(
                    "Could not locate backend/ directory. Set KONVEY_BACKEND_DIR env var, \
                     or run from a checkout where backend/src/konvey_backend exists."
                ))?;

            let pythonpath = backend_dir.join("src");

            log::info!("Starting sidecar in DEV mode:");
            log::info!("  python: {}", python);
            log::info!("  cwd:    {}", backend_dir.display());
            log::info!("  PYTHONPATH: {}", pythonpath.display());

            Command::new(&python)
                .args(["-u", "-m", "konvey_backend"])  // -u = unbuffered stdout/stderr
                .current_dir(&backend_dir)
                .env("PYTHONPATH", &pythonpath)
                .env("PYTHONIOENCODING", "utf-8")
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .kill_on_drop(true)
                .spawn()
                .with_context(|| format!("Failed to spawn python sidecar: {} -u -m konvey_backend", python))?
        } else {
            // Prod: launch packaged sidecar exe placed next to konvey.exe by Tauri bundler.
            log::info!("Starting sidecar in PROD mode (packaged exe)");
            let exe_name = if cfg!(target_os = "windows") {
                "konvey-backend.exe"
            } else {
                "konvey-backend"
            };
            // Try next to current exe first, then plain PATH lookup.
            let path_to_exec = std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|d| d.join(exe_name)))
                .filter(|p| p.exists())
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|| exe_name.to_string());

            Command::new(&path_to_exec)
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .kill_on_drop(true)
                .spawn()
                .with_context(|| format!("Failed to spawn packaged sidecar {}", path_to_exec))?
        };

        let stdin = child.stdin.take().ok_or_else(|| anyhow!("No stdin on sidecar"))?;
        let stdout = child.stdout.take().ok_or_else(|| anyhow!("No stdout on sidecar"))?;
        let stderr = child.stderr.take().ok_or_else(|| anyhow!("No stderr on sidecar"))?;

        let pending: PendingMap = Arc::new(Mutex::new(HashMap::new()));
        let pending_for_reader = pending.clone();

        // Reader task: reads stdout line-by-line, matches by JSON-RPC id, resolves oneshots.
        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let value: Value = match serde_json::from_str(&line) {
                    Ok(v) => v,
                    Err(e) => {
                        log::warn!("Sidecar produced invalid JSON line: {} | err={}", line, e);
                        continue;
                    }
                };
                let id = match value.get("id").and_then(Value::as_u64) {
                    Some(i) => i,
                    None => {
                        log::debug!("Notification or response without id: {}", value);
                        continue;
                    }
                };
                let mut pending = pending_for_reader.lock().await;
                if let Some(sender) = pending.remove(&id) {
                    let _ = sender.send(value);
                }
            }
            log::info!("Sidecar stdout closed");
        });

        // Stderr drain task: forward to host log.
        tokio::spawn(async move {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                log::info!("[sidecar.stderr] {}", line);
            }
        });

        Ok(Self {
            child,
            stdin,
            pending,
            next_id: AtomicU64::new(1),
        })
    }

    /// Send a JSON-RPC call and await the response with a 60-second timeout.
    /// If the sidecar crashed silently, the timeout surfaces the problem as an error
    /// rather than hanging the UI indefinitely.
    pub async fn call(&mut self, method: &str, params: Value) -> Result<Value> {
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);

        let req = json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": method,
            "params": params,
        });
        let mut req_line = serde_json::to_string(&req)?;
        req_line.push('\n');

        log::debug!("RPC -> {} (id={}, {} bytes)", method, id, req_line.len());

        let (tx, rx) = oneshot::channel();
        {
            let mut pending = self.pending.lock().await;
            pending.insert(id, tx);
        }

        self.stdin
            .write_all(req_line.as_bytes())
            .await
            .with_context(|| format!("Failed to write request {} to sidecar stdin", id))?;
        self.stdin
            .flush()
            .await
            .with_context(|| format!("Failed to flush sidecar stdin for request {}", id))?;

        // Wait for response with a generous timeout. Parsing a large XSD or 1C config
        // can legitimately take 10-30 seconds; we give 60s before declaring the sidecar dead.
        let resp = match tokio::time::timeout(std::time::Duration::from_secs(60), rx).await {
            Ok(Ok(value)) => value,
            Ok(Err(_)) => {
                // oneshot channel dropped without a value — sidecar process died
                self.pending.lock().await.remove(&id);
                return Err(anyhow!(
                    "Sidecar response channel closed for method '{}'. \
                     Sidecar likely crashed — check stderr logs above for Python traceback.",
                    method
                ));
            }
            Err(_elapsed) => {
                // Timeout
                self.pending.lock().await.remove(&id);
                return Err(anyhow!(
                    "Sidecar did not respond to '{}' within 60s. \
                     Either the operation is too slow or the sidecar is stuck. \
                     Check stderr logs above for Python errors.",
                    method
                ));
            }
        };

        if let Some(error) = resp.get("error") {
            return Err(anyhow!("Sidecar error: {}", error));
        }
        Ok(resp.get("result").cloned().unwrap_or(Value::Null))
    }

    /// Graceful shutdown: close stdin, wait briefly, then kill.
    pub async fn stop(&mut self) -> Result<()> {
        // shutdown() flushes and closes the write half of stdin.
        // Python's `for line in stdin` loop in __main__.py then sees EOF and exits cleanly.
        let _ = self.stdin.shutdown().await;
        // Best-effort wait, then ensure dead.
        // tokio::time::timeout returns Result<Result<ExitStatus, io::Error>, Elapsed>:
        //   outer Ok  = wait completed within timeout
        //   inner Ok  = process exited cleanly
        if let Ok(Ok(status)) =
            tokio::time::timeout(std::time::Duration::from_secs(2), self.child.wait()).await
        {
            log::info!("Sidecar exited with status {:?}", status);
            return Ok(());
        }
        log::warn!("Sidecar did not exit in 2s, killing");
        self.child.kill().await?;
        Ok(())
    }
}
