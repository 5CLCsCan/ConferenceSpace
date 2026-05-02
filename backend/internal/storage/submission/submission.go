package submission

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

var ErrAuthorAlreadySubmitted = errors.New("author already has a submission for this conference")

func isAuthorAlreadySubmittedError(err error) bool {
	pqErr, ok := err.(*pq.Error)
	return ok &&
		string(pqErr.Code) == "23505" &&
		pqErr.Constraint == "idx_unique_author_per_conference"
}

type QueryParams struct {
	Limit        int
	Offset       int
	ConferenceID int64
	Author       string
	Status       string
	Title        string
	Track        string
}

type StorageInterface interface {
	Create(ctx context.Context, sub *dto.Submission) (*dto.Submission, error)
	GetByID(ctx context.Context, id int64) (*dto.Submission, error)
	List(ctx context.Context, params *QueryParams) ([]*dto.Submission, int64, error)
	Update(ctx context.Context, id int64, sub *dto.Submission) (*dto.Submission, error)
	Delete(ctx context.Context, id int64) error
	BulkUpdateStatus(ctx context.Context, submissionIDs []int64, status string) error
	GetReviewersBySubmissionID(ctx context.Context, submissionID int64) ([]dto.Reviewer, error)
	SubmitRebuttal(ctx context.Context, submissionID int64, generalResponse string) error
	UpdateCameraReady(ctx context.Context, id int64, meta *dto.SubmissionFileMetadata) (*dto.Submission, error)
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

func (s *Storage) Create(ctx context.Context, sub *dto.Submission) (*dto.Submission, error) {
	now := time.Now()

	infoBytes, err := model.SerializeSubmissionInformation(sub.Information)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize information: %w", err)
	}

	// Use manual INSERT approach for reliability
	domainArray := "{" + strings.Join(sub.Domain, ",") + "}"

	// Build the INSERT query
	insertQuery := `INSERT INTO conference_submissions (conference_id, author, title, abstract, link, domain, track, status, information, created_at, updated_at`
	valuesQuery := `) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11`
	returningQuery := `) RETURNING submission_id, author, domain, track, status, link, information, created_at, updated_at, conference_id, title, abstract, file_path, file_original_name, file_size, file_mime_type, file_uploaded_at, cover_letter_path, cover_letter_original_name, cover_letter_size, cover_letter_mime_type, cover_letter_uploaded_at`

	// Use NULL for track if empty
	var trackValue interface{}
	if sub.Track != "" {
		trackValue = sub.Track
	} else {
		trackValue = nil
	}

	queryArgs := []interface{}{sub.ConferenceID, sub.Author, sub.Title, sub.Abstract, sub.Link, domainArray, trackValue, sub.Status, infoBytes, now, now}

	// Add file fields if present
	if sub.File != nil {
		insertQuery += `, file_path, file_original_name, file_size, file_mime_type, file_uploaded_at`
		valuesQuery += `, $12, $13, $14, $15, $16`
		queryArgs = append(queryArgs, sub.File.Path, sub.File.OriginalName, sub.File.Size, sub.File.MimeType, now)
	}

	// Add cover letter fields if present
	if sub.CoverLetter != nil {
		paramCount := len(queryArgs) + 1
		insertQuery += `, cover_letter_path, cover_letter_original_name, cover_letter_size, cover_letter_mime_type, cover_letter_uploaded_at`
		valuesQuery += fmt.Sprintf(`, $%d, $%d, $%d, $%d, $%d`, paramCount, paramCount+1, paramCount+2, paramCount+3, paramCount+4)
		queryArgs = append(queryArgs, sub.CoverLetter.Path, sub.CoverLetter.OriginalName, sub.CoverLetter.Size, sub.CoverLetter.MimeType, now)
	}

	fullQuery := insertQuery + valuesQuery + returningQuery

	entity := &model.Submission{}
	err = s.db.QueryRowContext(ctx, fullQuery, queryArgs...).Scan(
		&entity.SubmissionID, &entity.Author, &entity.Domain, &entity.Track, &entity.Status,
		&entity.Link, &entity.Information, &entity.CreatedAt, &entity.UpdatedAt,
		&entity.ConferenceID, &entity.Title, &entity.Abstract,
		&entity.FilePath, &entity.FileOriginalName, &entity.FileSize, &entity.FileMimeType, &entity.FileUploadedAt,
		&entity.CoverLetterPath, &entity.CoverLetterOriginalName, &entity.CoverLetterSize, &entity.CoverLetterMimeType, &entity.CoverLetterUploadedAt,
	)

	if err != nil {
		if isAuthorAlreadySubmittedError(err) {
			return nil, ErrAuthorAlreadySubmitted
		}
		return nil, fmt.Errorf("failed to create submission: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) GetByID(ctx context.Context, id int64) (*dto.Submission, error) {
	query, args, err := s.qb.
		Select(
			model.ColSubmissionID,
			model.ColConferenceID,
			model.ColAuthor,
			model.ColTitle,
			model.ColAbstract,
			model.ColLink,
			model.ColDomain,
			model.ColTrack,
			model.ColStatus,
			model.ColInformation,
			model.ColFilePath,
			model.ColFileOriginalName,
			model.ColFileSize,
			model.ColFileMimeType,
			model.ColFileUploadedAt,
			model.ColCoverLetterPath,
			model.ColCoverLetterOriginalName,
			model.ColCoverLetterSize,
			model.ColCoverLetterMimeType,
			model.ColCoverLetterUploadedAt,
			"camera_ready_path",
			"camera_ready_original_name",
			"camera_ready_size",
			"camera_ready_mime_type",
			"camera_ready_uploaded_at",
			"rebuttal_phase",
			"rebuttal_general_response",
			model.ColCreatedAt,
			model.ColUpdatedAt,
		).
		From(model.SubmissionTableName).
		Where(sq.Eq{model.ColSubmissionID: id}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &model.Submission{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.SubmissionID,
		&entity.ConferenceID,
		&entity.Author,
		&entity.Title,
		&entity.Abstract,
		&entity.Link,
		&entity.Domain,
		&entity.Track,
		&entity.Status,
		&entity.Information,
		&entity.FilePath,
		&entity.FileOriginalName,
		&entity.FileSize,
		&entity.FileMimeType,
		&entity.FileUploadedAt,
		&entity.CoverLetterPath,
		&entity.CoverLetterOriginalName,
		&entity.CoverLetterSize,
		&entity.CoverLetterMimeType,
		&entity.CoverLetterUploadedAt,
		&entity.CameraReadyPath,
		&entity.CameraReadyOriginalName,
		&entity.CameraReadySize,
		&entity.CameraReadyMimeType,
		&entity.CameraReadyUploadedAt,
		&entity.RebuttalPhase,
		&entity.RebuttalGeneralResponse,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("submission not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get submission: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) List(ctx context.Context, params *QueryParams) ([]*dto.Submission, int64, error) {

	baseQuery := s.qb.Select(
		model.ColSubmissionID,
		model.ColConferenceID,
		model.ColAuthor,
		model.ColTitle,
		model.ColAbstract,
		model.ColLink,
		model.ColDomain,
		model.ColTrack,
		model.ColStatus,
		model.ColInformation,
		model.ColFilePath,
		model.ColFileOriginalName,
		model.ColFileSize,
		model.ColFileMimeType,
		model.ColFileUploadedAt,
		model.ColCoverLetterPath,
		model.ColCoverLetterOriginalName,
		model.ColCoverLetterSize,
		model.ColCoverLetterMimeType,
		model.ColCoverLetterUploadedAt,
		model.ColCreatedAt,
		model.ColUpdatedAt,
	).From(model.SubmissionTableName)

	countQuery := s.qb.Select("COUNT(*)").From(model.SubmissionTableName)

	if params.ConferenceID > 0 {
		baseQuery = baseQuery.Where(sq.Eq{model.ColConferenceID: params.ConferenceID})
		countQuery = countQuery.Where(sq.Eq{model.ColConferenceID: params.ConferenceID})
	}
	if params.Author != "" {
		baseQuery = baseQuery.Where("LOWER("+model.ColAuthor+") = LOWER(?)", params.Author)
		countQuery = countQuery.Where("LOWER("+model.ColAuthor+") = LOWER(?)", params.Author)
	}
	if params.Status != "" {
		baseQuery = baseQuery.Where(sq.Eq{model.ColStatus: params.Status})
		countQuery = countQuery.Where(sq.Eq{model.ColStatus: params.Status})
	}
	if params.Title != "" {
		baseQuery = baseQuery.Where(sq.Like{model.ColTitle: "%" + params.Title + "%"})
		countQuery = countQuery.Where(sq.Like{model.ColTitle: "%" + params.Title + "%"})
	}
	if params.Track != "" {
		baseQuery = baseQuery.Where(sq.Eq{model.ColTrack: params.Track})
		countQuery = countQuery.Where(sq.Eq{model.ColTrack: params.Track})
	}

	countQueryStr, countArgs, err := countQuery.ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build count query: %w", err)
	}

	var total int64
	err = s.db.QueryRowContext(ctx, countQueryStr, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count submissions: %w", err)
	}

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
		return nil, 0, fmt.Errorf("failed to list submissions: %w", err)
	}
	defer rows.Close()

	var entities []*model.Submission
	rowCount := 0
	for rows.Next() {
		rowCount++
		entity := &model.Submission{}
		err := rows.Scan(
			&entity.SubmissionID,
			&entity.ConferenceID,
			&entity.Author,
			&entity.Title,
			&entity.Abstract,
			&entity.Link,
			&entity.Domain,
			&entity.Track,
			&entity.Status,
			&entity.Information,
			&entity.FilePath,
			&entity.FileOriginalName,
			&entity.FileSize,
			&entity.FileMimeType,
			&entity.FileUploadedAt,
			&entity.CoverLetterPath,
			&entity.CoverLetterOriginalName,
			&entity.CoverLetterSize,
			&entity.CoverLetterMimeType,
			&entity.CoverLetterUploadedAt,
			&entity.CreatedAt,
			&entity.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan submission: %w", err)
		}
		entities = append(entities, entity)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating submissions: %w", err)
	}


	dtos := make([]*dto.Submission, len(entities))
	for i, entity := range entities {
		dtos[i] = entity.ToDTO()
	}
	return dtos, total, nil
}

func (s *Storage) Update(ctx context.Context, id int64, sub *dto.Submission) (*dto.Submission, error) {
	updateMap := map[string]interface{}{}

	if sub.ConferenceID != 0 {
		updateMap[model.ColConferenceID] = sub.ConferenceID
	}

	if sub.Author != "" {
		updateMap[model.ColAuthor] = sub.Author
	}

	if sub.Title != "" {
		updateMap[model.ColTitle] = sub.Title
	}

	if sub.Abstract != "" {
		updateMap[model.ColAbstract] = sub.Abstract
	}

	if sub.Link != "" {
		updateMap[model.ColLink] = sub.Link
	}

	if sub.Domain != nil {
		updateMap[model.ColDomain] = pq.Array(sub.Domain)
	}

	// Allow track to be set or cleared
	if sub.Track != "" {
		updateMap[model.ColTrack] = sub.Track
	}

	if sub.Status != "" {
		updateMap[model.ColStatus] = sub.Status
	}

	if sub.Information != nil {
		infoBytes, err := model.SerializeSubmissionInformation(sub.Information)
		if err != nil {
			return nil, fmt.Errorf("failed to serialize information: %w", err)
		}
		updateMap[model.ColInformation] = infoBytes
	}

	// Add file metadata if provided
	if sub.File != nil {
		updateMap[model.ColFilePath] = sub.File.Path
		updateMap[model.ColFileOriginalName] = sub.File.OriginalName
		updateMap[model.ColFileSize] = sub.File.Size
		updateMap[model.ColFileMimeType] = sub.File.MimeType
		updateMap[model.ColFileUploadedAt] = time.Now()
	}

	// Add cover letter metadata if provided
	if sub.CoverLetter != nil {
		updateMap[model.ColCoverLetterPath] = sub.CoverLetter.Path
		updateMap[model.ColCoverLetterOriginalName] = sub.CoverLetter.OriginalName
		updateMap[model.ColCoverLetterSize] = sub.CoverLetter.Size
		updateMap[model.ColCoverLetterMimeType] = sub.CoverLetter.MimeType
		updateMap[model.ColCoverLetterUploadedAt] = time.Now()
	}

	updateMap[model.ColUpdatedAt] = time.Now()

	query, args, err := s.qb.
		Update(model.SubmissionTableName).
		SetMap(updateMap).
		Where(sq.Eq{model.ColSubmissionID: id}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.ColSubmissionID,
			model.ColConferenceID,
			model.ColAuthor,
			model.ColTitle,
			model.ColAbstract,
			model.ColLink,
			model.ColDomain,
			model.ColTrack,
			model.ColStatus,
			model.ColInformation,
			model.ColFilePath,
			model.ColFileOriginalName,
			model.ColFileSize,
			model.ColFileMimeType,
			model.ColFileUploadedAt,
			model.ColCoverLetterPath,
			model.ColCoverLetterOriginalName,
			model.ColCoverLetterSize,
			model.ColCoverLetterMimeType,
			model.ColCoverLetterUploadedAt,
			model.ColCreatedAt,
			model.ColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build update query: %w", err)
	}

	entity := &model.Submission{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.SubmissionID,
		&entity.ConferenceID,
		&entity.Author,
		&entity.Title,
		&entity.Abstract,
		&entity.Link,
		&entity.Domain,
		&entity.Track,
		&entity.Status,
		&entity.Information,
		&entity.FilePath,
		&entity.FileOriginalName,
		&entity.FileSize,
		&entity.FileMimeType,
		&entity.FileUploadedAt,
		&entity.CoverLetterPath,
		&entity.CoverLetterOriginalName,
		&entity.CoverLetterSize,
		&entity.CoverLetterMimeType,
		&entity.CoverLetterUploadedAt,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("submission not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update submission: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) Delete(ctx context.Context, id int64) error {
	query, args, err := s.qb.
		Delete(model.SubmissionTableName).
		Where(sq.Eq{model.ColSubmissionID: id}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete submission: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("submission not found")
	}

	return nil
}

func (s *Storage) BulkUpdateStatus(ctx context.Context, submissionIDs []int64, status string) error {
	if len(submissionIDs) == 0 {
		return nil
	}

	query, args, err := s.qb.
		Update(model.SubmissionTableName).
		Set(model.ColStatus, status).
		Set(model.ColUpdatedAt, time.Now()).
		Where(sq.Eq{model.ColSubmissionID: submissionIDs}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build bulk update query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to bulk update submission status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("no submissions were updated")
	}

	return nil
}

// GetReviewersBySubmissionID retrieves all reviewers assigned to a submission
func (s *Storage) GetReviewersBySubmissionID(ctx context.Context, submissionID int64) ([]dto.Reviewer, error) {
	query, args, err := s.qb.
		Select(
			"cr.id",
			"cr.user_id",
			"cr.conference_id",
			"u.email",
			"cr.status",
			"cr.domain",
			"cr.created_at",
			"cr.updated_at",
		).
		From("paper_assignments pa").
		Join("conference_reviewers cr ON pa.reviewer_id = cr.id").
		Join("users u ON cr.user_id = u.user_id").
		Where(sq.Eq{"pa.submission_id": submissionID}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query reviewers: %w", err)
	}
	defer rows.Close()

	var reviewers []dto.Reviewer
	for rows.Next() {
		var reviewer dto.Reviewer
		err := rows.Scan(
			&reviewer.ID,
			&reviewer.UserID,
			&reviewer.ConferenceID,
			&reviewer.Email,
			&reviewer.Status,
			pq.Array(&reviewer.Domain),
			&reviewer.CreatedAt,
			&reviewer.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan reviewer: %w", err)
		}
		reviewers = append(reviewers, reviewer)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating reviewers: %w", err)
	}

	return reviewers, nil
}

// UpdateCameraReady stores camera-ready file metadata on a submission.
func (s *Storage) UpdateCameraReady(ctx context.Context, id int64, meta *dto.SubmissionFileMetadata) (*dto.Submission, error) {
	entity := &model.Submission{}
	err := s.db.QueryRowContext(ctx, `
		UPDATE conference_submissions
		SET camera_ready_path = $1,
		    camera_ready_original_name = $2,
		    camera_ready_size = $3,
		    camera_ready_mime_type = $4,
		    camera_ready_uploaded_at = NOW(),
		    updated_at = NOW()
		WHERE submission_id = $5
		RETURNING submission_id, conference_id, author, title, abstract, link, domain, track,
		          status, information, file_path, file_original_name, file_size, file_mime_type,
		          file_uploaded_at, cover_letter_path, cover_letter_original_name, cover_letter_size,
		          cover_letter_mime_type, cover_letter_uploaded_at,
		          camera_ready_path, camera_ready_original_name, camera_ready_size,
		          camera_ready_mime_type, camera_ready_uploaded_at,
		          rebuttal_phase, rebuttal_general_response,
		          created_at, updated_at
	`, meta.Path, meta.OriginalName, meta.Size, meta.MimeType, id).Scan(
		&entity.SubmissionID, &entity.ConferenceID, &entity.Author, &entity.Title,
		&entity.Abstract, &entity.Link, &entity.Domain, &entity.Track,
		&entity.Status, &entity.Information, &entity.FilePath, &entity.FileOriginalName,
		&entity.FileSize, &entity.FileMimeType, &entity.FileUploadedAt,
		&entity.CoverLetterPath, &entity.CoverLetterOriginalName, &entity.CoverLetterSize,
		&entity.CoverLetterMimeType, &entity.CoverLetterUploadedAt,
		&entity.CameraReadyPath, &entity.CameraReadyOriginalName, &entity.CameraReadySize,
		&entity.CameraReadyMimeType, &entity.CameraReadyUploadedAt,
		&entity.RebuttalPhase, &entity.RebuttalGeneralResponse,
		&entity.CreatedAt, &entity.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("update camera ready: %w", err)
	}
	return entity.ToDTO(), nil
}

// SubmitRebuttal sets the rebuttal phase to 'submitted' and stores the general response.
func (s *Storage) SubmitRebuttal(ctx context.Context, submissionID int64, generalResponse string) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE conference_submissions
		SET rebuttal_phase = 'submitted',
		    rebuttal_general_response = $1,
		    updated_at = NOW()
		WHERE submission_id = $2
	`, generalResponse, submissionID)
	return err
}
