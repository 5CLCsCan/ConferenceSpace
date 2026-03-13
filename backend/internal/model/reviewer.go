package model

import (
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/lib/pq"
)

const (
	ReviewerTableName = "conference_reviewers"

	// Common column names (reusable across models)
	ColID     = "id"
	ColUserID = "user_id"
	ColStatus = "status"
)

// Reviewer represents the conference_reviewers database entity
type Reviewer struct {
	ID           int64          `db:"id"`
	UserID       int64          `db:"user_id"`
	ConferenceID int64          `db:"conference_id"`
	Status       string         `db:"status"`
	Domain       pq.StringArray `db:"domain"`
	CreatedAt    time.Time      `db:"created_at"`
	UpdatedAt    time.Time      `db:"updated_at"`

	// View fields
	UserEmail     string `db:"email"`
	UserFirstName string `db:"first_name"`
	UserLastName  string `db:"last_name"`
}

// Reviewer status constants
const (
	ReviewerStatusPending  = "pending"
	ReviewerStatusAccepted = "accepted"
	ReviewerStatusRejected = "rejected"
)

func (r *Reviewer) ToDTO() *dto.Reviewer {
	return &dto.Reviewer{
		ID:           r.ID,
		UserID:       r.UserID,
		ConferenceID: r.ConferenceID,
		Email:        r.UserEmail,
		FirstName:    r.UserFirstName,
		LastName:     r.UserLastName,
		Status:       r.Status,
		Domain:       r.Domain,
		CreatedAt:    r.CreatedAt,
		UpdatedAt:    r.UpdatedAt,
	}
}
