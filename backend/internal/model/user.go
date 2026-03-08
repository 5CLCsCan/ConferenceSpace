package model

import (
	"database/sql"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/lib/pq"
)

const (
	UserTableName = "users"

	UserColUserID    = "user_id"
	UserColEmail     = "email"
	UserColFirstName = "first_name"
	UserColLastName  = "last_name"
	UserColPassword  = "hashed_password"
	UserColDomain    = "domain"
	UserColCreatedAt          = "created_at"
	UserColUpdatedAt          = "updated_at"
	UserColSemanticScholarID  = "semantic_scholar_id"
	UserColProfileSyncStatus  = "profile_sync_status"
	UserColEmailVerified      = "email_verified"
)

type User struct {
	UserID         int64          `db:"user_id"`
	Email          string         `db:"email"`
	FirstName      string         `db:"first_name"`
	LastName       string         `db:"last_name"`
	HashedPassword string         `db:"hashed_password"`
	Domain            pq.StringArray `db:"domain"`
	SemanticScholarID sql.NullString `db:"semantic_scholar_id"`
	ProfileSyncStatus sql.NullString `db:"profile_sync_status"`
	EmailVerified     bool           `db:"email_verified"`
	CreatedAt         time.Time      `db:"created_at"`
	UpdatedAt         time.Time      `db:"updated_at"`
}

func (u *User) ToDTO() *dto.UserResponse {
	domain := []string(u.Domain)
	if domain == nil {
		domain = []string{}
	}

	var ssid *string
	if u.SemanticScholarID.Valid {
		ssid = &u.SemanticScholarID.String
	}

	var syncStatus *string
	if u.ProfileSyncStatus.Valid {
		syncStatus = &u.ProfileSyncStatus.String
	}

	return &dto.UserResponse{
		User: &dto.User{
			ID:                u.UserID,
			Email:             u.Email,
			FirstName:         u.FirstName,
			LastName:          u.LastName,
			Domain:            domain,
			SemanticScholarID: ssid,
			ProfileSyncStatus: syncStatus,
		},
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}
