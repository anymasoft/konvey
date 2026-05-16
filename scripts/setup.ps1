#
# scripts\setup.ps1
#
# Initial environment setup for a fresh Konvey checkout.
# Checks and installs everything needed to run `.\scripts\dev.ps1`.
#
# Usage:
#   .\scripts\setup.ps1
#
# What it does:
#   1. Verifies Node.js, Python, Rust are installed (with install hints if missing)
#   2. Verifies MSVC C++ Build Tools are installed (link.exe findable)
#   3. Creates backend Python venv and installs deps
#   4. Runs npm install for frontend
#   5. Creates sidecar placeholder
#
# After this script succeeds, you can run .\scripts\dev.ps1.
#

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path "$PSScriptRoot\.."

function Test-Command($name) {
    return (Get-Command $name -ErrorAction SilentlyContinue) -ne $null
}

function Write-Step($msg) { Write-Host "[setup] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  OK: $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  WARN: $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  FAIL: $msg" -ForegroundColor Red }

# ===== 1. Check Node.js =====
Write-Step "Checking Node.js..."
if (Test-Command node) {
    $v = (node --version)
    Write-Ok "node $v"
} else {
    Write-Fail "Node.js not found. Install from: https://nodejs.org/ (LTS recommended)"
    exit 1
}

if (Test-Command npm) {
    Write-Ok "npm $(npm --version)"
} else {
    Write-Fail "npm not found (should come with Node.js)"
    exit 1
}

# ===== 2. Check Python =====
Write-Step "Checking Python..."
if (Test-Command python) {
    $v = (python --version 2>&1)
    Write-Ok "$v"
} else {
    Write-Fail "Python not found. Install Python 3.11+ from: https://www.python.org/downloads/"
    exit 1
}

# ===== 3. Check Rust =====
Write-Step "Checking Rust..."
if (Test-Command rustc) {
    Write-Ok "$(rustc --version)"
} else {
    Write-Fail "Rust not found. Install via: https://rustup.rs/  (then: rustup default stable)"
    exit 1
}

if (Test-Command cargo) {
    Write-Ok "$(cargo --version)"
} else {
    Write-Fail "cargo not found (should come with rustup)"
    exit 1
}

# ===== 4. Check MSVC Build Tools =====
Write-Step "Checking MSVC C++ Build Tools (link.exe)..."
$vsDevCmds = @(
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\Tools\VsDevCmd.bat"
)
$found = $false
foreach ($p in $vsDevCmds) {
    if (Test-Path $p) {
        Write-Ok "VsDevCmd.bat at $p"
        $found = $true
        break
    }
}
if (-not $found) {
    Write-Fail "MSVC Build Tools not found. Download and install:"
    Write-Host "  https://aka.ms/vs/17/release/vs_BuildTools.exe" -ForegroundColor Yellow
    Write-Host "  When the installer opens, select 'Desktop development with C++' workload." -ForegroundColor Yellow
    exit 1
}

# ===== 5. Check git =====
Write-Step "Checking git..."
if (Test-Command git) {
    Write-Ok "$(git --version)"
} else {
    Write-Warn "git not found. Recommended for source control but not strictly required."
}

# ===== 6. Backend venv =====
Write-Step "Setting up backend venv..."
$BackendDir = "$RepoRoot\backend"
$VenvDir = "$BackendDir\.venv"
$VenvPython = "$VenvDir\Scripts\python.exe"

if (Test-Path $VenvPython) {
    Write-Ok "venv exists at $VenvDir"
} else {
    Write-Host "  Creating venv..."
    Push-Location $BackendDir
    python -m venv .venv
    Pop-Location
    Write-Ok "venv created"
}

Write-Host "  Installing/updating backend dependencies..."
Push-Location $BackendDir
& $VenvPython -m pip install --quiet --upgrade pip
& $VenvPython -m pip install --quiet -e .[dev]
Pop-Location
Write-Ok "backend deps installed"

# ===== 7. Frontend npm install =====
Write-Step "Installing frontend dependencies (npm install)..."
$NodeModules = "$RepoRoot\node_modules"
if (Test-Path "$NodeModules\.package-lock.json") {
    Write-Ok "node_modules already present (skip; rerun npm install manually if needed)"
} else {
    Push-Location $RepoRoot
    npm install
    Pop-Location
    Write-Ok "frontend deps installed"
}

# ===== 8. Sidecar placeholder =====
Write-Step "Creating sidecar placeholder..."
. "$PSScriptRoot\ensure-sidecar-placeholder.ps1"

# ===== 9. Quick test of backend =====
Write-Step "Running backend pytest as smoke check..."
Push-Location $BackendDir
$result = & $VenvPython -m pytest tests/ -q --tb=no 2>&1 | Out-String
Pop-Location
if ($LASTEXITCODE -eq 0) {
    Write-Ok "all backend tests pass"
} else {
    Write-Warn "some backend tests failed - check output:"
    Write-Host $result
}

# ===== Done =====
Write-Host ""
Write-Host "=== Setup complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  .\scripts\dev.ps1     # run Konvey in dev mode (opens window)"
Write-Host "  cd backend; .\.venv\Scripts\python.exe -m pytest -v   # run backend tests"
Write-Host "  npm test              # run frontend tests"
