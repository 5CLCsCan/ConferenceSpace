# ConferenceSpace Backend

A clean architecture Golang backend service for conference management.

## Architecture

The project follows a clean architecture pattern with clear separation of concerns:

```
Backend/
├── cmd/
│   └── server/          # Application entry point
├── internal/
│   ├── config/          # Configuration management
│   ├── controller/      # HTTP handlers (Presentation layer)
│   │   ├── controller.go
│   │   └── conference/
│   ├── service/         # Business logic (Application layer)
│   │   ├── service.go
│   │   └── conference/
│   ├── storage/         # Data persistence (Infrastructure layer)
│   │   ├── storage.go
│   │   └── conference/
│   └── model/           # Domain models
│       └── conference/
├── migrations/          # Database migrations
├── Dockerfile
├── docker-compose.yml
└── Makefile
```

## Prerequisites

- Go 1.21+
- Docker & Docker Compose
- golang-migrate CLI (optional, for local migrations)

## Quick Start

### Option 1: Local Development (Recommended)

Run the database in Docker and the server locally for faster development:

```bash
# Start everything (DB + migrations + server)
make dev

# Or step by step:
make db-up          # Start PostgreSQL
make migrate-up     # Run migrations
make server         # Start the server
```

The API will be available at `http://localhost:8080`

### Option 2: Full Docker Setup

Run everything in Docker containers:

```bash
# Start all services
make docker-up

# View logs
make docker-logs

# Stop services
make docker-down
```

## Available Commands

### 🚀 Development Workflow

```bash
make dev              # Start DB + migrations + server (one command!)
make db-up            # Start PostgreSQL database
make db-down          # Stop database
make db-reset         # Reset database (drop, create, migrate)
make server           # Run server locally
```

### 🐳 Docker Commands

```bash
make docker-up        # Start all services (DB + API)
make docker-down      # Stop all services
make docker-logs      # View logs from all services
make docker-logs-api  # View API logs only
make docker-logs-db   # View database logs only
make docker-restart   # Restart all services
make docker-build     # Build Docker image
```

### 🗄️ Database Migrations

```bash
make migrate-up       # Run migrations
make migrate-version  # Check current version
```

### 🛢️ Database Management

```bash
make db-shell         # Open PostgreSQL shell
make db-create        # Create database
make db-drop          # Drop database (with confirmation)
```

### 🧪 Testing

```bash
make test             # Run all tests
make test-coverage    # Run tests with coverage report
make test-unit        # Run unit tests only
```

### 🔧 Code Quality

```bash
make format           # Format code
make lint             # Run linter
make vet              # Run go vet
make tidy             # Tidy modules
```

### 📦 Build & Clean

```bash
make build            # Build binary
make run              # Build and run
make clean            # Clean build artifacts
make clean-all        # Clean everything including Docker volumes
```

### 🛠️ Tools

```bash
make install-tools    # Install development tools (migrate, golangci-lint)
make install-deps     # Download Go dependencies
make status           # Check status of all services
```

### ❓ Help

```bash
make help             # Show all available commands
```

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Conferences
- `GET /api/v1/conferences` - List all conferences
- `GET /api/v1/conferences/:id` - Get conference by ID
- `POST /api/v1/conferences` - Create new conference
- `PUT /api/v1/conferences/:id` - Update conference
- `DELETE /api/v1/conferences/:id` - Delete conference

## Example Usage

### Create a Conference

```bash
curl -X POST http://localhost:8080/api/v1/conferences \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GopherCon 2025",
    "description": "The largest Go conference",
    "location": "San Diego, CA",
    "start_date": "2025-07-15T09:00:00Z",
    "end_date": "2025-07-18T17:00:00Z",
    "capacity": 1500
  }'
```

### List Conferences

```bash
curl http://localhost:8080/api/v1/conferences
```

### Get Conference

```bash
curl http://localhost:8080/api/v1/conferences/1
```

## Configuration

Configuration is managed through environment variables. Copy `.env.example` to `.env` and modify as needed:

```bash
cp .env.example .env
```

Available configuration options:

- `SERVER_PORT` - Server port (default: 8080)
- `SERVER_ENV` - Environment (development/production)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_SSLMODE` - SSL mode (disable/require)

## Development Workflow

### Adding a New Entity

1. Create model in `internal/model/entity/entity.go`
2. Create storage in `internal/storage/entity/entity.go`
3. Create service in `internal/service/entity/entity.go`
4. Create controller in `internal/controller/entity/entity.go`
5. Update aggregators (`storage.go`, `service.go`, `controller.go`)
6. Wire up in `cmd/server/main.go`
7. Create migration: `make migrate-create NAME=create_entity_table`

### Project Structure

Each layer has an aggregator file (`<layer>.go`) that holds all dependencies:

- `internal/storage/storage.go` - Aggregates all storage implementations
- `internal/service/service.go` - Aggregates all services
- `internal/controller/controller.go` - Aggregates all controllers

Entity-specific implementations live in subfolders (e.g., `conference/`).

### Dependency Injection

The application uses manual dependency injection in `cmd/server/main.go`:

```
Storage Layer → Service Layer → Controller Layer
```

All dependencies are initialized at startup and injected through constructors.

## Troubleshooting

### Database connection failed

```bash
# Check if database is running
make status

# Restart database
make db-down
make db-up
```

### Migration errors

```bash
# Check migration status
make db-shell
# In psql shell:
# \dt  -- list tables
# SELECT * FROM schema_migrations;

# Force migration version if needed
make migrate-force VERSION=1
```

### Port already in use

```bash
# Check what's using port 8080
lsof -i :8080

# Or change port in .env
SERVER_PORT=8081
```

## License

MIT
