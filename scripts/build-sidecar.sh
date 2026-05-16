#!/usr/bin/env bash
# scripts/build-sidecar.sh — Linux/macOS equivalent of build-sidecar.ps1
# Not the primary build path (Konvey is Windows-first), but kept for cross-platform developers.

set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
BACKEND_DIR="$REPO_ROOT/backend"
BINARIES_DIR="$REPO_ROOT/src-tauri/binaries"

# Auto-detect target triple
case "$(uname -s)" in
    Darwin*)
        if [[ "$(uname -m)" == "arm64" ]]; then
            TARGET="aarch64-apple-darwin"
        else
            TARGET="x86_64-apple-darwin"
        fi
        ;;
    Linux*)
        TARGET="x86_64-unknown-linux-gnu"
        ;;
    *)
        echo "Unsupported OS: $(uname -s)"
        exit 1
        ;;
esac

SIDECAR_NAME="konvey-backend-$TARGET"

echo "Konvey: building Python sidecar..."
echo "  Backend: $BACKEND_DIR"
echo "  Target: $SIDECAR_NAME"

if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
    echo "Creating venv..."
    python3 -m venv "$BACKEND_DIR/.venv"
fi

VENV_PYTHON="$BACKEND_DIR/.venv/bin/python"

echo "Installing dependencies..."
"$VENV_PYTHON" -m pip install --quiet --upgrade pip
"$VENV_PYTHON" -m pip install --quiet -e "$BACKEND_DIR[dev]"

echo "Running PyInstaller..."
cd "$BACKEND_DIR"
"$VENV_PYTHON" -m PyInstaller \
    --onefile \
    --name konvey-backend \
    --distpath dist \
    --workpath build \
    --specpath build \
    --paths src \
    --clean \
    --noconfirm \
    src/konvey_backend/__main__.py

mkdir -p "$BINARIES_DIR"
cp "$BACKEND_DIR/dist/konvey-backend" "$BINARIES_DIR/$SIDECAR_NAME"
chmod +x "$BINARIES_DIR/$SIDECAR_NAME"

echo "Sidecar built: $BINARIES_DIR/$SIDECAR_NAME"
