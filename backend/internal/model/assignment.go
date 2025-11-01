package model

import (
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

const (
	AssignmentTableName = "paper_assignments"

	ColReviewerID   = "reviewer_id"
	ColScore        = "score"
	ColAssignedAt   = "assigned_at"
	ColCompletedAt  = "completed_at"
)

// Assignment represents the paper_assignments database entity
type Assignment struct {
	ID           int64      `db:"id"`
	ConferenceID int64      `db:"conference_id"`
	SubmissionID int64      `db:"submission_id"`
	ReviewerID   int64      `db:"reviewer_id"`
	Score        float64    `db:"score"`
	Status       string     `db:"status"`
	AssignedAt   time.Time  `db:"assigned_at"`
	CompletedAt  *time.Time `db:"completed_at"`
	CreatedAt    time.Time  `db:"created_at"`
	UpdatedAt    time.Time  `db:"updated_at"`
}

// Assignment status constants
const (
	AssignmentStatusPending   = "pending"
	AssignmentStatusAccepted  = "accepted"
	AssignmentStatusDeclined  = "declined"
	AssignmentStatusCompleted = "completed"
)

// ToDTO converts model to DTO
func (a *Assignment) ToDTO() *dto.Assignment {
	return &dto.Assignment{
		ID:           a.ID,
		ConferenceID: a.ConferenceID,
		SubmissionID: a.SubmissionID,
		ReviewerID:   a.ReviewerID,
		Score:        a.Score,
		Status:       a.Status,
		AssignedAt:   a.AssignedAt,
		CompletedAt:  a.CompletedAt,
		CreatedAt:    a.CreatedAt,
		UpdatedAt:    a.UpdatedAt,
	}
}
