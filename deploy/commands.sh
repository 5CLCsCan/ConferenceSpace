#!/bin/bash

echo "=== ConferenceSpace Management Commands ==="
echo ""
echo "This file lists useful commands for managing and debugging the deployment."
echo "You can run these commands directly in your terminal."
echo ""

# ==============================================================================
# FRONTEND (Next.js / Systemd)
# ==============================================================================
# Service Name: conferencespace-frontend

echo "--- Frontend Commands ---"
echo "Check Status:    sudo systemctl status conferencespace-frontend"
echo "Follow Logs:     sudo journalctl -u conferencespace-frontend -f"
echo "View Last Logs:  sudo journalctl -u conferencespace-frontend -n 100 --no-pager"
echo "Restart:         sudo systemctl restart conferencespace-frontend"
echo "Stop:            sudo systemctl stop conferencespace-frontend"
echo ""

# ==============================================================================
# BACKEND (Docker Compose)
# ==============================================================================
# Services: conferencespace-api, conferencespace-db (Postgres), conferencespace-neo4j

echo "--- Backend Commands ---"
echo "Check Status:    docker compose ps"
echo "Follow All Logs: docker compose logs -f"
echo "API Logs:        docker compose logs -f app"
echo "DB Logs:         docker compose logs -f postgres"
echo "Neo4j Logs:      docker compose logs -f neo4j"
echo "Restart All:     docker compose restart"
echo "Stop All:        docker compose down"
echo "Migrate DB:      make migrate-up"
echo ""

# ==============================================================================
# NGINX (Reverse Proxy)
# ==============================================================================

echo "--- Nginx Commands ---"
echo "Check Status:    sudo systemctl status nginx"
echo "Test Config:     sudo nginx -t"
echo "Reload Config:   sudo systemctl reload nginx"
echo "Error Logs:      sudo tail -f /var/log/nginx/error.log"
echo "Access Logs:     sudo tail -f /var/log/nginx/access.log"
echo ""

# ==============================================================================
# SYSTEM DEBUGGING
# ==============================================================================

echo "--- System Debugging ---"
echo "Check Ports:     sudo ss -tulpn | grep -E '3000|8080|80|5432|7474'"
echo "Check Memory:    free -h"
echo "Check Disk:      df -h"
echo "Check Swap:      swapon --show"
