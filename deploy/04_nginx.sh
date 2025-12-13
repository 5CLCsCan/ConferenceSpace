#!/usr/bin/env bash
set -euo pipefail

echo "Configuring Nginx..."

# Check if nginx is installed
if ! command -v nginx >/dev/null 2>&1; then
    echo "Nginx not found. Installing..."
    sudo apt-get update && sudo apt-get install -y nginx
fi

SERVER_NAME="_" # Catch-all, change to domain if needed
NGINX_ROOT="/var/www/conferencespace"
CONF_PATH="/etc/nginx/sites-available/conferencespace"

# Create Nginx Config
sudo tee "$CONF_PATH" > /dev/null <<EOF
server {
    listen 80;
    server_name $SERVER_NAME;

    root $NGINX_ROOT;
    index index.html;

    # Frontend Routes (Single Page App Support)
    location / {
        try_files \$uri \$uri.html \$uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Swagger UI Proxy
    location /swagger/ {
        proxy_pass http://localhost:8080/swagger/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";
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