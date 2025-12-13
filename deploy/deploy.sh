#!/usr/bin/env bash
set -euo pipefail

./deploy/01_prequisite.sh
./deploy/02_backend.sh
./deploy/03_frontend.sh
./deploy/04_nginx.sh

echo "🚀 Full deployment finished"