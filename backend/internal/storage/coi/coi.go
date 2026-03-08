package coi

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

// StorageInterface defines the interface for COI relationship storage operations
type StorageInterface interface {
	Create(ctx context.Context, relationship *model.COIRelationship) error
	BatchCreate(ctx context.Context, relationships []*model.COIRelationship) error
	GetByConference(ctx context.Context, conferenceID int64, filters *QueryFilters) ([]*model.COIRelationship, int64, error)
	GetByReviewerAndAuthor(ctx context.Context, conferenceID int64, reviewerID int64, authorEmail string) ([]*model.COIRelationship, error)
	GetBySubmission(ctx context.Context, conferenceID int64, submissionID int64) ([]*model.COIRelationship, error)
	GetDashboardStats(ctx context.Context, conferenceID int64) (*dto.COIDashboardStats, error)
	DeleteByConference(ctx context.Context, conferenceID int64) error
	DeleteByConferenceAndSubmission(ctx context.Context, conferenceID int64, submissionID int64) error
	DeleteByConferenceAndReviewer(ctx context.Context, conferenceID int64, reviewerID int64) error
	GetPaperSummaries(ctx context.Context, conferenceID int64, filters *PaperQueryFilters) ([]*PaperSummaryData, int64, error)
	GetLastRebuildAt(ctx context.Context, conferenceID int64) (*time.Time, error)
	SetLastRebuildAt(ctx context.Context, conferenceID int64, rebuiltAt time.Time) error
	UpsertDirtyConference(ctx context.Context, conferenceID int64, reason string) error
	UpsertDirtySubmission(ctx context.Context, conferenceID int64, submissionID int64, reason string) error
	UpsertDirtyReviewer(ctx context.Context, conferenceID int64, reviewerID int64, reason string) error
	ListDirtyScopes(ctx context.Context, conferenceID int64, limit int) ([]*DirtyScope, error)
	DeleteDirtyScope(ctx context.Context, conferenceID int64, scopeType string, scopeKey string) error
	ClearDirtyScopes(ctx context.Context, conferenceID int64) error
}

// Storage implements COI relationship storage operations
type Storage struct {
	db *sql.DB
	sb sq.StatementBuilderType
}

// New creates a new COI storage instance
func New(db *sql.DB) StorageInterface {
	return &Storage{
		db: db,
		sb: sq.StatementBuilder.PlaceholderFormat(sq.Dollar).RunWith(db),
	}
}

// QueryFilters represents filters for querying COI relationships
type QueryFilters struct {
	Severity         string
	RelationshipType string
	Search           string
	Limit            int
	Offset           int
}

// PaperQueryFilters represents filters for querying paper COI summaries
type PaperQueryFilters struct {
	Severity string
	Search   string
	Limit    int
	Offset   int
}

// PaperSummaryData represents aggregated COI data for a paper
type PaperSummaryData struct {
	SubmissionID        int64
	PaperTitle          string
	HighSeverityCount   int
	MediumSeverityCount int
	LowSeverityCount    int
}

const (
	ScopeTypeConference = "conference"
	ScopeTypeSubmission = "submission"
	ScopeTypeReviewer   = "reviewer"
)

// DirtyScope represents a pending COI refresh task at conference/submission/reviewer granularity.
type DirtyScope struct {
	ConferenceID int64
	ScopeType    string
	ScopeKey     string
	SubmissionID *int64
	ReviewerID   *int64
	Reason       string
	UpdatedAt    time.Time
}

func submissionScopeKey(submissionID int64) string {
	return strconv.FormatInt(submissionID, 10)
}

func reviewerScopeKey(reviewerID int64) string {
	return strconv.FormatInt(reviewerID, 10)
}

// Create inserts a new COI relationship
func (s *Storage) Create(ctx context.Context, relationship *model.COIRelationship) error {
	// Marshal evidence to JSONB
	evidenceJSON, err := json.Marshal(relationship.Evidence)
	if err != nil {
		return fmt.Errorf("failed to marshal evidence: %w", err)
	}

	query := s.sb.Insert(model.COIRelationshipTableName).
		Columns(
			model.COIColConferenceID,
			model.COIColReviewerID,
			model.COIColAuthorEmail,
			model.COIColSubmissionID,
			model.COIColRelationshipType,
			model.COIColSeverity,
			model.COIColDescription,
			model.COIColEvidence,
			model.COIColStartDate,
			model.COIColEndDate,
			model.COIColDetectedBy,
		).
		Values(
			relationship.ConferenceID,
			relationship.ReviewerID,
			relationship.AuthorEmail,
			relationship.SubmissionID,
			relationship.RelationshipType,
			relationship.Severity,
			relationship.Description,
			evidenceJSON,
			relationship.StartDate,
			relationship.EndDate,
			relationship.DetectedBy,
		).
		Suffix("RETURNING id, created_at, updated_at")

	err = query.QueryRowContext(ctx).Scan(
		&relationship.ID,
		&relationship.CreatedAt,
		&relationship.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create COI relationship: %w", err)
	}

	return nil
}

// BatchCreate inserts multiple COI relationships in a transaction
func (s *Storage) BatchCreate(ctx context.Context, relationships []*model.COIRelationship) error {
	if len(relationships) == 0 {
		return nil
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	builder := sq.StatementBuilder.PlaceholderFormat(sq.Dollar).RunWith(tx)

	for _, rel := range relationships {
		// Marshal evidence to JSONB
		evidenceJSON, err := json.Marshal(rel.Evidence)
		if err != nil {
			return fmt.Errorf("failed to marshal evidence: %w", err)
		}

		query := builder.Insert(model.COIRelationshipTableName).
			Columns(
				model.COIColConferenceID,
				model.COIColReviewerID,
				model.COIColAuthorEmail,
				model.COIColSubmissionID,
				model.COIColRelationshipType,
				model.COIColSeverity,
				model.COIColDescription,
				model.COIColEvidence,
				model.COIColStartDate,
				model.COIColEndDate,
				model.COIColDetectedBy,
			).
			Values(
				rel.ConferenceID,
				rel.ReviewerID,
				rel.AuthorEmail,
				rel.SubmissionID,
				rel.RelationshipType,
				rel.Severity,
				rel.Description,
				evidenceJSON,
				rel.StartDate,
				rel.EndDate,
				rel.DetectedBy,
			).
			Suffix("RETURNING id, created_at, updated_at")

		err = query.QueryRowContext(ctx).Scan(&rel.ID, &rel.CreatedAt, &rel.UpdatedAt)
		if err != nil {
			return fmt.Errorf("failed to insert COI relationship: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetByConference retrieves COI relationships for a conference with filters and pagination
func (s *Storage) GetByConference(ctx context.Context, conferenceID int64, filters *QueryFilters) ([]*model.COIRelationship, int64, error) {
	// Build base query using the pre-configured statement builder
	query := s.sb.Select(
		model.COIColID,
		model.COIColConferenceID,
		model.COIColReviewerID,
		model.COIColAuthorEmail,
		model.COIColSubmissionID,
		model.COIColRelationshipType,
		model.COIColSeverity,
		model.COIColDescription,
		model.COIColEvidence,
		model.COIColStartDate,
		model.COIColEndDate,
		model.COIColDetectedBy,
		model.COIColCreatedAt,
		model.COIColUpdatedAt,
	).
		From(model.COIRelationshipTableName).
		Where(sq.Eq{model.COIColConferenceID: conferenceID})

	// Apply filters
	if filters != nil {
		if filters.Severity != "" {
			query = query.Where(sq.Eq{model.COIColSeverity: filters.Severity})
		}
		if filters.RelationshipType != "" {
			query = query.Where(sq.Eq{model.COIColRelationshipType: filters.RelationshipType})
		}
		if filters.Search != "" {
			searchPattern := "%" + filters.Search + "%"
			query = query.Where(
				sq.Expr("("+model.COIColAuthorEmail+" LIKE ? OR "+model.COIColDescription+" LIKE ?)", searchPattern, searchPattern),
			)
		}
	}

	// Get total count - build a simpler count query using the pre-configured statement builder
	countQuery := s.sb.Select("COUNT(*)").
		From(model.COIRelationshipTableName).
		Where(sq.Eq{model.COIColConferenceID: conferenceID})

	// Apply the same filters as the main query
	if filters != nil {
		if filters.Severity != "" {
			countQuery = countQuery.Where(sq.Eq{model.COIColSeverity: filters.Severity})
		}
		if filters.RelationshipType != "" {
			countQuery = countQuery.Where(sq.Eq{model.COIColRelationshipType: filters.RelationshipType})
		}
		if filters.Search != "" {
			searchPattern := "%" + filters.Search + "%"
			countQuery = countQuery.Where(
				sq.Expr("("+model.COIColAuthorEmail+" LIKE ? OR "+model.COIColDescription+" LIKE ?)", searchPattern, searchPattern),
			)
		}
	}

	var total int64
	err := countQuery.QueryRowContext(ctx).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count relationships: %w", err)
	}

	// Apply pagination
	if filters != nil {
		if filters.Limit > 0 {
			query = query.Limit(uint64(filters.Limit))
		}
		if filters.Offset > 0 {
			query = query.Offset(uint64(filters.Offset))
		}
	}

	// Order by severity (high > medium > low) and created_at
	query = query.OrderBy(
		"CASE "+model.COIColSeverity+" WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END",
		model.COIColCreatedAt+" DESC",
	)

	// Execute query
	rows, err := query.QueryContext(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query relationships: %w", err)
	}
	defer rows.Close()

	// Scan results
	relationships := []*model.COIRelationship{}
	for rows.Next() {
		rel := &model.COIRelationship{}
		err := rows.Scan(
			&rel.ID,
			&rel.ConferenceID,
			&rel.ReviewerID,
			&rel.AuthorEmail,
			&rel.SubmissionID,
			&rel.RelationshipType,
			&rel.Severity,
			&rel.Description,
			&rel.Evidence,
			&rel.StartDate,
			&rel.EndDate,
			&rel.DetectedBy,
			&rel.CreatedAt,
			&rel.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan relationship: %w", err)
		}
		relationships = append(relationships, rel)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating relationships: %w", err)
	}

	return relationships, total, nil
}

// GetByReviewerAndAuthor retrieves all COI relationships between a reviewer and an author
func (s *Storage) GetByReviewerAndAuthor(ctx context.Context, conferenceID int64, reviewerID int64, authorEmail string) ([]*model.COIRelationship, error) {
	query := s.sb.Select(
		model.COIColID,
		model.COIColConferenceID,
		model.COIColReviewerID,
		model.COIColAuthorEmail,
		model.COIColSubmissionID,
		model.COIColRelationshipType,
		model.COIColSeverity,
		model.COIColDescription,
		model.COIColEvidence,
		model.COIColStartDate,
		model.COIColEndDate,
		model.COIColDetectedBy,
		model.COIColCreatedAt,
		model.COIColUpdatedAt,
	).
		From(model.COIRelationshipTableName).
		Where(sq.And{
			sq.Eq{model.COIColConferenceID: conferenceID},
			sq.Eq{model.COIColReviewerID: reviewerID},
			sq.Eq{model.COIColAuthorEmail: authorEmail},
		}).
		OrderBy(model.COIColCreatedAt + " DESC")

	rows, err := query.QueryContext(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query relationships: %w", err)
	}
	defer rows.Close()

	relationships := []*model.COIRelationship{}
	for rows.Next() {
		rel := &model.COIRelationship{}
		err := rows.Scan(
			&rel.ID,
			&rel.ConferenceID,
			&rel.ReviewerID,
			&rel.AuthorEmail,
			&rel.SubmissionID,
			&rel.RelationshipType,
			&rel.Severity,
			&rel.Description,
			&rel.Evidence,
			&rel.StartDate,
			&rel.EndDate,
			&rel.DetectedBy,
			&rel.CreatedAt,
			&rel.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan relationship: %w", err)
		}
		relationships = append(relationships, rel)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating relationships: %w", err)
	}

	return relationships, nil
}

// GetDashboardStats retrieves statistics for the COI dashboard
func (s *Storage) GetDashboardStats(ctx context.Context, conferenceID int64) (*dto.COIDashboardStats, error) {
	stats := &dto.COIDashboardStats{
		ConferenceID: conferenceID,
	}

	// Get total reviewers for this conference
	reviewerQuery := `
		SELECT COUNT(DISTINCT id) 
		FROM conference_reviewers 
		WHERE conference_id = $1 AND status = 'accepted'
	`
	err := s.db.QueryRowContext(ctx, reviewerQuery, conferenceID).Scan(&stats.TotalReviewers)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to count reviewers: %w", err)
	}

	// Get available reviewers (those with current_workload < max_capacity)
	// For now, assume all accepted reviewers are available
	stats.AvailableReviewers = stats.TotalReviewers

	// Get total papers
	paperQuery := `
		SELECT COUNT(*) 
		FROM conference_submissions 
		WHERE conference_id = $1
	`
	err = s.db.QueryRowContext(ctx, paperQuery, conferenceID).Scan(&stats.TotalPapers)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to count papers: %w", err)
	}

	// Get papers under review
	reviewingQuery := `
		SELECT COUNT(*) 
		FROM conference_submissions 
		WHERE conference_id = $1 AND status = 'under_review'
	`
	err = s.db.QueryRowContext(ctx, reviewingQuery, conferenceID).Scan(&stats.PapersUnderReview)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to count papers under review: %w", err)
	}

	// Get COI detected count (unique relationships with severity != 'none')
	coiQuery := `
		SELECT COUNT(*) 
		FROM coi_relationships 
		WHERE conference_id = $1 AND severity != 'none'
	`
	err = s.db.QueryRowContext(ctx, coiQuery, conferenceID).Scan(&stats.COIDetected)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to count COI: %w", err)
	}

	// Get total relationships
	totalRelQuery := `
		SELECT COUNT(*) 
		FROM coi_relationships 
		WHERE conference_id = $1
	`
	err = s.db.QueryRowContext(ctx, totalRelQuery, conferenceID).Scan(&stats.TotalRelationships)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to count relationships: %w", err)
	}

	// Get assignment statistics
	assignmentQuery := `
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
		FROM paper_assignments 
		WHERE conference_id = $1
	`
	err = s.db.QueryRowContext(ctx, assignmentQuery, conferenceID).Scan(
		&stats.TotalAssignments,
		&stats.CompletedAssignments,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to count assignments: %w", err)
	}

	return stats, nil
}

// GetBySubmission retrieves all COI relationships for a specific submission
func (s *Storage) GetBySubmission(ctx context.Context, conferenceID int64, submissionID int64) ([]*model.COIRelationship, error) {
	query := s.sb.Select("*").
		From(model.COIRelationshipTableName).
		Where(sq.Eq{
			model.COIColConferenceID: conferenceID,
			model.COIColSubmissionID: submissionID,
		})

	rows, err := query.QueryContext(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query relationships by submission: %w", err)
	}
	defer rows.Close()

	var relationships []*model.COIRelationship
	for rows.Next() {
		rel := &model.COIRelationship{}
		err := rows.Scan(
			&rel.ID,
			&rel.ConferenceID,
			&rel.ReviewerID,
			&rel.AuthorEmail,
			&rel.SubmissionID,
			&rel.RelationshipType,
			&rel.Severity,
			&rel.Description,
			&rel.Evidence,
			&rel.StartDate,
			&rel.EndDate,
			&rel.DetectedBy,
			&rel.CreatedAt,
			&rel.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan relationship: %w", err)
		}
		relationships = append(relationships, rel)
	}

	return relationships, nil
}

// DeleteByConference deletes all COI relationships for a conference
func (s *Storage) DeleteByConference(ctx context.Context, conferenceID int64) error {
	query := s.sb.Delete(model.COIRelationshipTableName).
		Where(sq.Eq{model.COIColConferenceID: conferenceID})

	_, err := query.ExecContext(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete COI relationships: %w", err)
	}

	return nil
}

// DeleteByConferenceAndSubmission deletes COI relationships for a single submission in a conference.
func (s *Storage) DeleteByConferenceAndSubmission(ctx context.Context, conferenceID int64, submissionID int64) error {
	query := s.sb.Delete(model.COIRelationshipTableName).
		Where(sq.Eq{
			model.COIColConferenceID: conferenceID,
			model.COIColSubmissionID: submissionID,
		})

	if _, err := query.ExecContext(ctx); err != nil {
		return fmt.Errorf("failed to delete COI relationships by submission: %w", err)
	}

	return nil
}

// DeleteByConferenceAndReviewer deletes COI relationships for a single reviewer in a conference.
func (s *Storage) DeleteByConferenceAndReviewer(ctx context.Context, conferenceID int64, reviewerID int64) error {
	query := s.sb.Delete(model.COIRelationshipTableName).
		Where(sq.Eq{
			model.COIColConferenceID: conferenceID,
			model.COIColReviewerID:   reviewerID,
		})

	if _, err := query.ExecContext(ctx); err != nil {
		return fmt.Errorf("failed to delete COI relationships by reviewer: %w", err)
	}

	return nil
}

// GetPaperSummaries retrieves COI summaries grouped by paper
func (s *Storage) GetPaperSummaries(ctx context.Context, conferenceID int64, filters *PaperQueryFilters) ([]*PaperSummaryData, int64, error) {
	// Build query to get papers with their COI counts
	baseQuery := `
		SELECT 
			cs.submission_id,
			cs.title,
			COUNT(CASE WHEN cr.severity = 'high' THEN 1 END) as high_count,
			COUNT(CASE WHEN cr.severity = 'medium' THEN 1 END) as medium_count,
			COUNT(CASE WHEN cr.severity = 'low' THEN 1 END) as low_count
		FROM conference_submissions cs
		LEFT JOIN coi_relationships cr ON cs.submission_id = cr.submission_id 
			AND cr.conference_id = cs.conference_id
		WHERE cs.conference_id = $1
	`

	args := []interface{}{conferenceID}
	argIdx := 2

	// Add search filter
	if filters != nil && filters.Search != "" {
		baseQuery += fmt.Sprintf(" AND cs.title ILIKE $%d", argIdx)
		args = append(args, "%"+filters.Search+"%")
		argIdx++
	}

	baseQuery += " GROUP BY cs.submission_id, cs.title"

	// Add severity filter (having clause)
	if filters != nil && filters.Severity != "" {
		switch filters.Severity {
		case "high":
			baseQuery += " HAVING COUNT(CASE WHEN cr.severity = 'high' THEN 1 END) > 0"
		case "medium":
			baseQuery += " HAVING COUNT(CASE WHEN cr.severity = 'medium' THEN 1 END) > 0"
		case "low":
			baseQuery += " HAVING COUNT(CASE WHEN cr.severity = 'low' THEN 1 END) > 0"
		}
	}

	// Get total count
	countQuery := "SELECT COUNT(*) FROM (" + baseQuery + ") AS count_subquery"
	var total int64
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count paper summaries: %w", err)
	}

	// Add ordering and pagination
	// Use original aggregation expressions instead of aliases in ORDER BY
	baseQuery += " ORDER BY (COUNT(CASE WHEN cr.severity = 'high' THEN 1 END) + COUNT(CASE WHEN cr.severity = 'medium' THEN 1 END) + COUNT(CASE WHEN cr.severity = 'low' THEN 1 END)) DESC, cs.submission_id"

	if filters != nil {
		if filters.Limit > 0 {
			baseQuery += fmt.Sprintf(" LIMIT $%d", argIdx)
			args = append(args, filters.Limit)
			argIdx++
		}
		if filters.Offset > 0 {
			baseQuery += fmt.Sprintf(" OFFSET $%d", argIdx)
			args = append(args, filters.Offset)
		}
	}

	// Execute query
	rows, err := s.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query paper summaries: %w", err)
	}
	defer rows.Close()

	summaries := []*PaperSummaryData{}
	for rows.Next() {
		summary := &PaperSummaryData{}
		err := rows.Scan(
			&summary.SubmissionID,
			&summary.PaperTitle,
			&summary.HighSeverityCount,
			&summary.MediumSeverityCount,
			&summary.LowSeverityCount,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan paper summary: %w", err)
		}
		summaries = append(summaries, summary)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating paper summaries: %w", err)
	}

	return summaries, total, nil
}

func (s *Storage) GetLastRebuildAt(ctx context.Context, conferenceID int64) (*time.Time, error) {
	const query = `
		SELECT last_rebuild_at
		FROM coi_refresh_state
		WHERE conference_id = $1
	`

	var rebuiltAt time.Time
	err := s.db.QueryRowContext(ctx, query, conferenceID).Scan(&rebuiltAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to fetch COI rebuild state: %w", err)
	}
	return &rebuiltAt, nil
}

func (s *Storage) SetLastRebuildAt(ctx context.Context, conferenceID int64, rebuiltAt time.Time) error {
	const query = `
		INSERT INTO coi_refresh_state (conference_id, last_rebuild_at, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (conference_id)
		DO UPDATE SET last_rebuild_at = EXCLUDED.last_rebuild_at, updated_at = NOW()
	`

	if _, err := s.db.ExecContext(ctx, query, conferenceID, rebuiltAt); err != nil {
		return fmt.Errorf("failed to persist COI rebuild state: %w", err)
	}

	return nil
}

func (s *Storage) upsertDirtyScope(
	ctx context.Context,
	conferenceID int64,
	scopeType string,
	scopeKey string,
	submissionID *int64,
	reviewerID *int64,
	reason string,
) error {
	const query = `
		INSERT INTO coi_dirty_scopes (
			conference_id,
			scope_type,
			scope_key,
			submission_id,
			reviewer_id,
			reason,
			updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		ON CONFLICT (conference_id, scope_type, scope_key)
		DO UPDATE SET reason = EXCLUDED.reason, updated_at = NOW()
	`

	if reason == "" {
		reason = "data_changed"
	}

	if _, err := s.db.ExecContext(
		ctx,
		query,
		conferenceID,
		scopeType,
		scopeKey,
		submissionID,
		reviewerID,
		reason,
	); err != nil {
		return fmt.Errorf("failed to upsert COI dirty scope: %w", err)
	}

	return nil
}

func (s *Storage) UpsertDirtyConference(ctx context.Context, conferenceID int64, reason string) error {
	return s.upsertDirtyScope(ctx, conferenceID, ScopeTypeConference, "all", nil, nil, reason)
}

func (s *Storage) UpsertDirtySubmission(ctx context.Context, conferenceID int64, submissionID int64, reason string) error {
	return s.upsertDirtyScope(
		ctx,
		conferenceID,
		ScopeTypeSubmission,
		submissionScopeKey(submissionID),
		&submissionID,
		nil,
		reason,
	)
}

func (s *Storage) UpsertDirtyReviewer(ctx context.Context, conferenceID int64, reviewerID int64, reason string) error {
	return s.upsertDirtyScope(
		ctx,
		conferenceID,
		ScopeTypeReviewer,
		reviewerScopeKey(reviewerID),
		nil,
		&reviewerID,
		reason,
	)
}

func (s *Storage) ListDirtyScopes(ctx context.Context, conferenceID int64, limit int) ([]*DirtyScope, error) {
	query := `
		SELECT conference_id, scope_type, scope_key, submission_id, reviewer_id, reason, updated_at
		FROM coi_dirty_scopes
		WHERE conference_id = $1
		ORDER BY updated_at ASC
	`

	args := []interface{}{conferenceID}
	if limit > 0 {
		query += " LIMIT $2"
		args = append(args, limit)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list COI dirty scopes: %w", err)
	}
	defer rows.Close()

	scopes := make([]*DirtyScope, 0)
	for rows.Next() {
		scope := &DirtyScope{}
		var submissionID sql.NullInt64
		var reviewerID sql.NullInt64
		var reason sql.NullString

		if err := rows.Scan(
			&scope.ConferenceID,
			&scope.ScopeType,
			&scope.ScopeKey,
			&submissionID,
			&reviewerID,
			&reason,
			&scope.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan COI dirty scope: %w", err)
		}

		if submissionID.Valid {
			id := submissionID.Int64
			scope.SubmissionID = &id
		}
		if reviewerID.Valid {
			id := reviewerID.Int64
			scope.ReviewerID = &id
		}
		if reason.Valid {
			scope.Reason = reason.String
		}

		scopes = append(scopes, scope)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating COI dirty scopes: %w", err)
	}

	return scopes, nil
}

func (s *Storage) DeleteDirtyScope(ctx context.Context, conferenceID int64, scopeType string, scopeKey string) error {
	const query = `
		DELETE FROM coi_dirty_scopes
		WHERE conference_id = $1 AND scope_type = $2 AND scope_key = $3
	`

	if _, err := s.db.ExecContext(ctx, query, conferenceID, scopeType, scopeKey); err != nil {
		return fmt.Errorf("failed to delete COI dirty scope: %w", err)
	}

	return nil
}

func (s *Storage) ClearDirtyScopes(ctx context.Context, conferenceID int64) error {
	const query = `
		DELETE FROM coi_dirty_scopes
		WHERE conference_id = $1
	`

	if _, err := s.db.ExecContext(ctx, query, conferenceID); err != nil {
		return fmt.Errorf("failed to clear COI dirty scopes: %w", err)
	}

	return nil
}
