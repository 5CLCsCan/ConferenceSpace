#!/usr/bin/env bash
set -euo pipefail

echo "Deploying Frontend (Standalone Node.js Server)..."

if [ ! -d "frontend" ]; then
    echo "Error: frontend directory not found. Please run from project root."
    exit 1
fi

cd frontend

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Building frontend..."
npm run build

echo "Preparing standalone build..."

mkdir -p .next/standalone/public
cp -r public/* .next/standalone/public/ || true

mkdir -p .next/standalone/.next/static
cp -r .next/static/* .next/standalone/.next/static/

DEST_DIR="/opt/conferencespace-frontend"

echo "Deploying to $DEST_DIR..."
sudo mkdir -p "$DEST_DIR"
sudo rm -rf "$DEST_DIR"/*
sudo cp -r .next/standalone/* "$DEST_DIR/"

# Set permissions
sudo chown -R www-data:www-data "$DEST_DIR"

# Create Systemd Service
SERVICE_FILE="/etc/systemd/system/conferencespace-frontend.service"

echo "Creating systemd service at $SERVICE_FILE..."
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=ConferenceSpace Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$DEST_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3
Environment="NODE_ENV=production"
Environment="PORT=3000"
# Add other env vars here if needed, e.g. OPENROUTER_API_KEY
# EnvironmentFile=/opt/conferencespace-frontend/.env

[Install]
WantedBy=multi-user.target
EOF

# Reload and Restart Service
echo "Reloading systemd..."
sudo systemctl daemon-reload
sudo systemctl enable conferencespace-frontend
sudo systemctl restart conferencespace-frontend

echo "✅ Frontend deployed as a service."
