package notification

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

// QueryParams defines the parameters for listing notifications
type QueryParams struct {
	Limit        int
	Offset       int
	UserEmail    string
	Unread       bool
	Type         string
	ConferenceID int64
}

// StorageInterface defines the notification storage operations
type StorageInterface interface {
	Create(ctx context.Context, req *dto.NotificationCreateRequest) (*dto.Notification, error)
	GetByID(ctx context.Context, id int64) (*dto.Notification, error)
	GetByUserEmail(ctx context.Context, params *QueryParams) ([]*dto.Notification, int64, error)
	GetUnreadCount(ctx context.Context, userEmail string) (int64, error)
	MarkAsRead(ctx context.Context, id int64, userEmail string) (*dto.Notification, error)
	MarkAllAsRead(ctx context.Context, userEmail string) (int64, error)
	Delete(ctx context.Context, id int64, userEmail string) error
}

// Storage implements notification storage operations
type Storage struct {
	db *sql.DB
	qb sq.StatementBuilderType
}

// New creates a new notification storage instance
func New(db *sql.DB) *Storage {
	return &Storage{
		db: db,
		qb: sq.StatementBuilder.PlaceholderFormat(sq.Dollar),
	}
}

// Create creates a new notification
func (s *Storage) Create(ctx context.Context, req *dto.NotificationCreateRequest) (*dto.Notification, error) {
	now := time.Now()

	// Marshal metadata to JSON
	metadataBytes := []byte("{}")
	if req.Metadata != nil {
		var err error
		metadataBytes, err = json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
	}

	builder := s.qb.
		Insert(model.NotificationTableName).
		Columns(
			model.NotificationColUserEmail,
			model.NotificationColType,
			model.NotificationColTitle,
			model.NotificationColMessage,
			model.NotificationColMetadata,
			model.NotificationColRead,
			model.NotificationColActionURL,
			model.NotificationColConferenceID,
			model.NotificationColCreatedAt,
		).
		Values(
			req.UserEmail,
			req.Type,
			req.Title,
			req.Message,
			metadataBytes,
			false,
			nilIfEmpty(req.ActionURL),
			req.ConferenceID,
			now,
		).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.NotificationColID,
			model.NotificationColUserEmail,
			model.NotificationColType,
			model.NotificationColTitle,
			model.NotificationColMessage,
			model.NotificationColMetadata,
			model.NotificationColRead,
			model.NotificationColActionURL,
			model.NotificationColConferenceID,
			model.NotificationColCreatedAt,
		))

	query, args, err := builder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build insert query: %w", err)
	}

	entity := &model.Notification{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.ID,
		&entity.UserEmail,
		&entity.Type,
		&entity.Title,
		&entity.Message,
		&entity.Metadata,
		&entity.Read,
		&entity.ActionURL,
		&entity.ConferenceID,
		&entity.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create notification: %w", err)
	}

	return entity.ToDTO(), nil
}

// GetByID retrieves a notification by its ID
func (s *Storage) GetByID(ctx context.Context, id int64) (*dto.Notification, error) {
	query, args, err := s.qb.
		Select(
			model.NotificationColID,
			model.NotificationColUserEmail,
			model.NotificationColType,
			model.NotificationColTitle,
			model.NotificationColMessage,
			model.NotificationColMetadata,
			model.NotificationColRead,
			model.NotificationColActionURL,
			model.NotificationColConferenceID,
			model.NotificationColCreatedAt,
		).
		From(model.NotificationTableName).
		Where(sq.Eq{model.NotificationColID: id}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &model.Notification{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.ID,
		&entity.UserEmail,
		&entity.Type,
		&entity.Title,
		&entity.Message,
		&entity.Metadata,
		&entity.Read,
		&entity.ActionURL,
		&entity.ConferenceID,
		&entity.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("notification not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get notification: %w", err)
	}

	return entity.ToDTO(), nil
}

// GetByUserEmail retrieves notifications for a user with pagination and filters
func (s *Storage) GetByUserEmail(ctx context.Context, params *QueryParams) ([]*dto.Notification, int64, error) {
	baseQuery := s.qb.
		Select(
			model.NotificationColID,
			model.NotificationColUserEmail,
			model.NotificationColType,
			model.NotificationColTitle,
			model.NotificationColMessage,
			model.NotificationColMetadata,
			model.NotificationColRead,
			model.NotificationColActionURL,
			model.NotificationColConferenceID,
			model.NotificationColCreatedAt,
		).
		From(model.NotificationTableName).
		Where(sq.Eq{model.NotificationColUserEmail: params.UserEmail})

	countQuery := s.qb.
		Select("COUNT(*)").
		From(model.NotificationTableName).
		Where(sq.Eq{model.NotificationColUserEmail: params.UserEmail})

	// Apply filters
	if params.Unread {
		baseQuery = baseQuery.Where(sq.Eq{model.NotificationColRead: false})
		countQuery = countQuery.Where(sq.Eq{model.NotificationColRead: false})
	}
	if params.Type != "" {
		baseQuery = baseQuery.Where(sq.Eq{model.NotificationColType: params.Type})
		countQuery = countQuery.Where(sq.Eq{model.NotificationColType: params.Type})
	}
	if params.ConferenceID > 0 {
		baseQuery = baseQuery.Where(sq.Eq{model.NotificationColConferenceID: params.ConferenceID})
		countQuery = countQuery.Where(sq.Eq{model.NotificationColConferenceID: params.ConferenceID})
	}

	// Get total count
	countQueryStr, countArgs, err := countQuery.ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build count query: %w", err)
	}

	var total int64
	err = s.db.QueryRowContext(ctx, countQueryStr, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count notifications: %w", err)
	}

	// Apply pagination
	if params.Limit > 0 {
		baseQuery = baseQuery.Limit(uint64(params.Limit))
	}
	if params.Offset > 0 {
		baseQuery = baseQuery.Offset(uint64(params.Offset))
	}

	// Order by created_at DESC (newest first)
	baseQuery = baseQuery.OrderBy(model.NotificationColCreatedAt + " DESC")

	query, args, err := baseQuery.ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build select query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list notifications: %w", err)
	}
	defer rows.Close()

	var notifications []*dto.Notification
	for rows.Next() {
		entity := &model.Notification{}
		err := rows.Scan(
			&entity.ID,
			&entity.UserEmail,
			&entity.Type,
			&entity.Title,
			&entity.Message,
			&entity.Metadata,
			&entity.Read,
			&entity.ActionURL,
			&entity.ConferenceID,
			&entity.CreatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan notification: %w", err)
		}
		notifications = append(notifications, entity.ToDTO())
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating notifications: %w", err)
	}

	// Return empty slice instead of nil
	if notifications == nil {
		notifications = []*dto.Notification{}
	}

	return notifications, total, nil
}

// GetUnreadCount returns the count of unread notifications for a user
func (s *Storage) GetUnreadCount(ctx context.Context, userEmail string) (int64, error) {
	query, args, err := s.qb.
		Select("COUNT(*)").
		From(model.NotificationTableName).
		Where(sq.Eq{
			model.NotificationColUserEmail: userEmail,
			model.NotificationColRead:      false,
		}).
		ToSql()

	if err != nil {
		return 0, fmt.Errorf("failed to build count query: %w", err)
	}

	var count int64
	err = s.db.QueryRowContext(ctx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count unread notifications: %w", err)
	}

	return count, nil
}

// MarkAsRead marks a notification as read
func (s *Storage) MarkAsRead(ctx context.Context, id int64, userEmail string) (*dto.Notification, error) {
	query, args, err := s.qb.
		Update(model.NotificationTableName).
		Set(model.NotificationColRead, true).
		Where(sq.Eq{
			model.NotificationColID:        id,
			model.NotificationColUserEmail: userEmail,
		}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.NotificationColID,
			model.NotificationColUserEmail,
			model.NotificationColType,
			model.NotificationColTitle,
			model.NotificationColMessage,
			model.NotificationColMetadata,
			model.NotificationColRead,
			model.NotificationColActionURL,
			model.NotificationColConferenceID,
			model.NotificationColCreatedAt,
		)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build update query: %w", err)
	}

	entity := &model.Notification{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.ID,
		&entity.UserEmail,
		&entity.Type,
		&entity.Title,
		&entity.Message,
		&entity.Metadata,
		&entity.Read,
		&entity.ActionURL,
		&entity.ConferenceID,
		&entity.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("notification not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to mark notification as read: %w", err)
	}

	return entity.ToDTO(), nil
}

// MarkAllAsRead marks all notifications as read for a user
func (s *Storage) MarkAllAsRead(ctx context.Context, userEmail string) (int64, error) {
	query, args, err := s.qb.
		Update(model.NotificationTableName).
		Set(model.NotificationColRead, true).
		Where(sq.Eq{
			model.NotificationColUserEmail: userEmail,
			model.NotificationColRead:      false,
		}).
		ToSql()

	if err != nil {
		return 0, fmt.Errorf("failed to build update query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to mark all notifications as read: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return rowsAffected, nil
}

// Delete deletes a notification (only if it belongs to the user)
func (s *Storage) Delete(ctx context.Context, id int64, userEmail string) error {
	query, args, err := s.qb.
		Delete(model.NotificationTableName).
		Where(sq.Eq{
			model.NotificationColID:        id,
			model.NotificationColUserEmail: userEmail,
		}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete notification: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("notification not found")
	}

	return nil
}

// Helper function to convert empty string to nil
func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

