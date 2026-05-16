#
# scripts\ensure-sidecar-placeholder.ps1
#
# Creates a placeholder sidecar exe in src-tauri\binaries\ if no real one exists.
#
# Why this is needed:
# Tauri 2 validates `externalBin` paths from tauri.conf.json at build time
# (including `cargo build` in dev mode). If the file doesn't exist, build fails
# with "resource path ... doesn't exist".
#
# In dev mode our sidecar.rs ignores the external bin and runs `python -m
# konvey_backend` directly (see KONVEY_SIDECAR_MODE=dev). So the placeholder
# is just to satisfy Tauri's existence check - its contents don't matter.
#
# Strategy: copy python.exe from backend venv as the placeholder.
#  - It's a valid Windows PE executable (Tauri may inspect file headers later)
#  - Already on disk, no download/build needed
#  - Build-sidecar.ps1 will OVERWRITE it with the real PyInstaller exe later
#

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path "$PSScriptRoot\.."
$BinariesDir = "$RepoRoot\src-tauri\binaries"
$Target = "x86_64-pc-windows-msvc"
$PlaceholderName = "konvey-backend-$Target.exe"
$PlaceholderPath = "$BinariesDir\$PlaceholderName"

if (Test-Path $PlaceholderPath) {
    Write-Host "Sidecar binary already exists at:"
    Write-Host "  $PlaceholderPath"
    return
}

if (-not (Test-Path $BinariesDir)) {
    New-Item -ItemType Directory -Path $BinariesDir -Force | Out-Null
}

$VenvPython = "$RepoRoot\backend\.venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Host "ERROR: Cannot create sidecar placeholder - venv python missing at:" -ForegroundColor Red
    Write-Host "  $VenvPython" -ForegroundColor Red
    Write-Host "Run: cd backend; python -m venv .venv" -ForegroundColor Yellow
    throw "venv python not found"
}

Write-Host "Creating sidecar placeholder (copy of venv python.exe):"
Write-Host "  $PlaceholderPath"
Copy-Item -Path $VenvPython -Destination $PlaceholderPath -Force

# Hint: in dev mode this file is not actually executed.
# For production builds, run scripts\build-sidecar.ps1 to replace it with real PyInstaller exe.
Write-Host "Note: this is a dev-only placeholder. For production build, run scripts\build-sidecar.ps1 first."
