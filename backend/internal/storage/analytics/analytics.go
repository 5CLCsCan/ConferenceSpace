package analytics

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"regexp"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

const (
	sessionTable = "user_sessions"
	eventTable   = "user_events"
)

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

type StorageInterface interface {
	RecordBatch(ctx context.Context, userID int64, userAgent string, req *dto.AnalyticsBatchRequest) (int, error)
}

type Storage struct {
	db *sql.DB
}

func New(db *sql.DB) *Storage {
	return &Storage{db: db}
}

func RecordableEventTypes() map[string]struct{} {
	return map[string]struct{}{
		dto.AnalyticsEventTypePageView: {},
		dto.AnalyticsEventTypeFeature:  {},
		dto.AnalyticsEventTypeFlowStep: {},
		dto.AnalyticsEventTypeTiming:   {},
	}
}

func IsValidUUID(value string) bool {
	return uuidPattern.MatchString(value)
}

func (s *Storage) RecordBatch(ctx context.Context, userID int64, userAgent string, req *dto.AnalyticsBatchRequest) (int, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to begin analytics transaction: %w", err)
	}
	defer tx.Rollback()

	startedAt := firstOccurredAt(req.Events)
	if startedAt.IsZero() {
		startedAt = time.Now().UTC()
	}

	if _, err := tx.ExecContext(ctx, fmt.Sprintf(`
		INSERT INTO %s (session_id, user_id, started_at, user_agent)
		VALUES ($1, $2, $3, NULLIF($4, ''))
		ON CONFLICT (session_id)
		DO UPDATE SET
			user_id = COALESCE(%s.user_id, EXCLUDED.user_id),
			user_agent = COALESCE(%s.user_agent, EXCLUDED.user_agent)
	`, sessionTable, sessionTable, sessionTable), req.SessionID, userID, startedAt, userAgent); err != nil {
		return 0, fmt.Errorf("failed to upsert analytics session: %w", err)
	}

	inserted := 0
	for _, event := range req.Events {
		metadataBytes := []byte("{}")
		if event.Metadata != nil {
			metadataBytes, err = json.Marshal(event.Metadata)
			if err != nil {
				return 0, fmt.Errorf("failed to marshal analytics metadata: %w", err)
			}
		}

		tag, err := tx.ExecContext(ctx, fmt.Sprintf(`
			INSERT INTO %s (
				event_id, session_id, user_id, event_name, event_type, route, role, feature,
				flow_id, flow_name, step_name, step_index, active_ms, metadata, occurred_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''), NULLIF($8, ''), NULLIF($9, '')::uuid,
				NULLIF($10, ''), NULLIF($11, ''), $12, $13, $14, $15)
			ON CONFLICT (event_id) DO NOTHING
		`, eventTable),
			event.EventID,
			req.SessionID,
			userID,
			event.EventName,
			event.EventType,
			event.Route,
			event.Role,
			event.Feature,
			event.FlowID,
			event.FlowName,
			event.StepName,
			event.StepIndex,
			event.ActiveMS,
			metadataBytes,
			event.OccurredAt,
		)
		if err != nil {
			return 0, fmt.Errorf("failed to insert analytics event: %w", err)
		}
		rows, err := tag.RowsAffected()
		if err != nil {
			return 0, fmt.Errorf("failed to read analytics insert result: %w", err)
		}
		inserted += int(rows)
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit analytics transaction: %w", err)
	}
	return inserted, nil
}

func firstOccurredAt(events []dto.AnalyticsEventCreate) time.Time {
	var first time.Time
	for _, event := range events {
		if event.OccurredAt.IsZero() {
			continue
		}
		if first.IsZero() || event.OccurredAt.Before(first) {
			first = event.OccurredAt
		}
	}
	return first
}
