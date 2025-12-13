#!/usr/bin/env bash
set -euo pipefail

echo "Configuring Nginx..."

if ! command -v nginx >/dev/null 2>&1; then
    echo "Installing Nginx..."
    sudo apt-get update && sudo apt-get install -y nginx
fi

SERVER_NAME="_"
CONF_PATH="/etc/nginx/sites-available/conferencespace"

sudo tee "$CONF_PATH" > /dev/null <<EOF
server {
    listen 80;
    server_name $SERVER_NAME;

    # Frontend Proxy (Next.js running on port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Frontend API Routes (Chat, Backend Proxy) must go to Next.js
    location /api/chat {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/backend {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API (Direct access to Go server for other /api/ calls)
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Swagger UI Proxy
    location /swagger/ {
        proxy_pass http://localhost:8080/swagger/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
}
EOF

# Enable Site
sudo ln -sf "$CONF_PATH" /etc/nginx/sites-enabled/

# Remove default if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test and Reload
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Nginx configured and reloaded."