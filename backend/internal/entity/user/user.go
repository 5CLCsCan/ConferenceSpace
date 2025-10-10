package user

import (
	"time"

	"github.com/lib/pq"
)

// User represents the user database entity
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

