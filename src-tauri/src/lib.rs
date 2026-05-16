//! Konvey Tauri library — runs the Tauri event loop and registers commands.

mod sidecar;

use serde_json::Value;
use tauri::{Manager, State};
use tokio::sync::Mutex;

use sidecar::Sidecar;

/// Shared sidecar state, wrapped in Mutex for safe async access.
struct SidecarState(Mutex<Option<Sidecar>>);

/// Tauri command: call a backend method by name with JSON params.
/// Returns the `result` field of the JSON-RPC response, or an error message.
#[tauri::command]
async fn call_backend(
    method: String,
    params: Value,
    state: State<'_, SidecarState>,
) -> Result<Value, String> {
    let mut guard = state.0.lock().await;
    let sidecar = guard
        .as_mut()
        .ok_or_else(|| "Sidecar not started".to_string())?;
    sidecar
        .call(&method, params)
        .await
        .map_err(|e| format!("{:#}", e))
}

/// Tauri command: stop the sidecar process explicitly (e.g. on window close).
#[tauri::command]
async fn stop_sidecar(state: State<'_, SidecarState>) -> Result<(), String> {
    let mut guard = state.0.lock().await;
    if let Some(mut sc) = guard.take() {
        sc.stop().await.map_err(|e| format!("{:#}", e))?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Default to info level so sidecar startup/stderr lines are visible.
    // Override with RUST_LOG env var (e.g. RUST_LOG=debug).
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("info"),
    )
    .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(SidecarState(Mutex::new(None)))
        .setup(|app| {
            // Start sidecar on app launch
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let state = handle.state::<SidecarState>();
                let mut guard = state.0.lock().await;
                match Sidecar::start(&handle).await {
                    Ok(sc) => {
                        log::info!("Sidecar started");
                        *guard = Some(sc);
                    }
                    Err(e) => {
                        log::error!("Failed to start sidecar: {:#}", e);
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![call_backend, stop_sidecar])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
