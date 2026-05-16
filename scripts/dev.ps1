#
# scripts\dev.ps1
#
# Run Konvey in dev mode: Tauri dev + Python sidecar from venv (no PyInstaller rebuild).
#
# Tauri starts the frontend (Vite at :5173) and spawns Python sidecar via the
# sidecar.rs logic - it checks KONVEY_SIDECAR_MODE env var and runs
# `python -m konvey_backend` from backend/.venv when set to "dev".
#
# This script ALSO loads MSVC Build Tools environment (required for `cargo build`
# to find link.exe on Windows). See scripts\msvc-env.ps1 for details.
#

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path "$PSScriptRoot\.."

# Step 1: Load MSVC environment (PATH/INCLUDE/LIB for link.exe)
. "$PSScriptRoot\msvc-env.ps1"

# Step 2: Ensure backend venv exists
$VenvPython = "$RepoRoot\backend\.venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Host ""
    Write-Host "Backend venv not found. Creating and installing..."
    Push-Location "$RepoRoot\backend"
    python -m venv .venv
    & .\.venv\Scripts\python.exe -m pip install --quiet --upgrade pip
    & .\.venv\Scripts\python.exe -m pip install --quiet -e .[dev]
    Pop-Location
}

# Step 3: Ensure sidecar placeholder exists (so Tauri build doesn't fail)
. "$PSScriptRoot\ensure-sidecar-placeholder.ps1"

# Step 4: Tell sidecar.rs to use dev mode
$env:KONVEY_SIDECAR_MODE = "dev"
$env:KONVEY_SIDECAR_PYTHON = $VenvPython

Push-Location $RepoRoot
try {
    Write-Host ""
    Write-Host "Starting Konvey in dev mode..."
    Write-Host "  KONVEY_SIDECAR_MODE = $env:KONVEY_SIDECAR_MODE"
    Write-Host "  KONVEY_SIDECAR_PYTHON = $env:KONVEY_SIDECAR_PYTHON"
    Write-Host ""
    npm run tauri dev
}
finally {
    Pop-Location
}
