package reviewer

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"path/filepath"

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
	
	// Reviewer Dashboard methods
	GetConferencesByReviewer(ctx context.Context, reviewerID int64) ([]*dto.ReviewerConference, error)
	GetPendingInvitations(ctx context.Context, reviewerID int64) ([]*dto.ReviewInvitation, error)
	GetReviewerStats(ctx context.Context, reviewerID int64) (*dto.ReviewerStats, error)
	GetRecentAssignments(ctx context.Context, reviewerID int64, limit int) ([]*dto.AssignmentWithPaper, error)
	GetAssignedPapers(ctx context.Context, reviewerID, conferenceID int64) ([]*dto.AssignedPaperResponse, error)
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

// Helper method to build SELECT with JOIN to users table
func (s *Storage) selectWithUserJoin() sq.SelectBuilder {
	return s.qb.
		Select(
			fmt.Sprintf("%s.%s", model.ReviewerTableName, model.ColID),
			fmt.Sprintf("%s.%s", model.ReviewerTableName, model.ColUserID),
			fmt.Sprintf("%s.%s", model.ReviewerTableName, model.ColConferenceID),
			fmt.Sprintf("%s.%s", model.ReviewerTableName, model.ColStatus),
			fmt.Sprintf("%s.%s", model.ReviewerTableName, model.ColDomain),
			fmt.Sprintf("%s.%s", model.ReviewerTableName, model.ColCreatedAt),
			fmt.Sprintf("%s.%s", model.ReviewerTableName, model.ColUpdatedAt),
			fmt.Sprintf("%s.%s", model.UserTableName, model.UserColEmail),
		).
		From(model.ReviewerTableName).
		LeftJoin(fmt.Sprintf("%s ON %s.%s = %s.%s",
			model.UserTableName,
			model.ReviewerTableName,
			model.ColUserID,
			model.UserTableName,
			model.UserColUserID))
}

// Create creates a single reviewer invitation
func (s *Storage) Create(ctx context.Context, conferenceID int64, invite *dto.Reviewer) (*dto.Reviewer, error) {
	status := invite.Status
	if status == "" {
		status = model.ReviewerStatusPending
	}

	query, args, err := s.qb.
		Insert(model.ReviewerTableName).
		Columns(model.ColUserID, model.ColConferenceID, model.ColStatus, model.ColDomain, model.ColCreatedAt, model.ColUpdatedAt).
		Values(invite.UserID, conferenceID, status, pq.Array(invite.Domain), sq.Expr("NOW()"), sq.Expr("NOW()")).
		Suffix(fmt.Sprintf("RETURNING %s", model.ColID)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build insert query: %w", err)
	}

	var reviewerID int64
	err = s.db.QueryRowContext(ctx, query, args...).Scan(&reviewerID)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			return nil, fmt.Errorf("reviewer already invited to this conference")
		}
		return nil, fmt.Errorf("failed to create reviewer: %w", err)
	}

	// Fetch the created reviewer with email from users table
	return s.GetByID(ctx, reviewerID)
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
			Insert(model.ReviewerTableName).
			Columns(model.ColUserID, model.ColConferenceID, model.ColStatus, model.ColDomain, model.ColCreatedAt, model.ColUpdatedAt).
			Values(invite.UserID, conferenceID, status, pq.Array(invite.Domain), sq.Expr("NOW()"), sq.Expr("NOW()")).
			Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s",
				model.ColID, model.ColUserID, model.ColConferenceID, model.ColStatus, model.ColDomain, model.ColCreatedAt, model.ColUpdatedAt)).
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

		response.Success = append(response.Success, *result.ToDTO())
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return response, nil
}

// GetByID retrieves a reviewer by ID with email from users table
func (s *Storage) GetByID(ctx context.Context, id int64) (*dto.Reviewer, error) {
	query, args, err := s.selectWithUserJoin().
		Where(sq.Eq{fmt.Sprintf("%s.%s", model.ReviewerTableName, model.ColID): id}).
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
		&result.UserEmail, // From JOIN with users table
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("reviewer not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get reviewer: %w", err)
	}

	return result.ToDTO(), nil
}

// GetByUserAndConference retrieves a reviewer by user ID and conference ID with email from users table
func (s *Storage) GetByUserAndConference(ctx context.Context, userID, conferenceID int64) (*dto.Reviewer, error) {
	query, args, err := s.selectWithUserJoin().
		Where(sq.Eq{
			fmt.Sprintf("%s.user_id", model.ReviewerTableName):       userID,
			fmt.Sprintf("%s.conference_id", model.ReviewerTableName): conferenceID,
		}).
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
		&result.UserEmail, // From JOIN with users table
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("reviewer not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get reviewer: %w", err)
	}

	return result.ToDTO(), nil
}

// List retrieves all reviewers for a conference with pagination and email from users table
func (s *Storage) List(ctx context.Context, conferenceID int64, params *ListParams) ([]*dto.Reviewer, int64, error) {
	baseQuery := s.selectWithUserJoin().
		Where(sq.Eq{fmt.Sprintf("%s.conference_id", model.ReviewerTableName): conferenceID})

	countQuery := s.qb.
		Select("COUNT(*)").
		From(model.ReviewerTableName).
		Where(sq.Eq{fmt.Sprintf("%s.conference_id", model.ReviewerTableName): conferenceID})

	if params.Status != "" {
		baseQuery = baseQuery.Where(sq.Eq{fmt.Sprintf("%s.status", model.ReviewerTableName): params.Status})
		countQuery = countQuery.Where(sq.Eq{fmt.Sprintf("%s.status", model.ReviewerTableName): params.Status})
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

	query, args, err := baseQuery.OrderBy(fmt.Sprintf("%s.created_at DESC", model.ReviewerTableName)).ToSql()
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
			&result.UserEmail, // From JOIN with users table
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
		dtos[i] = r.ToDTO()
	}

	return dtos, total, nil
}

// UpdateStatus updates the status of a reviewer invitation
func (s *Storage) UpdateStatus(ctx context.Context, id int64, status string) (*dto.Reviewer, error) {
	query, args, err := s.qb.
		Update(model.ReviewerTableName).
		Set("status", status).
		Set("updated_at", sq.Expr("NOW()")).
		Where(sq.Eq{"id": id}).
		Suffix("RETURNING id").
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build update query: %w", err)
	}

	var reviewerID int64
	err = s.db.QueryRowContext(ctx, query, args...).Scan(&reviewerID)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("reviewer not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update reviewer status: %w", err)
	}

	// Fetch the updated reviewer with email from users table
	return s.GetByID(ctx, reviewerID)
}

// Delete removes a reviewer
func (s *Storage) Delete(ctx context.Context, id int64) error {
	query, args, err := s.qb.
		Delete(model.ReviewerTableName).
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

// ================== Reviewer Dashboard Methods ==================

// GetConferencesByReviewer retrieves all conferences where user is an accepted reviewer with progress info
func (s *Storage) GetConferencesByReviewer(ctx context.Context, reviewerID int64) ([]*dto.ReviewerConference, error) {
	query, args, err := s.qb.
		Select(
			"c.conference_id",
			"c.title",
			"c.acronym",
			"c.description",
			"c.chair",
			"c.primary_contact",
			"c.area_chair",
			"c.domain",
			"c.configurations",
			"c.created_at",
			"c.updated_at",
			"COALESCE(COUNT(DISTINCT pa.id), 0) as total_papers",
			"COALESCE(COUNT(DISTINCT CASE WHEN pa.status = 'completed' THEN pa.id END), 0) as reviewed_papers",
		).
		From("conferences c").
		Join("conference_reviewers cr ON c.conference_id = cr.conference_id").
		LeftJoin("paper_assignments pa ON pa.conference_id = c.conference_id AND pa.reviewer_id = ?", reviewerID).
		Where(sq.Eq{
			"cr.user_id": reviewerID,
			"cr.status":  model.ReviewerStatusAccepted,
		}).
		GroupBy("c.conference_id", "c.title", "c.acronym", "c.description", "c.chair", "c.primary_contact", "c.area_chair", "c.domain", "c.configurations", "c.created_at", "c.updated_at").
		OrderBy("c.created_at DESC").
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query conferences: %w", err)
	}
	defer rows.Close()

	var results []*dto.ReviewerConference
	for rows.Next() {
		var conf model.Conference
		var title, acronym, description sql.NullString
		var primaryContact, areaChair sql.NullInt64
		var totalPapers, reviewedPapers int
		
		err := rows.Scan(
			&conf.ConferenceID,
			&title,
			&acronym,
			&description,
			&conf.Chair,
			&primaryContact,
			&areaChair,
			&conf.Domain,
			&conf.Configurations,
			&conf.CreatedAt,
			&conf.UpdatedAt,
			&totalPapers,
			&reviewedPapers,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan conference: %w", err)
		}

		// Handle nullable fields
		if title.Valid {
			conf.Title = title.String
		}
		if acronym.Valid {
			conf.Acronym = acronym.String
		}
		if description.Valid {
			conf.Description = description.String
		}
		if primaryContact.Valid {
			conf.PrimaryContact = primaryContact.Int64
		}
		if areaChair.Valid {
			conf.AreaChair = areaChair.Int64
		}

		// Get domain as string (take first domain if multiple exist)
		domainStr := ""
		if len(conf.Domain) > 0 {
			domainStr = conf.Domain[0]
		}

		results = append(results, &dto.ReviewerConference{
			ConferenceResponse: conf.ToDTO(),
			ReviewedPapers:     reviewedPapers,
			TotalPapers:        totalPapers,
			Domain:             domainStr,
			Status:             "active", // Default status since table doesn't have this column
		})
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating conferences: %w", err)
	}

	return results, nil
}

// GetPendingInvitations retrieves pending review invitations for a reviewer
func (s *Storage) GetPendingInvitations(ctx context.Context, reviewerID int64) ([]*dto.ReviewInvitation, error) {
	query, args, err := s.qb.
		Select(
			"cr.id",
			"cr.conference_id",
			"c.title as conference_name",
			"c.acronym as conference_acronym",
			"c.chair as requested_by",
			"COALESCE(u.first_name || ' ' || u.last_name, u.email, 'Unknown') as requested_by_name",
			"cr.created_at as requested_at",
			"cr.status",
			"COALESCE((SELECT COUNT(*) FROM conference_submissions WHERE conference_id = cr.conference_id), 0) as estimated_papers",
		).
		From("conference_reviewers cr").
		Join("conferences c ON cr.conference_id = c.conference_id").
		LeftJoin("users u ON c.chair = u.user_id::text").
		Where(sq.Eq{
			"cr.user_id": reviewerID,
			"cr.status":  model.ReviewerStatusPending,
		}).
		OrderBy("cr.created_at DESC").
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query invitations: %w", err)
	}
	defer rows.Close()

	var results []*dto.ReviewInvitation
	for rows.Next() {
		var inv dto.ReviewInvitation
		var conferenceName, conferenceAcronym, requestedByName sql.NullString
		err := rows.Scan(
			&inv.ID,
			&inv.ConferenceID,
			&conferenceName,
			&conferenceAcronym,
			&inv.RequestedBy,
			&requestedByName,
			&inv.RequestedAt,
			&inv.Status,
			&inv.EstimatedPapers,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan invitation: %w", err)
		}

		// Handle nullable fields
		if conferenceName.Valid {
			inv.ConferenceName = conferenceName.String
		}
		if conferenceAcronym.Valid {
			inv.ConferenceAcronym = conferenceAcronym.String
		}
		if requestedByName.Valid {
			inv.RequestedByName = requestedByName.String
		}
		inv.ExpertiseMatch = 0.85 // TODO: Calculate actual match

		results = append(results, &inv)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating invitations: %w", err)
	}

	return results, nil
}

// GetReviewerStats retrieves statistics for a reviewer
func (s *Storage) GetReviewerStats(ctx context.Context, reviewerID int64) (*dto.ReviewerStats, error) {
	// Get assignment stats
	query, args, err := s.qb.
		Select(
			"COUNT(*) as total_assigned",
			"COUNT(*) FILTER (WHERE status = 'pending') as pending",
			"COUNT(*) FILTER (WHERE status IN ('accepted', 'in_progress')) as in_progress",
			"COUNT(*) FILTER (WHERE status = 'completed') as completed",
		).
		From("paper_assignments").
		Where(sq.Eq{"reviewer_id": reviewerID}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build stats query: %w", err)
	}

	var stats dto.ReviewerStats
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&stats.TotalAssigned,
		&stats.Pending,
		&stats.InProgress,
		&stats.Completed,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query stats: %w", err)
	}

	// Get pending requests count
	countQuery, countArgs, err := s.qb.
		Select("COUNT(*)").
		From("conference_reviewers").
		Where(sq.Eq{
			"user_id": reviewerID,
			"status":  model.ReviewerStatusPending,
		}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build count query: %w", err)
	}

	err = s.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&stats.PendingRequests)
	if err != nil {
		return nil, fmt.Errorf("failed to query pending requests: %w", err)
	}

	return &stats, nil
}

// GetRecentAssignments retrieves recent assignments for reviewer dashboard
func (s *Storage) GetRecentAssignments(ctx context.Context, reviewerID int64, limit int) ([]*dto.AssignmentWithPaper, error) {
	if limit == 0 {
		limit = 5
	}

	query, args, err := s.qb.
		Select(
			"pa.id as assignment_id",
			"pa.submission_id as paper_id",
			"cs.title as paper_title",
			"cs.conference_id",
			"c.title as conference_name",
			"pa.status",
			"pa.assigned_at",
			"COALESCE(EXTRACT(DAY FROM (pa.assigned_at + INTERVAL '14 days') - NOW()), 0) as days_left",
		).
		From("paper_assignments pa").
		Join("conference_submissions cs ON pa.submission_id = cs.submission_id").
		Join("conferences c ON cs.conference_id = c.conference_id").
		Where(sq.And{
			sq.Eq{"pa.reviewer_id": reviewerID},
			sq.NotEq{"pa.status": "completed"},
		}).
		OrderBy("pa.assigned_at DESC").
		Limit(uint64(limit)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query assignments: %w", err)
	}
	defer rows.Close()

	var results []*dto.AssignmentWithPaper
	for rows.Next() {
		var assignment dto.AssignmentWithPaper
		var daysLeft sql.NullFloat64
		var assignedAt, conferenceName sql.NullString
		err := rows.Scan(
			&assignment.AssignmentID,
			&assignment.PaperID,
			&assignment.PaperTitle,
			&assignment.ConferenceID,
			&conferenceName,
			&assignment.Status,
			&assignedAt,
			&daysLeft,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan assignment: %w", err)
		}

		// Handle nullable fields
		if conferenceName.Valid {
			assignment.ConferenceName = conferenceName.String
		}
		if daysLeft.Valid {
			assignment.DaysLeft = int(daysLeft.Float64)
		}
		if assignedAt.Valid {
			assignment.DueDate = assignedAt.String
		}

		results = append(results, &assignment)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating assignments: %w", err)
	}

	return results, nil
}

// GetAssignedPapers retrieves papers assigned to reviewer in a specific conference
func (s *Storage) GetAssignedPapers(ctx context.Context, reviewerID, conferenceID int64) ([]*dto.AssignedPaperResponse, error) {
	query, args, err := s.qb.
		Select(
			"cs.submission_id",
			"cs.conference_id",
			"cs.author",
			"cs.title",
			"cs.abstract",
			"cs.link",
			"cs.domain",
			"cs.status",
			"cs.information",
			"cs.file_path",
			"cs.file_original_name",
			"cs.file_size",
			"cs.file_mime_type",
			"cs.created_at",
			"cs.updated_at",
			"pa.id as assignment_id",
			"pa.status as assignment_status",
			"pa.assigned_at",
		).
		From("conference_submissions cs").
		Join("paper_assignments pa ON cs.submission_id = pa.submission_id").
		Where(sq.And{
			sq.Eq{"pa.reviewer_id": reviewerID},
			sq.Eq{"cs.conference_id": conferenceID},
		}).
		OrderBy("pa.assigned_at DESC").
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query papers: %w", err)
	}
	defer rows.Close()

	var results []*dto.AssignedPaperResponse
	for rows.Next() {
		var paper dto.AssignedPaperResponse
		var submission dto.Submission
		var assignedAt sql.NullString
		var information sql.NullString
		var filePath, fileOriginalName, fileMimeType sql.NullString
		var fileSize sql.NullInt64

		err := rows.Scan(
			&submission.ID,
			&submission.ConferenceID,
			&submission.Author,
			&submission.Title,
			&submission.Abstract,
			&submission.Link,
			pq.Array(&submission.Domain),
			&submission.Status,
			&information,
			&filePath,
			&fileOriginalName,
			&fileSize,
			&fileMimeType,
			&submission.CreatedAt,
			&submission.UpdatedAt,
			&paper.AssignmentID,
			&paper.AssignmentStatus,
			&assignedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan paper: %w", err)
		}

		// Parse information JSON if exists
		if information.Valid && information.String != "" {
			var info dto.SubmissionInformation
			if err := json.Unmarshal([]byte(information.String), &info); err == nil {
				submission.Information = &info
			}
		}

		// Build file metadata if all required fields exist
		if filePath.Valid && fileOriginalName.Valid && fileSize.Valid && fileMimeType.Valid {
			submission.File = &dto.SubmissionFileMetadata{
				Filename:     filepath.Base(filePath.String),
				OriginalName: fileOriginalName.String,
				Size:         fileSize.Int64,
				MimeType:     fileMimeType.String,
				Path:         filePath.String,
			}
		}

		paper.Submission = &submission
		if assignedAt.Valid {
			paper.AssignedAt = assignedAt.String
			// Calculate due date (14 days from assigned)
			paper.DueDate = assignedAt.String
		}

		results = append(results, &paper)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating papers: %w", err)
	}

	return results, nil
}
