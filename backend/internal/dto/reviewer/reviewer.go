package reviewer

import "time"

// Response represents the reviewer API response
type Response struct {
	ID           int64     `json:"id"`
	UserID       int64     `json:"user_id"`
	ConferenceID int64     `json:"conference_id"`
	Domain       []string  `json:"domain"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// CreateRequest represents the request to create a reviewer
type CreateRequest struct {
	UserID       int64    `json:"user_id" binding:"required"`
	ConferenceID int64    `json:"conference_id" binding:"required"`
	Domain       []string `json:"domain"`
}

// UpdateRequest represents the request to update a reviewer
type UpdateRequest struct {
	Domain []string `json:"domain"`
}

