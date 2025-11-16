package model

import (
	"time"
)

const (
	ConferenceUserRoleTableName = "conference_user_roles"

	ColUserEmail = "user_email"
	ColRole      = "role"
	// ColStatus is defined in reviewer.go to avoid duplication
)

// ConferenceUserRole represents the conference_user_roles database entity (internal junction table)
type ConferenceUserRole struct {
	ID           int64     `db:"id"`
	ConferenceID int64     `db:"conference_id"`
	UserID       *int64    `db:"user_id"` // Nullable for cases where we only have email
	UserEmail    string    `db:"user_email"`
	Role         string    `db:"role"`
	Status       string    `db:"status"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

// RoleAssignment represents a user role assignment for bulk operations
type RoleAssignment struct {
	ConferenceID int64
	UserEmail    string
	Role         string
}

// Role status constants
const (
	RoleStatusActive   = "active"
	RoleStatusInactive = "inactive"
	RoleStatusPending  = "pending"
)
