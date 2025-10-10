package user

import "time"

// Response represents the user API response
type Response struct {
	UserID    int64     `json:"user_id"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Domain    []string  `json:"domain"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreateRequest represents the request to create a user (register)
type CreateRequest struct {
	Email     string   `json:"email" binding:"required,email"`
	FirstName string   `json:"first_name" binding:"required"`
	LastName  string   `json:"last_name" binding:"required"`
	Password  string   `json:"password" binding:"required,min=6"`
	Domain    []string `json:"domain"`
}

// UpdateRequest represents the request to update a user
type UpdateRequest struct {
	Email     *string  `json:"email" binding:"omitempty,email"`
	FirstName *string  `json:"first_name"`
	LastName  *string  `json:"last_name"`
	Domain    []string `json:"domain"`
}

// LoginRequest represents the login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the login response with JWT token
type LoginResponse struct {
	Token string    `json:"token"`
	User  *Response `json:"user"`
}

