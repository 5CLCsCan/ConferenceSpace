package submission

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/lib/pq"
)

type QueryParams struct {
	Limit        int
	Offset       int
	ConferenceID int64
	Author       string
	Status       string
	Title        string
}

type StorageInterface interface {
	Create(ctx context.Context, sub *dto.Submission) (*dto.Submission, error)
	GetByID(ctx context.Context, id int64) (*dto.Submission, error)
	List(ctx context.Context, params *QueryParams) ([]*dto.Submission, int64, error)
	Update(ctx context.Context, id int64, sub *dto.Submission) (*dto.Submission, error)
	Delete(ctx context.Context, id int64) error
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
	insertQuery := `INSERT INTO conference_submissions (conference_id, author, title, abstract, link, domain, status, information, created_at, updated_at`
	valuesQuery := `) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10`
	returningQuery := `) RETURNING submission_id, author, domain, status, link, information, created_at, updated_at, conference_id, title, abstract, file_path, file_original_name, file_size, file_mime_type, file_uploaded_at`

	queryArgs := []interface{}{sub.ConferenceID, sub.Author, sub.Title, sub.Abstract, sub.Link, domainArray, sub.Status, infoBytes, now, now}

	// Add file fields if present
	if sub.File != nil {
		insertQuery += `, file_path, file_original_name, file_size, file_mime_type, file_uploaded_at`
		valuesQuery += `, $11, $12, $13, $14, $15`
		queryArgs = append(queryArgs, sub.File.Path, sub.File.OriginalName, sub.File.Size, sub.File.MimeType, now)
	}

	fullQuery := insertQuery + valuesQuery + returningQuery

	entity := &model.Submission{}
	err = s.db.QueryRowContext(ctx, fullQuery, queryArgs...).Scan(
		&entity.SubmissionID, &entity.Author, &entity.Domain, &entity.Status,
		&entity.Link, &entity.Information, &entity.CreatedAt, &entity.UpdatedAt,
		&entity.ConferenceID, &entity.Title, &entity.Abstract,
		&entity.FilePath, &entity.FileOriginalName, &entity.FileSize, &entity.FileMimeType, &entity.FileUploadedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create submission: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) GetByID(ctx context.Context, id int64) (*dto.Submission, error) {
	query, args, err := s.qb.
		Select(
			model.SubmissionColSubmissionID,
			model.SubmissionColConferenceID,
			model.SubmissionColAuthor,
			model.SubmissionColTitle,
			model.SubmissionColAbstract,
			model.SubmissionColLink,
			model.SubmissionColDomain,
			model.SubmissionColStatus,
			model.SubmissionColInformation,
			model.SubmissionColFilePath,
			model.SubmissionColFileOriginalName,
			model.SubmissionColFileSize,
			model.SubmissionColFileMimeType,
			model.SubmissionColFileUploadedAt,
			model.SubmissionColCreatedAt,
			model.SubmissionColUpdatedAt,
		).
		From(model.SubmissionTableName).
		Where(sq.Eq{model.SubmissionColSubmissionID: id}).
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
		&entity.Status,
		&entity.Information,
		&entity.FilePath,
		&entity.FileOriginalName,
		&entity.FileSize,
		&entity.FileMimeType,
		&entity.FileUploadedAt,
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
		model.SubmissionColSubmissionID,
		model.SubmissionColConferenceID,
		model.SubmissionColAuthor,
		model.SubmissionColTitle,
		model.SubmissionColAbstract,
		model.SubmissionColLink,
		model.SubmissionColDomain,
		model.SubmissionColStatus,
		model.SubmissionColInformation,
		model.SubmissionColFilePath,
		model.SubmissionColFileOriginalName,
		model.SubmissionColFileSize,
		model.SubmissionColFileMimeType,
		model.SubmissionColFileUploadedAt,
		model.SubmissionColCreatedAt,
		model.SubmissionColUpdatedAt,
	).From(model.SubmissionTableName)

	countQuery := s.qb.Select("COUNT(*)").From(model.SubmissionTableName)

	if params.ConferenceID > 0 {
		baseQuery = baseQuery.Where(sq.Eq{model.SubmissionColConferenceID: params.ConferenceID})
		countQuery = countQuery.Where(sq.Eq{model.SubmissionColConferenceID: params.ConferenceID})
	}
	if params.Author != "" {
		baseQuery = baseQuery.Where(sq.Like{model.SubmissionColAuthor: "%" + params.Author + "%"})
		countQuery = countQuery.Where(sq.Like{model.SubmissionColAuthor: "%" + params.Author + "%"})
	}
	if params.Status != "" {
		baseQuery = baseQuery.Where(sq.Eq{model.SubmissionColStatus: params.Status})
		countQuery = countQuery.Where(sq.Eq{model.SubmissionColStatus: params.Status})
	}
	if params.Title != "" {
		baseQuery = baseQuery.Where(sq.Like{model.SubmissionColTitle: "%" + params.Title + "%"})
		countQuery = countQuery.Where(sq.Like{model.SubmissionColTitle: "%" + params.Title + "%"})
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

	query, args, err := baseQuery.OrderBy(model.SubmissionColCreatedAt + " DESC").ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build select query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list submissions: %w", err)
	}
	defer rows.Close()

	var entities []*model.Submission
	for rows.Next() {
		entity := &model.Submission{}
		err := rows.Scan(
			&entity.SubmissionID,
			&entity.ConferenceID,
			&entity.Author,
			&entity.Title,
			&entity.Abstract,
			&entity.Link,
			&entity.Domain,
			&entity.Status,
			&entity.Information,
			&entity.FilePath,
			&entity.FileOriginalName,
			&entity.FileSize,
			&entity.FileMimeType,
			&entity.FileUploadedAt,
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
		updateMap[model.SubmissionColConferenceID] = sub.ConferenceID
	}

	if sub.Author != "" {
		updateMap[model.SubmissionColAuthor] = sub.Author
	}

	if sub.Title != "" {
		updateMap[model.SubmissionColTitle] = sub.Title
	}

	if sub.Abstract != "" {
		updateMap[model.SubmissionColAbstract] = sub.Abstract
	}

	if sub.Link != "" {
		updateMap[model.SubmissionColLink] = sub.Link
	}

	if sub.Domain != nil {
		updateMap[model.SubmissionColDomain] = pq.Array(sub.Domain)
	}

	if sub.Status != "" {
		updateMap[model.SubmissionColStatus] = sub.Status
	}

	if sub.Information != nil {
		infoBytes, err := model.SerializeSubmissionInformation(sub.Information)
		if err != nil {
			return nil, fmt.Errorf("failed to serialize information: %w", err)
		}
		updateMap[model.SubmissionColInformation] = infoBytes
	}

	// Add file metadata if provided
	if sub.File != nil {
		updateMap[model.SubmissionColFilePath] = sub.File.Path
		updateMap[model.SubmissionColFileOriginalName] = sub.File.OriginalName
		updateMap[model.SubmissionColFileSize] = sub.File.Size
		updateMap[model.SubmissionColFileMimeType] = sub.File.MimeType
		updateMap[model.SubmissionColFileUploadedAt] = time.Now()
	}

	updateMap[model.SubmissionColUpdatedAt] = time.Now()

	query, args, err := s.qb.
		Update(model.SubmissionTableName).
		SetMap(updateMap).
		Where(sq.Eq{model.SubmissionColSubmissionID: id}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.SubmissionColSubmissionID,
			model.SubmissionColConferenceID,
			model.SubmissionColAuthor,
			model.SubmissionColTitle,
			model.SubmissionColAbstract,
			model.SubmissionColLink,
			model.SubmissionColDomain,
			model.SubmissionColStatus,
			model.SubmissionColInformation,
			model.SubmissionColFilePath,
			model.SubmissionColFileOriginalName,
			model.SubmissionColFileSize,
			model.SubmissionColFileMimeType,
			model.SubmissionColFileUploadedAt,
			model.SubmissionColCreatedAt,
			model.SubmissionColUpdatedAt,
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
		&entity.Status,
		&entity.Information,
		&entity.FilePath,
		&entity.FileOriginalName,
		&entity.FileSize,
		&entity.FileMimeType,
		&entity.FileUploadedAt,
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
		Where(sq.Eq{model.SubmissionColSubmissionID: id}).
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
