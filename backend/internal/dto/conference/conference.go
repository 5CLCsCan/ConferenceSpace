package conference

import "time"

// Response represents the conference API response
type Response struct {
	ConferenceID   int64                  `json:"conference_id"`
	Chair          string                 `json:"chair"`
	Configurations map[string]interface{} `json:"configurations"`
	Domain         []string               `json:"domain"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
}

// CreateRequest represents the request to create a conference
type CreateRequest struct {
	Chair          string                 `json:"chair" binding:"required"`
	Configurations map[string]interface{} `json:"configurations"`
	Domain         []string               `json:"domain"`
}

// UpdateRequest represents the request to update a conference
type UpdateRequest struct {
	Chair          *string                `json:"chair"`
	Configurations map[string]interface{} `json:"configurations"`
	Domain         []string               `json:"domain"`
}

