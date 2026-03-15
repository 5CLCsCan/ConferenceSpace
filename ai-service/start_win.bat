@echo off
:: Conference AI Service Quick Start (Windows)
:: Requires: backend stack running (docker compose up in /backend)
:: Usage: .\start_win.bat

if not exist .env (
    echo [INFO] .env not found, initializing from .env.example...
    copy .env.example .env
)

set "AI_SERVICE_HOST=0.0.0.0"
set "AI_SERVICE_PORT=8090"

for /f "usebackq tokens=1* delims==" %%A in (".env") do (
    if /I "%%A"=="AI_SERVICE_HOST" set "AI_SERVICE_HOST=%%B"
    if /I "%%A"=="AI_SERVICE_PORT" set "AI_SERVICE_PORT=%%B"
)

echo [INFO] Syncing database migrations...
call poetry run alembic upgrade head

echo [INFO] Launching ai-service on http://%AI_SERVICE_HOST%:%AI_SERVICE_PORT%...
call poetry run uvicorn app.main:app --reload --host %AI_SERVICE_HOST% --port %AI_SERVICE_PORT%
