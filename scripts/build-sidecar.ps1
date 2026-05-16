#
# scripts\build-sidecar.ps1
#
# Builds Python sidecar via PyInstaller and places the resulting exe
# into src-tauri\binaries\ with the Tauri Sidecar naming convention.
#
# Usage:
#   .\scripts\build-sidecar.ps1
#
# Prerequisites:
#   - Python 3.11+ in PATH
#   - cd backend; python -m venv .venv; pip install -e .[dev]
#

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path "$PSScriptRoot\.."
$BackendDir = "$RepoRoot\backend"
$BinariesDir = "$RepoRoot\src-tauri\binaries"

# Tauri 2 Sidecar naming convention: <name>-<rustc-target-triple>
# On Windows 64-bit: x86_64-pc-windows-msvc
$Target = "x86_64-pc-windows-msvc"
$SidecarName = "konvey-backend-$Target.exe"

Write-Host "Konvey: building Python sidecar..."
Write-Host "  Backend dir: $BackendDir"
Write-Host "  Target: $SidecarName"

# Ensure venv exists
if (-not (Test-Path "$BackendDir\.venv")) {
    Write-Host "Creating venv..."
    Push-Location $BackendDir
    python -m venv .venv
    Pop-Location
}

$VenvPython = "$BackendDir\.venv\Scripts\python.exe"

Write-Host "Installing dependencies (including pyinstaller)..."
& $VenvPython -m pip install --quiet --upgrade pip
& $VenvPython -m pip install --quiet -e "$BackendDir[dev]"

Write-Host "Running PyInstaller..."
Push-Location $BackendDir
& $VenvPython -m PyInstaller `
    --onefile `
    --name konvey-backend `
    --distpath dist `
    --workpath build `
    --specpath build `
    --paths src `
    --clean `
    --noconfirm `
    src\konvey_backend\__main__.py
Pop-Location

# Move resulting exe to src-tauri\binaries with target-triple suffix
if (-not (Test-Path $BinariesDir)) {
    New-Item -ItemType Directory -Path $BinariesDir | Out-Null
}

$SrcExe = "$BackendDir\dist\konvey-backend.exe"
$DstExe = "$BinariesDir\$SidecarName"

if (-not (Test-Path $SrcExe)) {
    Write-Error "PyInstaller did not produce $SrcExe"
    exit 1
}

Copy-Item -Force $SrcExe $DstExe
Write-Host "Sidecar built: $DstExe"
Write-Host "Size: $((Get-Item $DstExe).Length / 1MB | ForEach-Object { '{0:N1}' -f $_ }) MB"
