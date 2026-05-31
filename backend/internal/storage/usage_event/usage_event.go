package usageevent

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

type StorageInterface interface {
	CreateBatch(ctx context.Context, userID int64, events []dto.UsageEventCreateRequest) (int, error)
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

func (s *Storage) CreateBatch(ctx context.Context, userID int64, events []dto.UsageEventCreateRequest) (int, error) {
	if len(events) == 0 {
		return 0, nil
	}

	builder := s.qb.
		Insert(model.UsageEventsTableName).
		Columns(
			model.UsageEventColSessionID,
			model.UsageEventColUserID,
			model.UsageEventColRole,
			model.UsageEventColEventName,
			model.UsageEventColPagePath,
			model.UsageEventColEntityType,
			model.UsageEventColEntityID,
			model.UsageEventColSuccess,
			model.UsageEventColMetadata,
		)

	for _, event := range events {
		metadataValue := event.Metadata
		if metadataValue == nil {
			metadataValue = map[string]interface{}{}
		}
		metadata, err := json.Marshal(metadataValue)
		if err != nil {
			return 0, fmt.Errorf("failed to marshal usage event metadata: %w", err)
		}

		success := true
		if event.Success != nil {
			success = *event.Success
		}

		builder = builder.Values(
			event.SessionID,
			userID,
			nilIfEmpty(event.Role),
			event.EventName,
			nilIfEmpty(event.PagePath),
			nilIfEmpty(event.EntityType),
			nilIfEmpty(event.EntityID),
			success,
			metadata,
		)
	}

	query, args, err := builder.ToSql()
	if err != nil {
		return 0, fmt.Errorf("failed to build usage event insert: %w", err)
	}

	if _, err := s.db.ExecContext(ctx, query, args...); err != nil {
		return 0, fmt.Errorf("failed to insert usage events: %w", err)
	}

	return len(events), nil
}

func nilIfEmpty(value string) interface{} {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}
