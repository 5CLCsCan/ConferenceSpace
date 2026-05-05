package conferenceuserrole

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/model"
)

// ErrRoleConflict is returned when assigning a role that conflicts with an existing role
var ErrRoleConflict = fmt.Errorf("role conflict")

type StorageInterface interface {
	AddRole(ctx context.Context, conferenceID int64, userEmail string, role string) error
	AddRoles(ctx context.Context, roles []model.RoleAssignment) error
	RemoveRole(ctx context.Context, conferenceID int64, userEmail string) error
	UpdateRoleStatus(ctx context.Context, conferenceID int64, userEmail string, status string) error
	GetUserRoles(ctx context.Context, conferenceID int64, userEmail string) ([]string, error)
	GetAllUserRoles(ctx context.Context, userEmail string) ([]string, error)
	HasRole(ctx context.Context, conferenceID int64, userEmail string, roles []string) (bool, error)
	GetEmailsByRole(ctx context.Context, conferenceID int64, role string) ([]string, error)
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

func isAdminRole(role string) bool {
	return role == model.RoleChair || role == model.RoleCoChair || role == model.RolePC
}

func wantsRole(roles []string, target string) bool {
	for _, role := range roles {
		if role == target {
			return true
		}
	}
	return false
}

// AddRole adds or updates a role for a user in a conference.
// Admin roles are authoritative for a conference and must not be downgraded by
// later author/reviewer interactions.
func (s *Storage) AddRole(ctx context.Context, conferenceID int64, userEmail string, role string) error {
	existingRole, err := s.getExistingRole(ctx, conferenceID, userEmail)
	if err != nil {
		return err
	}
	if existingRole != "" && existingRole != role {
		if isAdminRole(existingRole) && !isAdminRole(role) {
			return fmt.Errorf("%w: user %s already has admin role '%s' in this conference; cannot assign '%s'", ErrRoleConflict, userEmail, existingRole, role)
		}
		if isAdminRole(role) && !isAdminRole(existingRole) {
			return fmt.Errorf("%w: user %s already has role '%s' in this conference; cannot assign '%s'", ErrRoleConflict, userEmail, existingRole, role)
		}
	}

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
			continue
		}
		existingRole, err := s.getExistingRole(ctx, assignment.ConferenceID, assignment.UserEmail)
		if err != nil {
			return err
		}
		if existingRole != "" && existingRole != assignment.Role {
			if isAdminRole(existingRole) && !isAdminRole(assignment.Role) {
				return fmt.Errorf("%w: user %s already has admin role '%s'; cannot assign '%s'", ErrRoleConflict, assignment.UserEmail, existingRole, assignment.Role)
			}
			if isAdminRole(assignment.Role) && !isAdminRole(existingRole) {
				return fmt.Errorf("%w: user %s already has role '%s'; cannot assign '%s'", ErrRoleConflict, assignment.UserEmail, existingRole, assignment.Role)
			}
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

// GetAllUserRoles retrieves all distinct active roles for a user across all conferences
func (s *Storage) GetAllUserRoles(ctx context.Context, userEmail string) ([]string, error) {
	query, args, err := s.qb.
		Select(fmt.Sprintf("DISTINCT %s", model.ColRole)).
		From(model.ConferenceUserRoleTableName).
		Where(sq.Eq{
			model.ColUserEmail: userEmail,
			model.ColStatus:    model.RoleStatusActive,
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

// GetEmailsByRole returns all active user emails with the given role in a conference
func (s *Storage) GetEmailsByRole(ctx context.Context, conferenceID int64, role string) ([]string, error) {
	query, args, err := s.qb.
		Select(model.ColUserEmail).
		From(model.ConferenceUserRoleTableName).
		Where(sq.Eq{
			model.ColConferenceID: conferenceID,
			model.ColRole:         role,
			model.ColStatus:       model.RoleStatusActive,
		}).
		OrderBy(model.ColUserEmail).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query emails by role: %w", err)
	}
	defer rows.Close()

	var emails []string
	for rows.Next() {
		var email string
		if err := rows.Scan(&email); err != nil {
			return nil, fmt.Errorf("failed to scan email: %w", err)
		}
		emails = append(emails, email)
	}
	return emails, rows.Err()
}

// getExistingRole returns the current active role for a user in a conference, or "" if none
func (s *Storage) getExistingRole(ctx context.Context, conferenceID int64, userEmail string) (string, error) {
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
		return "", fmt.Errorf("failed to build query: %w", err)
	}

	var existingRole string
	err = s.db.QueryRowContext(ctx, query, args...).Scan(&existingRole)
	if err == sql.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("failed to query existing role: %w", err)
	}
	return existingRole, nil
}

// HasRole checks if a user has any of the specified roles in a conference
func (s *Storage) HasRole(ctx context.Context, conferenceID int64, userEmail string, roles []string) (bool, error) {
	if wantsRole(roles, model.RoleChair) || wantsRole(roles, model.RoleCoChair) {
		query, args, err := s.qb.
			Select("COUNT(*)").
			From(model.ConferenceTableName).
			Where(sq.Eq{model.ColConferenceID: conferenceID}).
			Where(sq.Or{
				sq.And{
					sq.Eq{model.ColChair: userEmail},
					sq.Expr("?", wantsRole(roles, model.RoleChair)),
				},
				sq.Expr("? = ANY("+model.ColCoChairs+") AND ?", userEmail, wantsRole(roles, model.RoleCoChair)),
			}).
			ToSql()
		if err != nil {
			return false, fmt.Errorf("failed to build conference ownership query: %w", err)
		}

		var ownerCount int
		if err := s.db.QueryRowContext(ctx, query, args...).Scan(&ownerCount); err != nil {
			return false, fmt.Errorf("failed to check conference ownership: %w", err)
		}
		if ownerCount > 0 {
			return true, nil
		}
	}

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
