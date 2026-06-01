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
	Status        string // Filter by status: "active", "upcoming", "archived"
	MyConferences bool
	Role          string
	UserEmail     string // User email - single source of truth
	MyBookmark    bool   // Filter by bookmarked conferences
	PublicOnly    bool   // Only return publicly visible statuses (open, reviewing, completed)
}

type StorageInterface interface {
	Create(ctx context.Context, conf *dto.Conference) (*dto.ConferenceResponse, error)
	GetByID(ctx context.Context, id int64) (*dto.ConferenceResponse, error)
	GetByIDForUser(ctx context.Context, id int64, userEmail string) (*dto.ConferenceResponse, error)
	GetByAcronym(ctx context.Context, acronym string) (*dto.ConferenceResponse, error)
	List(ctx context.Context, params *QueryParams) ([]*dto.ConferenceResponse, int64, error)
	Update(ctx context.Context, id int64, conf *dto.Conference) (*dto.ConferenceResponse, error)
	Delete(ctx context.Context, id int64) error
	TransitionStatus(ctx context.Context, id int64, newStatus string, configurations *dto.ConferenceConfiguration) (*dto.ConferenceResponse, error)
	AddBookmark(ctx context.Context, userEmail string, conferenceID int64) error
	RemoveBookmark(ctx context.Context, userEmail string, conferenceID int64) error
	IsBookmarked(ctx context.Context, userEmail string, conferenceID int64) (bool, error)
	GetStats(ctx context.Context, conferenceID int64) (*dto.ConferenceStatsResponse, error)
	GetRebuttalSettings(ctx context.Context, conferenceID int64) (*dto.ConferenceRebuttalConfig, error)
	SaveRebuttalSettings(ctx context.Context, conferenceID int64, req *dto.SaveRebuttalConfigRequest) (*dto.ConferenceRebuttalConfig, error)
	OpenRebuttal(ctx context.Context, conferenceID int64) error
	FinalizeRebuttal(ctx context.Context, conferenceID int64) error
	OpenDiscussion(ctx context.Context, conferenceID int64) error
	GetRebuttalOverview(ctx context.Context, conferenceID int64) (*dto.RebuttalOverviewResponse, error)
	GetOverdueRebuttalConferences(ctx context.Context) ([]int64, error)
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

func recoverCanonicalAdminRole(conf *model.Conference, userEmail string) {
	if userEmail == "" || conf == nil {
		return
	}
	if conf.Chair == userEmail {
		conf.UserRole = model.RoleChair
		return
	}
	for _, coChair := range conf.CoChairs {
		if coChair == userEmail {
			conf.UserRole = model.RoleCoChair
			return
		}
	}
}

func (s *Storage) Create(ctx context.Context, conf *dto.Conference) (*dto.ConferenceResponse, error) {
	now := time.Now()

	configBytes, err := model.SerializeConferenceConfiguration(conf.Configurations)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize configuration: %w", err)
	}

	// Default status to draft or open depending on input; if not provided, use open.
	status := conf.Status
	if status == "" {
		status = model.ConferenceStatusOpen
	}

	query, args, err := s.qb.
		Insert(model.ConferenceTableName).
		Columns(
			model.ColTitle,
			model.ColAcronym,
			model.ColDescription,
			model.ColChair,
			model.ColCoChairs,
			model.ConferenceColDomain,
			model.ColTracks,
			model.ColVenue,
			model.ColConfigurations,
			model.ColConferenceStatus,
			model.ConferenceColCreatedAt,
			model.ConferenceColUpdatedAt,
		).
		Values(
			conf.Title,
			conf.Acronym,
			conf.Description,
			conf.Chair,
			pq.Array(conf.CoChairs),
			pq.Array(conf.Domain),
			pq.Array(conf.Tracks),
			conf.Venue,
			configBytes,
			status,
			now,
			now,
		).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.ColConferenceID,
			model.ColTitle,
			model.ColAcronym,
			model.ColDescription,
			model.ColChair,
			model.ColCoChairs,
			model.ConferenceColDomain,
			model.ColTracks,
			model.ColVenue,
			model.ColConfigurations,
			model.ColConferenceStatus,
			model.ConferenceColCreatedAt,
			model.ConferenceColUpdatedAt,
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
		&entity.CoChairs,
		&entity.Domain,
		&entity.Tracks,
		&entity.Venue,
		&entity.Configurations,
		&entity.Status,
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
			model.ColCoChairs,
			model.ConferenceColDomain,
			model.ColTracks,
			model.ColVenue,
			model.ColConfigurations,
			model.ColConferenceStatus,
			model.ConferenceColCreatedAt,
			model.ConferenceColUpdatedAt,
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
		&entity.CoChairs,
		&entity.Domain,
		&entity.Tracks,
		&entity.Venue,
		&entity.Configurations,
		&entity.Status,
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

// GetByIDForUser fetches a single conference by ID and also populates UserRole
// for the given user email via a LEFT JOIN on conference_user_roles.
func (s *Storage) GetByIDForUser(ctx context.Context, id int64, userEmail string) (*dto.ConferenceResponse, error) {
	selectCols := []string{
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColConferenceID),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColTitle),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColAcronym),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColDescription),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColChair),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColCoChairs),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ConferenceColDomain),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColTracks),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColVenue),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColConfigurations),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColConferenceStatus),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ConferenceColCreatedAt),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ConferenceColUpdatedAt),
	}

	q := s.qb.Select(selectCols...).
		From(model.ConferenceTableName).
		Where(sq.Eq{fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColConferenceID): id})

	if userEmail != "" {
		selectCols = append(selectCols, fmt.Sprintf("%s.%s as user_role", model.ConferenceUserRoleTableName, model.ColRole))
		q = s.qb.Select(selectCols...).
			From(model.ConferenceTableName).
			LeftJoin(
				fmt.Sprintf("%s ON %s.%s = %s.%s AND %s.%s = ? AND %s.%s = ?",
					model.ConferenceUserRoleTableName,
					model.ConferenceTableName, model.ColConferenceID,
					model.ConferenceUserRoleTableName, model.ColConferenceID,
					model.ConferenceUserRoleTableName, model.ColUserEmail,
					model.ConferenceUserRoleTableName, model.ColStatus,
				),
				userEmail,
				model.RoleStatusActive,
			).
			Where(sq.Eq{fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColConferenceID): id})
	}

	query, args, err := q.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build select query: %w", err)
	}

	entity := &model.Conference{}
	scanArgs := []interface{}{
		&entity.ConferenceID,
		&entity.Title,
		&entity.Acronym,
		&entity.Description,
		&entity.Chair,
		&entity.CoChairs,
		&entity.Domain,
		&entity.Tracks,
		&entity.Venue,
		&entity.Configurations,
		&entity.Status,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	}

	if userEmail != "" {
		var userRole sql.NullString
		scanArgs = append(scanArgs, &userRole)
		err = s.db.QueryRowContext(ctx, query, args...).Scan(scanArgs...)
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("conference not found")
		}
		if err != nil {
			return nil, fmt.Errorf("failed to get conference: %w", err)
		}
		if userRole.Valid {
			entity.UserRole = userRole.String
		}
		recoverCanonicalAdminRole(entity, userEmail)
	} else {
		err = s.db.QueryRowContext(ctx, query, args...).Scan(scanArgs...)
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("conference not found")
		}
		if err != nil {
			return nil, fmt.Errorf("failed to get conference: %w", err)
		}
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
			model.ColCoChairs,
			model.ConferenceColDomain,
			model.ColTracks,
			model.ColVenue,
			model.ColConfigurations,
			model.ColConferenceStatus,
			model.ConferenceColCreatedAt,
			model.ConferenceColUpdatedAt,
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
		&entity.CoChairs,
		&entity.Domain,
		&entity.Tracks,
		&entity.Venue,
		&entity.Configurations,
		&entity.Status,
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
	// Build base query with LEFT JOIN to get user role if userEmail is provided
	selectCols := []string{
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColConferenceID),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColTitle),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColAcronym),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColDescription),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColChair),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColCoChairs),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ConferenceColDomain),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColTracks),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColVenue),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColConfigurations),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColConferenceStatus),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ConferenceColCreatedAt),
		fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ConferenceColUpdatedAt),
	}

	// Add user role if userEmail is provided
	if params.UserEmail != "" {
		selectCols = append(selectCols, fmt.Sprintf("%s.%s as user_role", model.ConferenceUserRoleTableName, model.ColRole))
	}

	baseQuery := s.qb.Select(selectCols...).
		From(model.ConferenceTableName)

	// LEFT JOIN with conference_user_roles to get user's role
	if params.UserEmail != "" {
		baseQuery = baseQuery.LeftJoin(
			fmt.Sprintf("%s ON %s.%s = %s.%s AND %s.%s = ? AND %s.%s = ?",
				model.ConferenceUserRoleTableName,
				model.ConferenceTableName, model.ColConferenceID,
				model.ConferenceUserRoleTableName, model.ColConferenceID,
				model.ConferenceUserRoleTableName, model.ColUserEmail,
				model.ConferenceUserRoleTableName, model.ColStatus,
			),
			params.UserEmail,
			model.RoleStatusActive,
		)
	}

	countQuery := s.qb.Select("COUNT(*)").From(model.ConferenceTableName)

	if params.Title != "" {
		titleCol := fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColTitle)
		baseQuery = baseQuery.Where(sq.Like{titleCol: fmt.Sprintf("%%%s%%", params.Title)})
		countQuery = countQuery.Where(sq.Like{model.ColTitle: fmt.Sprintf("%%%s%%", params.Title)})
	}
	if params.Acronym != "" {
		acronymCol := fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColAcronym)
		baseQuery = baseQuery.Where(sq.Like{acronymCol: fmt.Sprintf("%%%s%%", params.Acronym)})
		countQuery = countQuery.Where(sq.Like{model.ColAcronym: fmt.Sprintf("%%%s%%", params.Acronym)})
	}
	if params.Chair != "" {
		chairCol := fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColChair)
		baseQuery = baseQuery.Where(sq.Like{chairCol: fmt.Sprintf("%%%s%%", params.Chair)})
		countQuery = countQuery.Where(sq.Like{model.ColChair: fmt.Sprintf("%%%s%%", params.Chair)})
	}
	if params.Status != "" {
		statusCol := fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColConferenceStatus)
		baseQuery = baseQuery.Where(sq.Eq{statusCol: params.Status})
		countQuery = countQuery.Where(sq.Eq{model.ColConferenceStatus: params.Status})
	}

	// PublicOnly: restrict to publicly visible statuses (open, reviewing, completed)
	if params.PublicOnly {
		statusCol := fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColConferenceStatus)
		publicStatuses := []string{model.ConferenceStatusOpen, model.ConferenceStatusReviewing, model.ConferenceStatusCompleted}
		baseQuery = baseQuery.Where(sq.Eq{statusCol: publicStatuses})
		countQuery = countQuery.Where(sq.Eq{model.ColConferenceStatus: publicStatuses})
	}

	// Apply bookmark filtering - only filter when myBookmark is true
	if params.MyBookmark && params.UserEmail != "" {
		bookmarkCond := sq.Expr(
			fmt.Sprintf("EXISTS (SELECT 1 FROM %s WHERE %s = %s.%s AND %s = ?)",
				model.BookmarkTableName,
				model.ColBookmarkConfID,
				model.ConferenceTableName,
				model.ColConferenceID,
				model.ColBookmarkUserEmail,
			),
			params.UserEmail,
		)
		baseQuery = baseQuery.Where(bookmarkCond)
		countQuery = countQuery.Where(bookmarkCond)
	}

	// Apply role-based filtering - only filter when myConferences is true
	if params.MyConferences {
		if params.Role == "" {
			roleCond := sq.Expr(
				fmt.Sprintf("(EXISTS (SELECT 1 FROM %s WHERE %s = %s.%s AND %s = ? AND %s IN (?, ?, ?, ?, ?) AND %s = ?) OR %s.%s = ? OR ? = ANY(%s.%s))",
					model.ConferenceUserRoleTableName,
					model.ColConferenceID,
					model.ConferenceTableName,
					model.ColConferenceID,
					model.ColUserEmail,
					model.ColRole,
					model.ColStatus,
					model.ConferenceTableName,
					model.ColChair,
					model.ConferenceTableName,
					model.ColCoChairs,
				),
				params.UserEmail,
				model.RoleChair,
				model.RoleCoChair,
				model.RoleAuthor,
				model.RoleReviewer,
				model.RolePC,
				model.RoleStatusActive,
				params.UserEmail,
				params.UserEmail,
			)
			baseQuery = baseQuery.Where(roleCond)
			countQuery = countQuery.Where(roleCond)
		} else {
			roleCond := sq.Sqlizer(sq.Expr(
				fmt.Sprintf("EXISTS (SELECT 1 FROM %s WHERE %s = %s.%s AND %s = ? AND %s = ? AND %s = ?)",
					model.ConferenceUserRoleTableName,
					model.ColConferenceID,
					model.ConferenceTableName,
					model.ColConferenceID,
					model.ColUserEmail,
					model.ColRole,
					model.ColStatus,
				),
				params.UserEmail,
				params.Role,
				model.RoleStatusActive,
			))
			if params.Role == model.RoleChair {
				roleCond = sq.Or{
					roleCond,
					sq.Expr(fmt.Sprintf("%s.%s = ?", model.ConferenceTableName, model.ColChair), params.UserEmail),
				}
			} else if params.Role == model.RoleCoChair {
				roleCond = sq.Or{
					roleCond,
					sq.Expr(fmt.Sprintf("? = ANY(%s.%s)", model.ConferenceTableName, model.ColCoChairs), params.UserEmail),
				}
			}
			baseQuery = baseQuery.Where(roleCond)
			countQuery = countQuery.Where(roleCond)

			if params.Role == model.RoleAuthor || params.Role == model.RoleReviewer {
				adminCond := sq.Expr(
					fmt.Sprintf("NOT EXISTS (SELECT 1 FROM %s WHERE %s = %s.%s AND %s = ? AND %s IN (?, ?, ?) AND %s = ?)",
						model.ConferenceUserRoleTableName,
						model.ColConferenceID,
						model.ConferenceTableName,
						model.ColConferenceID,
						model.ColUserEmail,
						model.ColRole,
						model.ColStatus,
					),
					params.UserEmail,
					model.RoleChair,
					model.RoleCoChair,
					model.RolePC,
					model.RoleStatusActive,
				)
				baseQuery = baseQuery.Where(adminCond)
				countQuery = countQuery.Where(adminCond)
			}
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

	orderBy := fmt.Sprintf("%s.%s DESC", model.ConferenceTableName, model.ConferenceColCreatedAt)
	query, args, err := baseQuery.OrderBy(orderBy).ToSql()
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

		scanArgs := []interface{}{
			&entity.ConferenceID,
			&entity.Title,
			&entity.Acronym,
			&entity.Description,
			&entity.Chair,
			&entity.CoChairs,
			&entity.Domain,
			&entity.Tracks,
			&entity.Venue,
			&entity.Configurations,
			&entity.Status,
			&entity.CreatedAt,
			&entity.UpdatedAt,
		}

		// Add user_role to scan if userEmail was provided
		if params.UserEmail != "" {
			var userRole sql.NullString
			scanArgs = append(scanArgs, &userRole)
			err := rows.Scan(scanArgs...)
			if err != nil {
				return nil, 0, fmt.Errorf("failed to scan conference: %w", err)
			}
			// Populate view field
			if userRole.Valid {
				entity.UserRole = userRole.String
			}
			recoverCanonicalAdminRole(entity, params.UserEmail)
		} else {
			err := rows.Scan(scanArgs...)
			if err != nil {
				return nil, 0, fmt.Errorf("failed to scan conference: %w", err)
			}
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
		model.ColTitle:               conf.Title,
		model.ColAcronym:             conf.Acronym,
		model.ColDescription:         conf.Description,
		model.ColChair:               conf.Chair,
		model.ColCoChairs:            pq.Array(conf.CoChairs),
		model.ConferenceColDomain:    pq.Array(conf.Domain),
		model.ColTracks:              pq.Array(conf.Tracks),
		model.ColVenue:               conf.Venue,
		model.ColConfigurations:      configBytes,
		model.ConferenceColUpdatedAt: time.Now(),
	}

	query, args, err := s.qb.
		Update(model.ConferenceTableName).
		SetMap(updateMap).
		Where(sq.Eq{model.ColConferenceID: id}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.ColConferenceID,
			model.ColTitle,
			model.ColAcronym,
			model.ColDescription,
			model.ColChair,
			model.ColCoChairs,
			model.ConferenceColDomain,
			model.ColTracks,
			model.ColVenue,
			model.ColConfigurations,
			model.ColConferenceStatus,
			model.ConferenceColCreatedAt,
			model.ConferenceColUpdatedAt,
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
		&entity.CoChairs,
		&entity.Domain,
		&entity.Tracks,
		&entity.Venue,
		&entity.Configurations,
		&entity.Status,
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

func (s *Storage) AddBookmark(ctx context.Context, userEmail string, conferenceID int64) error {
	query, args, err := s.qb.
		Insert(model.BookmarkTableName).
		Columns(model.ColBookmarkUserEmail, model.ColBookmarkConfID, model.ColBookmarkCreatedAt).
		Values(userEmail, conferenceID, time.Now()).
		Suffix(fmt.Sprintf("ON CONFLICT (%s, %s) DO NOTHING", model.ColBookmarkUserEmail, model.ColBookmarkConfID)).
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

func (s *Storage) RemoveBookmark(ctx context.Context, userEmail string, conferenceID int64) error {
	query, args, err := s.qb.
		Delete(model.BookmarkTableName).
		Where(sq.Eq{model.ColBookmarkUserEmail: userEmail, model.ColBookmarkConfID: conferenceID}).
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

func (s *Storage) IsBookmarked(ctx context.Context, userEmail string, conferenceID int64) (bool, error) {
	query, args, err := s.qb.
		Select("COUNT(*)").
		From(model.BookmarkTableName).
		Where(sq.Eq{model.ColBookmarkUserEmail: userEmail, model.ColBookmarkConfID: conferenceID}).
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

// TransitionStatus updates conference status and optionally persists configuration changes.
func (s *Storage) TransitionStatus(
	ctx context.Context,
	id int64,
	newStatus string,
	configurations *dto.ConferenceConfiguration,
) (*dto.ConferenceResponse, error) {
	update := s.qb.
		Update(model.ConferenceTableName).
		Set(model.ColConferenceStatus, newStatus).
		Set(model.ConferenceColUpdatedAt, time.Now())

	if configurations != nil {
		configBytes, err := model.SerializeConferenceConfiguration(configurations)
		if err != nil {
			return nil, fmt.Errorf("failed to serialize configuration: %w", err)
		}
		update = update.Set(model.ColConfigurations, configBytes)
	}

	query, args, err := update.
		Where(sq.Eq{model.ColConferenceID: id}).
		Suffix(fmt.Sprintf("RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.ColConferenceID,
			model.ColTitle,
			model.ColAcronym,
			model.ColDescription,
			model.ColChair,
			model.ColCoChairs,
			model.ConferenceColDomain,
			model.ColTracks,
			model.ColVenue,
			model.ColConfigurations,
			model.ColConferenceStatus,
			model.ConferenceColCreatedAt,
			model.ConferenceColUpdatedAt,
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
		&entity.CoChairs,
		&entity.Domain,
		&entity.Tracks,
		&entity.Venue,
		&entity.Configurations,
		&entity.Status,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("conference not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to transition status: %w", err)
	}

	return entity.ToDTO(), nil
}

// GetStats returns aggregated statistics for a conference.
func (s *Storage) GetStats(ctx context.Context, conferenceID int64) (*dto.ConferenceStatsResponse, error) {
	// submission counts by status
	subRows, err := s.db.QueryContext(ctx, `
		SELECT status, COUNT(*) AS cnt
		FROM conference_submissions
		WHERE conference_id = $1
		GROUP BY status
	`, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("query submission stats: %w", err)
	}
	defer subRows.Close()

	var subStats dto.ConferenceSubmissionStats
	for subRows.Next() {
		var status string
		var cnt int
		if err := subRows.Scan(&status, &cnt); err != nil {
			return nil, err
		}
		subStats.Total += cnt
		switch status {
		case "draft":
			subStats.Draft = cnt
		case "submitted", "reviewing":
			subStats.Submitted += cnt
		case "accepted":
			subStats.Accepted = cnt
		case "rejected":
			subStats.Rejected = cnt
		}
	}

	// review/assignment progress
	var reviewStats dto.ConferenceReviewStats
	err = s.db.QueryRowContext(ctx, `
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE status = 'completed') AS completed
		FROM paper_assignments
		WHERE conference_id = $1
	`, conferenceID).Scan(&reviewStats.TotalAssigned, &reviewStats.Completed)
	if err != nil {
		return nil, fmt.Errorf("query review stats: %w", err)
	}
	reviewStats.Pending = reviewStats.TotalAssigned - reviewStats.Completed

	// per-track breakdown
	trackRows, err := s.db.QueryContext(ctx, `
		SELECT
			COALESCE(track, 'Untracked') AS track,
			COUNT(*) AS submission_count,
			COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_count
		FROM conference_submissions
		WHERE conference_id = $1
		GROUP BY track
		ORDER BY track
	`, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("query track stats: %w", err)
	}
	defer trackRows.Close()

	var tracks []dto.ConferenceTrackStats
	for trackRows.Next() {
		var t dto.ConferenceTrackStats
		if err := trackRows.Scan(&t.Name, &t.SubmissionCount, &t.AcceptedCount); err != nil {
			return nil, err
		}
		tracks = append(tracks, t)
	}
	if tracks == nil {
		tracks = []dto.ConferenceTrackStats{}
	}

	return &dto.ConferenceStatsResponse{
		Submissions: subStats,
		Reviews:     reviewStats,
		Tracks:      tracks,
	}, nil
}
