// Konvey — Tauri shell entrypoint.
// Connects React frontend to Python sidecar (konvey-backend) via JSON-RPC over stdio.
//
// Prevents the additional console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    konvey_lib::run();
}
