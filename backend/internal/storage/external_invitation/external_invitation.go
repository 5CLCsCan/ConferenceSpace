package external_invitation

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/lib/pq"
)

type StorageInterface interface {
	BatchCreate(ctx context.Context, conferenceID, invitedBy int64, items []dto.ExternalInvitationCreateItem) (*dto.ExternalInvitationBatchCreateResponse, error)
	List(ctx context.Context, conferenceID int64, params *ListParams) ([]dto.ExternalInvitation, int64, error)
	Delete(ctx context.Context, id, conferenceID int64) error
	GetByToken(ctx context.Context, token string) (*model.ExternalInvitation, error)
	MarkAccepted(ctx context.Context, id, userID int64) error
	GetTokenByID(ctx context.Context, id int64) (string, error)
}

func generateInvitationToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}
	return hex.EncodeToString(b), nil
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
		token, err := generateInvitationToken()
		if err != nil {
			resp.Failed = append(resp.Failed, dto.ExternalInvitationFailure{
				ScholarID: item.ScholarID,
				Error:     fmt.Sprintf("token gen failed: %v", err),
			})
			continue
		}

		cols := []string{
			model.ExternalInvColConferenceID,
			model.ExternalInvColRole,
			model.ExternalInvColName,
			model.ExternalInvColStatus,
			model.ExternalInvColInvitedBy,
			model.ExternalInvColCreatedAt,
			model.ExternalInvColUpdatedAt,
			model.ExternalInvColInvitationToken,
			model.ExternalInvColInvitationTokenExpiresAt,
		}
		vals := []interface{}{
			conferenceID,
			item.Role,
			item.Name,
			model.ExternalInvitationStatusPending,
			invitedBy,
			sq.Expr("NOW()"),
			sq.Expr("NOW()"),
			token,
			time.Now().Add(model.ExternalInvitationTokenExpiry),
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
		if len(item.FieldsOfStudy) > 0 {
			// pq.StringArray (driver.Valuer) encodes as a Postgres array literal
			// so we don't have to build `ARRAY[...]` SQL by hand. Passing a
			// plain []string here would fail to scan into TEXT[].
			cols = append(cols, model.ExternalInvColFieldsOfStudy)
			vals = append(vals, pq.StringArray(item.FieldsOfStudy))
		}

		query, args, err := s.qb.
			Insert(model.ExternalInvitationTableName).
			Columns(cols...).
			Values(vals...).
			Suffix("RETURNING id, conference_id, role, scholar_id, name, email, affiliation, profile_url, status, invited_by, created_at, updated_at, fields_of_study, invitation_token, invitation_token_expires_at, invitation_token_used_at, accepted_user_id").
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
			&row.FieldsOfStudy,
			&row.InvitationToken, &row.InvitationTokenExpiresAt,
			&row.InvitationTokenUsedAt, &row.AcceptedUserID,
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
		model.ExternalInvColFieldsOfStudy,
		model.ExternalInvColInvitationToken,
		model.ExternalInvColInvitationTokenExpiresAt,
		model.ExternalInvColInvitationTokenUsedAt,
		model.ExternalInvColAcceptedUserID,
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
			&row.FieldsOfStudy,
			&row.InvitationToken, &row.InvitationTokenExpiresAt,
			&row.InvitationTokenUsedAt, &row.AcceptedUserID,
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

func (s *Storage) GetByToken(ctx context.Context, token string) (*model.ExternalInvitation, error) {
	query, args, err := s.qb.
		Select(
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
			model.ExternalInvColFieldsOfStudy,
			model.ExternalInvColInvitationToken,
			model.ExternalInvColInvitationTokenExpiresAt,
			model.ExternalInvColInvitationTokenUsedAt,
			model.ExternalInvColAcceptedUserID,
		).
		From(model.ExternalInvitationTableName).
		Where(sq.Eq{model.ExternalInvColInvitationToken: token}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("build query: %w", err)
	}
	var row model.ExternalInvitation
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&row.ID, &row.ConferenceID, &row.Role, &row.ScholarID,
		&row.Name, &row.Email, &row.Affiliation, &row.ProfileURL,
		&row.Status, &row.InvitedBy, &row.CreatedAt, &row.UpdatedAt,
		&row.FieldsOfStudy,
		&row.InvitationToken, &row.InvitationTokenExpiresAt,
		&row.InvitationTokenUsedAt, &row.AcceptedUserID,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("invitation not found")
	}
	if err != nil {
		return nil, fmt.Errorf("get by token: %w", err)
	}
	return &row, nil
}

// MarkAccepted flips a pending invitation to accepted.
//
// The WHERE clause includes `status = 'pending'` so that a concurrent
// double-submit (e.g. two browser tabs hitting POST /accept at the same
// instant) is idempotent: the second call sees rowsAffected=0 and returns
// a clear error that the orchestrator maps to 410 Gone. Without this guard,
// the second call would silently overwrite accepted_user_id.
func (s *Storage) MarkAccepted(ctx context.Context, id, userID int64) error {
	now := time.Now()
	query, args, err := s.qb.
		Update(model.ExternalInvitationTableName).
		Set(model.ExternalInvColStatus, model.ExternalInvitationStatusAccepted).
		Set(model.ExternalInvColAcceptedUserID, userID).
		Set(model.ExternalInvColInvitationTokenUsedAt, now).
		Set(model.ExternalInvColUpdatedAt, now).
		Where(sq.And{
			sq.Eq{model.ExternalInvColID: id},
			sq.Eq{model.ExternalInvColStatus: model.ExternalInvitationStatusPending},
		}).
		ToSql()
	if err != nil {
		return fmt.Errorf("build update: %w", err)
	}
	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("mark accepted: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("mark accepted rows: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("invitation already accepted or not found")
	}
	return nil
}

// GetTokenByID returns only the invitation_token for a row. This lets the
// orchestrator compose invitation_url right after BatchCreate without
// embedding the raw token in the outer DTO (which is returned by List/GET).
func (s *Storage) GetTokenByID(ctx context.Context, id int64) (string, error) {
	query, args, err := s.qb.
		Select(model.ExternalInvColInvitationToken).
		From(model.ExternalInvitationTableName).
		Where(sq.Eq{model.ExternalInvColID: id}).
		ToSql()
	if err != nil {
		return "", fmt.Errorf("build query: %w", err)
	}
	var token *string
	if err := s.db.QueryRowContext(ctx, query, args...).Scan(&token); err != nil {
		return "", fmt.Errorf("get token by id: %w", err)
	}
	if token == nil {
		return "", nil
	}
	return *token, nil
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
