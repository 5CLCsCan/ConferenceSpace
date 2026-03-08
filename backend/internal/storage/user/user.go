package user

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/lib/pq"
)

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
	UpdateByEmail(ctx context.Context, email string, user *dto.User) (*dto.UserResponse, error)
	Delete(ctx context.Context, id int64) error
	DeleteByEmail(ctx context.Context, email string) error
	UpdatePassword(ctx context.Context, email string, hashedPassword string) error
	SetEmailVerified(ctx context.Context, email string, verified bool) error
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
		return nil, fmt.Errorf("user not found")
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
		return nil, fmt.Errorf("user not found")
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
		return nil, "", fmt.Errorf("user not found")
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

	if user.SemanticScholarID != nil {
		updateMap[model.UserColSemanticScholarID] = *user.SemanticScholarID
	}
	if user.ProfileSyncStatus != nil {
		updateMap[model.UserColProfileSyncStatus] = *user.ProfileSyncStatus
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
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) UpdateByEmail(ctx context.Context, email string, user *dto.User) (*dto.UserResponse, error) {
	updateMap := map[string]interface{}{
		model.UserColFirstName: user.FirstName,
		model.UserColLastName:  user.LastName,
		model.UserColDomain:    pq.Array(user.Domain),
		model.UserColUpdatedAt: time.Now(),
	}

	if user.SemanticScholarID != nil {
		updateMap[model.UserColSemanticScholarID] = *user.SemanticScholarID
	}
	if user.ProfileSyncStatus != nil {
		updateMap[model.UserColProfileSyncStatus] = *user.ProfileSyncStatus
	}

	query, args, err := s.qb.
		Update(model.UserTableName).
		SetMap(updateMap).
		Where(sq.Eq{model.UserColEmail: email}).
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
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return entity.ToDTO(), nil
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
		return fmt.Errorf("user not found")
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
		return fmt.Errorf("user not found")
	}

	return nil
}
