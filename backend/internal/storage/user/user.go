package user

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	userDto "github.com/dcao/conferencespace/internal/dto/user"
	userModel "github.com/dcao/conferencespace/internal/model/user"
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
	Create(ctx context.Context, user *userDto.User, hashedPassword string) (*userDto.Response, error)
	GetByID(ctx context.Context, id int64) (*userDto.Response, error)
	GetByEmail(ctx context.Context, email string) (*userDto.Response, error)
	GetByEmailWithPassword(ctx context.Context, email string) (*userDto.Response, string, error)
	List(ctx context.Context, params *QueryParams) ([]*userDto.Response, int64, error)
	Update(ctx context.Context, id int64, user *userDto.User) (*userDto.Response, error)
	Delete(ctx context.Context, id int64) error
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

func (s *Storage) Create(ctx context.Context, user *userDto.User, hashedPassword string) (*userDto.Response, error) {
	now := time.Now()

	query, args, err := s.qb.
		Insert(userModel.TableName).
		Columns(
			userModel.ColEmail,
			userModel.ColFirstName,
			userModel.ColLastName,
			userModel.ColPassword,
			userModel.ColDomain,
			userModel.ColCreatedAt,
			userModel.ColUpdatedAt,
		).
		Values(user.Email, user.FirstName, user.LastName, hashedPassword, pq.Array(user.Domain), now, now).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s",
			userModel.ColUserID,
			userModel.ColEmail,
			userModel.ColFirstName,
			userModel.ColLastName,
			userModel.ColDomain,
			userModel.ColCreatedAt,
			userModel.ColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build insert query: %w", err)
	}

	entity := &userModel.User{}
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

func (s *Storage) GetByID(ctx context.Context, id int64) (*userDto.Response, error) {
	query, args, err := s.qb.
		Select(
			userModel.ColUserID,
			userModel.ColEmail,
			userModel.ColFirstName,
			userModel.ColLastName,
			userModel.ColDomain,
			userModel.ColCreatedAt,
			userModel.ColUpdatedAt,
		).
		From(userModel.TableName).
		Where(sq.Eq{userModel.ColUserID: id}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &userModel.User{}
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
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) GetByEmail(ctx context.Context, email string) (*userDto.Response, error) {
	query, args, err := s.qb.
		Select(
			userModel.ColUserID,
			userModel.ColEmail,
			userModel.ColFirstName,
			userModel.ColLastName,
			userModel.ColDomain,
			userModel.ColCreatedAt,
			userModel.ColUpdatedAt,
		).
		From(userModel.TableName).
		Where(sq.Eq{userModel.ColEmail: email}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &userModel.User{}
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
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) GetByEmailWithPassword(ctx context.Context, email string) (*userDto.Response, string, error) {
	query, args, err := s.qb.
		Select(
			userModel.ColUserID,
			userModel.ColEmail,
			userModel.ColFirstName,
			userModel.ColLastName,
			userModel.ColPassword,
			userModel.ColDomain,
			userModel.ColCreatedAt,
			userModel.ColUpdatedAt,
		).
		From(userModel.TableName).
		Where(sq.Eq{userModel.ColEmail: email}).
		ToSql()

	if err != nil {
		return nil, "", fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &userModel.User{}
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
		return nil, "", fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, "", fmt.Errorf("failed to get user: %w", err)
	}

	return entity.ToDTO(), entity.HashedPassword, nil
}

func (s *Storage) List(ctx context.Context, params *QueryParams) ([]*userDto.Response, int64, error) {
	baseQuery := s.qb.Select(
		userModel.ColUserID,
		userModel.ColEmail,
		userModel.ColFirstName,
		userModel.ColLastName,
		userModel.ColDomain,
		userModel.ColCreatedAt,
		userModel.ColUpdatedAt,
	).From(userModel.TableName)

	countQuery := s.qb.Select("COUNT(*)").From(userModel.TableName)

	if params.Email != "" {
		baseQuery = baseQuery.Where(sq.Like{userModel.ColEmail: "%" + params.Email + "%"})
		countQuery = countQuery.Where(sq.Like{userModel.ColEmail: "%" + params.Email + "%"})
	}
	if params.FirstName != "" {
		baseQuery = baseQuery.Where(sq.Like{userModel.ColFirstName: "%" + params.FirstName + "%"})
		countQuery = countQuery.Where(sq.Like{userModel.ColFirstName: "%" + params.FirstName + "%"})
	}
	if params.LastName != "" {
		baseQuery = baseQuery.Where(sq.Like{userModel.ColLastName: "%" + params.LastName + "%"})
		countQuery = countQuery.Where(sq.Like{userModel.ColLastName: "%" + params.LastName + "%"})
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

	query, args, err := baseQuery.OrderBy(userModel.ColCreatedAt + " DESC").ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build select query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	var entities []*userModel.User
	for rows.Next() {
		entity := &userModel.User{}
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
			return nil, 0, fmt.Errorf("failed to scan user: %w", err)
		}
		entities = append(entities, entity)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating users: %w", err)
	}

	dtos := make([]*userDto.Response, len(entities))
	for i, entity := range entities {
		dtos[i] = entity.ToDTO()
	}
	return dtos, total, nil
}

func (s *Storage) Update(ctx context.Context, id int64, user *userDto.User) (*userDto.Response, error) {
	updateMap := map[string]interface{}{
		userModel.ColEmail:     user.Email,
		userModel.ColFirstName: user.FirstName,
		userModel.ColLastName:  user.LastName,
		userModel.ColDomain:    pq.Array(user.Domain),
		userModel.ColUpdatedAt: time.Now(),
	}

	query, args, err := s.qb.
		Update(userModel.TableName).
		SetMap(updateMap).
		Where(sq.Eq{userModel.ColUserID: id}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s",
			userModel.ColUserID,
			userModel.ColEmail,
			userModel.ColFirstName,
			userModel.ColLastName,
			userModel.ColDomain,
			userModel.ColCreatedAt,
			userModel.ColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build update query: %w", err)
	}

	entity := &userModel.User{}
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

	return entity.ToDTO(), nil
}

func (s *Storage) Delete(ctx context.Context, id int64) error {
	query, args, err := s.qb.
		Delete(userModel.TableName).
		Where(sq.Eq{userModel.ColUserID: id}).
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
