package assignment

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

type StorageInterface interface {
	Create(ctx context.Context, conferenceID int64, assignment *dto.Assignment) (*dto.Assignment, error)
	BatchCreate(ctx context.Context, conferenceID int64, assignments []dto.Assignment) ([]*dto.Assignment, error)
	GetByID(ctx context.Context, id int64) (*dto.Assignment, error)
	List(ctx context.Context, conferenceID int64, params *ListParams) ([]*dto.Assignment, int64, error)
	UpdateStatus(ctx context.Context, id int64, status string) (*dto.Assignment, error)
	Delete(ctx context.Context, id int64) error
	DeleteBySubmission(ctx context.Context, submissionID int64) error
	DeleteByReviewer(ctx context.Context, reviewerID int64) error
	SaveReview(ctx context.Context, assignmentID int64, reviewScore *float64, reviewData *dto.ReviewData, status string) (*dto.Assignment, error)
	GetReview(ctx context.Context, assignmentID int64) (*dto.Assignment, error)
	GetReviewsBySubmission(ctx context.Context, submissionID int64, limit, offset int) ([]*dto.Assignment, int64, error)
	GetReviewAnalytics(ctx context.Context, submissionID int64) (*dto.ReviewAnalyticsResponse, error)
	// Suggestion methods
	GetSuggestionsByConference(ctx context.Context, conferenceID int64) ([]*dto.SuggestionGroup, int64, error)
	GetConfirmedAssignmentsByConference(ctx context.Context, conferenceID int64) ([]*dto.ConfirmedAssignmentGroup, int64, error)
	ConfirmSuggestions(ctx context.Context, conferenceID int64, assignmentIDs []int64) (int64, error)
	DeleteSuggestion(ctx context.Context, assignmentID int64) error
	DeleteSuggestionsByConference(ctx context.Context, conferenceID int64) error
	AcknowledgeRebuttal(ctx context.Context, assignmentID int64) (*dto.Assignment, error)
	UpdatePostRebuttalScore(ctx context.Context, assignmentID int64, req *dto.PostRebuttalScoreRequest) error
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
		Select("id", "conference_id", "submission_id", "reviewer_id", "score", "status", "assigned_at", "completed_at",
			"review_status", "review_score", "review_data", "review_submitted_at",
			"post_rebuttal_score", "post_rebuttal_recommendation", "post_rebuttal_comment", "post_rebuttal_updated_at",
			"created_at", "updated_at").
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
		&result.ReviewStatus,
		&result.ReviewScore,
		&result.ReviewData,
		&result.ReviewSubmittedAt,
		&result.PostRebuttalScore,
		&result.PostRebuttalRecommendation,
		&result.PostRebuttalComment,
		&result.PostRebuttalUpdatedAt,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("assignment not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get assignment (id=%d, error=%v, query=%s): %w", id, err, query, err)
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

// SaveReview saves or updates a review for an assignment
func (s *Storage) SaveReview(ctx context.Context, assignmentID int64, reviewScore *float64, reviewData *dto.ReviewData, status string) (*dto.Assignment, error) {
	updateBuilder := s.qb.
		Update(model.AssignmentTableName).
		Set(model.ColReviewStatus, status).
		Set(model.ColUpdatedAt, sq.Expr("NOW()"))

	// Only set assignment status to completed if review is submitted
	if status == model.ReviewStatusSubmitted {
		updateBuilder = updateBuilder.Set("status", model.AssignmentStatusCompleted)
	}

	// Set review score if provided
	if reviewScore != nil {
		updateBuilder = updateBuilder.Set(model.ColReviewScore, *reviewScore)
	}

	// Set review data if provided
	if reviewData != nil {
		reviewDataJSON, err := json.Marshal(reviewData)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal review data: %w", err)
		}
		updateBuilder = updateBuilder.Set(model.ColReviewData, reviewDataJSON)
	}

	// Set review_submitted_at timestamp if status is submitted
	if status == model.ReviewStatusSubmitted {
		updateBuilder = updateBuilder.Set(model.ColReviewSubmittedAt, time.Now())
	}

	query, args, err := updateBuilder.
		Where(sq.Eq{"id": assignmentID}).
		Suffix("RETURNING id, conference_id, submission_id, reviewer_id, score, status, assigned_at, completed_at, review_status, review_score, review_data, review_submitted_at, created_at, updated_at").
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
		&result.ReviewStatus,
		&result.ReviewScore,
		&result.ReviewData,
		&result.ReviewSubmittedAt,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("assignment not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to save review: %w", err)
	}

	return result.ToDTO(), nil
}

// GetReview retrieves an assignment with review data
func (s *Storage) GetReview(ctx context.Context, assignmentID int64) (*dto.Assignment, error) {
	// Reuse GetByID which now includes review fields
	return s.GetByID(ctx, assignmentID)
}

// GetReviewsBySubmission retrieves all reviews for a specific submission
func (s *Storage) GetReviewsBySubmission(ctx context.Context, submissionID int64, limit, offset int) ([]*dto.Assignment, int64, error) {
	// Get total count
	countQuery, countArgs, err := s.qb.
		Select("COUNT(*)").
		From(model.AssignmentTableName).
		Where(sq.Eq{model.ColSubmissionID: submissionID}).
		Where(sq.Eq{model.ColReviewStatus: model.ReviewStatusSubmitted}).
		ToSql()

	if err != nil {
		return nil, 0, fmt.Errorf("failed to build count query: %w", err)
	}

	var total int64
	err = s.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count reviews: %w", err)
	}

	// Get reviews with reviewer email
	// reviewer_id in paper_assignments references conference_reviewers(id),
	// so we must JOIN through conference_reviewers to reach users.
	query, args, err := s.qb.
		Select(
			"a.id", "a.conference_id", "a.submission_id", "a.reviewer_id", "a.score", "a.status", "a.assigned_at", "a.completed_at", "a.review_status", "a.review_score", "a.review_data", "a.review_submitted_at", "a.created_at", "a.updated_at",
			"u.email AS reviewer_email",
		).
		From(model.AssignmentTableName + " AS a").
		Join("conference_reviewers cr ON a.reviewer_id = cr.id").
		Join("users u ON cr.user_id = u.user_id").
		Where(sq.Eq{"a." + model.ColSubmissionID: submissionID}).
		Where(sq.Eq{"a." + model.ColReviewStatus: model.ReviewStatusSubmitted}).
		OrderBy("a.review_submitted_at DESC").
		Limit(uint64(limit)).
		Offset(uint64(offset)).
		ToSql()

	if err != nil {
		return nil, 0, fmt.Errorf("failed to build select query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query reviews: %w", err)
	}
	defer rows.Close()

	reviews := make([]*dto.Assignment, 0)
	for rows.Next() {
		var result model.Assignment
		err := rows.Scan(
			&result.ID,
			&result.ConferenceID,
			&result.SubmissionID,
			&result.ReviewerID,
			&result.Score,
			&result.Status,
			&result.AssignedAt,
			&result.CompletedAt,
			&result.ReviewStatus,
			&result.ReviewScore,
			&result.ReviewData,
			&result.ReviewSubmittedAt,
			&result.CreatedAt,
			&result.UpdatedAt,
			&result.ReviewerEmail,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan review: %w", err)
		}
		reviews = append(reviews, result.ToDTO())
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating reviews: %w", err)
	}

	return reviews, total, nil
}

// GetReviewAnalytics calculates analytics for all reviews of a submission
func (s *Storage) GetReviewAnalytics(ctx context.Context, submissionID int64) (*dto.ReviewAnalyticsResponse, error) {
	query := `
		SELECT 
			COUNT(*) as total_reviews,
			AVG(review_score) as average_score,
			SUM(CASE WHEN (review_data->>'recommendation') = 'strong_accept' THEN 1 ELSE 0 END) as strong_accept,
			SUM(CASE WHEN (review_data->>'recommendation') = 'accept' THEN 1 ELSE 0 END) as accept,
			SUM(CASE WHEN (review_data->>'recommendation') = 'weak_accept' THEN 1 ELSE 0 END) as weak_accept,
			SUM(CASE WHEN (review_data->>'recommendation') = 'borderline' THEN 1 ELSE 0 END) as borderline,
			SUM(CASE WHEN (review_data->>'recommendation') = 'weak_reject' THEN 1 ELSE 0 END) as weak_reject,
			SUM(CASE WHEN (review_data->>'recommendation') = 'reject' THEN 1 ELSE 0 END) as reject,
			SUM(CASE WHEN (review_data->>'recommendation') = 'strong_reject' THEN 1 ELSE 0 END) as strong_reject,
			SUM(CASE WHEN (review_data->>'confidence') = 'high' THEN 1 ELSE 0 END) as confidence_high,
			SUM(CASE WHEN (review_data->>'confidence') = 'medium' THEN 1 ELSE 0 END) as confidence_medium,
			SUM(CASE WHEN (review_data->>'confidence') = 'low' THEN 1 ELSE 0 END) as confidence_low,
			AVG(CAST(review_data->'criteria'->>'originality' AS FLOAT)) as avg_originality,
			AVG(CAST(review_data->'criteria'->>'technical_quality' AS FLOAT)) as avg_technical_quality,
			AVG(CAST(review_data->'criteria'->>'clarity' AS FLOAT)) as avg_clarity,
			AVG(CAST(review_data->'criteria'->>'significance' AS FLOAT)) as avg_significance,
			AVG(CAST(review_data->'criteria'->>'methodology' AS FLOAT)) as avg_methodology
		FROM paper_assignments
		WHERE submission_id = $1 AND review_status = 'submitted'
	`

	var analytics dto.ReviewAnalyticsResponse
	var avgScore sql.NullFloat64
	var avgOriginality, avgTechnicalQuality, avgClarity, avgSignificance, avgMethodology sql.NullFloat64
	var strongAccept, accept, weakAccept, borderline, weakReject, reject, strongReject sql.NullInt64
	var confidenceHigh, confidenceMedium, confidenceLow sql.NullInt64

	err := s.db.QueryRowContext(ctx, query, submissionID).Scan(
		&analytics.TotalReviews,
		&avgScore,
		&strongAccept,
		&accept,
		&weakAccept,
		&borderline,
		&weakReject,
		&reject,
		&strongReject,
		&confidenceHigh,
		&confidenceMedium,
		&confidenceLow,
		&avgOriginality,
		&avgTechnicalQuality,
		&avgClarity,
		&avgSignificance,
		&avgMethodology,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get review analytics: %w", err)
	}

	// Handle nullable score distribution
	if strongAccept.Valid {
		analytics.ScoreDistribution.StrongAccept = int(strongAccept.Int64)
	}
	if accept.Valid {
		analytics.ScoreDistribution.Accept = int(accept.Int64)
	}
	if weakAccept.Valid {
		analytics.ScoreDistribution.WeakAccept = int(weakAccept.Int64)
	}
	if borderline.Valid {
		analytics.ScoreDistribution.Borderline = int(borderline.Int64)
	}
	if weakReject.Valid {
		analytics.ScoreDistribution.WeakReject = int(weakReject.Int64)
	}
	if reject.Valid {
		analytics.ScoreDistribution.Reject = int(reject.Int64)
	}
	if strongReject.Valid {
		analytics.ScoreDistribution.StrongReject = int(strongReject.Int64)
	}

	// Handle nullable confidence distribution
	if confidenceHigh.Valid {
		analytics.ConfidenceDistribution.High = int(confidenceHigh.Int64)
	}
	if confidenceMedium.Valid {
		analytics.ConfidenceDistribution.Medium = int(confidenceMedium.Int64)
	}
	if confidenceLow.Valid {
		analytics.ConfidenceDistribution.Low = int(confidenceLow.Int64)
	}

	// Handle nullable averages
	if avgScore.Valid {
		analytics.AverageScore = avgScore.Float64
	}
	if avgOriginality.Valid {
		analytics.CriteriaAverages.Originality = avgOriginality.Float64
	}
	if avgTechnicalQuality.Valid {
		analytics.CriteriaAverages.TechnicalQuality = avgTechnicalQuality.Float64
	}
	if avgClarity.Valid {
		analytics.CriteriaAverages.Clarity = avgClarity.Float64
	}
	if avgSignificance.Valid {
		analytics.CriteriaAverages.Significance = avgSignificance.Float64
	}
	if avgMethodology.Valid {
		analytics.CriteriaAverages.Methodology = avgMethodology.Float64
	}

	return &analytics, nil
}

// GetSuggestionsByConference retrieves all suggested assignments grouped by submission
func (s *Storage) GetSuggestionsByConference(ctx context.Context, conferenceID int64) ([]*dto.SuggestionGroup, int64, error) {
	query := `
		SELECT
			pa.id, pa.submission_id, pa.reviewer_id, pa.score,
			cs.title as submission_title,
			u.email as reviewer_email
		FROM paper_assignments pa
		JOIN conference_submissions cs ON pa.submission_id = cs.submission_id
		JOIN conference_reviewers cr ON pa.reviewer_id = cr.id
		JOIN users u ON cr.user_id = u.user_id
		WHERE pa.conference_id = $1 AND pa.status = 'suggested'
		ORDER BY pa.submission_id, pa.score DESC
	`

	rows, err := s.db.QueryContext(ctx, query, conferenceID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query suggestions: %w", err)
	}
	defer rows.Close()

	// Group by submission
	groupMap := make(map[int64]*dto.SuggestionGroup)
	var totalSuggestions int64

	for rows.Next() {
		var (
			id, subID, revID               int64
			score                          float64
			submissionTitle, reviewerEmail string
		)

		err := rows.Scan(&id, &subID, &revID, &score, &submissionTitle, &reviewerEmail)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan suggestion: %w", err)
		}

		group, exists := groupMap[subID]
		if !exists {
			group = &dto.SuggestionGroup{
				SubmissionID:    subID,
				SubmissionTitle: submissionTitle,
				Reviewers:       []dto.SuggestedReviewer{},
			}
			groupMap[subID] = group
		}

		group.Reviewers = append(group.Reviewers, dto.SuggestedReviewer{
			AssignmentID:  id,
			ReviewerID:    revID,
			ReviewerEmail: reviewerEmail,
			Score:         score,
		})
		totalSuggestions++
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating suggestions: %w", err)
	}

	// Convert map to slice
	groups := make([]*dto.SuggestionGroup, 0, len(groupMap))
	for _, g := range groupMap {
		groups = append(groups, g)
	}

	return groups, totalSuggestions, nil
}

// GetConfirmedAssignmentsByConference retrieves all confirmed assignments grouped by submission
// Confirmed means status is not 'suggested' (i.e., pending, accepted, declined, or completed)
func (s *Storage) GetConfirmedAssignmentsByConference(ctx context.Context, conferenceID int64) ([]*dto.ConfirmedAssignmentGroup, int64, error) {
	query := `
		SELECT
			pa.id, pa.submission_id, pa.reviewer_id, pa.score, pa.status,
			COALESCE(pa.review_status, 'not_started') as review_status,
			cs.title as submission_title,
			u.email as reviewer_email
		FROM paper_assignments pa
		JOIN conference_submissions cs ON pa.submission_id = cs.submission_id
		JOIN conference_reviewers cr ON pa.reviewer_id = cr.id
		JOIN users u ON cr.user_id = u.user_id
		WHERE pa.conference_id = $1 AND pa.status != 'suggested'
		ORDER BY pa.submission_id, pa.status, pa.score DESC
	`

	rows, err := s.db.QueryContext(ctx, query, conferenceID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query confirmed assignments: %w", err)
	}
	defer rows.Close()

	// Group by submission
	groupMap := make(map[int64]*dto.ConfirmedAssignmentGroup)
	var totalAssignments int64

	for rows.Next() {
		var (
			id, subID, revID               int64
			score                          float64
			status, reviewStatus           string
			submissionTitle, reviewerEmail string
		)

		err := rows.Scan(&id, &subID, &revID, &score, &status, &reviewStatus, &submissionTitle, &reviewerEmail)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan confirmed assignment: %w", err)
		}

		group, exists := groupMap[subID]
		if !exists {
			group = &dto.ConfirmedAssignmentGroup{
				SubmissionID:    subID,
				SubmissionTitle: submissionTitle,
				Reviewers:       []dto.ConfirmedReviewer{},
			}
			groupMap[subID] = group
		}

		group.Reviewers = append(group.Reviewers, dto.ConfirmedReviewer{
			AssignmentID:  id,
			ReviewerID:    revID,
			ReviewerEmail: reviewerEmail,
			Score:         score,
			Status:        status,
			ReviewStatus:  reviewStatus,
		})
		totalAssignments++
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating confirmed assignments: %w", err)
	}

	// Convert map to slice
	groups := make([]*dto.ConfirmedAssignmentGroup, 0, len(groupMap))
	for _, g := range groupMap {
		groups = append(groups, g)
	}

	return groups, totalAssignments, nil
}

// ConfirmSuggestions updates status from 'suggested' to 'pending' for given IDs
func (s *Storage) ConfirmSuggestions(ctx context.Context, conferenceID int64, assignmentIDs []int64) (int64, error) {
	if len(assignmentIDs) == 0 {
		// Confirm all suggestions for this conference
		query, args, err := s.qb.
			Update(model.AssignmentTableName).
			Set(model.ColStatus, model.AssignmentStatusPending).
			Set(model.ColUpdatedAt, sq.Expr("NOW()")).
			Where(sq.Eq{model.ColConferenceID: conferenceID}).
			Where(sq.Eq{model.ColStatus: model.AssignmentStatusSuggested}).
			ToSql()
		if err != nil {
			return 0, fmt.Errorf("failed to build update query: %w", err)
		}

		result, err := s.db.ExecContext(ctx, query, args...)
		if err != nil {
			return 0, fmt.Errorf("failed to confirm suggestions: %w", err)
		}

		return result.RowsAffected()
	}

	// Confirm specific IDs
	query, args, err := s.qb.
		Update(model.AssignmentTableName).
		Set(model.ColStatus, model.AssignmentStatusPending).
		Set(model.ColUpdatedAt, sq.Expr("NOW()")).
		Where(sq.Eq{model.ColConferenceID: conferenceID}).
		Where(sq.Eq{"id": assignmentIDs}).
		Where(sq.Eq{model.ColStatus: model.AssignmentStatusSuggested}).
		ToSql()
	if err != nil {
		return 0, fmt.Errorf("failed to build update query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to confirm suggestions: %w", err)
	}

	return result.RowsAffected()
}

// DeleteSuggestion deletes a single suggested assignment
func (s *Storage) DeleteSuggestion(ctx context.Context, assignmentID int64) error {
	query, args, err := s.qb.
		Delete(model.AssignmentTableName).
		Where(sq.Eq{"id": assignmentID}).
		Where(sq.Eq{model.ColStatus: model.AssignmentStatusSuggested}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete suggestion: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("suggestion not found or already confirmed")
	}

	return nil
}

// DeleteSuggestionsByConference deletes all suggested assignments for a conference
func (s *Storage) DeleteSuggestionsByConference(ctx context.Context, conferenceID int64) error {
	query, args, err := s.qb.
		Delete(model.AssignmentTableName).
		Where(sq.Eq{model.ColConferenceID: conferenceID}).
		Where(sq.Eq{model.ColStatus: model.AssignmentStatusSuggested}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete suggestions: %w", err)
	}

	return nil
}

// AcknowledgeRebuttal marks the reviewer as having read the author's rebuttal (idempotent).
func (s *Storage) AcknowledgeRebuttal(ctx context.Context, assignmentID int64) (*dto.Assignment, error) {
	var result model.Assignment
	err := s.db.QueryRowContext(ctx, `
		UPDATE paper_assignments
		SET rebuttal_status = 'acknowledged',
		    rebuttal_acknowledged_at = COALESCE(rebuttal_acknowledged_at, NOW()),
		    updated_at = NOW()
		WHERE id = $1
		RETURNING id, conference_id, submission_id, reviewer_id, score, status,
		          assigned_at, completed_at, review_status, review_score, review_data,
		          review_submitted_at, rebuttal_status,
		          rebuttal_submitted_at, rebuttal_acknowledged_at, created_at, updated_at
	`, assignmentID).Scan(
		&result.ID, &result.ConferenceID, &result.SubmissionID, &result.ReviewerID,
		&result.Score, &result.Status, &result.AssignedAt, &result.CompletedAt,
		&result.ReviewStatus, &result.ReviewScore, &result.ReviewData, &result.ReviewSubmittedAt,
		&result.RebuttalStatus, &result.RebuttalSubmittedAt,
		&result.RebuttalAcknowledgedAt, &result.CreatedAt, &result.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("assignment not found")
	}
	if err != nil {
		return nil, fmt.Errorf("acknowledge rebuttal: %w", err)
	}
	return result.ToDTO(), nil
}

