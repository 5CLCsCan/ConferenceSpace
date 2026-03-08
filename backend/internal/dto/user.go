package dto

import "time"

type User struct {
	ID                int64    `json:"id"`
	Email             string   `json:"email" binding:"required,email"`
	FirstName         string   `json:"first_name" binding:"required"`
	LastName          string   `json:"last_name" binding:"required"`
	Domain            []string `json:"domain"`
	SemanticScholarID *string  `json:"semantic_scholar_id,omitempty"`
	ProfileSyncStatus *string  `json:"profile_sync_status,omitempty"`
}

type UserResponse struct {
	*User
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserCreateRequest struct {
	User     *User  `json:"user" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

type UserGetRequest struct {
	ID int64 `uri:"id" binding:"required"`
}

type UserUpdateRequest struct {
	User *User `json:"user" binding:"required"`
}

type UserDeleteRequest struct {
	ID int64 `uri:"id" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string        `json:"token"`
	User  *UserResponse `json:"user"`
}

type UserListRequest struct {
	Limit     int    `form:"limit" json:"limit"`
	Offset    int    `form:"offset" json:"offset"`
	Email     string `form:"email" json:"email"`
	FirstName string `form:"first_name" json:"first_name"`
	LastName  string `form:"last_name" json:"last_name"`
}

type UserListResponse struct {
	Users []*UserResponse `json:"users"`
	Total int64           `json:"total"`
}

// UserSearchResponse represents the response for search endpoint (autocomplete)
type UserSearchResponse struct {
	Users []*UserResponse `json:"users"`
	Total int64           `json:"total"`
}

// UserCOICheckRequest represents the request to check COI for a user against conference authors
type UserCOICheckRequest struct {
	UserEmail    string `uri:"email" binding:"required"`
	ConferenceID int64  `form:"conference_id"`
}

// ConflictingAuthor represents an author that has a COI with the user
type ConflictingAuthor struct {
	Email     string `json:"email"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Reason    string `json:"reason"` // e.g., "Recent collaboration (2023)"
}

// UserCOICheckResponse represents the response with list of conflicting authors
type UserCOICheckResponse struct {
	UserID             int64               `json:"user_id"`
	UserEmail          string              `json:"user_email"`
	ConferenceID       int64               `json:"conference_id"`
	TotalAuthors       int                 `json:"total_authors"`
	ConflictingCount   int                 `json:"conflicting_count"`
	ConflictingAuthors []ConflictingAuthor `json:"conflicting_authors"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ForgotPasswordResponse includes token only in dev/test
type ForgotPasswordResponse struct {
	Message string  `json:"message"`
	Token   *string `json:"token,omitempty"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

type VerifyEmailRequest struct {
	Token string `form:"token" binding:"required"`
}

type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResendVerificationResponse includes token only in dev/test
type ResendVerificationResponse struct {
	Message string  `json:"message"`
	Token   *string `json:"token,omitempty"`
}

type MessageResponse struct {
	Message string `json:"message"`
}
