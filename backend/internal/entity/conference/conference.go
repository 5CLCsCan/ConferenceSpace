package conference

import (
	"time"

	"github.com/lib/pq"
)

// Conference represents the conference database entity
type Conference struct {
	ConferenceID   int64          `db:"conference_id"`
	Chair          string         `db:"chair"`
	Configurations []byte         `db:"configurations"` // JSONB stored as bytes
	Domain         pq.StringArray `db:"domain"`
	CreatedAt      time.Time      `db:"created_at"`
	UpdatedAt      time.Time      `db:"updated_at"`
}

