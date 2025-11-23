package conferenceuserrole

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/model"
)

type StorageInterface interface {
	AddRole(ctx context.Context, conferenceID int64, userEmail string, role string) error
	AddRoles(ctx context.Context, roles []model.RoleAssignment) error
	RemoveRole(ctx context.Context, conferenceID int64, userEmail string) error
	UpdateRoleStatus(ctx context.Context, conferenceID int64, userEmail string, status string) error
	GetUserRoles(ctx context.Context, conferenceID int64, userEmail string) ([]string, error)
	HasRole(ctx context.Context, conferenceID int64, userEmail string, roles []string) (bool, error)
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

// AddRole adds or updates a role for a user in a conference
func (s *Storage) AddRole(ctx context.Context, conferenceID int64, userEmail string, role string) error {
	query, args, err := s.qb.
		Insert(model.ConferenceUserRoleTableName).
		Columns(
			model.ColConferenceID,
			model.ColUserEmail,
			model.ColRole,
			model.ColStatus,
			model.ColCreatedAt,
			model.ColUpdatedAt,
		).
		Values(
			conferenceID,
			userEmail,
			role,
			model.RoleStatusActive,
			time.Now(),
			time.Now(),
		).
		Suffix(fmt.Sprintf(`
			ON CONFLICT (%s, %s) 
			DO UPDATE SET 
				%s = EXCLUDED.%s,
				%s = EXCLUDED.%s,
				%s = EXCLUDED.%s
		`,
			model.ColConferenceID, model.ColUserEmail,
			model.ColRole, model.ColRole,
			model.ColStatus, model.ColStatus,
			model.ColUpdatedAt, model.ColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build insert query: %w", err)
	}

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to add user role: %w", err)
	}

	return nil
}

// AddRoles adds multiple roles for different users in a conference in a single transaction
func (s *Storage) AddRoles(ctx context.Context, roles []model.RoleAssignment) error {
	if len(roles) == 0 {
		return nil
	}

	// Build bulk insert query
	insertBuilder := s.qb.
		Insert(model.ConferenceUserRoleTableName).
		Columns(
			model.ColConferenceID,
			model.ColUserEmail,
			model.ColRole,
			model.ColStatus,
			model.ColCreatedAt,
			model.ColUpdatedAt,
		)

	now := time.Now()
	for _, assignment := range roles {
		if assignment.UserEmail == "" || assignment.ConferenceID == 0 {
			continue // Skip invalid assignments
		}
		insertBuilder = insertBuilder.Values(
			assignment.ConferenceID,
			assignment.UserEmail,
			assignment.Role,
			model.RoleStatusActive,
			now,
			now,
		)
	}

	query, args, err := insertBuilder.
		Suffix(fmt.Sprintf(`
			ON CONFLICT (%s, %s) 
			DO UPDATE SET 
				%s = EXCLUDED.%s,
				%s = EXCLUDED.%s,
				%s = EXCLUDED.%s
		`,
			model.ColConferenceID, model.ColUserEmail,
			model.ColRole, model.ColRole,
			model.ColStatus, model.ColStatus,
			model.ColUpdatedAt, model.ColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build bulk insert query: %w", err)
	}

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to add user roles: %w", err)
	}

	return nil
}

// RemoveRole removes a user's role from a conference
func (s *Storage) RemoveRole(ctx context.Context, conferenceID int64, userEmail string) error {
	query, args, err := s.qb.
		Delete(model.ConferenceUserRoleTableName).
		Where(sq.Eq{
			model.ColConferenceID: conferenceID,
			model.ColUserEmail:    userEmail,
		}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to remove user role: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("role not found")
	}

	return nil
}

// UpdateRoleStatus updates the status of a user's role in a conference
func (s *Storage) UpdateRoleStatus(ctx context.Context, conferenceID int64, userEmail string, status string) error {
	query, args, err := s.qb.
		Update(model.ConferenceUserRoleTableName).
		Set(model.ColStatus, status).
		Set(model.ColUpdatedAt, time.Now()).
		Where(sq.Eq{
			model.ColConferenceID: conferenceID,
			model.ColUserEmail:    userEmail,
		}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build update query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update role status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("role not found")
	}

	return nil
}

// GetUserRoles retrieves all active roles for a user in a conference
func (s *Storage) GetUserRoles(ctx context.Context, conferenceID int64, userEmail string) ([]string, error) {
	query, args, err := s.qb.
		Select(model.ColRole).
		From(model.ConferenceUserRoleTableName).
		Where(sq.Eq{
			model.ColConferenceID: conferenceID,
			model.ColUserEmail:    userEmail,
			model.ColStatus:       model.RoleStatusActive,
		}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query roles: %w", err)
	}
	defer rows.Close()

	var roles []string
	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}
		roles = append(roles, role)
	}

	return roles, nil
}

// HasRole checks if a user has any of the specified roles in a conference
func (s *Storage) HasRole(ctx context.Context, conferenceID int64, userEmail string, roles []string) (bool, error) {
	query, args, err := s.qb.
		Select("COUNT(*)").
		From(model.ConferenceUserRoleTableName).
		Where(sq.Eq{
			model.ColConferenceID: conferenceID,
			model.ColUserEmail:    userEmail,
			model.ColRole:         roles,
			model.ColStatus:       model.RoleStatusActive,
		}).
		ToSql()

	if err != nil {
		return false, fmt.Errorf("failed to build query: %w", err)
	}

	var count int
	err = s.db.QueryRowContext(ctx, query, args...).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check role: %w", err)
	}

	return count > 0, nil
}
