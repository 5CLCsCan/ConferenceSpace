package external_invitation

import (
	"context"
	"database/sql"
	"fmt"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/lib/pq"
)

type StorageInterface interface {
	BatchCreate(ctx context.Context, conferenceID, invitedBy int64, items []dto.ExternalInvitationCreateItem) (*dto.ExternalInvitationBatchCreateResponse, error)
	List(ctx context.Context, conferenceID int64, params *ListParams) ([]dto.ExternalInvitation, int64, error)
	Delete(ctx context.Context, id, conferenceID int64) error
}

type ListParams struct {
	Limit  int
	Offset int
	Role   string
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

func (s *Storage) BatchCreate(ctx context.Context, conferenceID, invitedBy int64, items []dto.ExternalInvitationCreateItem) (*dto.ExternalInvitationBatchCreateResponse, error) {
	// Each item is inserted independently — we deliberately do NOT use a
	// transaction here. The batch API returns a per-item success/failed
	// breakdown (e.g. a duplicate scholar_id lands in Failed), so wrapping
	// all inserts in a single transaction would be wrong: Postgres aborts
	// the whole transaction on any constraint violation, making subsequent
	// inserts fail with "current transaction is aborted" and Commit() fail
	// with "could not complete operation in a failed transaction".
	resp := &dto.ExternalInvitationBatchCreateResponse{
		Success: make([]dto.ExternalInvitation, 0, len(items)),
		Failed:  make([]dto.ExternalInvitationFailure, 0),
	}

	for _, item := range items {
		cols := []string{
			model.ExternalInvColConferenceID,
			model.ExternalInvColRole,
			model.ExternalInvColName,
			model.ExternalInvColStatus,
			model.ExternalInvColInvitedBy,
			model.ExternalInvColCreatedAt,
			model.ExternalInvColUpdatedAt,
		}
		vals := []interface{}{
			conferenceID,
			item.Role,
			item.Name,
			"pending",
			invitedBy,
			sq.Expr("NOW()"),
			sq.Expr("NOW()"),
		}

		if item.ScholarID != "" {
			cols = append(cols, model.ExternalInvColScholarID)
			vals = append(vals, item.ScholarID)
		}
		if item.Email != "" {
			cols = append(cols, model.ExternalInvColEmail)
			vals = append(vals, item.Email)
		}
		if item.Affiliation != "" {
			cols = append(cols, model.ExternalInvColAffiliation)
			vals = append(vals, item.Affiliation)
		}
		if item.ProfileURL != "" {
			cols = append(cols, model.ExternalInvColProfileURL)
			vals = append(vals, item.ProfileURL)
		}

		query, args, err := s.qb.
			Insert(model.ExternalInvitationTableName).
			Columns(cols...).
			Values(vals...).
			Suffix("RETURNING id, conference_id, role, scholar_id, name, email, affiliation, profile_url, status, invited_by, created_at, updated_at").
			ToSql()
		if err != nil {
			resp.Failed = append(resp.Failed, dto.ExternalInvitationFailure{
				ScholarID: item.ScholarID,
				Error:     fmt.Sprintf("failed to build query: %v", err),
			})
			continue
		}

		var row model.ExternalInvitation
		err = s.db.QueryRowContext(ctx, query, args...).Scan(
			&row.ID, &row.ConferenceID, &row.Role, &row.ScholarID,
			&row.Name, &row.Email, &row.Affiliation, &row.ProfileURL,
			&row.Status, &row.InvitedBy, &row.CreatedAt, &row.UpdatedAt,
		)
		if err != nil {
			errMsg := err.Error()
			if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
				errMsg = "already invited"
			}
			resp.Failed = append(resp.Failed, dto.ExternalInvitationFailure{
				ScholarID: item.ScholarID,
				Error:     errMsg,
			})
			continue
		}

		resp.Success = append(resp.Success, *row.ToDTO())
	}

	return resp, nil
}

func (s *Storage) List(ctx context.Context, conferenceID int64, params *ListParams) ([]dto.ExternalInvitation, int64, error) {
	baseWhere := sq.Eq{model.ExternalInvColConferenceID: conferenceID}

	countBuilder := s.qb.Select("COUNT(*)").From(model.ExternalInvitationTableName).Where(baseWhere)
	selectBuilder := s.qb.Select(
		model.ExternalInvColID,
		model.ExternalInvColConferenceID,
		model.ExternalInvColRole,
		model.ExternalInvColScholarID,
		model.ExternalInvColName,
		model.ExternalInvColEmail,
		model.ExternalInvColAffiliation,
		model.ExternalInvColProfileURL,
		model.ExternalInvColStatus,
		model.ExternalInvColInvitedBy,
		model.ExternalInvColCreatedAt,
		model.ExternalInvColUpdatedAt,
	).From(model.ExternalInvitationTableName).Where(baseWhere)

	if params.Role != "" {
		roleFilter := sq.Eq{model.ExternalInvColRole: params.Role}
		countBuilder = countBuilder.Where(roleFilter)
		selectBuilder = selectBuilder.Where(roleFilter)
	}

	countSQL, countArgs, err := countBuilder.ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build count query: %w", err)
	}
	var total int64
	if err := s.db.QueryRowContext(ctx, countSQL, countArgs...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count external invitations: %w", err)
	}

	limit := params.Limit
	if limit <= 0 {
		limit = 20
	}
	selectBuilder = selectBuilder.Limit(uint64(limit)).OrderBy("created_at DESC")
	if params.Offset > 0 {
		selectBuilder = selectBuilder.Offset(uint64(params.Offset))
	}

	query, args, err := selectBuilder.ToSql()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to build select query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list external invitations: %w", err)
	}
	defer func() {
		_ = rows.Close()
	}()

	var results []dto.ExternalInvitation
	for rows.Next() {
		var row model.ExternalInvitation
		if err := rows.Scan(
			&row.ID, &row.ConferenceID, &row.Role, &row.ScholarID,
			&row.Name, &row.Email, &row.Affiliation, &row.ProfileURL,
			&row.Status, &row.InvitedBy, &row.CreatedAt, &row.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan external invitation: %w", err)
		}
		results = append(results, *row.ToDTO())
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating external invitations: %w", err)
	}

	if results == nil {
		results = []dto.ExternalInvitation{}
	}

	return results, total, nil
}

func (s *Storage) Delete(ctx context.Context, id, conferenceID int64) error {
	query, args, err := s.qb.
		Delete(model.ExternalInvitationTableName).
		Where(sq.Eq{model.ExternalInvColID: id, model.ExternalInvColConferenceID: conferenceID}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete external invitation: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("external invitation not found")
	}

	return nil
}
