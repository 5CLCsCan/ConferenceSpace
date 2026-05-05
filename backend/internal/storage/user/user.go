package user

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/lib/pq"
)

var ErrEmailAlreadyExists = errors.New("email already exists")
var ErrUserNotFound = errors.New("user not found")

type QueryParams struct {
	Limit     int
	Offset    int
	Email     string
	FirstName string
	LastName  string
}

type StorageInterface interface {
	Create(ctx context.Context, user *dto.User, hashedPassword string, emailVerified bool) (*dto.UserResponse, error)
	GetByID(ctx context.Context, id int64) (*dto.UserResponse, error)
	GetByEmail(ctx context.Context, email string) (*dto.UserResponse, error)
	GetByEmailWithPassword(ctx context.Context, email string) (*dto.UserResponse, string, error)
	List(ctx context.Context, params *QueryParams) ([]*dto.UserResponse, int64, error)
	Update(ctx context.Context, id int64, user *dto.User) (*dto.UserResponse, error)
	UpdateDomain(ctx context.Context, id int64, domain []string) (*dto.UserResponse, error)
	UpdateByEmail(ctx context.Context, email string, user *dto.User) (*dto.UserResponse, error)
	Delete(ctx context.Context, id int64) error
	DeleteByEmail(ctx context.Context, email string) error
	UpdatePassword(ctx context.Context, email string, hashedPassword string) error
	SetEmailVerified(ctx context.Context, email string, verified bool) error
	GetLinkedSemanticScholarIDs(ctx context.Context, semanticIDs []string) (map[string]bool, error)
}

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

func (s *Storage) Create(ctx context.Context, user *dto.User, hashedPassword string, emailVerified bool) (*dto.UserResponse, error) {
	now := time.Now()

	query, args, err := s.qb.
		Insert(model.UserTableName).
		Columns(
			model.UserColEmail,
			model.UserColFirstName,
			model.UserColLastName,
			model.UserColPassword,
			model.UserColDomain,
			model.UserColEmailVerified,
			model.UserColCreatedAt,
			model.UserColUpdatedAt,
		).
		Values(user.Email, user.FirstName, user.LastName, hashedPassword, pq.Array(user.Domain), emailVerified, now, now).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s",
			model.UserColUserID,
			model.UserColEmail,
			model.UserColFirstName,
			model.UserColLastName,
			model.UserColDomain,
			model.UserColCreatedAt,
			model.UserColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build insert query: %w", err)
	}

	entity := &model.User{}
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
		if pqErr, ok := err.(*pq.Error); ok &&
			string(pqErr.Code) == "23505" &&
			pqErr.Constraint == "users_email_key" {
			return nil, ErrEmailAlreadyExists
		}
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) GetByID(ctx context.Context, id int64) (*dto.UserResponse, error) {
	query, args, err := s.qb.
		Select(
			model.UserColUserID,
			model.UserColEmail,
			model.UserColFirstName,
			model.UserColLastName,
			model.UserColDomain,
			model.UserColSemanticScholarID,
			model.UserColProfileSyncStatus,
			model.UserColCreatedAt,
			model.UserColUpdatedAt,
		).
		From(model.UserTableName).
		Where(sq.Eq{model.UserColUserID: id}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &model.User{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.UserID,
		&entity.Email,
		&entity.FirstName,
		&entity.LastName,
		&entity.Domain,
		&entity.SemanticScholarID,
		&entity.ProfileSyncStatus,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) GetByEmail(ctx context.Context, email string) (*dto.UserResponse, error) {
	query, args, err := s.qb.
		Select(
			model.UserColUserID,
			model.UserColEmail,
			model.UserColFirstName,
			model.UserColLastName,
			model.UserColDomain,
			model.UserColSemanticScholarID,
			model.UserColProfileSyncStatus,
			model.UserColCreatedAt,
			model.UserColUpdatedAt,
		).
		From(model.UserTableName).
		Where(sq.Eq{model.UserColEmail: email}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &model.User{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.UserID,
		&entity.Email,
		&entity.FirstName,
		&entity.LastName,
		&entity.Domain,
		&entity.SemanticScholarID,
		&entity.ProfileSyncStatus,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) GetByEmailWithPassword(ctx context.Context, email string) (*dto.UserResponse, string, error) {
	query, args, err := s.qb.
		Select(
			model.UserColUserID,
			model.UserColEmail,
			model.UserColFirstName,
			model.UserColLastName,
			model.UserColPassword,
			model.UserColDomain,
			model.UserColSemanticScholarID,
			model.UserColProfileSyncStatus,
			model.UserColCreatedAt,
			model.UserColUpdatedAt,
		).
		From(model.UserTableName).
		Where(sq.Eq{model.UserColEmail: email}).
		ToSql()

	if err != nil {
		return nil, "", fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &model.User{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.UserID,
		&entity.Email,
		&entity.FirstName,
		&entity.LastName,
		&entity.HashedPassword,
		&entity.Domain,
		&entity.SemanticScholarID,
		&entity.ProfileSyncStatus,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, "", ErrUserNotFound
	}
	if err != nil {
		return nil, "", fmt.Errorf("failed to get user: %w", err)
	}

	return entity.ToDTO(), entity.HashedPassword, nil
}

func (s *Storage) List(ctx context.Context, params *QueryParams) ([]*dto.UserResponse, int64, error) {
	baseQuery := s.qb.Select(
		model.UserColUserID,
		model.UserColEmail,
		model.UserColFirstName,
		model.UserColLastName,
		model.UserColDomain,
		model.UserColSemanticScholarID,
		model.UserColProfileSyncStatus,
		model.UserColCreatedAt,
		model.UserColUpdatedAt,
	).From(model.UserTableName)

	countQuery := s.qb.Select("COUNT(*)").From(model.UserTableName)

	if params.Email != "" {
		baseQuery = baseQuery.Where(sq.Like{model.UserColEmail: "%" + params.Email + "%"})
		countQuery = countQuery.Where(sq.Like{model.UserColEmail: "%" + params.Email + "%"})
	}
	if params.FirstName != "" {
		baseQuery = baseQuery.Where(sq.Like{model.UserColFirstName: "%" + params.FirstName + "%"})
		countQuery = countQuery.Where(sq.Like{model.UserColFirstName: "%" + params.FirstName + "%"})
	}
	if params.LastName != "" {
		baseQuery = baseQuery.Where(sq.Like{model.UserColLastName: "%" + params.LastName + "%"})
		countQuery = countQuery.Where(sq.Like{model.UserColLastName: "%" + params.LastName + "%"})
	}

	countQueryStr, countArgs, err := countQuery.ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build count query: %w", err)
	}

	var total int64
	err = s.db.QueryRowContext(ctx, countQueryStr, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	if params.Limit > 0 {
		baseQuery = baseQuery.Limit(uint64(params.Limit))
	}
	if params.Offset > 0 {
		baseQuery = baseQuery.Offset(uint64(params.Offset))
	}

	query, args, err := baseQuery.OrderBy(model.UserColCreatedAt + " DESC").ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build select query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	var entities []*model.User
	for rows.Next() {
		entity := &model.User{}
		err := rows.Scan(
			&entity.UserID,
			&entity.Email,
			&entity.FirstName,
			&entity.LastName,
			&entity.Domain,
			&entity.SemanticScholarID,
			&entity.ProfileSyncStatus,
			&entity.CreatedAt,
			&entity.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan user: %w", err)
		}
		entities = append(entities, entity)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating users: %w", err)
	}

	dtos := make([]*dto.UserResponse, len(entities))
	for i, entity := range entities {
		dtos[i] = entity.ToDTO()
	}
	return dtos, total, nil
}

func (s *Storage) Update(ctx context.Context, id int64, user *dto.User) (*dto.UserResponse, error) {
	// If check to support partial updates for new fields if needed, but for now we stick to updating existing fields + timestamps.
	// Actually, the storage Update method takes *dto.User, which now has the new fields.
	// I should probably update them if they are set in the DTO?
	// The interface uses *dto.User, let's look at the implementation.
	updateMap := map[string]interface{}{
		model.UserColEmail:     user.Email,
		model.UserColFirstName: user.FirstName,
		model.UserColLastName:  user.LastName,
		model.UserColDomain:    pq.Array(user.Domain),
		model.UserColUpdatedAt: time.Now(),
	}

	if user.SemanticScholarIDSet {
		if user.SemanticScholarID == nil {
			updateMap[model.UserColSemanticScholarID] = nil
		} else {
			updateMap[model.UserColSemanticScholarID] = *user.SemanticScholarID
		}
	}
	if user.ProfileSyncStatusSet {
		if user.ProfileSyncStatus == nil {
			updateMap[model.UserColProfileSyncStatus] = nil
		} else {
			updateMap[model.UserColProfileSyncStatus] = *user.ProfileSyncStatus
		}
	}

	query, args, err := s.qb.
		Update(model.UserTableName).
		SetMap(updateMap).
		Where(sq.Eq{model.UserColUserID: id}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.UserColUserID,
			model.UserColEmail,
			model.UserColFirstName,
			model.UserColLastName,
			model.UserColDomain,
			model.UserColSemanticScholarID,
			model.UserColProfileSyncStatus,
			model.UserColCreatedAt,
			model.UserColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build update query: %w", err)
	}

	entity := &model.User{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.UserID,
		&entity.Email,
		&entity.FirstName,
		&entity.LastName,
		&entity.Domain,
		&entity.SemanticScholarID,
		&entity.ProfileSyncStatus,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) UpdateDomain(ctx context.Context, id int64, domain []string) (*dto.UserResponse, error) {
	query, args, err := s.qb.
		Update(model.UserTableName).
		Set(model.UserColDomain, pq.Array(domain)).
		Set(model.UserColUpdatedAt, time.Now()).
		Where(sq.Eq{model.UserColUserID: id}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.UserColUserID,
			model.UserColEmail,
			model.UserColFirstName,
			model.UserColLastName,
			model.UserColDomain,
			model.UserColSemanticScholarID,
			model.UserColProfileSyncStatus,
			model.UserColCreatedAt,
			model.UserColUpdatedAt,
		)).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build update domain query: %w", err)
	}

	entity := &model.User{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.UserID,
		&entity.Email,
		&entity.FirstName,
		&entity.LastName,
		&entity.Domain,
		&entity.SemanticScholarID,
		&entity.ProfileSyncStatus,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update user domain: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) UpdateByEmail(ctx context.Context, email string, user *dto.User) (*dto.UserResponse, error) {
	oldEmail := strings.TrimSpace(email)
	newEmail := strings.TrimSpace(user.Email)

	if oldEmail == "" {
		return nil, ErrUserNotFound
	}
	if newEmail == "" {
		return nil, fmt.Errorf("email is required")
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}

	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	if !strings.EqualFold(oldEmail, newEmail) {
		var exists bool
		err = tx.QueryRowContext(
			ctx,
			"SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) AND LOWER(email) <> LOWER($2))",
			newEmail,
			oldEmail,
		).Scan(&exists)
		if err != nil {
			return nil, fmt.Errorf("failed to check email uniqueness: %w", err)
		}
		if exists {
			return nil, ErrEmailAlreadyExists
		}

		if err := s.updateEmailReferences(ctx, tx, oldEmail, newEmail); err != nil {
			return nil, err
		}
	}

	updateMap := map[string]interface{}{
		model.UserColEmail:     newEmail,
		model.UserColFirstName: user.FirstName,
		model.UserColLastName:  user.LastName,
		model.UserColDomain:    pq.Array(user.Domain),
		model.UserColUpdatedAt: time.Now(),
	}

	if user.SemanticScholarIDSet {
		if user.SemanticScholarID == nil {
			updateMap[model.UserColSemanticScholarID] = nil
		} else {
			updateMap[model.UserColSemanticScholarID] = *user.SemanticScholarID
		}
	}
	if user.ProfileSyncStatusSet {
		if user.ProfileSyncStatus == nil {
			updateMap[model.UserColProfileSyncStatus] = nil
		} else {
			updateMap[model.UserColProfileSyncStatus] = *user.ProfileSyncStatus
		}
	}

	query, args, err := s.qb.
		Update(model.UserTableName).
		SetMap(updateMap).
		Where(sq.Expr("LOWER("+model.UserColEmail+") = LOWER(?)", oldEmail)).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.UserColUserID,
			model.UserColEmail,
			model.UserColFirstName,
			model.UserColLastName,
			model.UserColDomain,
			model.UserColSemanticScholarID,
			model.UserColProfileSyncStatus,
			model.UserColCreatedAt,
			model.UserColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build update query: %w", err)
	}

	entity := &model.User{}
	err = tx.QueryRowContext(ctx, query, args...).Scan(
		&entity.UserID,
		&entity.Email,
		&entity.FirstName,
		&entity.LastName,
		&entity.Domain,
		&entity.SemanticScholarID,
		&entity.ProfileSyncStatus,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && string(pqErr.Code) == "23505" && pqErr.Constraint == "users_email_key" {
			return nil, ErrEmailAlreadyExists
		}
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit update transaction: %w", err)
	}
	committed = true

	return entity.ToDTO(), nil
}

func (s *Storage) updateEmailReferences(ctx context.Context, tx *sql.Tx, oldEmail string, newEmail string) error {
	statements := []struct {
		name string
		sql  string
	}{
		{
			name: "conference chair email",
			sql: `
				UPDATE conferences
				SET chair = $2,
				    updated_at = NOW()
				WHERE LOWER(chair) = LOWER($1)
			`,
		},
		{
			name: "conference co-chairs email",
			sql: `
				UPDATE conferences
				SET co_chairs = (
					SELECT COALESCE(ARRAY(
						SELECT CASE
							WHEN LOWER(co_chair_email) = LOWER($1) THEN $2
							ELSE co_chair_email
						END
						FROM unnest(co_chairs) AS co_chair_email
					), '{}')
				),
				updated_at = NOW()
				WHERE EXISTS (
					SELECT 1
					FROM unnest(co_chairs) AS co_chair_email
					WHERE LOWER(co_chair_email) = LOWER($1)
				)
			`,
		},
		{
			name: "dedupe role rows",
			sql: `
				DELETE FROM conference_user_roles old
				USING conference_user_roles new
				WHERE LOWER(old.user_email) = LOWER($1)
				  AND LOWER(new.user_email) = LOWER($2)
				  AND old.conference_id = new.conference_id
			`,
		},
		{
			name: "conference user roles email",
			sql: `
				UPDATE conference_user_roles
				SET user_email = $2,
				    updated_at = NOW()
				WHERE LOWER(user_email) = LOWER($1)
			`,
		},
		{
			name: "conference submission author email",
			sql: `
				UPDATE conference_submissions
				SET author = $2,
				    updated_at = NOW()
				WHERE LOWER(author) = LOWER($1)
			`,
		},
		{
			name: "dedupe conference bookmarks",
			sql: `
				DELETE FROM conference_bookmarks old
				USING conference_bookmarks new
				WHERE LOWER(old.user_email) = LOWER($1)
				  AND LOWER(new.user_email) = LOWER($2)
				  AND old.conference_id = new.conference_id
			`,
		},
		{
			name: "conference bookmarks email",
			sql: `
				UPDATE conference_bookmarks
				SET user_email = $2
				WHERE LOWER(user_email) = LOWER($1)
			`,
		},
		{
			name: "notifications email",
			sql: `
				UPDATE notifications
				SET user_email = $2
				WHERE LOWER(user_email) = LOWER($1)
			`,
		},
		{
			name: "dedupe notification preferences",
			sql: `
				DELETE FROM notification_preferences old
				USING notification_preferences new
				WHERE LOWER(old.user_email) = LOWER($1)
				  AND LOWER(new.user_email) = LOWER($2)
			`,
		},
		{
			name: "notification preferences email",
			sql: `
				UPDATE notification_preferences
				SET user_email = $2,
				    updated_at = NOW()
				WHERE LOWER(user_email) = LOWER($1)
			`,
		},
		{
			name: "auth tokens email",
			sql: `
				UPDATE auth_tokens
				SET user_email = $2
				WHERE LOWER(user_email) = LOWER($1)
			`,
		},
	}

	for _, statement := range statements {
		if _, err := tx.ExecContext(ctx, statement.sql, oldEmail, newEmail); err != nil {
			return fmt.Errorf("failed to migrate %s: %w", statement.name, err)
		}
	}

	return nil
}

func (s *Storage) Delete(ctx context.Context, id int64) error {
	query, args, err := s.qb.
		Delete(model.UserTableName).
		Where(sq.Eq{model.UserColUserID: id}).
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
		return ErrUserNotFound
	}

	return nil
}

func (s *Storage) UpdatePassword(ctx context.Context, email string, hashedPassword string) error {
	query, args, err := s.qb.
		Update(model.UserTableName).
		Set(model.UserColPassword, hashedPassword).
		Set(model.UserColUpdatedAt, time.Now()).
		Where(sq.Eq{model.UserColEmail: email}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build update query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

func (s *Storage) SetEmailVerified(ctx context.Context, email string, verified bool) error {
	query, args, err := s.qb.
		Update(model.UserTableName).
		Set(model.UserColEmailVerified, verified).
		Set(model.UserColUpdatedAt, time.Now()).
		Where(sq.Eq{model.UserColEmail: email}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build update query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to set email verified: %w", err)
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

func (s *Storage) GetLinkedSemanticScholarIDs(ctx context.Context, semanticIDs []string) (map[string]bool, error) {
	if len(semanticIDs) == 0 {
		return map[string]bool{}, nil
	}

	query, args, err := s.qb.
		Select(model.UserColSemanticScholarID).
		From(model.UserTableName).
		Where(sq.Eq{model.UserColSemanticScholarID: semanticIDs}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query linked semantic scholar IDs: %w", err)
	}
	defer rows.Close()

	linked := make(map[string]bool)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("failed to scan semantic scholar ID: %w", err)
		}
		linked[id] = true
	}
	return linked, rows.Err()
}

func (s *Storage) DeleteByEmail(ctx context.Context, email string) error {
	query, args, err := s.qb.
		Delete(model.UserTableName).
		Where(sq.Eq{model.UserColEmail: email}).
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
		return ErrUserNotFound
	}

	return nil
}
