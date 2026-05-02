package model

import "time"

const (
	ConferenceInvitationTableName = "conference_invitations"

	ConferenceInvitationColID            = "id"
	ConferenceInvitationColConferenceID  = "conference_id"
	ConferenceInvitationColInviteeEmail  = "invitee_email"
	ConferenceInvitationColRole          = "role"
	ConferenceInvitationColStatus        = "status"
	ConferenceInvitationColInviterEmail  = "inviter_email"
	ConferenceInvitationColTokenHash     = "token_hash"
	ConferenceInvitationColInvitedUserID = "invited_user_id"
	ConferenceInvitationColRespondedAt   = "responded_at"
	ConferenceInvitationColExpiresAt     = "expires_at"
	ConferenceInvitationColCreatedAt     = "created_at"
	ConferenceInvitationColUpdatedAt     = "updated_at"

	ConferenceInvitationRoleReviewer = "reviewer"
	ConferenceInvitationRoleCoChair  = "co_chair"
	ConferenceInvitationRolePC       = "pc"

	ConferenceInvitationStatusPending  = "pending"
	ConferenceInvitationStatusAccepted = "accepted"
	ConferenceInvitationStatusDeclined = "declined"
	ConferenceInvitationStatusExpired  = "expired"
	ConferenceInvitationStatusRevoked  = "revoked"

	ConferenceInvitationExpiry = 7 * 24 * time.Hour
)

type ConferenceInvitation struct {
	ID            int64      `db:"id"`
	ConferenceID  int64      `db:"conference_id"`
	InviteeEmail  string     `db:"invitee_email"`
	Role          string     `db:"role"`
	Status        string     `db:"status"`
	InviterEmail  string     `db:"inviter_email"`
	TokenHash     string     `db:"token_hash"`
	InvitedUserID *int64     `db:"invited_user_id"`
	RespondedAt   *time.Time `db:"responded_at"`
	ExpiresAt     time.Time  `db:"expires_at"`
	CreatedAt     time.Time  `db:"created_at"`
	UpdatedAt     time.Time  `db:"updated_at"`
}
