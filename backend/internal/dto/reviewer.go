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
	ConferenceID int64      `uri:"conference_id" binding:"required"`
	Reviewers    []Reviewer `json:"reviewers"`
}

// ReviewerBatchInviteResponse represents the response after inviting reviewers
type ReviewerBatchInviteResponse struct {
	Success []Reviewer `json:"success"`
	Failed  []struct {
		UserID int64  `json:"user_id"`
		Error  string `json:"error"`
	} `json:"failed,omitempty"`
}

// ReviewerGetRequest represents the request to get a specific reviewer
type ReviewerGetRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
	ReviewerID   int64 `uri:"reviewer_id" binding:"required"`
}

// ReviewerUpdateStatusRequest represents the request to update a reviewer's status
type ReviewerUpdateStatusRequest struct {
	ConferenceID int64  `uri:"conference_id" binding:"required"`
	ReviewerID   int64  `uri:"reviewer_id" binding:"required"`
	Status       string `json:"status"`
}

// ReviewerDeleteRequest represents the request to delete a reviewer
type ReviewerDeleteRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
	ReviewerID   int64 `uri:"reviewer_id" binding:"required"`
}

// ReviewerListRequest represents the request to list reviewers with pagination
type ReviewerListRequest struct {
	ConferenceID int64  `uri:"conference_id" binding:"required"`
	Limit        int    `form:"limit" json:"limit"`
	Offset       int    `form:"offset" json:"offset"`
	Status       string `form:"status" json:"status"` // Filter by status (pending, accepted, rejected)
}

// ReviewerListResponse represents the paginated list of reviewers
type ReviewerListResponse struct {
	Reviewers []*Reviewer `json:"reviewers"`
	Total     int64       `json:"total"`
	Limit     int         `json:"limit"`
	Offset    int         `json:"offset"`
}
