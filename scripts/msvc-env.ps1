#
# scripts\msvc-env.ps1
#
# Loads MSVC C++ Build Tools environment variables (PATH, INCLUDE, LIB) into
# the current PowerShell session. Required for `cargo build` to find link.exe
# on Windows when targeting *-pc-windows-msvc.
#
# Usage:
#   . .\scripts\msvc-env.ps1
#
# (Note the leading dot — that's PowerShell's dot-sourcing operator, which
# preserves env-var changes in the calling session.)
#
# Why this is needed:
# VS Build Tools deliberately do NOT add their compiler/linker paths to the
# system PATH — to avoid conflicts between multiple installed VS versions.
# Microsoft's standard pattern is to invoke VsDevCmd.bat / Launch-VsDevShell.ps1
# inside a "Developer Command Prompt" before building. We automate that here.
#

$ErrorActionPreference = "Stop"

# Candidates ordered by preference: stable VS 2022 BuildTools first, then any others.
$candidates = @(
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\Tools\VsDevCmd.bat"
)

$vsDevCmd = $null
foreach ($c in $candidates) {
    if (Test-Path $c) {
        $vsDevCmd = $c
        break
    }
}

if (-not $vsDevCmd) {
    Write-Host "ERROR: VsDevCmd.bat not found. Install VS Build Tools (C++ workload):" -ForegroundColor Red
    Write-Host "  https://aka.ms/vs/17/release/vs_BuildTools.exe" -ForegroundColor Red
    throw "VsDevCmd.bat not found"
}

Write-Host "Loading MSVC environment from:"
Write-Host "  $vsDevCmd"

# Run VsDevCmd.bat inside cmd, then dump environment, parse into PowerShell session.
# `-arch=amd64 -host_arch=amd64` = 64-bit toolchain (matches our Rust target x86_64-pc-windows-msvc).
# `-no_logo` suppresses copyright banner.
$envDump = cmd /c "`"$vsDevCmd`" -arch=amd64 -host_arch=amd64 -no_logo && set"

$applied = 0
foreach ($line in $envDump) {
    if ($line -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        # Skip pseudo-variables that PowerShell can't set
        if ($name -match '^(PROMPT|=|_)' -or $name -eq 'PROCESSOR_REVISION') { continue }
        Set-Item -Path "Env:$name" -Value $value -ErrorAction SilentlyContinue
        $applied++
    }
}

Write-Host "  Applied $applied environment variables"

# Verify link.exe is now findable
$link = Get-Command link.exe -ErrorAction SilentlyContinue
if ($link) {
    Write-Host "  link.exe: $($link.Source)" -ForegroundColor Green
} else {
    Write-Host "  WARNING: link.exe still not in PATH after loading VsDevCmd" -ForegroundColor Yellow
}
