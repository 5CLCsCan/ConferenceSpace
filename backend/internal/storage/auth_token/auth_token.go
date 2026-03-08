package authtoken

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/model"
)

type StorageInterface interface {
	Create(ctx context.Context, userEmail, tokenType string, expiry time.Duration) (string, error)
	GetByToken(ctx context.Context, token string) (*model.AuthToken, error)
	MarkUsed(ctx context.Context, token string) error
	DeleteExpired(ctx context.Context) error
}

type Storage struct {
	db *sql.DB
	qb sq.StatementBuilderType
}

func New(db *sql.DB) *Storage {
	return &Storage{
		db: db,
		qb: sq.StatementBuilder.PlaceholderFormat(sq.Dollar),
	}
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate random token: %w", err)
	}
	return hex.EncodeToString(b), nil
}

func (s *Storage) Create(ctx context.Context, userEmail, tokenType string, expiry time.Duration) (string, error) {
	token, err := generateToken()
	if err != nil {
		return "", err
	}

	now := time.Now()
	query, args, err := s.qb.
		Insert(model.AuthTokenTableName).
		Columns(
			model.AuthTokenColUserEmail,
			model.AuthTokenColToken,
			model.AuthTokenColType,
			model.AuthTokenColExpiresAt,
			model.AuthTokenColCreatedAt,
		).
		Values(userEmail, token, tokenType, now.Add(expiry), now).
		ToSql()
	if err != nil {
		return "", fmt.Errorf("failed to build insert query: %w", err)
	}

	if _, err := s.db.ExecContext(ctx, query, args...); err != nil {
		return "", fmt.Errorf("failed to create auth token: %w", err)
	}

	return token, nil
}

func (s *Storage) GetByToken(ctx context.Context, token string) (*model.AuthToken, error) {
	query, args, err := s.qb.
		Select(
			model.AuthTokenColID,
			model.AuthTokenColUserEmail,
			model.AuthTokenColToken,
			model.AuthTokenColType,
			model.AuthTokenColExpiresAt,
			model.AuthTokenColUsedAt,
			model.AuthTokenColCreatedAt,
		).
		From(model.AuthTokenTableName).
		Where(sq.Eq{model.AuthTokenColToken: token}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	t := &model.AuthToken{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&t.ID,
		&t.UserEmail,
		&t.Token,
		&t.TokenType,
		&t.ExpiresAt,
		&t.UsedAt,
		&t.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("token not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get auth token: %w", err)
	}

	return t, nil
}

func (s *Storage) MarkUsed(ctx context.Context, token string) error {
	now := time.Now()
	query, args, err := s.qb.
		Update(model.AuthTokenTableName).
		Set(model.AuthTokenColUsedAt, now).
		Where(sq.Eq{model.AuthTokenColToken: token}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build update query: %w", err)
	}

	if _, err := s.db.ExecContext(ctx, query, args...); err != nil {
		return fmt.Errorf("failed to mark token as used: %w", err)
	}

	return nil
}

func (s *Storage) DeleteExpired(ctx context.Context) error {
	query, args, err := s.qb.
		Delete(model.AuthTokenTableName).
		Where(sq.Lt{model.AuthTokenColExpiresAt: time.Now()}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	if _, err := s.db.ExecContext(ctx, query, args...); err != nil {
		return fmt.Errorf("failed to delete expired tokens: %w", err)
	}

	return nil
}
