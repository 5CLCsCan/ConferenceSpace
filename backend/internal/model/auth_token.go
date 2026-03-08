package model

import "time"

const (
	AuthTokenTableName = "auth_tokens"

	AuthTokenColID        = "id"
	AuthTokenColUserEmail = "user_email"
	AuthTokenColToken     = "token"
	AuthTokenColType      = "token_type"
	AuthTokenColExpiresAt = "expires_at"
	AuthTokenColUsedAt    = "used_at"
	AuthTokenColCreatedAt = "created_at"

	AuthTokenTypePasswordReset     = "password_reset"
	AuthTokenTypeEmailVerification = "email_verification"

	PasswordResetTokenExpiry     = 1 * time.Hour
	EmailVerificationTokenExpiry = 24 * time.Hour
)

type AuthToken struct {
	ID        int64      `db:"id"`
	UserEmail string     `db:"user_email"`
	Token     string     `db:"token"`
	TokenType string     `db:"token_type"`
	ExpiresAt time.Time  `db:"expires_at"`
	UsedAt    *time.Time `db:"used_at"`
	CreatedAt time.Time  `db:"created_at"`
}
