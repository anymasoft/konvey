#
# scripts\check-env.ps1
#
# Pre-flight environment check for Konvey development.
# Verifies all required tools are installed and properly configured.
# Does NOT install anything - reports what's missing with exact remediation steps.
#
# Usage:
#   .\scripts\check-env.ps1
#
# Exit codes:
#   0 - all checks passed
#   1 - at least one check failed
#
# This script closes Q1 (Rust toolchain) and Q9 (MSVC Build Tools) from Sprint 0.
#

$ErrorActionPreference = "Continue"
$Failures = @()

$RepoRoot = Resolve-Path "$PSScriptRoot\.."

function Test-Command($name) {
    return (Get-Command $name -ErrorAction SilentlyContinue) -ne $null
}

function Write-Pass($name, $detail) {
    Write-Host ("  OK  {0,-32} {1}" -f $name, $detail) -ForegroundColor Green
}

function Write-Fail($name, $reason, $remedy) {
    Write-Host ("  FAIL {0,-32} {1}" -f $name, $reason) -ForegroundColor Red
    Write-Host ("       Remediation: {0}" -f $remedy) -ForegroundColor Yellow
    $script:Failures += $name
}

Write-Host ""
Write-Host "=== Konvey environment check ===" -ForegroundColor Cyan
Write-Host ""

# ---- 1. Node.js ----
if (Test-Command node) {
    $nodeVer = (node --version)
    $nodeMajor = [int]($nodeVer -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -ge 20) {
        Write-Pass "Node.js" "$nodeVer"
    } else {
        Write-Fail "Node.js" "version $nodeVer is too old (need >= 20.x)" `
            "Download LTS from https://nodejs.org/"
    }
} else {
    Write-Fail "Node.js" "not found in PATH" `
        "Install LTS from https://nodejs.org/"
}

# ---- 2. npm ----
if (Test-Command npm) {
    $npmVer = (npm --version)
    Write-Pass "npm" "$npmVer"
} else {
    Write-Fail "npm" "not found (should come with Node.js)" `
        "Reinstall Node.js from https://nodejs.org/"
}

# ---- 3. Python ----
if (Test-Command python) {
    $pyVer = (python --version 2>&1)
    if ($pyVer -match "Python (\d+)\.(\d+)") {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        if (($major -gt 3) -or ($major -eq 3 -and $minor -ge 11)) {
            Write-Pass "Python" $pyVer
        } else {
            Write-Fail "Python" "$pyVer is too old (need >= 3.11)" `
                "Install Python 3.11+ from https://www.python.org/downloads/"
        }
    }
} else {
    Write-Fail "Python" "not found in PATH" `
        "Install Python 3.11+ from https://www.python.org/downloads/"
}

# ---- 4. Rust toolchain ----
if (Test-Command rustc) {
    Write-Pass "Rust (rustc)" "$(rustc --version)"
} else {
    Write-Fail "Rust toolchain" "rustc not found" `
        "Install via https://rustup.rs/  then: rustup default stable"
}

if (Test-Command cargo) {
    Write-Pass "Rust (cargo)" "$(cargo --version)"
} else {
    Write-Fail "Rust toolchain" "cargo not found" `
        "Install via https://rustup.rs/  then: rustup default stable"
}

# ---- 5. MSVC linker (link.exe) ----
# Tauri requires C++ Build Tools for the MSVC linker.
# link.exe is typically NOT in PATH by default - it lives in
# VS Build Tools' VC\Tools\MSVC\<ver>\bin\HostX64\x64\.
# scripts\msvc-env.ps1 loads VsDevCmd.bat to fix this.

$vsDevCmds = @(
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\Tools\VsDevCmd.bat"
)
$vsDevCmdFound = $null
foreach ($p in $vsDevCmds) {
    if (Test-Path $p) { $vsDevCmdFound = $p; break }
}

if ($vsDevCmdFound) {
    Write-Pass "MSVC C++ Build Tools" "VsDevCmd at $vsDevCmdFound"
} else {
    Write-Fail "MSVC C++ Build Tools" "VsDevCmd.bat not found in standard locations" `
        "Download https://aka.ms/vs/17/release/vs_BuildTools.exe, install 'Desktop development with C++' workload (~3-7 GB, 10-20 min)"
}

# ---- 6. Git ----
if (Test-Command git) {
    $gitVer = (git --version)
    Write-Pass "git" $gitVer
} else {
    Write-Fail "git" "not found in PATH" `
        "Install Git for Windows from https://git-scm.com/"
}

# ---- 7. Backend venv ----
$VenvPython = "$RepoRoot\backend\.venv\Scripts\python.exe"
if (Test-Path $VenvPython) {
    Write-Pass "Backend venv" "$VenvPython"
} else {
    Write-Fail "Backend venv" "not found at $VenvPython" `
        "cd backend; python -m venv .venv; .\.venv\Scripts\python.exe -m pip install -e .[dev]"
}

# ---- 8. node_modules ----
$NodeModules = "$RepoRoot\node_modules"
if (Test-Path $NodeModules) {
    Write-Pass "Frontend node_modules" "$NodeModules"
} else {
    Write-Fail "Frontend node_modules" "not present at $NodeModules" `
        "Run: npm install (in repo root)"
}

# ---- 9. Sidecar placeholder ----
$Placeholder = "$RepoRoot\src-tauri\binaries\konvey-backend-x86_64-pc-windows-msvc.exe"
if (Test-Path $Placeholder) {
    Write-Pass "Sidecar placeholder" "$Placeholder"
} else {
    Write-Host ("  WARN {0,-32} placeholder missing (auto-created on dev.ps1 run)" -f "Sidecar placeholder") -ForegroundColor DarkYellow
}

# ---- Summary ----
Write-Host ""
if ($Failures.Count -eq 0) {
    Write-Host "All checks passed. You can run .\scripts\dev.ps1" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host ("{0} check(s) failed - see remediation hints above" -f $Failures.Count) -ForegroundColor Red
    Write-Host "After fixing, rerun .\scripts\check-env.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
