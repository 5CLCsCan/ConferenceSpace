# Quick Start Guide

## 🚀 Get Started in 3 Commands

### Option 1: Local Development (Fastest)

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

### Option 2: Full Docker (Everything in containers)

```bash
make docker-up
```

This will start both PostgreSQL and the API server in Docker containers.

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

### Port 5432 already in use?
```bash
# Check what's using it
lsof -i :5432
# Stop existing PostgreSQL
brew services stop postgresql
# or
sudo systemctl stop postgresql
```

### Port 8080 already in use?
```bash
# Find and kill the process
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

Happy coding! 🎉

