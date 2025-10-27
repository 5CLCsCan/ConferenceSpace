package model

import (
	"encoding/json"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/lib/pq"
)

const (
	ConferenceTableName = "conferences"

	ColConferenceID   = "conference_id"
	ColTitle          = "title"
	ColAcronym        = "acronym"
	ColDescription    = "description"
	ColChair          = "chair"
	ColPrimaryContact = "primary_contact"
	ColAreaChair      = "area_chair"
	ColConfigurations = "configurations"
)

type Conference struct {
	ConferenceID   int64          `db:"conference_id"`
	Title          string         `db:"title"`
	Acronym        string         `db:"acronym"`
	Description    string         `db:"description"`
	Chair          string         `db:"chair"`
	PrimaryContact int64          `db:"primary_contact"`
	AreaChair      int64          `db:"area_chair"`
	Domain         pq.StringArray `db:"domain"`
	Configurations []byte         `db:"configurations"`
	CreatedAt      time.Time      `db:"created_at"`
	UpdatedAt      time.Time      `db:"updated_at"`
}

func (c *Conference) ToDTO() *dto.ConferenceResponse {
	domain := []string(c.Domain)
	if domain == nil {
		domain = []string{}
	}

	var config *dto.ConferenceConfiguration
	if len(c.Configurations) > 0 {
		config = &dto.ConferenceConfiguration{}
		if err := json.Unmarshal(c.Configurations, config); err != nil {
			config = nil
		}
	}

	return &dto.ConferenceResponse{
		ID:             c.ConferenceID,
		Title:          c.Title,
		Acronym:        c.Acronym,
		Description:    c.Description,
		Chair:          c.Chair,
		PrimaryContact: c.PrimaryContact,
		AreaChair:      c.AreaChair,
		Domain:         domain,
		Configurations: config,
		CreatedAt:      c.CreatedAt,
		UpdatedAt:      c.UpdatedAt,
	}
}

func SerializeConferenceConfiguration(config *dto.ConferenceConfiguration) ([]byte, error) {
	if config == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(config)
}
