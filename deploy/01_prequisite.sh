#!/usr/bin/env bash
set -euo pipefail

# Update package index (idempotent)
sudo apt-get update -y

# Install core utilities (always safe)
sudo apt-get install -y ca-certificates curl gnupg lsb-release make git

# --- Docker ---------------------------------------------------
# Install Docker only if not already present (avoids containerd conflicts)
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found – installing docker.io and docker-compose-plugin"
  sudo apt-get install -y docker.io docker-compose-plugin
else
  echo "Docker already installed"
fi

# Add current user to docker group (no‑op if already a member)
if groups $USER | grep -q docker; then
  echo "User already in docker group"
else
  sudo usermod -aG docker $USER
  echo "Added $USER to docker group – you may need to log out/in"
fi

# --- Node.js -------------------------------------------------
# Install Node.js (includes npm) only if missing
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found – installing from nodesource"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "Node.js already installed"
fi

# Verify installations
docker version || { echo "Docker not installed correctly"; exit 1; }
nginx -v || { echo "Nginx not installed correctly"; exit 1; }
node -v || { echo "Node not installed correctly"; exit 1; }

echo "✅ Prerequisite installation complete"
