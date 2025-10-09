package storage

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/dcao/conferencespace/internal/config"
	"github.com/dcao/conferencespace/internal/storage/conference"
)

// Storage holds all storage dependencies
type Storage struct {
	Conference *conference.Conference
	// Add more storages here as needed
}

// NewStorage creates a new storage instance with all dependencies
func NewStorage(db *sql.DB) *Storage {
	return &Storage{
		Conference: conference.New(db),
	}
}

// NewDB creates a new database connection
func NewDB(cfg config.DatabaseConfig) (*sql.DB, error) {
	db, err := sql.Open("postgres", cfg.GetDSN())
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}
