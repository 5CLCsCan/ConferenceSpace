package conference_template

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

type StorageInterface interface {
	List(ctx context.Context, ownerEmail string, search string) ([]*dto.ConferenceConfigTemplateResponse, error)
	Create(ctx context.Context, ownerEmail string, template *dto.ConferenceConfigTemplate) (*dto.ConferenceConfigTemplateResponse, error)
	Update(ctx context.Context, templateID int64, ownerEmail string, template *dto.ConferenceConfigTemplate) (*dto.ConferenceConfigTemplateResponse, error)
	Delete(ctx context.Context, templateID int64, ownerEmail string) error
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

func (s *Storage) List(ctx context.Context, ownerEmail string, search string) ([]*dto.ConferenceConfigTemplateResponse, error) {
	queryBuilder := s.qb.
		Select(
			model.ColConferenceConfigTemplateID,
			model.ColConferenceConfigTemplateOwnerEmail,
			model.ColConferenceConfigTemplateName,
			model.ColConferenceConfigTemplateDescription,
			model.ColConferenceConfigTemplatePayload,
			model.ColConferenceConfigTemplateCreatedAt,
			model.ColConferenceConfigTemplateUpdatedAt,
		).
		From(model.ConferenceConfigTemplateTableName).
		Where(sq.Eq{model.ColConferenceConfigTemplateOwnerEmail: ownerEmail}).
		OrderBy(fmt.Sprintf("%s DESC", model.ColConferenceConfigTemplateUpdatedAt))

	if normalized := strings.TrimSpace(search); normalized != "" {
		pattern := "%" + normalized + "%"
		queryBuilder = queryBuilder.Where(
			sq.Expr(
				fmt.Sprintf("(%s ILIKE ? OR %s ILIKE ?)", model.ColConferenceConfigTemplateName, model.ColConferenceConfigTemplateDescription),
				pattern,
				pattern,
			),
		)
	}

	query, args, err := queryBuilder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build list conference config templates query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list conference config templates: %w", err)
	}
	defer rows.Close()

	templates := make([]*dto.ConferenceConfigTemplateResponse, 0)
	for rows.Next() {
		entity := &model.ConferenceConfigTemplate{}
		if err := rows.Scan(
			&entity.TemplateID,
			&entity.OwnerEmail,
			&entity.Name,
			&entity.Description,
			&entity.Payload,
			&entity.CreatedAt,
			&entity.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan conference config template: %w", err)
		}
		templates = append(templates, entity.ToDTO())
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed while iterating conference config templates: %w", err)
	}

	return templates, nil
}

func (s *Storage) Create(ctx context.Context, ownerEmail string, template *dto.ConferenceConfigTemplate) (*dto.ConferenceConfigTemplateResponse, error) {
	payloadBytes, err := model.SerializeConferenceConfigTemplatePayload(template.Payload)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize conference config template payload: %w", err)
	}

	now := time.Now()
	query, args, err := s.qb.
		Insert(model.ConferenceConfigTemplateTableName).
		Columns(
			model.ColConferenceConfigTemplateOwnerEmail,
			model.ColConferenceConfigTemplateName,
			model.ColConferenceConfigTemplateDescription,
			model.ColConferenceConfigTemplatePayload,
			model.ColConferenceConfigTemplateCreatedAt,
			model.ColConferenceConfigTemplateUpdatedAt,
		).
		Values(ownerEmail, template.Name, template.Description, payloadBytes, now, now).
		Suffix(
			fmt.Sprintf(
				"RETURNING %s, %s, %s, %s, %s, %s, %s",
				model.ColConferenceConfigTemplateID,
				model.ColConferenceConfigTemplateOwnerEmail,
				model.ColConferenceConfigTemplateName,
				model.ColConferenceConfigTemplateDescription,
				model.ColConferenceConfigTemplatePayload,
				model.ColConferenceConfigTemplateCreatedAt,
				model.ColConferenceConfigTemplateUpdatedAt,
			),
		).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build create conference config template query: %w", err)
	}

	entity := &model.ConferenceConfigTemplate{}
	if err := s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.TemplateID,
		&entity.OwnerEmail,
		&entity.Name,
		&entity.Description,
		&entity.Payload,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("failed to create conference config template: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) Update(ctx context.Context, templateID int64, ownerEmail string, template *dto.ConferenceConfigTemplate) (*dto.ConferenceConfigTemplateResponse, error) {
	payloadBytes, err := model.SerializeConferenceConfigTemplatePayload(template.Payload)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize conference config template payload: %w", err)
	}

	query, args, err := s.qb.
		Update(model.ConferenceConfigTemplateTableName).
		SetMap(map[string]interface{}{
			model.ColConferenceConfigTemplateName:        template.Name,
			model.ColConferenceConfigTemplateDescription: template.Description,
			model.ColConferenceConfigTemplatePayload:     payloadBytes,
			model.ColConferenceConfigTemplateUpdatedAt:   time.Now(),
		}).
		Where(sq.Eq{
			model.ColConferenceConfigTemplateID:         templateID,
			model.ColConferenceConfigTemplateOwnerEmail: ownerEmail,
		}).
		Suffix(
			fmt.Sprintf(
				"RETURNING %s, %s, %s, %s, %s, %s, %s",
				model.ColConferenceConfigTemplateID,
				model.ColConferenceConfigTemplateOwnerEmail,
				model.ColConferenceConfigTemplateName,
				model.ColConferenceConfigTemplateDescription,
				model.ColConferenceConfigTemplatePayload,
				model.ColConferenceConfigTemplateCreatedAt,
				model.ColConferenceConfigTemplateUpdatedAt,
			),
		).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build update conference config template query: %w", err)
	}

	entity := &model.ConferenceConfigTemplate{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&entity.TemplateID,
		&entity.OwnerEmail,
		&entity.Name,
		&entity.Description,
		&entity.Payload,
		&entity.CreatedAt,
		&entity.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("conference config template not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update conference config template: %w", err)
	}

	return entity.ToDTO(), nil
}

func (s *Storage) Delete(ctx context.Context, templateID int64, ownerEmail string) error {
	query, args, err := s.qb.
		Delete(model.ConferenceConfigTemplateTableName).
		Where(sq.Eq{
			model.ColConferenceConfigTemplateID:         templateID,
			model.ColConferenceConfigTemplateOwnerEmail: ownerEmail,
		}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete conference config template query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete conference config template: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get deleted conference config template rows: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("conference config template not found")
	}

	return nil
}
