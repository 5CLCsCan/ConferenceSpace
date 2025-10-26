package dto

import "time"

// Reviewer represents a reviewer for both request and response
type Reviewer struct {
	ID           int64     `json:"id,omitempty"`
	UserID       int64     `json:"user_id" binding:"required"`
	ConferenceID int64     `json:"conference_id,omitempty"`
	Email        string    `json:"email,omitempty"`  // From users table (view field)
	Status       string    `json:"status,omitempty"` // Optional in request, defaults to "pending"
	Domain       []string  `json:"domain,omitempty"`
	CreatedAt    time.Time `json:"created_at,omitempty"`
	UpdatedAt    time.Time `json:"updated_at,omitempty"`
}

// ReviewerBatchInviteRequest represents the request to invite multiple reviewers
type ReviewerBatchInviteRequest struct {
	Reviewers []Reviewer `json:"reviewers" binding:"required,dive"`
}

// ReviewerBatchInviteResponse represents the response after inviting reviewers
type ReviewerBatchInviteResponse struct {
	Success []Reviewer `json:"success"`
	Failed  []struct {
		UserID int64  `json:"user_id"`
		Error  string `json:"error"`
	} `json:"failed,omitempty"`
}

// ReviewerUpdateStatusRequest represents the request to update a reviewer's status
type ReviewerUpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending accepted rejected"`
}

// ReviewerListRequest represents the request to list reviewers with pagination
type ReviewerListRequest struct {
	Limit  int    `form:"limit" json:"limit"`
	Offset int    `form:"offset" json:"offset"`
	Status string `form:"status" json:"status"` // Filter by status (pending, accepted, rejected)
}

// ReviewerListResponse represents the paginated list of reviewers
type ReviewerListResponse struct {
	Reviewers []*Reviewer `json:"reviewers"`
	Total     int64       `json:"total"`
	Limit     int         `json:"limit"`
	Offset    int         `json:"offset"`
}
