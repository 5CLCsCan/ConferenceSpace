package assignment

import (
	"context"
	"database/sql"
	"fmt"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

type StorageInterface interface {
	Create(ctx context.Context, conferenceID int64, assignment *dto.Assignment) (*dto.Assignment, error)
	BatchCreate(ctx context.Context, conferenceID int64, assignments []dto.Assignment) ([]*dto.Assignment, error)
	GetByID(ctx context.Context, id int64) (*dto.Assignment, error)
	List(ctx context.Context, conferenceID int64, params *ListParams) ([]*dto.Assignment, int64, error)
	UpdateStatus(ctx context.Context, id int64, status string) (*dto.Assignment, error)
	Delete(ctx context.Context, id int64) error
	DeleteBySubmission(ctx context.Context, submissionID int64) error
	DeleteByReviewer(ctx context.Context, reviewerID int64) error
}

type ListParams struct {
	Limit        int
	Offset       int
	SubmissionID int64
	ReviewerID   int64
	Status       string
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

// Create creates a single assignment
func (s *Storage) Create(ctx context.Context, conferenceID int64, assignment *dto.Assignment) (*dto.Assignment, error) {
	status := assignment.Status
	if status == "" {
		status = model.AssignmentStatusPending
	}

	score := assignment.Score
	if score == 0 {
		score = 0.0
	}

	query, args, err := s.qb.
		Insert(model.AssignmentTableName).
		Columns(model.ColConferenceID, model.ColSubmissionID, model.ColReviewerID, model.ColScore, model.ColStatus, model.ColAssignedAt, model.ColCreatedAt, model.ColUpdatedAt).
		Values(conferenceID, assignment.SubmissionID, assignment.ReviewerID, score, status, sq.Expr("NOW()"), sq.Expr("NOW()"), sq.Expr("NOW()")).
		Suffix("RETURNING id, conference_id, submission_id, reviewer_id, score, status, assigned_at, completed_at, created_at, updated_at").
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build insert query: %w", err)
	}

	var result model.Assignment
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&result.ID,
		&result.ConferenceID,
		&result.SubmissionID,
		&result.ReviewerID,
		&result.Score,
		&result.Status,
		&result.AssignedAt,
		&result.CompletedAt,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create assignment: %w", err)
	}

	return result.ToDTO(), nil
}

// BatchCreate creates multiple assignments in a transaction
func (s *Storage) BatchCreate(ctx context.Context, conferenceID int64, assignments []dto.Assignment) ([]*dto.Assignment, error) {
	if len(assignments) == 0 {
		return []*dto.Assignment{}, nil
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	result := make([]*dto.Assignment, 0, len(assignments))

	for _, assignment := range assignments {
		status := assignment.Status
		if status == "" {
			status = model.AssignmentStatusPending
		}

		score := assignment.Score
		if score == 0 {
			score = 0.0
		}

		query, args, err := s.qb.
			Insert(model.AssignmentTableName).
			Columns(model.ColConferenceID, model.ColSubmissionID, model.ColReviewerID, model.ColScore, model.ColStatus, model.ColAssignedAt, model.ColCreatedAt, model.ColUpdatedAt).
			Values(conferenceID, assignment.SubmissionID, assignment.ReviewerID, score, status, sq.Expr("NOW()"), sq.Expr("NOW()"), sq.Expr("NOW()")).
			Suffix("RETURNING id, conference_id, submission_id, reviewer_id, score, status, assigned_at, completed_at, created_at, updated_at").
			ToSql()

		if err != nil {
			return nil, fmt.Errorf("failed to build insert query: %w", err)
		}

		var assignmentModel model.Assignment
		err = tx.QueryRowContext(ctx, query, args...).Scan(
			&assignmentModel.ID,
			&assignmentModel.ConferenceID,
			&assignmentModel.SubmissionID,
			&assignmentModel.ReviewerID,
			&assignmentModel.Score,
			&assignmentModel.Status,
			&assignmentModel.AssignedAt,
			&assignmentModel.CompletedAt,
			&assignmentModel.CreatedAt,
			&assignmentModel.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to create assignment: %w", err)
		}

		result = append(result, assignmentModel.ToDTO())
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return result, nil
}

// GetByID retrieves an assignment by ID
func (s *Storage) GetByID(ctx context.Context, id int64) (*dto.Assignment, error) {
	query, args, err := s.qb.
		Select("id", "conference_id", "submission_id", "reviewer_id", "score", "status", "assigned_at", "completed_at", "created_at", "updated_at").
		From(model.AssignmentTableName).
		Where(sq.Eq{"id": id}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	var result model.Assignment
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&result.ID,
		&result.ConferenceID,
		&result.SubmissionID,
		&result.ReviewerID,
		&result.Score,
		&result.Status,
		&result.AssignedAt,
		&result.CompletedAt,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("assignment not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get assignment: %w", err)
	}

	return result.ToDTO(), nil
}

// List retrieves all assignments for a conference with pagination and filters
func (s *Storage) List(ctx context.Context, conferenceID int64, params *ListParams) ([]*dto.Assignment, int64, error) {
	baseQuery := s.qb.
		Select("id", "conference_id", "submission_id", "reviewer_id", "score", "status", "assigned_at", "completed_at", "created_at", "updated_at").
		From(model.AssignmentTableName).
		Where(sq.Eq{model.ColConferenceID: conferenceID})

	countQuery := s.qb.
		Select("COUNT(*)").
		From(model.AssignmentTableName).
		Where(sq.Eq{model.ColConferenceID: conferenceID})

	// Apply filters
	if params.SubmissionID > 0 {
		baseQuery = baseQuery.Where(sq.Eq{model.ColSubmissionID: params.SubmissionID})
		countQuery = countQuery.Where(sq.Eq{model.ColSubmissionID: params.SubmissionID})
	}
	if params.ReviewerID > 0 {
		baseQuery = baseQuery.Where(sq.Eq{model.ColReviewerID: params.ReviewerID})
		countQuery = countQuery.Where(sq.Eq{model.ColReviewerID: params.ReviewerID})
	}
	if params.Status != "" {
		baseQuery = baseQuery.Where(sq.Eq{model.ColStatus: params.Status})
		countQuery = countQuery.Where(sq.Eq{model.ColStatus: params.Status})
	}

	// Get total count
	countQueryStr, countArgs, err := countQuery.ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build count query: %w", err)
	}

	var total int64
	err = s.db.QueryRowContext(ctx, countQueryStr, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count assignments: %w", err)
	}

	// Apply pagination
	if params.Limit > 0 {
		baseQuery = baseQuery.Limit(uint64(params.Limit))
	}
	if params.Offset > 0 {
		baseQuery = baseQuery.Offset(uint64(params.Offset))
	}

	query, args, err := baseQuery.OrderBy(model.ColCreatedAt + " DESC").ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build select query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list assignments: %w", err)
	}
	defer rows.Close()

	var results []*model.Assignment
	for rows.Next() {
		result := &model.Assignment{}
		err := rows.Scan(
			&result.ID,
			&result.ConferenceID,
			&result.SubmissionID,
			&result.ReviewerID,
			&result.Score,
			&result.Status,
			&result.AssignedAt,
			&result.CompletedAt,
			&result.CreatedAt,
			&result.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan assignment: %w", err)
		}
		results = append(results, result)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating assignments: %w", err)
	}

	dtos := make([]*dto.Assignment, len(results))
	for i, r := range results {
		dtos[i] = r.ToDTO()
	}

	return dtos, total, nil
}

// UpdateStatus updates an assignment's status
func (s *Storage) UpdateStatus(ctx context.Context, id int64, status string) (*dto.Assignment, error) {
	query, args, err := s.qb.
		Update(model.AssignmentTableName).
		Set(model.ColStatus, status).
		Set(model.ColUpdatedAt, sq.Expr("NOW()")).
		Where(sq.Eq{"id": id}).
		Suffix("RETURNING id, conference_id, submission_id, reviewer_id, score, status, assigned_at, completed_at, created_at, updated_at").
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build update query: %w", err)
	}

	var result model.Assignment
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&result.ID,
		&result.ConferenceID,
		&result.SubmissionID,
		&result.ReviewerID,
		&result.Score,
		&result.Status,
		&result.AssignedAt,
		&result.CompletedAt,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("assignment not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update assignment: %w", err)
	}

	return result.ToDTO(), nil
}

// Delete deletes an assignment by ID
func (s *Storage) Delete(ctx context.Context, id int64) error {
	query, args, err := s.qb.
		Delete(model.AssignmentTableName).
		Where(sq.Eq{"id": id}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete assignment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("assignment not found")
	}

	return nil
}

// DeleteBySubmission deletes all assignments for a submission
func (s *Storage) DeleteBySubmission(ctx context.Context, submissionID int64) error {
	query, args, err := s.qb.
		Delete(model.AssignmentTableName).
		Where(sq.Eq{model.ColSubmissionID: submissionID}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete assignments: %w", err)
	}

	return nil
}

// DeleteByReviewer deletes all assignments for a reviewer
func (s *Storage) DeleteByReviewer(ctx context.Context, reviewerID int64) error {
	query, args, err := s.qb.
		Delete(model.AssignmentTableName).
		Where(sq.Eq{model.ColReviewerID: reviewerID}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete assignments: %w", err)
	}

	return nil
}
