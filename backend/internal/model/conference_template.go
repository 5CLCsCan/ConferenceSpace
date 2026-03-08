package model

import (
	"encoding/json"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

const (
	ConferenceConfigTemplateTableName = "conference_config_templates"

	ColConferenceConfigTemplateID          = "template_id"
	ColConferenceConfigTemplateOwnerEmail  = "owner_email"
	ColConferenceConfigTemplateName        = "name"
	ColConferenceConfigTemplateDescription = "description"
	ColConferenceConfigTemplatePayload     = "payload"
	ColConferenceConfigTemplateCreatedAt   = "created_at"
	ColConferenceConfigTemplateUpdatedAt   = "updated_at"
)

type ConferenceConfigTemplate struct {
	TemplateID  int64     `db:"template_id"`
	OwnerEmail  string    `db:"owner_email"`
	Name        string    `db:"name"`
	Description string    `db:"description"`
	Payload     []byte    `db:"payload"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}

func (c *ConferenceConfigTemplate) ToDTO() *dto.ConferenceConfigTemplateResponse {
	payload := &dto.ConferenceConfigTemplatePayload{}
	if len(c.Payload) > 0 {
		if err := json.Unmarshal(c.Payload, payload); err != nil {
			payload = &dto.ConferenceConfigTemplatePayload{}
		}
	}

	return &dto.ConferenceConfigTemplateResponse{
		ID:          c.TemplateID,
		Name:        c.Name,
		Description: c.Description,
		Payload:     payload,
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.UpdatedAt,
	}
}

func SerializeConferenceConfigTemplatePayload(payload *dto.ConferenceConfigTemplatePayload) ([]byte, error) {
	if payload == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(payload)
}
