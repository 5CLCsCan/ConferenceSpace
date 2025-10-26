package dto

import "time"

// Assignment represents a paper-reviewer assignment
type Assignment struct {
	ID           int64      `json:"id,omitempty"`
	ConferenceID int64      `json:"conference_id,omitempty"`
	SubmissionID int64      `json:"submission_id" binding:"required"`
	ReviewerID   int64      `json:"reviewer_id" binding:"required"`
	Score        float64    `json:"score,omitempty"`
	Status       string     `json:"status,omitempty"`
	AssignedAt   time.Time  `json:"assigned_at,omitempty"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at,omitempty"`
	UpdatedAt    time.Time  `json:"updated_at,omitempty"`
}

// AssignmentCreateRequest represents the request to create assignments
type AssignmentCreateRequest struct {
	Assignments []Assignment `json:"assignments" binding:"required,dive"`
}

// AssignmentListRequest represents the request for listing assignments
type AssignmentListRequest struct {
	Limit        int    `form:"limit" json:"limit"`
	Offset       int    `form:"offset" json:"offset"`
	SubmissionID int64  `form:"submission_id" json:"submission_id"`
	ReviewerID   int64  `form:"reviewer_id" json:"reviewer_id"`
	Status       string `form:"status" json:"status"`
}

// AssignmentListResponse represents the response for listing assignments
type AssignmentListResponse struct {
	Assignments []*Assignment `json:"assignments"`
	Total       int64         `json:"total"`
	Limit       int           `json:"limit"`
	Offset      int           `json:"offset"`
}

// AssignmentUpdateStatusRequest represents the request to update assignment status
type AssignmentUpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending accepted declined completed"`
}
