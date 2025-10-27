package dto

import "time"

// Assignment represents a paper assignment for both request and response
type Assignment struct {
	ID           int64      `json:"id,omitempty"`
	ConferenceID int64      `json:"conference_id,omitempty"`
	SubmissionID int64      `json:"submission_id" binding:"required"`
	ReviewerID   int64      `json:"reviewer_id" binding:"required"`
	Score        float64    `json:"score,omitempty"`
	Status       string     `json:"status,omitempty"` // pending, accepted, declined, completed
	AssignedAt   time.Time  `json:"assigned_at,omitempty"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at,omitempty"`
	UpdatedAt    time.Time  `json:"updated_at,omitempty"`
}

// AssignmentCreateRequest represents the request to create a single assignment
type AssignmentCreateRequest struct {
	Assignment *Assignment `json:"assignment" binding:"required"`
}

// AssignmentListRequest represents the request for listing assignments with pagination and filters
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

// AssignmentUpdateStatusRequest represents the request to update an assignment's status
type AssignmentUpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending accepted declined completed"`
}

// AutoAssignRequest represents the request for auto-assignment
type AutoAssignRequest struct {
	MinReviewersPerPaper int     `json:"min_reviewers_per_paper" binding:"required,min=1"`
	MaxReviewersPerPaper int     `json:"max_reviewers_per_paper" binding:"required,min=1"`
	MaxPapersPerReviewer *int    `json:"max_papers_per_reviewer,omitempty"`
	MinScoreThreshold    float64 `json:"min_score_threshold"`
	DryRun               bool    `json:"dry_run"`
}

// AutoAssignResponse represents the response for auto-assignment
type AutoAssignResponse struct {
	TotalSubmissions int           `json:"total_submissions"`
	TotalReviewers   int           `json:"total_reviewers"`
	TotalAssignments int           `json:"total_assignments"`
	AverageScore     float64       `json:"average_score"`
	UnassignedPapers []int64       `json:"unassigned_papers"`
	ReviewerLoad     map[int64]int `json:"reviewer_load"`
	Assignments      []*Assignment `json:"assignments,omitempty"` // Only populated if DryRun=true
}
