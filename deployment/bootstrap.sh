#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/conferencespace}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root." >&2
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl gnupg ufw

install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  echo "User '${DEPLOY_USER}' does not exist. Set DEPLOY_USER to an existing SSH user." >&2
  exit 1
fi

usermod -aG docker "${DEPLOY_USER}"
mkdir -p "${DEPLOY_DIR}"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_DIR}"

ufw allow OpenSSH
ufw allow "${FRONTEND_PORT}/tcp"
ufw --force enable

docker --version
docker compose version
ufw status verbose

cat <<EOF

Bootstrap complete.

Next steps:
1. Add your deploy public key to /home/${DEPLOY_USER}/.ssh/authorized_keys
2. Add GitHub production environment secrets
3. Run the Deploy workflow

Deploy directory: ${DEPLOY_DIR}
Public frontend port: ${FRONTEND_PORT}
EOF
