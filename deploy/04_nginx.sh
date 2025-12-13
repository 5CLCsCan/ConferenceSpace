#!/usr/bin/env bash
set -euo pipefail

SERVER_NAME="_"  
NGINX_ROOT="/var/www/conferencespace"

CONF_PATH="/etc/nginx/sites-available/conferencespace"

sudo tee "$CONF_PATH" > /dev/null <<EOF
server {
    listen 80;
    server_name $SERVER_NAME;

    root $NGINX_ROOT;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss;
}
EOF

sudo ln -sf "$CONF_PATH" /etc/nginx/sites-enabled/

sudo nginx -t && sudo nginx -s reload

echo "✅ Nginx configuration applied and reloaded"