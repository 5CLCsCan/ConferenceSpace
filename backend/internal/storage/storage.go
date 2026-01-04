package storage

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/dcao/conferencespace/internal/config"
	"github.com/dcao/conferencespace/internal/storage/assignment"
	"github.com/dcao/conferencespace/internal/storage/cache"
	"github.com/dcao/conferencespace/internal/storage/coi"
	"github.com/dcao/conferencespace/internal/storage/conference"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	"github.com/dcao/conferencespace/internal/storage/notification"
	"github.com/dcao/conferencespace/internal/storage/reviewer"
	"github.com/dcao/conferencespace/internal/storage/submission"
	"github.com/dcao/conferencespace/internal/storage/user"
)

type Storage struct {
	User               user.StorageInterface
	Conference         conference.StorageInterface
	Submission         submission.StorageInterface
	Reviewer           reviewer.StorageInterface
	Assignment         assignment.StorageInterface
	ConferenceUserRole conferenceuserrole.StorageInterface
	COI                coi.StorageInterface
	Notification       notification.StorageInterface
	Cache              cache.StorageInterface
}

func NewStorage(db *sql.DB) *Storage {
	return &Storage{
		User:               user.New(db),
		Conference:         conference.New(db),
		Submission:         submission.New(db),
		Reviewer:           reviewer.New(db),
		Assignment:         assignment.New(db),
		ConferenceUserRole: conferenceuserrole.New(db),
		COI:                coi.New(db),
		Notification:       notification.New(db),
		Cache:              cache.New(db),
	}
}

// NewDB creates a new database connection
func NewDB(cfg config.DatabaseConfig) (*sql.DB, error) {
	db, err := sql.Open("postgres", cfg.GetDSN())
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	return db, nil
}
