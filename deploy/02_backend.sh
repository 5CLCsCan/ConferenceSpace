#!/usr/bin/env bash
set -euo pipefail

cd backend
docker compose build
docker compose up -d

# Wait for PostgreSQL healthcheck
until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-postgres}"; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

until curl -s http://localhost:7474 > /dev/null; do
  echo "Waiting for Neo4j..."
  sleep 2
done

make migrate-up || { echo "Migrations failed"; exit 1; }

echo "✅ Backend containers are up and migrations applied"
