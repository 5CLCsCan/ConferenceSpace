package reviewer

import (
	"context"
	"database/sql"
	"fmt"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/lib/pq"
)

type StorageInterface interface {
	Create(ctx context.Context, conferenceID int64, invite *dto.Reviewer) (*dto.Reviewer, error)
	BatchCreate(ctx context.Context, conferenceID int64, invites []dto.Reviewer) (*dto.ReviewerBatchInviteResponse, error)
	GetByID(ctx context.Context, id int64) (*dto.Reviewer, error)
	GetByUserAndConference(ctx context.Context, userID, conferenceID int64) (*dto.Reviewer, error)
	List(ctx context.Context, conferenceID int64, params *ListParams) ([]*dto.Reviewer, int64, error)
	UpdateStatus(ctx context.Context, id int64, status string) (*dto.Reviewer, error)
	Delete(ctx context.Context, id int64) error
}

type ListParams struct {
	Limit  int
	Offset int
	Status string
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

// Create creates a single reviewer invitation
func (s *Storage) Create(ctx context.Context, conferenceID int64, invite *dto.Reviewer) (*dto.Reviewer, error) {
	status := invite.Status
	if status == "" {
		status = model.ReviewerStatusPending
	}

	query, args, err := s.qb.
		Insert("conference_reviewers").
		Columns("user_id", "conference_id", "status", "domain", "created_at", "updated_at").
		Values(invite.UserID, conferenceID, status, pq.Array(invite.Domain), sq.Expr("NOW()"), sq.Expr("NOW()")).
		Suffix("RETURNING id, user_id, conference_id, status, domain, created_at, updated_at").
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build insert query: %w", err)
	}

	var result model.Reviewer
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&result.ID,
		&result.UserID,
		&result.ConferenceID,
		&result.Status,
		&result.Domain,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			return nil, fmt.Errorf("reviewer already invited to this conference")
		}
		return nil, fmt.Errorf("failed to create reviewer: %w", err)
	}

	return toDTO(&result), nil
}

// BatchCreate creates multiple reviewer invitations in a single transaction
func (s *Storage) BatchCreate(ctx context.Context, conferenceID int64, invites []dto.Reviewer) (*dto.ReviewerBatchInviteResponse, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	response := &dto.ReviewerBatchInviteResponse{
		Success: make([]dto.Reviewer, 0),
		Failed: make([]struct {
			UserID int64  `json:"user_id"`
			Error  string `json:"error"`
		}, 0),
	}

	for _, invite := range invites {
		status := invite.Status
		if status == "" {
			status = model.ReviewerStatusPending
		}

		query, args, err := s.qb.
			Insert("conference_reviewers").
			Columns("user_id", "conference_id", "status", "domain", "created_at", "updated_at").
			Values(invite.UserID, conferenceID, status, pq.Array(invite.Domain), sq.Expr("NOW()"), sq.Expr("NOW()")).
			Suffix("RETURNING id, user_id, conference_id, status, domain, created_at, updated_at").
			ToSql()

		if err != nil {
			response.Failed = append(response.Failed, struct {
				UserID int64  `json:"user_id"`
				Error  string `json:"error"`
			}{
				UserID: invite.UserID,
				Error:  fmt.Sprintf("failed to build query: %v", err),
			})
			continue
		}

		var result model.Reviewer
		err = tx.QueryRowContext(ctx, query, args...).Scan(
			&result.ID,
			&result.UserID,
			&result.ConferenceID,
			&result.Status,
			&result.Domain,
			&result.CreatedAt,
			&result.UpdatedAt,
		)

		if err != nil {
			errorMsg := err.Error()
			if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
				errorMsg = "already invited to this conference"
			}
			response.Failed = append(response.Failed, struct {
				UserID int64  `json:"user_id"`
				Error  string `json:"error"`
			}{
				UserID: invite.UserID,
				Error:  errorMsg,
			})
			continue
		}

		response.Success = append(response.Success, *toDTO(&result))
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return response, nil
}

// GetByID retrieves a reviewer by ID
func (s *Storage) GetByID(ctx context.Context, id int64) (*dto.Reviewer, error) {
	query, args, err := s.qb.
		Select("id", "user_id", "conference_id", "status", "domain", "created_at", "updated_at").
		From("conference_reviewers").
		Where(sq.Eq{"id": id}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	var result model.Reviewer
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&result.ID,
		&result.UserID,
		&result.ConferenceID,
		&result.Status,
		&result.Domain,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("reviewer not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get reviewer: %w", err)
	}

	return toDTO(&result), nil
}

// GetByUserAndConference retrieves a reviewer by user ID and conference ID
func (s *Storage) GetByUserAndConference(ctx context.Context, userID, conferenceID int64) (*dto.Reviewer, error) {
	query, args, err := s.qb.
		Select("id", "user_id", "conference_id", "status", "domain", "created_at", "updated_at").
		From("conference_reviewers").
		Where(sq.Eq{"user_id": userID, "conference_id": conferenceID}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	var result model.Reviewer
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&result.ID,
		&result.UserID,
		&result.ConferenceID,
		&result.Status,
		&result.Domain,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("reviewer not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get reviewer: %w", err)
	}

	return toDTO(&result), nil
}

// List retrieves all reviewers for a conference with pagination
func (s *Storage) List(ctx context.Context, conferenceID int64, params *ListParams) ([]*dto.Reviewer, int64, error) {
	baseQuery := s.qb.
		Select("id", "user_id", "conference_id", "status", "domain", "created_at", "updated_at").
		From("conference_reviewers").
		Where(sq.Eq{"conference_id": conferenceID})

	countQuery := s.qb.
		Select("COUNT(*)").
		From("conference_reviewers").
		Where(sq.Eq{"conference_id": conferenceID})

	if params.Status != "" {
		baseQuery = baseQuery.Where(sq.Eq{"status": params.Status})
		countQuery = countQuery.Where(sq.Eq{"status": params.Status})
	}

	// Get total count
	countQueryStr, countArgs, err := countQuery.ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build count query: %w", err)
	}

	var total int64
	err = s.db.QueryRowContext(ctx, countQueryStr, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count reviewers: %w", err)
	}

	// Apply pagination
	if params.Limit > 0 {
		baseQuery = baseQuery.Limit(uint64(params.Limit))
	}
	if params.Offset > 0 {
		baseQuery = baseQuery.Offset(uint64(params.Offset))
	}

	query, args, err := baseQuery.OrderBy("created_at DESC").ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build select query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list reviewers: %w", err)
	}
	defer rows.Close()

	var results []*model.Reviewer
	for rows.Next() {
		result := &model.Reviewer{}
		err := rows.Scan(
			&result.ID,
			&result.UserID,
			&result.ConferenceID,
			&result.Status,
			&result.Domain,
			&result.CreatedAt,
			&result.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan reviewer: %w", err)
		}
		results = append(results, result)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating reviewers: %w", err)
	}

	dtos := make([]*dto.Reviewer, len(results))
	for i, r := range results {
		dtos[i] = toDTO(r)
	}

	return dtos, total, nil
}

// UpdateStatus updates the status of a reviewer invitation
func (s *Storage) UpdateStatus(ctx context.Context, id int64, status string) (*dto.Reviewer, error) {
	query, args, err := s.qb.
		Update("conference_reviewers").
		Set("status", status).
		Set("updated_at", sq.Expr("NOW()")).
		Where(sq.Eq{"id": id}).
		Suffix("RETURNING id, user_id, conference_id, status, domain, created_at, updated_at").
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build update query: %w", err)
	}

	var result model.Reviewer
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&result.ID,
		&result.UserID,
		&result.ConferenceID,
		&result.Status,
		&result.Domain,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("reviewer not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update reviewer status: %w", err)
	}

	return toDTO(&result), nil
}

// Delete removes a reviewer
func (s *Storage) Delete(ctx context.Context, id int64) error {
	query, args, err := s.qb.
		Delete("conference_reviewers").
		Where(sq.Eq{"id": id}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete reviewer: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("reviewer not found")
	}

	return nil
}

// toDTO converts a model to DTO
func toDTO(model *model.Reviewer) *dto.Reviewer {
	return &dto.Reviewer{
		ID:           model.ID,
		UserID:       model.UserID,
		ConferenceID: model.ConferenceID,
		Status:       model.Status,
		Domain:       model.Domain,
		CreatedAt:    model.CreatedAt,
		UpdatedAt:    model.UpdatedAt,
	}
}
