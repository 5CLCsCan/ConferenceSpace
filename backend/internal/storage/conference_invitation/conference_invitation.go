package conferenceinvitation

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/lib/pq"
)

type StorageInterface interface {
	Create(ctx context.Context, conferenceID int64, inviteeEmail, role, inviterEmail string, invitedUserID *int64) (*dto.ConferenceInvitationRecord, string, error)
	ListByConference(ctx context.Context, conferenceID int64, status string) ([]*dto.ConferenceInvitationRecord, error)
	GetByToken(ctx context.Context, token string) (*model.ConferenceInvitation, error)
	UpdateStatus(ctx context.Context, id int64, status string, respondedAt *time.Time, invitedUserID *int64) (*dto.ConferenceInvitationRecord, error)
	MarkExpiredPending(ctx context.Context) error
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

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate random token: %w", err)
	}
	return hex.EncodeToString(b), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func scanInvitation(scanner interface {
	Scan(dest ...any) error
}) (*dto.ConferenceInvitationRecord, error) {
	record := &dto.ConferenceInvitationRecord{}
	if err := scanner.Scan(
		&record.ID,
		&record.ConferenceID,
		&record.InviteeEmail,
		&record.Role,
		&record.Status,
		&record.InviterEmail,
		&record.InvitedUserID,
		&record.RespondedAt,
		&record.ExpiresAt,
		&record.CreatedAt,
		&record.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return record, nil
}

func (s *Storage) Create(ctx context.Context, conferenceID int64, inviteeEmail, role, inviterEmail string, invitedUserID *int64) (*dto.ConferenceInvitationRecord, string, error) {
	token, err := generateToken()
	if err != nil {
		return nil, "", err
	}

	now := time.Now()
	query, args, err := s.qb.
		Insert(model.ConferenceInvitationTableName).
		Columns(
			model.ConferenceInvitationColConferenceID,
			model.ConferenceInvitationColInviteeEmail,
			model.ConferenceInvitationColRole,
			model.ConferenceInvitationColStatus,
			model.ConferenceInvitationColInviterEmail,
			model.ConferenceInvitationColTokenHash,
			model.ConferenceInvitationColInvitedUserID,
			model.ConferenceInvitationColExpiresAt,
			model.ConferenceInvitationColCreatedAt,
			model.ConferenceInvitationColUpdatedAt,
		).
		Values(
			conferenceID,
			normalizeEmail(inviteeEmail),
			role,
			model.ConferenceInvitationStatusPending,
			normalizeEmail(inviterEmail),
			hashToken(token),
			invitedUserID,
			now.Add(model.ConferenceInvitationExpiry),
			now,
			now,
		).
		Suffix(fmt.Sprintf(
			"RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.ConferenceInvitationColID,
			model.ConferenceInvitationColConferenceID,
			model.ConferenceInvitationColInviteeEmail,
			model.ConferenceInvitationColRole,
			model.ConferenceInvitationColStatus,
			model.ConferenceInvitationColInviterEmail,
			model.ConferenceInvitationColInvitedUserID,
			model.ConferenceInvitationColRespondedAt,
			model.ConferenceInvitationColExpiresAt,
			model.ConferenceInvitationColCreatedAt,
			model.ConferenceInvitationColUpdatedAt,
		)).
		ToSql()
	if err != nil {
		return nil, "", fmt.Errorf("failed to build invitation insert query: %w", err)
	}

	record, err := scanInvitation(s.db.QueryRowContext(ctx, query, args...))
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			return nil, "", fmt.Errorf("an active invitation already exists for this email and role")
		}
		return nil, "", fmt.Errorf("failed to create invitation: %w", err)
	}

	return record, token, nil
}

func (s *Storage) ListByConference(ctx context.Context, conferenceID int64, status string) ([]*dto.ConferenceInvitationRecord, error) {
	builder := s.qb.
		Select(
			model.ConferenceInvitationColID,
			model.ConferenceInvitationColConferenceID,
			model.ConferenceInvitationColInviteeEmail,
			model.ConferenceInvitationColRole,
			model.ConferenceInvitationColStatus,
			model.ConferenceInvitationColInviterEmail,
			model.ConferenceInvitationColInvitedUserID,
			model.ConferenceInvitationColRespondedAt,
			model.ConferenceInvitationColExpiresAt,
			model.ConferenceInvitationColCreatedAt,
			model.ConferenceInvitationColUpdatedAt,
		).
		From(model.ConferenceInvitationTableName).
		Where(sq.Eq{model.ConferenceInvitationColConferenceID: conferenceID}).
		OrderBy(model.ConferenceInvitationColCreatedAt + " DESC")

	if strings.TrimSpace(status) != "" {
		builder = builder.Where(sq.Eq{model.ConferenceInvitationColStatus: status})
	}

	query, args, err := builder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build invitation list query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list invitations: %w", err)
	}
	defer rows.Close()

	var records []*dto.ConferenceInvitationRecord
	for rows.Next() {
		record, err := scanInvitation(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan invitation: %w", err)
		}
		records = append(records, record)
	}

	return records, nil
}

func (s *Storage) GetByToken(ctx context.Context, token string) (*model.ConferenceInvitation, error) {
	query, args, err := s.qb.
		Select(
			model.ConferenceInvitationColID,
			model.ConferenceInvitationColConferenceID,
			model.ConferenceInvitationColInviteeEmail,
			model.ConferenceInvitationColRole,
			model.ConferenceInvitationColStatus,
			model.ConferenceInvitationColInviterEmail,
			model.ConferenceInvitationColTokenHash,
			model.ConferenceInvitationColInvitedUserID,
			model.ConferenceInvitationColRespondedAt,
			model.ConferenceInvitationColExpiresAt,
			model.ConferenceInvitationColCreatedAt,
			model.ConferenceInvitationColUpdatedAt,
		).
		From(model.ConferenceInvitationTableName).
		Where(sq.Eq{model.ConferenceInvitationColTokenHash: hashToken(token)}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build invitation lookup query: %w", err)
	}

	record := &model.ConferenceInvitation{}
	if err := s.db.QueryRowContext(ctx, query, args...).Scan(
		&record.ID,
		&record.ConferenceID,
		&record.InviteeEmail,
		&record.Role,
		&record.Status,
		&record.InviterEmail,
		&record.TokenHash,
		&record.InvitedUserID,
		&record.RespondedAt,
		&record.ExpiresAt,
		&record.CreatedAt,
		&record.UpdatedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("invitation not found")
		}
		return nil, fmt.Errorf("failed to get invitation: %w", err)
	}

	return record, nil
}

func (s *Storage) UpdateStatus(ctx context.Context, id int64, status string, respondedAt *time.Time, invitedUserID *int64) (*dto.ConferenceInvitationRecord, error) {
	builder := s.qb.
		Update(model.ConferenceInvitationTableName).
		Set(model.ConferenceInvitationColStatus, status).
		Set(model.ConferenceInvitationColUpdatedAt, time.Now()).
		Where(sq.Eq{model.ConferenceInvitationColID: id})

	if respondedAt != nil {
		builder = builder.Set(model.ConferenceInvitationColRespondedAt, *respondedAt)
	}
	if invitedUserID != nil {
		builder = builder.Set(model.ConferenceInvitationColInvitedUserID, *invitedUserID)
	}

	query, args, err := builder.
		Suffix(fmt.Sprintf(
			"RETURNING %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s",
			model.ConferenceInvitationColID,
			model.ConferenceInvitationColConferenceID,
			model.ConferenceInvitationColInviteeEmail,
			model.ConferenceInvitationColRole,
			model.ConferenceInvitationColStatus,
			model.ConferenceInvitationColInviterEmail,
			model.ConferenceInvitationColInvitedUserID,
			model.ConferenceInvitationColRespondedAt,
			model.ConferenceInvitationColExpiresAt,
			model.ConferenceInvitationColCreatedAt,
			model.ConferenceInvitationColUpdatedAt,
		)).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build invitation update query: %w", err)
	}

	record, err := scanInvitation(s.db.QueryRowContext(ctx, query, args...))
	if err != nil {
		return nil, fmt.Errorf("failed to update invitation: %w", err)
	}
	return record, nil
}

func (s *Storage) MarkExpiredPending(ctx context.Context) error {
	query, args, err := s.qb.
		Update(model.ConferenceInvitationTableName).
		Set(model.ConferenceInvitationColStatus, model.ConferenceInvitationStatusExpired).
		Set(model.ConferenceInvitationColUpdatedAt, time.Now()).
		Where(sq.And{
			sq.Eq{model.ConferenceInvitationColStatus: model.ConferenceInvitationStatusPending},
			sq.Lt{model.ConferenceInvitationColExpiresAt: time.Now()},
		}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build expire invitation query: %w", err)
	}
	if _, err := s.db.ExecContext(ctx, query, args...); err != nil {
		return fmt.Errorf("failed to expire invitations: %w", err)
	}
	return nil
}
