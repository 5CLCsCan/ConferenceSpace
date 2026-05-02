package model

import (
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

const (
	ExternalInvitationTableName = "external_invitations"

	ExternalInvColID           = "id"
	ExternalInvColConferenceID = "conference_id"
	ExternalInvColRole         = "role"
	ExternalInvColScholarID    = "scholar_id"
	ExternalInvColName         = "name"
	ExternalInvColEmail        = "email"
	ExternalInvColAffiliation  = "affiliation"
	ExternalInvColProfileURL   = "profile_url"
	ExternalInvColStatus       = "status"
	ExternalInvColInvitedBy    = "invited_by"
	ExternalInvColCreatedAt    = "created_at"
	ExternalInvColUpdatedAt    = "updated_at"
)

type ExternalInvitation struct {
	ID           int64     `db:"id"`
	ConferenceID int64     `db:"conference_id"`
	Role         string    `db:"role"`
	ScholarID    *string   `db:"scholar_id"`
	Name         string    `db:"name"`
	Email        *string   `db:"email"`
	Affiliation  *string   `db:"affiliation"`
	ProfileURL   *string   `db:"profile_url"`
	Status       string    `db:"status"`
	InvitedBy    int64     `db:"invited_by"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

func (e *ExternalInvitation) ToDTO() *dto.ExternalInvitation {
	d := &dto.ExternalInvitation{
		ID:           e.ID,
		ConferenceID: e.ConferenceID,
		Role:         e.Role,
		Name:         e.Name,
		Status:       e.Status,
		InvitedBy:    e.InvitedBy,
		CreatedAt:    e.CreatedAt,
		UpdatedAt:    e.UpdatedAt,
	}
	if e.ScholarID != nil {
		d.ScholarID = *e.ScholarID
	}
	if e.Email != nil {
		d.Email = *e.Email
	}
	if e.Affiliation != nil {
		d.Affiliation = *e.Affiliation
	}
	if e.ProfileURL != nil {
		d.ProfileURL = *e.ProfileURL
	}
	return d
}
