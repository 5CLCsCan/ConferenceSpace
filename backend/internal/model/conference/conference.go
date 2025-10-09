package conference

import "time"

// Conference represents a conference entity
type Conference struct {
	ID          int64     `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Location    string    `json:"location" db:"location"`
	StartDate   time.Time `json:"start_date" db:"start_date"`
	EndDate     time.Time `json:"end_date" db:"end_date"`
	Capacity    int       `json:"capacity" db:"capacity"`
	Status      string    `json:"status" db:"status"` // draft, published, cancelled, completed
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// CreateRequest represents the request to create a conference
type CreateRequest struct {
	Name        string    `json:"name" binding:"required"`
	Description string    `json:"description"`
	Location    string    `json:"location" binding:"required"`
	StartDate   time.Time `json:"start_date" binding:"required"`
	EndDate     time.Time `json:"end_date" binding:"required"`
	Capacity    int       `json:"capacity" binding:"required,min=1"`
}

// UpdateRequest represents the request to update a conference
type UpdateRequest struct {
	Name        *string    `json:"name"`
	Description *string    `json:"description"`
	Location    *string    `json:"location"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	Capacity    *int       `json:"capacity"`
	Status      *string    `json:"status"`
}

