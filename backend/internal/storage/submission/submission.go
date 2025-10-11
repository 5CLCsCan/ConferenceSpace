package submission

import (
	"context"
	"database/sql"
	"fmt"
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

	query, args, err := s.qb.
		Insert(submissionModel.TableName).
		Columns(
			submissionModel.ColConferenceID,
			submissionModel.ColAuthor,
			submissionModel.ColTitle,
			submissionModel.ColAbstract,
			submissionModel.ColLink,
			submissionModel.ColDomain,
			submissionModel.ColStatus,
			submissionModel.ColInformation,
			submissionModel.ColCreatedAt,
			submissionModel.ColUpdatedAt,
		).
		Values(
			sub.ConferenceID,
			sub.Author,
			sub.Title,
			sub.Abstract,
			sub.Link,
			pq.Array(sub.Domain),
			sub.Status,
			infoBytes,
			now,
			now,
		).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			submissionModel.ColSubmissionID,
			submissionModel.ColConferenceID,
			submissionModel.ColAuthor,
			submissionModel.ColTitle,
			submissionModel.ColAbstract,
			submissionModel.ColLink,
			submissionModel.ColDomain,
			submissionModel.ColStatus,
			submissionModel.ColInformation,
			submissionModel.ColCreatedAt,
			submissionModel.ColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build insert query: %w", err)
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
		&entity.CreatedAt,
		&entity.UpdatedAt,
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
	infoBytes, err := submissionModel.SerializeInformation(sub.Information)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize information: %w", err)
	}

	updateMap := map[string]interface{}{
		submissionModel.ColConferenceID: sub.ConferenceID,
		submissionModel.ColAuthor:       sub.Author,
		submissionModel.ColTitle:        sub.Title,
		submissionModel.ColAbstract:     sub.Abstract,
		submissionModel.ColLink:         sub.Link,
		submissionModel.ColDomain:       pq.Array(sub.Domain),
		submissionModel.ColStatus:       sub.Status,
		submissionModel.ColInformation:  infoBytes,
		submissionModel.ColUpdatedAt:    time.Now(),
	}

	query, args, err := s.qb.
		Update(submissionModel.TableName).
		SetMap(updateMap).
		Where(sq.Eq{submissionModel.ColSubmissionID: id}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			submissionModel.ColSubmissionID,
			submissionModel.ColConferenceID,
			submissionModel.ColAuthor,
			submissionModel.ColTitle,
			submissionModel.ColAbstract,
			submissionModel.ColLink,
			submissionModel.ColDomain,
			submissionModel.ColStatus,
			submissionModel.ColInformation,
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
