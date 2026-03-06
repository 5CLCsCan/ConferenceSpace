@echo off
:: Conference AI Service Quick Start (Windows)
:: Usage: .\start.bat

if not exist .env (
    echo [INFO] .env not found, initializing from .env.example...
    copy .env.example .env
)

echo [INFO] Syncing database migrations...
call poetry run alembic upgrade head

echo [INFO] Launching service on http://localhost:8090...
call poetry run uvicorn app.main:app --reload --port 8090
