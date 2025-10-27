.PHONY: help dev db-up db-down db-reset server build run test clean docker-build docker-up docker-down migrate-up migrate-down test-api test-api-coverage

# Go binary path
GOBIN := $(shell go env GOPATH)/bin
MIGRATE := $(GOBIN)/migrate

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ============================================================================
# Development Workflow
# ============================================================================

dev: db-up migrate-up swagger server ## Start DB, run migrations, generate swagger docs, and start server (recommended for development)

db-up: ## Start PostgreSQL database only
	@echo "Starting PostgreSQL database..."
	docker-compose up -d postgres
	@echo "Waiting for database to be ready..."
	@docker-compose exec -T postgres bash -lc 'until pg_isready -U postgres -d conferencespace -q; do echo "…"; sleep 1; done'
	@echo "Database is ready!"

db-down: ## Stop PostgreSQL database
	@echo "Stopping PostgreSQL database..."
	docker-compose down

db-reset: db-down db-up migrate-up ## Reset database (down, up, migrate)
	@echo "Database reset complete!"

server: ## Run the server locally (requires DB to be running)
	@echo "Starting server..."
	go run ./cmd/server/main.go

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

docker-logs: ## View logs from all Docker services
	docker-compose logs -f

docker-logs-api: ## View logs from API service only
	docker-compose logs -f app

docker-logs-db: ## View logs from database service only
	docker-compose logs -f postgres

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
	@if ! command -v $(GOBIN)/swag >/dev/null 2>&1; then \
		echo "⚠️  swag not found. Installing..."; \
		go install github.com/swaggo/swag/cmd/swag@latest; \
	fi
	@$(GOBIN)/swag init -g cmd/server/main.go -o ./docs
	@echo "✅ Swagger docs generated in ./docs"
	@echo "📚 Access Swagger UI at: http://localhost:8080/swagger/index.html"

swagger-serve: swagger ## Generate and serve swagger UI
	@echo "Swagger UI available at: http://localhost:8080/swagger/index.html"

# ============================================================================
# Quick Status Check
# ============================================================================

status: ## Check status of services
	@echo "=== Docker Services Status ==="
	@docker-compose ps
	@echo ""
	@echo "=== Database Connection ==="
	@docker-compose exec -T postgres psql -U postgres -d conferencespace -c "SELECT 'Connected!' as status" 2>/dev/null || echo "Database not accessible"
	@echo ""
	@echo "=== API Health Check ==="
	@curl -s http://localhost:8080/health 2>/dev/null | grep -q "healthy" && echo "API is healthy!" || echo "API not accessible"