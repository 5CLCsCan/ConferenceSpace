package submission

import (
	"time"

	"github.com/lib/pq"
)

// Submission represents the conference_submissions database entity
type Submission struct {
	SubmissionID int64          `db:"submission_id"`
	Author       string         `db:"author"`
	Domain       pq.StringArray `db:"domain"`
	Status       string         `db:"status"`
	Link         string         `db:"link"`
	Information  []byte         `db:"information"` // JSONB stored as bytes
	CreatedAt    time.Time      `db:"created_at"`
	UpdatedAt    time.Time      `db:"updated_at"`
}

