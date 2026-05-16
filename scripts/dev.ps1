#
# scripts\dev.ps1
#
# Run Konvey in dev mode: Tauri dev + Python sidecar from venv (no PyInstaller rebuild).
#
# Tauri starts the frontend (Vite at :5173) and spawns Python sidecar via the
# sidecar.rs logic — it checks KONVEY_SIDECAR_MODE env var and runs
# `python -m konvey_backend` from backend/.venv when set to "dev".
#

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path "$PSScriptRoot\.."

# Ensure backend venv exists
$VenvPython = "$RepoRoot\backend\.venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Host "Backend venv not found. Creating and installing..."
    Push-Location "$RepoRoot\backend"
    python -m venv .venv
    & .\.venv\Scripts\python.exe -m pip install --quiet --upgrade pip
    & .\.venv\Scripts\python.exe -m pip install --quiet -e .[dev]
    Pop-Location
}

# Tell sidecar.rs to use dev mode
$env:KONVEY_SIDECAR_MODE = "dev"

# Tell sidecar to use venv python explicitly (avoid system python issues)
$env:KONVEY_SIDECAR_PYTHON = $VenvPython

Push-Location $RepoRoot
try {
    Write-Host "Starting Konvey in dev mode..."
    Write-Host "  KONVEY_SIDECAR_MODE = $env:KONVEY_SIDECAR_MODE"
    Write-Host "  KONVEY_SIDECAR_PYTHON = $env:KONVEY_SIDECAR_PYTHON"
    npm run tauri dev
}
finally {
    Pop-Location
}
