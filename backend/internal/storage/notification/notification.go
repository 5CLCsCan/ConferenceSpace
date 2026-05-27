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
	GetPreferences(ctx context.Context, userEmail string) (*dto.NotificationPreferencesResponse, error)
	UpdatePreferences(ctx context.Context, userEmail string, req *dto.NotificationPreferencesUpdateRequest) (*dto.NotificationPreferencesResponse, error)
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

func (s *Storage) enabledTypesForUser(ctx context.Context, userEmail string) ([]string, error) {
	preferences, err := s.GetPreferences(ctx, userEmail)
	if err != nil {
		return nil, err
	}

	types := make([]string, 0, 16)
	add := func(enabled bool, values ...string) {
		if enabled {
			types = append(types, values...)
		}
	}

	add(preferences.SubmissionReceived, model.NotificationTypeSubmissionReceived)
	add(
		preferences.ReviewAssigned,
		model.NotificationTypeReviewAssigned,
		model.NotificationTypeAssignmentAccepted,
		model.NotificationTypeAssignmentDeclined,
	)
	add(preferences.ReviewSubmitted, model.NotificationTypeReviewSubmitted)
	add(preferences.PaperAccepted, model.NotificationTypePaperAccepted)
	add(preferences.PaperRejected, model.NotificationTypePaperRejected)
	add(
		preferences.DeadlineReminder,
		model.NotificationTypeDeadlineReminder,
		model.NotificationTypeRebuttalReminder,
	)
	add(
		preferences.StatusChange,
		model.NotificationTypeStatusChange,
		model.NotificationTypeDiscussionThread,
		model.NotificationTypeDiscussionMessage,
		model.NotificationTypeRebuttalOpened,
		model.NotificationTypeRebuttalSubmitted,
		model.NotificationTypeRebuttalAcknowledged,
		model.NotificationTypeRebuttalFinalized,
	)

	return types, nil
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
	enabledTypes, err := s.enabledTypesForUser(ctx, params.UserEmail)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get notification preferences: %w", err)
	}

	if len(enabledTypes) == 0 {
		return []*dto.Notification{}, 0, nil
	}

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

	baseQuery = baseQuery.Where(sq.Eq{model.NotificationColType: enabledTypes})
	countQuery = countQuery.Where(sq.Eq{model.NotificationColType: enabledTypes})

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
	enabledTypes, err := s.enabledTypesForUser(ctx, userEmail)
	if err != nil {
		return 0, fmt.Errorf("failed to get notification preferences: %w", err)
	}

	if len(enabledTypes) == 0 {
		return 0, nil
	}

	query, args, err := s.qb.
		Select("COUNT(*)").
		From(model.NotificationTableName).
		Where(sq.Eq{
			model.NotificationColUserEmail: userEmail,
			model.NotificationColRead:      false,
		}).
		Where(sq.Eq{model.NotificationColType: enabledTypes}).
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

func (s *Storage) GetPreferences(ctx context.Context, userEmail string) (*dto.NotificationPreferencesResponse, error) {
	query, args, err := s.qb.
		Select(
			model.NotificationPrefColUserEmail,
			model.NotificationPrefColSubmissionReceived,
			model.NotificationPrefColReviewAssigned,
			model.NotificationPrefColReviewSubmitted,
			model.NotificationPrefColPaperAccepted,
			model.NotificationPrefColPaperRejected,
			model.NotificationPrefColDeadlineReminder,
			model.NotificationPrefColStatusChange,
			model.NotificationPrefColEmailNotifications,
			model.NotificationPrefColUpdatedAt,
		).
		From(model.NotificationPreferencesTableName).
		Where(sq.Eq{model.NotificationPrefColUserEmail: userEmail}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build preferences query: %w", err)
	}

	entity := &model.NotificationPreferences{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.UserEmail,
		&entity.SubmissionReceived,
		&entity.ReviewAssigned,
		&entity.ReviewSubmitted,
		&entity.PaperAccepted,
		&entity.PaperRejected,
		&entity.DeadlineReminder,
		&entity.StatusChange,
		&entity.EmailNotifications,
		&entity.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return s.upsertPreferences(ctx, &model.NotificationPreferences{
			UserEmail:          userEmail,
			SubmissionReceived: true,
			ReviewAssigned:     true,
			ReviewSubmitted:    true,
			PaperAccepted:      true,
			PaperRejected:      true,
			DeadlineReminder:   true,
			StatusChange:       true,
			EmailNotifications: true,
		})
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get preferences: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) UpdatePreferences(ctx context.Context, userEmail string, req *dto.NotificationPreferencesUpdateRequest) (*dto.NotificationPreferencesResponse, error) {
	current, err := s.GetPreferences(ctx, userEmail)
	if err != nil {
		return nil, err
	}

	entity := &model.NotificationPreferences{
		UserEmail:          userEmail,
		SubmissionReceived: current.SubmissionReceived,
		ReviewAssigned:     current.ReviewAssigned,
		ReviewSubmitted:    current.ReviewSubmitted,
		PaperAccepted:      current.PaperAccepted,
		PaperRejected:      current.PaperRejected,
		DeadlineReminder:   current.DeadlineReminder,
		StatusChange:       current.StatusChange,
		EmailNotifications: current.EmailNotifications,
	}

	if req.SubmissionReceived != nil {
		entity.SubmissionReceived = *req.SubmissionReceived
	}
	if req.ReviewAssigned != nil {
		entity.ReviewAssigned = *req.ReviewAssigned
	}
	if req.ReviewSubmitted != nil {
		entity.ReviewSubmitted = *req.ReviewSubmitted
	}
	if req.PaperAccepted != nil {
		entity.PaperAccepted = *req.PaperAccepted
	}
	if req.PaperRejected != nil {
		entity.PaperRejected = *req.PaperRejected
	}
	if req.DeadlineReminder != nil {
		entity.DeadlineReminder = *req.DeadlineReminder
	}
	if req.StatusChange != nil {
		entity.StatusChange = *req.StatusChange
	}
	if req.EmailNotifications != nil {
		entity.EmailNotifications = *req.EmailNotifications
	}

	return s.upsertPreferences(ctx, entity)
}

func (s *Storage) upsertPreferences(ctx context.Context, prefs *model.NotificationPreferences) (*dto.NotificationPreferencesResponse, error) {
	query := `
		INSERT INTO notification_preferences (
			user_email,
			submission_received,
			review_assigned,
			review_submitted,
			paper_accepted,
			paper_rejected,
			deadline_reminder,
			status_change,
			email_notifications,
			updated_at
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
		ON CONFLICT (user_email)
		DO UPDATE SET
			submission_received = EXCLUDED.submission_received,
			review_assigned = EXCLUDED.review_assigned,
			review_submitted = EXCLUDED.review_submitted,
			paper_accepted = EXCLUDED.paper_accepted,
			paper_rejected = EXCLUDED.paper_rejected,
			deadline_reminder = EXCLUDED.deadline_reminder,
			status_change = EXCLUDED.status_change,
			email_notifications = EXCLUDED.email_notifications,
			updated_at = NOW()
		RETURNING user_email,
			submission_received,
			review_assigned,
			review_submitted,
			paper_accepted,
			paper_rejected,
			deadline_reminder,
			status_change,
			email_notifications,
			updated_at
	`

	entity := &model.NotificationPreferences{}
	err := s.db.QueryRowContext(
		ctx,
		query,
		prefs.UserEmail,
		prefs.SubmissionReceived,
		prefs.ReviewAssigned,
		prefs.ReviewSubmitted,
		prefs.PaperAccepted,
		prefs.PaperRejected,
		prefs.DeadlineReminder,
		prefs.StatusChange,
		prefs.EmailNotifications,
	).Scan(
		&entity.UserEmail,
		&entity.SubmissionReceived,
		&entity.ReviewAssigned,
		&entity.ReviewSubmitted,
		&entity.PaperAccepted,
		&entity.PaperRejected,
		&entity.DeadlineReminder,
		&entity.StatusChange,
		&entity.EmailNotifications,
		&entity.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert preferences: %w", err)
	}

	return entity.ToDTO(), nil
}

// Helper function to convert empty string to nil
func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
