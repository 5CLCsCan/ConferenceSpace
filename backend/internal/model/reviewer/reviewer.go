package reviewer

import (
	"time"

	"github.com/lib/pq"
)

// Reviewer represents the conference_reviewers database entity
type Reviewer struct {
	ID           int64          `db:"id"`
	UserID       int64          `db:"user_id"`
	ConferenceID int64          `db:"conference_id"`
	Domain       pq.StringArray `db:"domain"`
	CreatedAt    time.Time      `db:"created_at"`
	UpdatedAt    time.Time      `db:"updated_at"`
}

