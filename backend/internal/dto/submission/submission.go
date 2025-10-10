package submission

import "time"

// Response represents the submission API response
type Response struct {
	SubmissionID int64                  `json:"submission_id"`
	Author       string                 `json:"author"`
	Domain       []string               `json:"domain"`
	Status       string                 `json:"status"`
	Link         string                 `json:"link"`
	Information  map[string]interface{} `json:"information"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}

// CreateRequest represents the request to create a submission
type CreateRequest struct {
	Author      string                 `json:"author" binding:"required"`
	Domain      []string               `json:"domain"`
	Status      string                 `json:"status"`
	Link        string                 `json:"link"`
	Information map[string]interface{} `json:"information"`
}

// UpdateRequest represents the request to update a submission
type UpdateRequest struct {
	Author      *string                `json:"author"`
	Domain      []string               `json:"domain"`
	Status      *string                `json:"status"`
	Link        *string                `json:"link"`
	Information map[string]interface{} `json:"information"`
}

