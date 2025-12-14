#!/usr/bin/env bash
set -euo pipefail

# Make scripts executable
chmod +x deploy/*.sh

echo "🚀 Starting Deployment..."

./deploy/01_prequisite.sh

# Check if Docker permissions are active (requires re-login after first install)
if ! docker info >/dev/null 2>&1; then
    echo ""
    echo "====================================================================="
    echo "⚠️  DOCKER PERMISSION CHECK FAILED"
    echo "====================================================================="
    echo "It looks like Docker was just installed or permissions are active."
    echo "You MUST log out and log back in for the 'docker' group to take effect."
    echo ""
    echo "Please run: exit"
    echo "Then reconnect and run ./deploy/deploy.sh again."
    echo "====================================================================="
    exit 1
fi

./deploy/02_backend.sh
./deploy/03_frontend.sh
./deploy/04_nginx.sh

echo "✨ Full deployment finished successfully!"