#!/usr/bin/env bash
set -euo pipefail

echo "Start checking prerequisites..."

# Update package index
sudo apt-get update -y

# --- Swap Setup--------------------------------
# Check if swap exists, if not create 8G swap
if ! swapon --show | grep -q '/swapfile'; then
  echo "Creating 8GB swap file for build stability..."
  sudo fallocate -l 8G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo "Swap created."
else
  echo "Swap file already exists."
fi

# Install core utilities
# build-essential is needed for some go tools or cgo if required
sudo apt-get install -y ca-certificates curl gnupg lsb-release make git build-essential

# --- Docker ---------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker Engine..."
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
  sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io
  
  sudo usermod -aG docker $USER || true
  echo "Docker Engine installed. You might need to re-login to use docker without sudo."
else
  echo "Docker Engine is already installed."
fi

if ! command -v docker-compose >/dev/null 2>&1; then
  echo "Installing standalone docker-compose..."
  COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
  if [ -z "$COMPOSE_VERSION" ]; then COMPOSE_VERSION="v2.24.5"; fi
  
  sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  echo "Standalone docker-compose installed: $(docker-compose --version)"
else
  echo "docker-compose is already installed: $(docker-compose --version)"
fi

# --- Go -------------------------------------------------------
if ! command -v go >/dev/null 2>&1; then
  echo "Installing Go (via snap)..."
  sudo snap install go --classic
else
  echo "Go is already installed: $(go version)"
fi

# --- Node.js -------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "Node.js is already installed: $(node -v)"
fi

# --- Verify --------------------------------------------------
echo "Verifying installations..."
docker version >/dev/null 2>&1 || echo "Warning: User may need to re-login for Docker permissions"
go version
node -v
npm -v
make --version

echo "✅ Prerequisites check complete."
