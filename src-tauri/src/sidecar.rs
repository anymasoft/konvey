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
// stdin shutdown trait
use tokio::io::AsyncWrite;

/// Pending requests keyed by JSON-RPC id, waiting for stdout response.
type PendingMap = Arc<Mutex<HashMap<u64, oneshot::Sender<Value>>>>;

pub struct Sidecar {
    child: Child,
    stdin: ChildStdin,
    pending: PendingMap,
    next_id: AtomicU64,
}

impl Sidecar {
    pub async fn start(_app: &tauri::AppHandle) -> Result<Self> {
        let dev_mode =
            std::env::var("KONVEY_SIDECAR_MODE").unwrap_or_default().to_lowercase() == "dev";

        let mut child = if dev_mode {
            // Dev: run Python from backend/ directory via .venv
            log::info!("Starting sidecar in DEV mode (python -m konvey_backend)");
            Command::new("python")
                .args(["-m", "konvey_backend"])
                .current_dir("../backend")
                .env("PYTHONPATH", "src")
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .kill_on_drop(true)
                .spawn()
                .context("Failed to spawn python sidecar in dev mode")?
        } else {
            // Prod: launch packaged sidecar exe via Tauri Sidecar.
            // Tauri 2: tauri::process::Command — но если плагина нет, используем системный exec.
            // На данном этапе Sprint 0 — простой fallback.
            log::info!("Starting sidecar in PROD mode (packaged exe)");
            let exe_name = if cfg!(target_os = "windows") {
                "konvey-backend.exe"
            } else {
                "konvey-backend"
            };
            Command::new(exe_name)
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .kill_on_drop(true)
                .spawn()
                .with_context(|| format!("Failed to spawn packaged sidecar {}", exe_name))?
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

    /// Send a JSON-RPC call and await the response.
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

        let (tx, rx) = oneshot::channel();
        {
            let mut pending = self.pending.lock().await;
            pending.insert(id, tx);
        }

        self.stdin.write_all(req_line.as_bytes()).await?;
        self.stdin.flush().await?;

        let resp = rx.await.context("Sidecar response channel closed")?;

        if let Some(error) = resp.get("error") {
            return Err(anyhow!("Sidecar error: {}", error));
        }
        Ok(resp.get("result").cloned().unwrap_or(Value::Null))
    }

    /// Graceful shutdown — close stdin, wait briefly, then kill.
    pub async fn stop(&mut self) -> Result<()> {
        // Closing stdin signals the Python loop to exit
        drop(&mut self.stdin);
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
