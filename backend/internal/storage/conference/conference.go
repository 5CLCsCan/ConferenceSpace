package conference

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/lib/pq"
)

type QueryParams struct {
	Limit         int
	Offset        int
	Title         string
	Acronym       string
	Chair         string
	MyConferences bool
	Role          string
	UserID        int64  // User ID for role-based filtering
	UserEmail     string // User email for role-based filtering
	MyBookmark    bool   // Filter by bookmarked conferences
}

type StorageInterface interface {
	Create(ctx context.Context, conf *dto.Conference) (*dto.ConferenceResponse, error)
	GetByID(ctx context.Context, id int64) (*dto.ConferenceResponse, error)
	GetByAcronym(ctx context.Context, acronym string) (*dto.ConferenceResponse, error)
	List(ctx context.Context, params *QueryParams) ([]*dto.ConferenceResponse, int64, error)
	Update(ctx context.Context, id int64, conf *dto.Conference) (*dto.ConferenceResponse, error)
	Delete(ctx context.Context, id int64) error
	AddBookmark(ctx context.Context, userID int64, conferenceID int64) error
	RemoveBookmark(ctx context.Context, userID int64, conferenceID int64) error
	IsBookmarked(ctx context.Context, userID int64, conferenceID int64) (bool, error)
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

func (s *Storage) Create(ctx context.Context, conf *dto.Conference) (*dto.ConferenceResponse, error) {
	now := time.Now()

	configBytes, err := model.SerializeConferenceConfiguration(conf.Configurations)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize configuration: %w", err)
	}

	query, args, err := s.qb.
		Insert(model.ConferenceTableName).
		Columns(
			model.ColTitle,
			model.ColAcronym,
			model.ColDescription,
			model.ColChair,
			model.ColPrimaryContact,
			model.ColAreaChair,
			model.ColDomain,
			model.ColConfigurations,
			model.ColCreatedAt,
			model.ColUpdatedAt,
		).
		Values(
			conf.Title,
			conf.Acronym,
			conf.Description,
			conf.Chair,
			conf.PrimaryContact,
			conf.AreaChair,
			pq.Array(conf.Domain),
			configBytes,
			now,
			now,
		).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.ColConferenceID,
			model.ColTitle,
			model.ColAcronym,
			model.ColDescription,
			model.ColChair,
			model.ColPrimaryContact,
			model.ColAreaChair,
			model.ColDomain,
			model.ColConfigurations,
			model.ColCreatedAt,
			model.ColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build insert query: %w", err)
	}

	entity := &model.Conference{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.ConferenceID,
		&entity.Title,
		&entity.Acronym,
		&entity.Description,
		&entity.Chair,
		&entity.PrimaryContact,
		&entity.AreaChair,
		&entity.Domain,
		&entity.Configurations,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create conference: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) GetByID(ctx context.Context, id int64) (*dto.ConferenceResponse, error) {
	query, args, err := s.qb.
		Select(
			model.ColConferenceID,
			model.ColTitle,
			model.ColAcronym,
			model.ColDescription,
			model.ColChair,
			model.ColPrimaryContact,
			model.ColAreaChair,
			model.ColDomain,
			model.ColConfigurations,
			model.ColCreatedAt,
			model.ColUpdatedAt,
		).
		From(model.ConferenceTableName).
		Where(sq.Eq{model.ColConferenceID: id}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &model.Conference{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.ConferenceID,
		&entity.Title,
		&entity.Acronym,
		&entity.Description,
		&entity.Chair,
		&entity.PrimaryContact,
		&entity.AreaChair,
		&entity.Domain,
		&entity.Configurations,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("conference not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get conference: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) GetByAcronym(ctx context.Context, acronym string) (*dto.ConferenceResponse, error) {
	query, args, err := s.qb.
		Select(
			model.ColConferenceID,
			model.ColTitle,
			model.ColAcronym,
			model.ColDescription,
			model.ColChair,
			model.ColPrimaryContact,
			model.ColAreaChair,
			model.ColDomain,
			model.ColConfigurations,
			model.ColCreatedAt,
			model.ColUpdatedAt,
		).
		From(model.ConferenceTableName).
		Where(sq.Eq{model.ColAcronym: acronym}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &model.Conference{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.ConferenceID,
		&entity.Title,
		&entity.Acronym,
		&entity.Description,
		&entity.Chair,
		&entity.PrimaryContact,
		&entity.AreaChair,
		&entity.Domain,
		&entity.Configurations,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("conference not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get conference: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) List(ctx context.Context, params *QueryParams) ([]*dto.ConferenceResponse, int64, error) {
	baseQuery := s.qb.Select(
		model.ColConferenceID,
		model.ColTitle,
		model.ColAcronym,
		model.ColDescription,
		model.ColChair,
		model.ColPrimaryContact,
		model.ColAreaChair,
		model.ColDomain,
		model.ColConfigurations,
		model.ColCreatedAt,
		model.ColUpdatedAt,
	).From(model.ConferenceTableName)

	countQuery := s.qb.Select("COUNT(*)").From(model.ConferenceTableName)

	if params.Title != "" {
		baseQuery = baseQuery.Where(sq.Like{model.ColTitle: "%" + params.Title + "%"})
		countQuery = countQuery.Where(sq.Like{model.ColTitle: "%" + params.Title + "%"})
	}
	if params.Acronym != "" {
		baseQuery = baseQuery.Where(sq.Like{model.ColAcronym: "%" + params.Acronym + "%"})
		countQuery = countQuery.Where(sq.Like{model.ColAcronym: "%" + params.Acronym + "%"})
	}
	if params.Chair != "" {
		baseQuery = baseQuery.Where(sq.Like{model.ColChair: "%" + params.Chair + "%"})
		countQuery = countQuery.Where(sq.Like{model.ColChair: "%" + params.Chair + "%"})
	}

	// Apply bookmark filtering - only filter when myBookmark is true
	if params.MyBookmark && params.UserID > 0 {
		bookmarkCond := sq.Expr(
			fmt.Sprintf("EXISTS (SELECT 1 FROM %s WHERE %s = %s.%s AND %s = ?)",
				model.BookmarkTableName,
				model.ColBookmarkConfID,
				model.ConferenceTableName,
				model.ColConferenceID,
				model.ColBookmarkUserID,
			),
			params.UserID,
		)
		baseQuery = baseQuery.Where(bookmarkCond)
		countQuery = countQuery.Where(bookmarkCond)
	}

	// Apply role-based filtering - only filter when myConferences is true
	if params.MyConferences {
		var conditions []sq.Sqlizer

		// If role is specified, only check that specific role
		// If role is empty, check ALL roles (chair, author, reviewer)

		// Check chair role
		if params.Role == "" || params.Role == "chair" {
			chairCond := sq.Or{
				sq.Eq{model.ColChair: params.UserEmail},
				sq.Eq{model.ColPrimaryContact: params.UserID},
				sq.Eq{model.ColAreaChair: params.UserID},
			}
			conditions = append(conditions, chairCond)
		}

		// Check author role (has submissions)
		if params.Role == "" || params.Role == "author" {
			authorCond := sq.Expr(
				fmt.Sprintf("EXISTS (SELECT 1 FROM %s s WHERE s.%s = %s.%s AND s.%s = ?)",
					model.SubmissionTableName,
					model.ColConferenceID,
					model.ConferenceTableName,
					model.ColConferenceID,
					model.ColAuthor,
				),
				params.UserEmail,
			)
			conditions = append(conditions, authorCond)
		}

		// Check reviewer role (in conference_reviewers table)
		if params.Role == "" || params.Role == "reviewer" {
			reviewerCond := sq.Expr(
				fmt.Sprintf("EXISTS (SELECT 1 FROM %s cr WHERE cr.%s = %s.%s AND cr.%s = ?)",
					model.ReviewerTableName,
					model.ColConferenceID,
					model.ConferenceTableName,
					model.ColConferenceID,
					model.ColUserID,
				),
				params.UserID,
			)
			conditions = append(conditions, reviewerCond)
		}

		// Combine all conditions with OR
		if len(conditions) > 0 {
			roleFilter := sq.Or(conditions)
			baseQuery = baseQuery.Where(roleFilter)
			countQuery = countQuery.Where(roleFilter)
		}
	}

	countQueryStr, countArgs, err := countQuery.ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build count query: %w", err)
	}

	var total int64
	err = s.db.QueryRowContext(ctx, countQueryStr, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count conferences: %w", err)
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
		return nil, 0, fmt.Errorf("failed to list conferences: %w", err)
	}
	defer rows.Close()

	var entities []*model.Conference
	for rows.Next() {
		entity := &model.Conference{}
		err := rows.Scan(
			&entity.ConferenceID,
			&entity.Title,
			&entity.Acronym,
			&entity.Description,
			&entity.Chair,
			&entity.PrimaryContact,
			&entity.AreaChair,
			&entity.Domain,
			&entity.Configurations,
			&entity.CreatedAt,
			&entity.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan conference: %w", err)
		}
		entities = append(entities, entity)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating conferences: %w", err)
	}

	dtos := make([]*dto.ConferenceResponse, len(entities))
	for i, entity := range entities {
		dtos[i] = entity.ToDTO()
	}
	return dtos, total, nil
}

func (s *Storage) Update(ctx context.Context, id int64, conf *dto.Conference) (*dto.ConferenceResponse, error) {
	configBytes, err := model.SerializeConferenceConfiguration(conf.Configurations)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize configuration: %w", err)
	}

	updateMap := map[string]interface{}{
		model.ColTitle:          conf.Title,
		model.ColAcronym:        conf.Acronym,
		model.ColDescription:    conf.Description,
		model.ColChair:          conf.Chair,
		model.ColPrimaryContact: conf.PrimaryContact,
		model.ColAreaChair:      conf.AreaChair,
		model.ColDomain:         pq.Array(conf.Domain),
		model.ColConfigurations: configBytes,
		model.ColUpdatedAt:      time.Now(),
	}

	query, args, err := s.qb.
		Update(model.ConferenceTableName).
		SetMap(updateMap).
		Where(sq.Eq{model.ColConferenceID: id}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.ColConferenceID,
			model.ColTitle,
			model.ColAcronym,
			model.ColDescription,
			model.ColChair,
			model.ColPrimaryContact,
			model.ColAreaChair,
			model.ColDomain,
			model.ColConfigurations,
			model.ColCreatedAt,
			model.ColUpdatedAt,
		)).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build update query: %w", err)
	}

	entity := &model.Conference{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.ConferenceID,
		&entity.Title,
		&entity.Acronym,
		&entity.Description,
		&entity.Chair,
		&entity.PrimaryContact,
		&entity.AreaChair,
		&entity.Domain,
		&entity.Configurations,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("conference not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update conference: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) Delete(ctx context.Context, id int64) error {
	query, args, err := s.qb.
		Delete(model.ConferenceTableName).
		Where(sq.Eq{model.ColConferenceID: id}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete conference: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("conference not found")
	}

	return nil
}

func (s *Storage) AddBookmark(ctx context.Context, userID int64, conferenceID int64) error {
	query, args, err := s.qb.
		Insert(model.BookmarkTableName).
		Columns(model.ColBookmarkUserID, model.ColBookmarkConfID, model.ColBookmarkCreatedAt).
		Values(userID, conferenceID, time.Now()).
		Suffix(fmt.Sprintf("ON CONFLICT (%s, %s) DO NOTHING", model.ColBookmarkUserID, model.ColBookmarkConfID)).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build insert query: %w", err)
	}

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to add bookmark: %w", err)
	}

	return nil
}

func (s *Storage) RemoveBookmark(ctx context.Context, userID int64, conferenceID int64) error {
	query, args, err := s.qb.
		Delete(model.BookmarkTableName).
		Where(sq.Eq{model.ColBookmarkUserID: userID, model.ColBookmarkConfID: conferenceID}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to remove bookmark: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("bookmark not found")
	}

	return nil
}

func (s *Storage) IsBookmarked(ctx context.Context, userID int64, conferenceID int64) (bool, error) {
	query, args, err := s.qb.
		Select("COUNT(*)").
		From(model.BookmarkTableName).
		Where(sq.Eq{model.ColBookmarkUserID: userID, model.ColBookmarkConfID: conferenceID}).
		ToSql()

	if err != nil {
		return false, fmt.Errorf("failed to build query: %w", err)
	}

	var count int
	err = s.db.QueryRowContext(ctx, query, args...).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check bookmark: %w", err)
	}

	return count > 0, nil
}
