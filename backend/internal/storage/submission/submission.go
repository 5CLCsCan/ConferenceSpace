package submission

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
	submissionDto "github.com/dcao/conferencespace/internal/dto/submission"
	submissionModel "github.com/dcao/conferencespace/internal/model/submission"
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
	Create(ctx context.Context, sub *submissionDto.Submission) (*submissionDto.Response, error)
	GetByID(ctx context.Context, id int64) (*submissionDto.Response, error)
	List(ctx context.Context, params *QueryParams) ([]*submissionDto.Response, int64, error)
	Update(ctx context.Context, id int64, sub *submissionDto.Submission) (*submissionDto.Response, error)
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

func (s *Storage) Create(ctx context.Context, sub *submissionDto.Submission) (*submissionDto.Response, error) {
	now := time.Now()

	infoBytes, err := submissionModel.SerializeInformation(sub.Information)
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

	entity := &submissionModel.Submission{}
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

func (s *Storage) GetByID(ctx context.Context, id int64) (*submissionDto.Response, error) {
	query, args, err := s.qb.
		Select(
			submissionModel.ColSubmissionID,
			submissionModel.ColConferenceID,
			submissionModel.ColAuthor,
			submissionModel.ColTitle,
			submissionModel.ColAbstract,
			submissionModel.ColLink,
			submissionModel.ColDomain,
			submissionModel.ColStatus,
			submissionModel.ColInformation,
			submissionModel.ColFilePath,
			submissionModel.ColFileOriginalName,
			submissionModel.ColFileSize,
			submissionModel.ColFileMimeType,
			submissionModel.ColFileUploadedAt,
			submissionModel.ColCreatedAt,
			submissionModel.ColUpdatedAt,
		).
		From(submissionModel.TableName).
		Where(sq.Eq{submissionModel.ColSubmissionID: id}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &submissionModel.Submission{}
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

func (s *Storage) List(ctx context.Context, params *QueryParams) ([]*submissionDto.Response, int64, error) {
	baseQuery := s.qb.Select(
		submissionModel.ColSubmissionID,
		submissionModel.ColConferenceID,
		submissionModel.ColAuthor,
		submissionModel.ColTitle,
		submissionModel.ColAbstract,
		submissionModel.ColLink,
		submissionModel.ColDomain,
		submissionModel.ColStatus,
		submissionModel.ColInformation,
		submissionModel.ColFilePath,
		submissionModel.ColFileOriginalName,
		submissionModel.ColFileSize,
		submissionModel.ColFileMimeType,
		submissionModel.ColFileUploadedAt,
		submissionModel.ColCreatedAt,
		submissionModel.ColUpdatedAt,
	).From(submissionModel.TableName)

	countQuery := s.qb.Select("COUNT(*)").From(submissionModel.TableName)

	if params.ConferenceID > 0 {
		baseQuery = baseQuery.Where(sq.Eq{submissionModel.ColConferenceID: params.ConferenceID})
		countQuery = countQuery.Where(sq.Eq{submissionModel.ColConferenceID: params.ConferenceID})
	}
	if params.Author != "" {
		baseQuery = baseQuery.Where(sq.Like{submissionModel.ColAuthor: "%" + params.Author + "%"})
		countQuery = countQuery.Where(sq.Like{submissionModel.ColAuthor: "%" + params.Author + "%"})
	}
	if params.Status != "" {
		baseQuery = baseQuery.Where(sq.Eq{submissionModel.ColStatus: params.Status})
		countQuery = countQuery.Where(sq.Eq{submissionModel.ColStatus: params.Status})
	}
	if params.Title != "" {
		baseQuery = baseQuery.Where(sq.Like{submissionModel.ColTitle: "%" + params.Title + "%"})
		countQuery = countQuery.Where(sq.Like{submissionModel.ColTitle: "%" + params.Title + "%"})
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

	query, args, err := baseQuery.OrderBy(submissionModel.ColCreatedAt + " DESC").ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build select query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list submissions: %w", err)
	}
	defer rows.Close()

	var entities []*submissionModel.Submission
	for rows.Next() {
		entity := &submissionModel.Submission{}
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

	dtos := make([]*submissionDto.Response, len(entities))
	for i, entity := range entities {
		dtos[i] = entity.ToDTO()
	}
	return dtos, total, nil
}

func (s *Storage) Update(ctx context.Context, id int64, sub *submissionDto.Submission) (*submissionDto.Response, error) {
	updateMap := map[string]interface{}{}

	if sub.ConferenceID != 0 {
		updateMap[submissionModel.ColConferenceID] = sub.ConferenceID
	}

	if sub.Author != "" {
		updateMap[submissionModel.ColAuthor] = sub.Author
	}

	if sub.Title != "" {
		updateMap[submissionModel.ColTitle] = sub.Title
	}

	if sub.Abstract != "" {
		updateMap[submissionModel.ColAbstract] = sub.Abstract
	}

	if sub.Link != "" {
		updateMap[submissionModel.ColLink] = sub.Link
	}

	if sub.Domain != nil {
		updateMap[submissionModel.ColDomain] = pq.Array(sub.Domain)
	}

	if sub.Status != "" {
		updateMap[submissionModel.ColStatus] = sub.Status
	}

	if sub.Information != nil {
		infoBytes, err := submissionModel.SerializeInformation(sub.Information)
		if err != nil {
			return nil, fmt.Errorf("failed to serialize information: %w", err)
		}
		updateMap[submissionModel.ColInformation] = infoBytes
	}

	// Add file metadata if provided
	if sub.File != nil {
		updateMap[submissionModel.ColFilePath] = sub.File.Path
		updateMap[submissionModel.ColFileOriginalName] = sub.File.OriginalName
		updateMap[submissionModel.ColFileSize] = sub.File.Size
		updateMap[submissionModel.ColFileMimeType] = sub.File.MimeType
		updateMap[submissionModel.ColFileUploadedAt] = time.Now()
	}

	updateMap[submissionModel.ColUpdatedAt] = time.Now()

	query, args, err := s.qb.
		Update(submissionModel.TableName).
		SetMap(updateMap).
		Where(sq.Eq{submissionModel.ColSubmissionID: id}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			submissionModel.ColSubmissionID,
			submissionModel.ColConferenceID,
			submissionModel.ColAuthor,
			submissionModel.ColTitle,
			submissionModel.ColAbstract,
			submissionModel.ColLink,
			submissionModel.ColDomain,
			submissionModel.ColStatus,
			submissionModel.ColInformation,
			submissionModel.ColFilePath,
			submissionModel.ColFileOriginalName,
			submissionModel.ColFileSize,
			submissionModel.ColFileMimeType,
			submissionModel.ColFileUploadedAt,
			submissionModel.ColCreatedAt,
			submissionModel.ColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build update query: %w", err)
	}

	entity := &submissionModel.Submission{}
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
		Delete(submissionModel.TableName).
		Where(sq.Eq{submissionModel.ColSubmissionID: id}).
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
