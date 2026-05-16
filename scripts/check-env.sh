#!/usr/bin/env bash
# scripts/check-env.sh
#
# Linux/macOS counterpart of check-env.ps1.
# Konvey is Windows-first; this script is a courtesy for cross-platform
# developers but lacks the MSVC check (irrelevant on non-Windows).

set -u
FAILURES=()
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

pass() { printf "  OK  %-32s %s\n" "$1" "$2"; }
fail() {
    printf "\033[31m  FAIL %-32s %s\033[0m\n" "$1" "$2"
    printf "       \033[33mRemediation: %s\033[0m\n" "$3"
    FAILURES+=("$1")
}

echo
echo "=== Konvey environment check ==="
echo

if command -v node >/dev/null 2>&1; then
    pass "Node.js" "$(node --version)"
else
    fail "Node.js" "not found" "Install LTS from https://nodejs.org/"
fi

if command -v npm >/dev/null 2>&1; then
    pass "npm" "$(npm --version)"
else
    fail "npm" "not found" "Reinstall Node.js"
fi

if command -v python3 >/dev/null 2>&1; then
    pass "Python" "$(python3 --version)"
else
    fail "Python" "python3 not found" "Install Python 3.11+ from https://www.python.org/"
fi

if command -v rustc >/dev/null 2>&1; then
    pass "Rust (rustc)" "$(rustc --version)"
else
    fail "Rust toolchain" "rustc not found" "Install via https://rustup.rs/"
fi

if command -v cargo >/dev/null 2>&1; then
    pass "Rust (cargo)" "$(cargo --version)"
else
    fail "Rust toolchain" "cargo not found" "Install via https://rustup.rs/"
fi

if command -v git >/dev/null 2>&1; then
    pass "git" "$(git --version)"
else
    fail "git" "not found" "Install git from your package manager"
fi

if [ -x "$REPO_ROOT/backend/.venv/bin/python" ]; then
    pass "Backend venv" "$REPO_ROOT/backend/.venv"
else
    fail "Backend venv" "not found" \
        "cd backend && python3 -m venv .venv && ./.venv/bin/python -m pip install -e .[dev]"
fi

if [ -d "$REPO_ROOT/node_modules" ]; then
    pass "Frontend node_modules" "$REPO_ROOT/node_modules"
else
    fail "Frontend node_modules" "not found" "Run: npm install (in repo root)"
fi

echo
if [ ${#FAILURES[@]} -eq 0 ]; then
    printf "\033[32mAll checks passed.\033[0m\n\n"
    exit 0
else
    printf "\033[31m%d check(s) failed - see hints above\033[0m\n\n" "${#FAILURES[@]}"
    exit 1
fi
