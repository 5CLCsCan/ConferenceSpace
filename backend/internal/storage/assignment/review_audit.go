package assignment

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

const reviewAuditEventsTableName = "review_audit_events"

func (s *Storage) GetReviewAuditState(ctx context.Context, assignmentID int64) (*dto.ReviewAuditState, error) {
	query, args, err := s.qb.
		Select(model.ColReviewAuditState).
		From(model.AssignmentTableName).
		Where(sq.Eq{"id": assignmentID}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build review audit state query: %w", err)
	}

	var raw json.RawMessage
	if err := s.db.QueryRowContext(ctx, query, args...).Scan(&raw); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("assignment not found")
		}
		return nil, fmt.Errorf("failed to get review audit state: %w", err)
	}

	return decodeReviewAuditState(raw)
}

func (s *Storage) UpdateReviewAuditDismissal(
	ctx context.Context,
	assignmentID int64,
	dismissal dto.ReviewAuditDismissal,
	dismiss bool,
) (*dto.ReviewAuditState, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin review audit dismissal transaction: %w", err)
	}
	defer tx.Rollback()

	query, args, err := s.qb.
		Select(model.ColReviewAuditState).
		From(model.AssignmentTableName).
		Where(sq.Eq{"id": assignmentID}).
		Suffix("FOR UPDATE").
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build review audit dismissal query: %w", err)
	}

	var raw json.RawMessage
	if err := tx.QueryRowContext(ctx, query, args...).Scan(&raw); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("assignment not found")
		}
		return nil, fmt.Errorf("failed to load review audit dismissal state: %w", err)
	}

	state, err := decodeReviewAuditState(raw)
	if err != nil {
		return nil, err
	}

	filtered := make([]dto.ReviewAuditDismissal, 0, len(state.DismissedWarnings))
	for _, item := range state.DismissedWarnings {
		if item.Code == dismissal.Code && item.ConditionFingerprint == dismissal.ConditionFingerprint {
			continue
		}
		filtered = append(filtered, item)
	}
	if dismiss {
		filtered = append(filtered, dismissal)
	}
	state.DismissedWarnings = filtered

	stateJSON, err := json.Marshal(state)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal review audit state: %w", err)
	}

	updateQuery, updateArgs, err := s.qb.
		Update(model.AssignmentTableName).
		Set(model.ColReviewAuditState, stateJSON).
		Set(model.ColUpdatedAt, sq.Expr("NOW()")).
		Where(sq.Eq{"id": assignmentID}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build review audit state update: %w", err)
	}

	if _, err := tx.ExecContext(ctx, updateQuery, updateArgs...); err != nil {
		return nil, fmt.Errorf("failed to persist review audit state: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit review audit dismissal update: %w", err)
	}

	return state, nil
}

func (s *Storage) AppendReviewAuditEvent(ctx context.Context, event *dto.ReviewAuditEvent) error {
	if event == nil {
		return fmt.Errorf("review audit event is required")
	}

	payload := event.Payload
	if payload == nil {
		payload = map[string]interface{}{}
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal review audit event payload: %w", err)
	}

	query, args, err := s.qb.
		Insert(reviewAuditEventsTableName).
		Columns("assignment_id", "conference_id", "actor_id", "actor_email", "event_type", "payload", "created_at").
		Values(event.AssignmentID, event.ConferenceID, event.ActorID, event.ActorEmail, event.EventType, payloadJSON, sq.Expr("NOW()")).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build review audit event insert: %w", err)
	}

	if _, err := s.db.ExecContext(ctx, query, args...); err != nil {
		return fmt.Errorf("failed to append review audit event: %w", err)
	}
	return nil
}

func decodeReviewAuditState(raw json.RawMessage) (*dto.ReviewAuditState, error) {
	state := &dto.ReviewAuditState{DismissedWarnings: []dto.ReviewAuditDismissal{}}
	if len(raw) == 0 {
		return state, nil
	}
	if err := json.Unmarshal(raw, state); err != nil {
		return nil, fmt.Errorf("failed to decode review audit state: %w", err)
	}
	if state.DismissedWarnings == nil {
		state.DismissedWarnings = []dto.ReviewAuditDismissal{}
	}
	return state, nil
}
