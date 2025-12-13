#!/usr/bin/env bash
set -euo pipefail

# Assumes prerequisite installed Node/NPM and nginx is present.
# Run from the repository root.

cd frontend

npm ci

npm run build

npm run export

NGINX_ROOT="/var/www/conferencespace"

# Ensure the target directory exists and copy files (needs sudo for /var/www)
sudo mkdir -p "$NGINX_ROOT"
sudo cp -r out/* "$NGINX_ROOT/"

echo "✅ Frontend static assets built and copied to $NGINX_ROOT"
