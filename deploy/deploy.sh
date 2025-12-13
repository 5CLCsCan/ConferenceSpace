#!/usr/bin/env bash
set -euo pipefail

# Make scripts executable
chmod +x deploy/*.sh

echo "🚀 Starting Deployment..."

./deploy/01_prequisite.sh
./deploy/02_backend.sh
./deploy/03_frontend.sh
./deploy/04_nginx.sh

echo "✨ Full deployment finished successfully!"