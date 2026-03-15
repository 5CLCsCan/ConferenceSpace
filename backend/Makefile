.PHONY: help dev db-up db-down db-reset redis-up redis-down redis-logs neo4j-up neo4j-down neo4j-init neo4j-shell neo4j-logs server build run test clean docker-build docker-up docker-down docker-logs-redis migrate-up migrate-down test-api test-api-coverage

# Go binary path
GOBIN := $(shell go env GOPATH)/bin
MIGRATE := $(GOBIN)/migrate

# Neo4j connection details
NEO4J_URI := bolt://localhost:7687
NEO4J_USER := neo4j
NEO4J_PASS := conferencespace

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ============================================================================
# Development Workflow
# ============================================================================

dev: db-up redis-up neo4j-up migrate-up neo4j-init swagger server ## Start all databases, run migrations, init Neo4j, generate swagger docs, and start server (recommended for development)

restart: ## Restart all services (kill current server, stop databases, and run make dev)
	@echo "Stopping existing server..."
	@pkill -f "go run ./cmd/server/main.go" || true
	@pkill -f "bin/server" || true
	@echo "Killing any process on port 8080..."
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	@echo "Waiting for processes to terminate..."
	@sleep 2
	$(MAKE) dev

db-up: ## Start PostgreSQL database only
	@echo "Starting PostgreSQL database..."
	docker-compose up -d postgres
	@echo "Waiting for database to be ready..."
	@docker-compose exec -T postgres bash -lc 'until pg_isready -U postgres -d conferencespace -q; do echo "…"; sleep 1; done'
	@echo "Database is ready!"

db-down: ## Stop PostgreSQL database
	@echo "Stopping PostgreSQL database..."
	docker-compose stop postgres

db-reset: db-down db-up migrate-up ## Reset database (down, up, migrate)
	@echo "Database reset complete!"

redis-up: ## Start Redis cache
	@echo "Starting Redis cache..."
	docker-compose up -d redis
	@echo "Waiting for Redis to be ready..."
	@ping -n 4 127.0.0.1 > NUL 2>&1
	@echo "Redis is ready!"

redis-down: ## Stop Redis cache
	@echo "Stopping Redis cache..."
	docker-compose stop redis

redis-logs: ## View Redis logs
	docker-compose logs -f redis

server: ## Run the server locally (requires DB to be running)
	@echo "Starting server..."
	go run ./cmd/server/main.go

# ============================================================================
# Neo4j Graph Database
# ============================================================================

neo4j-up: ## Start Neo4j graph database
	@echo "Starting Neo4j graph database..."
	docker-compose up -d neo4j
	@echo "Waiting for Neo4j to be ready (this may take 30 seconds)..."
	@ping -n 31 127.0.0.1 > NUL 2>&1
	@echo "✅ Neo4j is ready!"
	@echo "📊 Neo4j Browser UI: http://localhost:7474"
	@echo "🔐 Username: neo4j"
	@echo "🔑 Password: conferencespace"

neo4j-down: ## Stop Neo4j database
	@echo "Stopping Neo4j database..."
	docker-compose stop neo4j

neo4j-restart: neo4j-down neo4j-up ## Restart Neo4j database

neo4j-init: ## Initialize Neo4j constraints and indexes for COI detection
	@echo "Initializing Neo4j schema (constraints & indexes)..."
	-@docker-compose exec -T neo4j cypher-shell -u $(NEO4J_USER) -p $(NEO4J_PASS) -d neo4j "CREATE CONSTRAINT author_email IF NOT EXISTS FOR (a:Author) REQUIRE a.email IS UNIQUE;"
	-@docker-compose exec -T neo4j cypher-shell -u $(NEO4J_USER) -p $(NEO4J_PASS) -d neo4j "CREATE INDEX author_name IF NOT EXISTS FOR (a:Author) ON (a.name);"
	-@docker-compose exec -T neo4j cypher-shell -u $(NEO4J_USER) -p $(NEO4J_PASS) -d neo4j "CREATE INDEX coauthor_date IF NOT EXISTS FOR ()-[r:COAUTHORED]-() ON (r.established_date);"
	@echo "Neo4j schema initialized!"
	@echo ""
	@echo "📋 Created constraints:"
	@echo "   - UNIQUE constraint on Author.email"
	@echo "📋 Created indexes:"
	@echo "   - Index on Author.name"
	@echo "   - Index on COAUTHORED.established_date"

neo4j-shell: ## Open Neo4j Cypher shell
	@echo "Opening Neo4j Cypher shell..."
	@echo "💡 Tip: Use :exit to quit"
	@docker-compose exec neo4j cypher-shell -u $(NEO4J_USER) -p $(NEO4J_PASS) -d neo4j

neo4j-logs: ## View Neo4j logs
	docker-compose logs -f neo4j

neo4j-status: ## Check Neo4j status and show sample data
	@echo "=== Neo4j Status ==="
	@docker-compose exec -T neo4j cypher-shell -u $(NEO4J_USER) -p $(NEO4J_PASS) -d neo4j \
		"CALL dbms.components() YIELD name, versions, edition RETURN name, versions[0] as version, edition;" 2>/dev/null || echo "Neo4j not accessible"
	@echo ""
	@echo "=== Node Counts ==="
	@docker-compose exec -T neo4j cypher-shell -u $(NEO4J_USER) -p $(NEO4J_PASS) -d neo4j \
		"MATCH (a:Author) RETURN 'Authors' as type, count(a) as count UNION ALL MATCH ()-[r:COAUTHORED]->() RETURN 'Relationships' as type, count(r) as count;" 2>/dev/null || echo "No data yet"

neo4j-clear: ## Clear all data from Neo4j (WARNING: destructive)
	@echo "⚠️  WARNING: This will delete ALL data from Neo4j!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose exec -T neo4j cypher-shell -u $(NEO4J_USER) -p $(NEO4J_PASS) -d neo4j \
			"MATCH (n) DETACH DELETE n;" 2>/dev/null; \
		echo "✅ Neo4j data cleared!"; \
	fi

# ============================================================================
# Graph Data Ingestion
# ============================================================================

graph-import-build: ## Build the graph import tool
	@echo "Building graph import tool..."
	cd tools/graph_ingestion && go build -o graph-import
	@echo "✅ Built: tools/graph_ingestion/graph-import"

graph-import: ## Import data into Neo4j (usage: make graph-import FILE=data.csv)
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make graph-import FILE=your_data.csv"; \
		echo ""; \
		echo "Optional parameters:"; \
		echo "  CLEAR=true    - Clear existing data first"; \
		echo "  BATCH=2000    - Set batch size"; \
		echo ""; \
		echo "Example:"; \
		echo "  make graph-import FILE=data.csv CLEAR=true BATCH=2000"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "❌ File not found: $(FILE)"; \
		exit 1; \
	fi
	@cd tools/graph_ingestion && \
		if [ ! -f graph-import ]; then \
			echo "Building import tool..."; \
			go build -o graph-import; \
		fi && \
		./graph-import -file=../../$(FILE) \
			$(if $(CLEAR),-clear,) \
			$(if $(BATCH),-batch=$(BATCH),)

graph-import-example: graph-import-build ## Import example data
	@echo "Importing example data..."
	cd tools/graph_ingestion && ./graph-import -file=example_data.csv -clear
	@echo ""
	@echo "✅ Example data imported!"
	@echo "📊 View in Neo4j Browser: http://localhost:7474"

# ============================================================================
# Build & Run
# ============================================================================

build: ## Build the application binary
	@echo "Building application..."
	go build -o bin/server ./cmd/server
	@echo "Binary created at bin/server"

run: build ## Build and run the application
	./bin/server

install-deps: ## Install Go dependencies
	@echo "Downloading dependencies..."
	go mod download
	@echo "Dependencies installed!"

# ============================================================================
# Docker Commands
# ============================================================================

docker-build: ## Build Docker image for the application
	@echo "Building Docker image..."
	docker build -t conferencespace:latest .

docker-up: ## Start all services (DB + API) with Docker Compose
	@echo "Starting all services with Docker Compose..."
	docker-compose up -d
	@echo "All services started!"
	@echo "API available at: http://localhost:8080"
	@echo "Health check: http://localhost:8080/health"

docker-down: ## Stop all Docker services
	@echo "Stopping all services..."
	docker-compose down

docker-down-volumes: ## Stop all services and remove volumes (WARNING: deletes all data)
	@echo "⚠️  WARNING: This will delete all data including PostgreSQL and Neo4j!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "✅ All services stopped and volumes removed!"; \
	fi

docker-logs: ## View logs from all Docker services
	docker-compose logs -f

docker-logs-api: ## View logs from API service only
	docker-compose logs -f app

docker-logs-db: ## View logs from PostgreSQL service only
	docker-compose logs -f postgres

docker-logs-neo4j: ## View logs from Neo4j service only
	docker-compose logs -f neo4j

docker-logs-redis: ## View logs from Redis service only
	docker-compose logs -f redis

docker-restart: docker-down docker-up ## Restart all Docker services

# ============================================================================
# Database Migrations
# ============================================================================

migrate-up: ## Run database migrations
	@echo "Running migrations..."
	@docker-compose exec -T postgres bash -lc 'until pg_isready -U postgres -d conferencespace -q; do sleep 1; done'
	$(MIGRATE) -path migrations -database "postgresql://postgres:postgres@localhost:5432/conferencespace?sslmode=disable" up
	@echo "Migrations completed!"

migrate-version: ## Check current migration version
	@echo "Current migration version:"
	@$(MIGRATE) -path migrations -database "postgresql://postgres:postgres@localhost:5432/conferencespace?sslmode=disable" version 2>/dev/null || echo "No migrations applied yet"
	@echo ""
	@echo "Available migrations:"
	@ls -1 migrations/*.up.sql 2>/dev/null | wc -l | xargs echo "Total:"

migrate-create: ## Create new migration (usage: make migrate-create NAME=add_email_field)
	@if [ -z "$(NAME)" ]; then \
		echo "Usage: make migrate-create NAME=your_migration_name"; \
		echo "Example: make migrate-create NAME=add_email_to_conferences"; \
		exit 1; \
	fi
	@$(MIGRATE) create -ext sql -dir migrations -seq $(NAME)
	@echo "✅ Created migration files!"
	@echo "Edit them in: migrations/"

# ============================================================================
# Database Management
# ============================================================================

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d conferencespace

db-schema: ## Show current database schema
	@echo "=== Database Tables ==="
	@docker-compose exec -T postgres psql -U postgres -d conferencespace -c "\dt"
	@echo ""
	@echo "=== Conferences Table Schema ==="
	@docker-compose exec -T postgres psql -U postgres -d conferencespace -c "\d conferences"

db-create: ## Create database (if not exists)
	docker-compose exec postgres psql -U postgres -c "CREATE DATABASE conferencespace;" || echo "Database already exists"

db-drop: ## Drop database (WARNING: destructive)
	@echo "WARNING: This will delete the database!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS conferencespace;"; \
		echo "Database dropped!"; \
	fi

# ============================================================================
# Testing
# ============================================================================

test: ## Run all tests
	@echo "Running tests..."
	go test -v ./...

test-coverage: ## Run tests with coverage report
	@echo "Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

test-unit: ## Run unit tests only
	go test -v -short ./...

# ============================================================================
# API Integration Tests
# ============================================================================

test-api: ## Run API tests (usage: make test-api [path=auth|user|conference|submission|e2e])
	@if [ -n "$(path)" ]; then \
		echo "Running tests for: $(path)"; \
		cd tests/api && go test -v ./$(path); \
	else \
		echo "Running all API tests..."; \
		cd tests/api && go test -v ./...; \
	fi

test-api-coverage: ## Run API tests with coverage
	@echo "Running API tests with coverage..."
	cd tests/api && go test -v -coverprofile=coverage.out ./...
	cd tests/api && go tool cover -html=coverage.out -o coverage.html
	@echo "API test coverage report generated: tests/api/coverage.html"

# ============================================================================
# Code Quality
# ============================================================================

lint: ## Run linter (requires golangci-lint)
	@test -f $(GOBIN)/golangci-lint || { echo "golangci-lint not installed. Run: make install-tools"; exit 1; }
	$(GOBIN)/golangci-lint run

format: ## Format Go code
	@echo "Formatting code..."
	go fmt ./...
	@echo "Code formatted!"

vet: ## Run go vet
	@echo "Running go vet..."
	go vet ./...

tidy: ## Tidy Go modules
	@echo "Tidying modules..."
	go mod tidy
	@echo "Modules tidied!"

# ============================================================================
# Cleanup
# ============================================================================

clean: ## Clean build artifacts and temporary files
	@echo "Cleaning up..."
	rm -rf bin/
	rm -f coverage.out coverage.html
	@echo "Cleanup complete!"

clean-all: clean docker-down ## Clean everything including Docker volumes
	@echo "Removing Docker volumes..."
	docker-compose down -v
	@echo "All cleaned up!"

# ============================================================================
# Tools Installation
# ============================================================================

install-tools: ## Install required development tools
	@echo "Installing golang-migrate..."
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	@echo "Installing golangci-lint..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "Installing swag..."
	go install github.com/swaggo/swag/cmd/swag@latest
	@echo "✅ Tools installed to $(GOBIN)"
	@echo ""
	@echo "💡 Tip: Add Go binaries to your PATH by adding this to your ~/.zshrc:"
	@echo "   export PATH=\$$PATH:$(GOBIN)"
	@echo ""
	@echo "The Makefile will automatically use the correct path for migrate."

swagger: ## Generate swagger documentation
	@echo "Generating swagger documentation..."
	$(GOBIN)/swag init -g cmd/server/main.go -o ./docs
	@echo "Swagger docs generated in ./docs"

swagger-serve: swagger ## Generate and serve swagger UI
	@echo "Swagger UI available at: http://localhost:8080/swagger/index.html"

# ============================================================================
# Quick Status Check
# ============================================================================

status: ## Check status of services
	@echo "=== Docker Services Status ==="
	@docker-compose ps
	@echo ""
	@echo "=== PostgreSQL Connection ==="
	@docker-compose exec -T postgres psql -U postgres -d conferencespace -c "SELECT 'Connected!' as status" 2>/dev/null || echo "PostgreSQL not accessible"
	@echo ""
	@echo "=== Neo4j Connection ==="
	@docker-compose exec -T neo4j cypher-shell -u $(NEO4J_USER) -p $(NEO4J_PASS) -d neo4j "RETURN 'Connected!' as status" 2>/dev/null || echo "Neo4j not accessible"
	@echo ""
	@echo "=== Redis Connection ==="
	@docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG && echo "Redis is accessible!" || echo "Redis not accessible"
	@echo ""
	@echo "=== API Health Check ==="
	@curl -s http://localhost:8080/health 2>/dev/null | grep -q "healthy" && echo "API is healthy!" || echo "API not accessible"
