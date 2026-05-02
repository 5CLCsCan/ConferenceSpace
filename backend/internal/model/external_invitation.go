package model

import (
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/lib/pq"
)

const (
	ExternalInvitationTableName = "external_invitations"

	ExternalInvColID            = "id"
	ExternalInvColConferenceID  = "conference_id"
	ExternalInvColRole          = "role"
	ExternalInvColScholarID     = "scholar_id"
	ExternalInvColName          = "name"
	ExternalInvColEmail         = "email"
	ExternalInvColAffiliation   = "affiliation"
	ExternalInvColProfileURL    = "profile_url"
	ExternalInvColStatus        = "status"
	ExternalInvColInvitedBy     = "invited_by"
	ExternalInvColCreatedAt     = "created_at"
	ExternalInvColUpdatedAt     = "updated_at"
	ExternalInvColFieldsOfStudy = "fields_of_study"

	ExternalInvColInvitationToken          = "invitation_token"
	ExternalInvColInvitationTokenExpiresAt = "invitation_token_expires_at"
	ExternalInvColInvitationTokenUsedAt    = "invitation_token_used_at"
	ExternalInvColAcceptedUserID           = "accepted_user_id"

	ExternalInvitationTokenExpiry = 30 * 24 * time.Hour

	ExternalInvitationStatusPending  = "pending"
	ExternalInvitationStatusAccepted = "accepted"
	ExternalInvitationStatusExpired  = "expired"
)

type ExternalInvitation struct {
	ID            int64          `db:"id"`
	ConferenceID  int64          `db:"conference_id"`
	Role          string         `db:"role"`
	ScholarID     *string        `db:"scholar_id"`
	Name          string         `db:"name"`
	Email         *string        `db:"email"`
	Affiliation   *string        `db:"affiliation"`
	ProfileURL    *string        `db:"profile_url"`
	Status        string         `db:"status"`
	InvitedBy     int64          `db:"invited_by"`
	CreatedAt     time.Time      `db:"created_at"`
	UpdatedAt     time.Time      `db:"updated_at"`
	FieldsOfStudy pq.StringArray `db:"fields_of_study"`

	InvitationToken          *string    `db:"invitation_token"`
	InvitationTokenExpiresAt *time.Time `db:"invitation_token_expires_at"`
	InvitationTokenUsedAt    *time.Time `db:"invitation_token_used_at"`
	AcceptedUserID           *int64     `db:"accepted_user_id"`
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
	if len(e.FieldsOfStudy) > 0 {
		// Copy to a plain []string so JSON marshalling doesn't expose the
		// pq.StringArray type.
		d.FieldsOfStudy = make([]string, len(e.FieldsOfStudy))
		copy(d.FieldsOfStudy, e.FieldsOfStudy)
	}
	return d
}
