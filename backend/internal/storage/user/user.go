package user

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/entity/user"
	"github.com/lib/pq"
)

// Storage handles user data persistence
type Storage struct {
	db *sql.DB
	qb sq.StatementBuilderType
}

// New creates a new user storage instance
func New(db *sql.DB) *Storage {
	return &Storage{
		db: db,
		qb: sq.StatementBuilder.PlaceholderFormat(sq.Dollar),
	}
}

// Create creates a new user
func (s *Storage) Create(ctx context.Context, email, firstName, lastName, hashedPassword string, domain []string) (*user.User, error) {
	now := time.Now()
	
	query, args, err := s.qb.
		Insert("users").
		Columns("email", "first_name", "last_name", "hashed_password", "domain", "created_at", "updated_at").
		Values(email, firstName, lastName, hashedPassword, pq.Array(domain), now, now).
		Suffix("RETURNING user_id, email, first_name, last_name, domain, created_at, updated_at").
		ToSql()
	
	if err != nil {
		return nil, fmt.Errorf("failed to build insert query: %w", err)
	}

	entity := &user.User{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.UserID,
		&entity.Email,
		&entity.FirstName,
		&entity.LastName,
		&entity.Domain,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return entity, nil
}

// GetByID retrieves a user by ID
func (s *Storage) GetByID(ctx context.Context, id int64) (*user.User, error) {
	query, args, err := s.qb.
		Select("user_id", "email", "first_name", "last_name", "hashed_password", "domain", "created_at", "updated_at").
		From("users").
		Where(sq.Eq{"user_id": id}).
		ToSql()
	
	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &user.User{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.UserID,
		&entity.Email,
		&entity.FirstName,
		&entity.LastName,
		&entity.HashedPassword,
		&entity.Domain,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return entity, nil
}

// GetByEmail retrieves a user by email
func (s *Storage) GetByEmail(ctx context.Context, email string) (*user.User, error) {
	query, args, err := s.qb.
		Select("user_id", "email", "first_name", "last_name", "hashed_password", "domain", "created_at", "updated_at").
		From("users").
		Where(sq.Eq{"email": email}).
		ToSql()
	
	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &user.User{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.UserID,
		&entity.Email,
		&entity.FirstName,
		&entity.LastName,
		&entity.HashedPassword,
		&entity.Domain,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return entity, nil
}

// List retrieves all users
func (s *Storage) List(ctx context.Context) ([]*user.User, error) {
	query, args, err := s.qb.
		Select("user_id", "email", "first_name", "last_name", "domain", "created_at", "updated_at").
		From("users").
		OrderBy("created_at DESC").
		ToSql()
	
	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	var users []*user.User
	for rows.Next() {
		entity := &user.User{}
		err := rows.Scan(
			&entity.UserID,
			&entity.Email,
			&entity.FirstName,
			&entity.LastName,
			&entity.Domain,
			&entity.CreatedAt,
			&entity.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, entity)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating users: %w", err)
	}

	return users, nil
}

// Update updates a user
func (s *Storage) Update(ctx context.Context, id int64, email, firstName, lastName *string, domain []string) (*user.User, error) {
	updateMap := map[string]interface{}{
		"updated_at": time.Now(),
	}

	if email != nil {
		updateMap["email"] = *email
	}
	if firstName != nil {
		updateMap["first_name"] = *firstName
	}
	if lastName != nil {
		updateMap["last_name"] = *lastName
	}
	if domain != nil {
		updateMap["domain"] = pq.Array(domain)
	}

	query, args, err := s.qb.
		Update("users").
		SetMap(updateMap).
		Where(sq.Eq{"user_id": id}).
		Suffix("RETURNING user_id, email, first_name, last_name, domain, created_at, updated_at").
		ToSql()
	
	if err != nil {
		return nil, fmt.Errorf("failed to build update query: %w", err)
	}

	entity := &user.User{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.UserID,
		&entity.Email,
		&entity.FirstName,
		&entity.LastName,
		&entity.Domain,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return entity, nil
}

// Delete deletes a user
func (s *Storage) Delete(ctx context.Context, id int64) error {
	query, args, err := s.qb.
		Delete("users").
		Where(sq.Eq{"user_id": id}).
		ToSql()
	
	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}
