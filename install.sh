#!/bin/bash
# FZautochoice — Installer and Packager Script
# Author: Roger Luft (veilwaker)
# Version: 1.0.0
# License: CC-BY-4.0

set -e

echo "=========================================================="
echo "🎯 FZautochoice — Installer & Local Build System"
echo "=========================================================="

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed."
    exit 1
fi

# Check Linux native build dependencies
if [ "$(uname)" == "Linux" ]; then
    echo "🔍 Checking Linux package system dependencies..."
    if ! command -v xdotool &> /dev/null; then
        echo "⚠️ Warning: 'xdotool' is missing. Please install it with:"
        echo "   sudo apt-get install xdotool"
    fi
fi

# Step 1: Install node modules
echo "📦 [1/3] Installing NPM dependencies..."
npm install --no-bin-links

# Step 2: Build the project
echo "⚙️ [2/3] Compiling TypeScript and bundling Vite..."
npm run build

# Step 3: Run electron-builder for Linux locally (Windows compiled natively in GitHub Actions CI/CD)
echo "🚀 [3/3] Packaging executables for Linux (AppImage/deb)..."
TMP_OUT_DIR="/tmp/fzautochoice-dist-$(date +%s)"
mkdir -p "$TMP_OUT_DIR"

# Run packaging using /tmp output directory to support mounts
node node_modules/electron-builder/cli.js --linux -c.directories.output="$TMP_OUT_DIR"

# Copy outputs back to workspace dist/
echo "🚚 Copying built packages to dist/..."
mkdir -p dist
cp -R "$TMP_OUT_DIR"/* dist/ || true
rm -rf "$TMP_OUT_DIR"

echo "=========================================================="
echo "✅ Local Build Complete! Executables created successfully:"
echo "=========================================================="
echo "🐧 Linux executables (in dist/):"
ls -la dist/ | grep -iE '(\.appimage|\.deb)' || echo "   (No Linux files found)"
echo ""
echo "🪟 Windows portable exe and installers are built automatically"
echo "   via GitHub Actions CI/CD when tagging a release (e.g. git tag v1.0.0)"
echo "=========================================================="
