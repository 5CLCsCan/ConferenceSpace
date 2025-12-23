#!/usr/bin/env bash
set -euo pipefail

echo "Deploying Backend..."

# Ensure we are at root
if [ ! -d "backend" ]; then
    echo "Error: backend directory not found. Please run from project root."
    exit 1
fi

cd backend

# Setup Go environment for the script session
# Assuming Go is installed via snap or typically in path, but just in case
export PATH=$PATH:/snap/bin:$(go env GOPATH)/bin

# 1. Install Tools (needed for migration and swagger)
echo "Installing development tools (migrate, swag)..."
make install-tools

# 2. Generate Swagger Docs (needed before docker build so it can copy them)
echo "Generating Swagger documentation..."
make swagger

# 3. Docker Compose Build & Up
echo "Starting backend containers..."
docker compose build
docker compose up -d

# 4. Wait for Services
echo "Waiting for services to be ready..."

# Wait for Postgres
until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-postgres}"; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Ensure database exists (create if it doesn't)
echo "Ensuring database exists..."
docker compose exec -T postgres psql -U "${POSTGRES_USER:-postgres}" -tc "SELECT 1 FROM pg_database WHERE datname = 'conferencespace'" | grep -q 1 || \
  docker compose exec -T postgres psql -U "${POSTGRES_USER:-postgres}" -c "CREATE DATABASE conferencespace"
echo "✅ Database ready"

# Wait for Neo4j (using curl to check 7474)
until curl -s http://localhost:7474 > /dev/null; do
  echo "Waiting for Neo4j..."
  sleep 2
done

# 5. Run Migrations
echo "Running database migrations..."
make migrate-up

echo "✅ Backend deployed successfully."
