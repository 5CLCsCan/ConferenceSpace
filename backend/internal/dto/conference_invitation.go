package dto

import "time"

type ConferenceInvitationCreateItem struct {
	Email string `json:"email" binding:"required,email"`
	Role  string `json:"role" binding:"required,oneof=reviewer co_chair pc"`
}

type ConferenceInvitationCreateRequest struct {
	ConferenceID int64                            `uri:"conference_id" binding:"required"`
	Invitations  []ConferenceInvitationCreateItem `json:"invitations" binding:"required,min=1"`
}

type ConferenceInvitationRecord struct {
	ID            int64      `json:"id"`
	ConferenceID  int64      `json:"conference_id"`
	InviteeEmail  string     `json:"invitee_email"`
	Role          string     `json:"role"`
	Status        string     `json:"status"`
	InviterEmail  string     `json:"inviter_email"`
	InvitedUserID *int64     `json:"invited_user_id,omitempty"`
	RespondedAt   *time.Time `json:"responded_at,omitempty"`
	ExpiresAt     time.Time  `json:"expires_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type ConferenceInvitationCreateResult struct {
	Invitation *ConferenceInvitationRecord `json:"invitation,omitempty"`
	Email      string                      `json:"email"`
	Role       string                      `json:"role"`
	Error      string                      `json:"error,omitempty"`
}

type ConferenceInvitationCreateResponse struct {
	Success []ConferenceInvitationCreateResult `json:"success"`
	Failed  []ConferenceInvitationCreateResult `json:"failed"`
}

type ConferenceInvitationListRequest struct {
	ConferenceID int64  `uri:"conference_id" binding:"required"`
	Status       string `form:"status"`
}

type ConferenceInvitationListResponse struct {
	Invitations []*ConferenceInvitationRecord `json:"invitations"`
}

type ConferenceInvitationPreviewRequest struct {
	Token string `form:"token" binding:"required"`
}

type ConferenceInvitationPreviewResponse struct {
	Invitation      *ConferenceInvitationRecord `json:"invitation"`
	ConferenceTitle string                      `json:"conference_title"`
	ConferenceCode  string                      `json:"conference_code"`
	InviterName     string                      `json:"inviter_name"`
	SignupURL       string                      `json:"signup_url"`
	IsExistingUser  bool                        `json:"is_existing_user"`
}

type ConferenceInvitationRespondRequest struct {
	Token  string `json:"token" binding:"required"`
	Action string `json:"action" binding:"required,oneof=accept decline"`
}

type ConferenceInvitationRespondResponse struct {
	Invitation *ConferenceInvitationRecord `json:"invitation"`
	Message    string                      `json:"message"`
}
