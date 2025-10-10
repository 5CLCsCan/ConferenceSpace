package user

import (
	"time"

	userDto "github.com/dcao/conferencespace/internal/dto/user"
	"github.com/lib/pq"
)

const (
	TableName = "users"

	ColUserID    = "user_id"
	ColEmail     = "email"
	ColFirstName = "first_name"
	ColLastName  = "last_name"
	ColPassword  = "hashed_password"
	ColDomain    = "domain"
	ColCreatedAt = "created_at"
	ColUpdatedAt = "updated_at"
)

type User struct {
	UserID         int64          `db:"user_id"`
	Email          string         `db:"email"`
	FirstName      string         `db:"first_name"`
	LastName       string         `db:"last_name"`
	HashedPassword string         `db:"hashed_password"`
	Domain         pq.StringArray `db:"domain"`
	CreatedAt      time.Time      `db:"created_at"`
	UpdatedAt      time.Time      `db:"updated_at"`
}

func (u *User) ToDTO() *userDto.Response {
	domain := []string(u.Domain)
	if domain == nil {
		domain = []string{}
	}

	return &userDto.Response{
		User: &userDto.User{
			ID:        u.UserID,
			Email:     u.Email,
			FirstName: u.FirstName,
			LastName:  u.LastName,
			Domain:    domain,
		},
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}
