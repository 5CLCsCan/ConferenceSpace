# Quick Start Guide

## 🚀 First Time Setup (For Windows)

### Prerequisites

- **Windows:** WSL2 with Ubuntu installed
- **Docker Desktop** (must be running on Windows)

### Initial Setup (One-Time)

Open WSL Ubuntu terminal and run:

```bash
# Navigate to backend directory
cd <path_to_backend>/ConferenceSpace/backend

# 1. Install Go (if not already installed)
sudo snap install go --classic

# 2. Verify Go installation
go version

# 3. Install development tools (migrate, swag, golangci-lint)
make install-tools

# 4. Generate Swagger documentation
make swagger

# 5. Start backend
make dev
```

---

## 🚀 Daily Development

Once initial setup is complete, start development with:

```bash
make dev
```

This single command will:

1. ✅ Start PostgreSQL in Docker
2. ✅ Wait for database to be ready
3. ✅ Run database migrations
4. ✅ Start your Go server locally

**Access your API:** `http://localhost:8080/health`

---

## 📋 Common Commands

### Development Workflow

```bash
make dev              # Start everything (DB + server)
make db-up            # Just start the database
make server           # Just start the server (requires DB)
make status           # Check if services are running
```

### Docker

```bash
make docker-up        # Start all in Docker
make docker-down      # Stop Docker services
make docker-logs      # View logs
```

### Database

```bash
make migrate-up       # Run migrations
make db-shell         # Open database shell
make db-reset         # Reset database
```

### Stop Everything

```bash
make db-down          # Stop database
# or
make docker-down      # Stop all Docker services
```

---

## 🧪 Test Your Setup

1. Start the services:

   ```bash
   make dev
   ```

2. Check health:

   ```bash
   curl http://localhost:8080/health
   ```

3. Create a conference:

   ```bash
   curl -X POST http://localhost:8080/api/v1/conferences \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Conference",
       "description": "My first conference",
       "location": "Online",
       "start_date": "2025-12-01T09:00:00Z",
       "end_date": "2025-12-01T17:00:00Z",
       "capacity": 100
     }'
   ```

4. List conferences:
   ```bash
   curl http://localhost:8080/api/v1/conferences
   ```

---

## 🆘 Troubleshooting

### Docker not running?

```bash
# Start Docker Desktop on Windows
# Check Docker status in WSL
docker ps
```

### Port 5432 already in use?

```bash
# Stop existing PostgreSQL container
make db-down
# or
docker-compose down
```

### Port 8080 already in use?

```bash
# Find and kill the process in WSL
lsof -i :8080
kill -9 <PID>
```

### Database won't connect?

```bash
make status           # Check services
make db-down         # Stop
make db-up           # Start fresh
```

### Need to reset everything?

```bash
make clean-all       # Clean everything
make dev            # Start fresh
```

### "migrate: command not found" or "swag: command not found"?

```bash
# Reinstall tools
make install-tools
# Reload PATH
source ~/.bashrc
```

### "no required module provides package github.com/dcao/conferencespace/docs"?

```bash
# Generate Swagger docs
make swagger
```

---

## 🔧 Platform-Specific Notes

### WSL on Windows

- Make sure **Docker Desktop** is running on Windows
- All backend development happens **inside WSL Ubuntu**
- Frontend can run in Windows PowerShell (separate terminal)
- Database runs in Docker (accessible from both WSL and Windows)
- Port `localhost:8080` and `localhost:5432` work from both environments

### macOS/Linux

- Setup is simpler - just follow the "Initial Setup" section
- No WSL needed
- Docker can be Docker Desktop or native Docker

---

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- Run `make help` to see all available commands
- Check [API Endpoints](README.md#api-endpoints) for API documentation

---

## 💡 Pro Tips

1. **Use `make dev` for daily development** - fastest feedback loop
2. **Run `make status`** to check if everything is working
3. **Use `make db-reset`** when you need a clean database
4. **Run `make format`** before committing code
5. **Use `make docker-logs`** to debug issues
6. **Keep Docker Desktop running** if you're on Windows

Happy coding! 🎉
