#!/usr/bin/env bash
set -euo pipefail

echo "Deploying Frontend..."

if [ ! -d "frontend" ]; then
    echo "Error: frontend directory not found. Please run from project root."
    exit 1
fi

cd frontend

echo "Installing dependencies..."
npm ci

echo "Building frontend (Static Export)..."
# next.config.mjs should have output: 'export'
npm run build

# The output folder is 'out' by default for next export
EXPORT_DIR="out"

if [ ! -d "$EXPORT_DIR" ]; then
    echo "Error: Build did not produce '$EXPORT_DIR' directory. Check next.config.mjs has output: 'export'."
    exit 1
fi

NGINX_ROOT="/var/www/conferencespace"

echo "Deploying to $NGINX_ROOT..."
sudo mkdir -p "$NGINX_ROOT"
# Remove old files to ensure clean deployment
sudo rm -rf "$NGINX_ROOT"/*
sudo cp -r "$EXPORT_DIR"/* "$NGINX_ROOT/"

# Permission fix if needed
sudo chown -R www-data:www-data "$NGINX_ROOT" || true
sudo chmod -R 755 "$NGINX_ROOT" || true

echo "✅ Frontend deployed to $NGINX_ROOT"
