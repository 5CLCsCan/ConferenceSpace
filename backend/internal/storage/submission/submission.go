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
			model.ColSubmissionID,
			model.ColConferenceID,
			model.ColAuthor,
			model.ColTitle,
			model.ColAbstract,
			model.ColLink,
			model.ColDomain,
			model.ColStatus,
			model.ColInformation,
			model.ColFilePath,
			model.ColFileOriginalName,
			model.ColFileSize,
			model.ColFileMimeType,
			model.ColFileUploadedAt,
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
	fmt.Printf("[STORAGE LIST] Starting with params: ConferenceID=%d, Author='%s', Status='%s', Title='%s'\n",
		params.ConferenceID, params.Author, params.Status, params.Title)

	baseQuery := s.qb.Select(
		model.ColSubmissionID,
		model.ColConferenceID,
		model.ColAuthor,
		model.ColTitle,
		model.ColAbstract,
		model.ColLink,
		model.ColDomain,
		model.ColStatus,
		model.ColInformation,
		model.ColFilePath,
		model.ColFileOriginalName,
		model.ColFileSize,
		model.ColFileMimeType,
		model.ColFileUploadedAt,
		model.ColCreatedAt,
		model.ColUpdatedAt,
	).From(model.SubmissionTableName)

	countQuery := s.qb.Select("COUNT(*)").From(model.SubmissionTableName)

	if params.ConferenceID > 0 {
		fmt.Printf("[STORAGE LIST] Adding ConferenceID filter: %d\n", params.ConferenceID)
		baseQuery = baseQuery.Where(sq.Eq{model.ColConferenceID: params.ConferenceID})
		countQuery = countQuery.Where(sq.Eq{model.ColConferenceID: params.ConferenceID})
	}
	if params.Author != "" {
		// Use exact match for email addresses (case-insensitive comparison)
		fmt.Printf("[STORAGE LIST] Adding Author filter (case-insensitive): '%s'\n", params.Author)
		baseQuery = baseQuery.Where("LOWER("+model.ColAuthor+") = LOWER(?)", params.Author)
		countQuery = countQuery.Where("LOWER("+model.ColAuthor+") = LOWER(?)", params.Author)
	}
	if params.Status != "" {
		fmt.Printf("[STORAGE LIST] Adding Status filter: '%s'\n", params.Status)
		baseQuery = baseQuery.Where(sq.Eq{model.ColStatus: params.Status})
		countQuery = countQuery.Where(sq.Eq{model.ColStatus: params.Status})
	}
	if params.Title != "" {
		fmt.Printf("[STORAGE LIST] Adding Title filter: '%s'\n", params.Title)
		baseQuery = baseQuery.Where(sq.Like{model.ColTitle: "%" + params.Title + "%"})
		countQuery = countQuery.Where(sq.Like{model.ColTitle: "%" + params.Title + "%"})
	}

	countQueryStr, countArgs, err := countQuery.ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build count query: %w", err)
	}
	fmt.Printf("[STORAGE LIST] Count query: %s\n", countQueryStr)
	fmt.Printf("[STORAGE LIST] Count query args: %v\n", countArgs)

	var total int64
	err = s.db.QueryRowContext(ctx, countQueryStr, countArgs...).Scan(&total)
	if err != nil {
		fmt.Printf("[STORAGE LIST] Count query error: %v\n", err)
		return nil, 0, fmt.Errorf("failed to count submissions: %w", err)
	}
	fmt.Printf("[STORAGE LIST] Total count result: %d\n", total)

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
	fmt.Printf("[STORAGE LIST] Select query: %s\n", query)
	fmt.Printf("[STORAGE LIST] Select query args: %v\n", args)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		fmt.Printf("[STORAGE LIST] Query execution error: %v\n", err)
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
		fmt.Printf("[STORAGE LIST] Scanned row %d: ID=%d, Author='%s', Title='%s', Status='%s', ConferenceID=%d\n",
			rowCount, entity.SubmissionID, entity.Author, entity.Title, entity.Status, entity.ConferenceID)
	}

	if err := rows.Err(); err != nil {
		fmt.Printf("[STORAGE LIST] Rows iteration error: %v\n", err)
		return nil, 0, fmt.Errorf("error iterating submissions: %w", err)
	}

	fmt.Printf("[STORAGE LIST] Total rows scanned: %d\n", len(entities))

	dtos := make([]*dto.Submission, len(entities))
	for i, entity := range entities {
		dtos[i] = entity.ToDTO()
	}
	fmt.Printf("[STORAGE LIST] Returning %d submissions, total=%d\n", len(dtos), total)
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

	updateMap[model.ColUpdatedAt] = time.Now()

	query, args, err := s.qb.
		Update(model.SubmissionTableName).
		SetMap(updateMap).
		Where(sq.Eq{model.ColSubmissionID: id}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.ColSubmissionID,
			model.ColConferenceID,
			model.ColAuthor,
			model.ColTitle,
			model.ColAbstract,
			model.ColLink,
			model.ColDomain,
			model.ColStatus,
			model.ColInformation,
			model.ColFilePath,
			model.ColFileOriginalName,
			model.ColFileSize,
			model.ColFileMimeType,
			model.ColFileUploadedAt,
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
