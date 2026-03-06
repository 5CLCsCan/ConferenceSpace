#!/bin/bash
# Conference AI Service Quick Start (POSIX)

if [ ! -f .env ]; then
    echo "[INFO] .env not found, initializing from .env.example..."
    cp .env.example .env
fi

poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --port 8090