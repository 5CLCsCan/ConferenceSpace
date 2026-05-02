package dto

import "time"

// ExternalInvitation is the response DTO for a single external invitation.
type ExternalInvitation struct {
	ID            int64     `json:"id"`
	ConferenceID  int64     `json:"conference_id"`
	Role          string    `json:"role"`
	ScholarID     string    `json:"scholar_id,omitempty"`
	Name          string    `json:"name"`
	Email         string    `json:"email,omitempty"`
	Affiliation   string    `json:"affiliation,omitempty"`
	ProfileURL    string    `json:"profile_url,omitempty"`
	Status        string    `json:"status"`
	InvitedBy     int64     `json:"invited_by"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	FieldsOfStudy []string  `json:"fields_of_study,omitempty"`
	// InvitationURL is set by the orchestrator after creation/listing so the
	// chair UI can render a "Copy invite link" affordance. Empty when the
	// invitation has no token (legacy rows pre-Phase-2) or when the token
	// has been consumed.
	InvitationURL string `json:"invitation_url,omitempty"`
}

// ExternalInvitationCreateItem is one invitation in the batch create request.
type ExternalInvitationCreateItem struct {
	Role          string   `json:"role" binding:"required"`
	ScholarID     string   `json:"scholar_id"`
	Name          string   `json:"name" binding:"required"`
	Email         string   `json:"email"`
	Affiliation   string   `json:"affiliation"`
	ProfileURL    string   `json:"profile_url"`
	FieldsOfStudy []string `json:"fields_of_study"`
}

// ExternalInvitationFailure represents a single failed invitation in a batch create.
type ExternalInvitationFailure struct {
	ScholarID string `json:"scholar_id"`
	Error     string `json:"error"`
}

// ExternalInvitationBatchCreateRequest is the POST request body.
//
// Invitations intentionally omits `required,min=1`. ShouldBindUri runs
// struct-wide validation before the JSON body is bound, so a required tag on
// the body field would fail before ShouldBindJSON ever runs. The controller
// enforces the non-empty check explicitly.
//
// The `dive` tag is required so gin's validator recurses into each item and
// enforces the per-item `required` tags on Role and Name. Without it, a POST
// with `[{"name": "No Role"}]` would silently succeed with an empty role.
type ExternalInvitationBatchCreateRequest struct {
	ConferenceID int64                          `uri:"conference_id" binding:"required"`
	Invitations  []ExternalInvitationCreateItem `json:"invitations" binding:"dive"`
}

// ExternalInvitationBatchCreateResponse is the POST response.
//
// Neither `success` nor `failed` carries `omitempty`: the frontend reads
// `response.data.failed.length` directly, so the field MUST always be present
// in the payload. With `omitempty`, a batch of all-successful invites would
// serialise to `{"success":[...]}` (no `failed` key), producing a runtime
// `Cannot read properties of undefined (reading 'length')` at the call site.
// Both slices are guaranteed non-nil by storage.BatchCreate, so they marshal
// as `[]` rather than `null`.
type ExternalInvitationBatchCreateResponse struct {
	Success []ExternalInvitation        `json:"success"`
	Failed  []ExternalInvitationFailure `json:"failed"`
}

// ExternalInvitationListRequest is the GET request (query + URI params).
type ExternalInvitationListRequest struct {
	ConferenceID int64  `uri:"conference_id" binding:"required"`
	Limit        int    `form:"limit"`
	Offset       int    `form:"offset"`
	Role         string `form:"role"`
}

// ExternalInvitationListResponse is the GET response.
type ExternalInvitationListResponse struct {
	Invitations []ExternalInvitation `json:"invitations"`
	Total       int64                `json:"total"`
	Limit       int                  `json:"limit"`
	Offset      int                  `json:"offset"`
}

// ExternalInvitationDeleteRequest is the DELETE request.
type ExternalInvitationDeleteRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
	ID           int64 `uri:"id" binding:"required"`
}

// ExternalInvitationAcceptValidateRequest carries the bare token from the
// public accept page so the frontend can prefill the register form.
type ExternalInvitationAcceptValidateRequest struct {
	Token string `form:"token" binding:"required"`
}

type ExternalInvitationAcceptValidateResponse struct {
	InvitationID  int64    `json:"invitation_id"`
	Role          string   `json:"role"`
	Name          string   `json:"name"`
	Email         string   `json:"email,omitempty"`
	ScholarID     string   `json:"scholar_id,omitempty"`
	Affiliation   string   `json:"affiliation,omitempty"`
	ProfileURL    string   `json:"profile_url,omitempty"`
	FieldsOfStudy []string `json:"fields_of_study,omitempty"`
	Conference    struct {
		ID      int64  `json:"id"`
		Title   string `json:"title"`
		Acronym string `json:"acronym"`
	} `json:"conference"`
	InvitedBy struct {
		Name  string `json:"name,omitempty"`
		Email string `json:"email,omitempty"`
	} `json:"invited_by"`
}

// ExternalInvitationAcceptRequest is the payload submitted from the prefilled
// register form. Email is editable in the UI (the invitation row's email
// is treated as a default, not a constraint).
type ExternalInvitationAcceptRequest struct {
	Token     string   `json:"token" binding:"required"`
	Email     string   `json:"email" binding:"required,email"`
	Password  string   `json:"password" binding:"required,min=8"`
	FirstName string   `json:"first_name" binding:"required"`
	LastName  string   `json:"last_name" binding:"required"`
	Domain    []string `json:"domain"`
}

type ExternalInvitationAcceptResponse struct {
	Token        string        `json:"token"` // JWT for auto-login
	User         *UserResponse `json:"user"`
	ConferenceID int64         `json:"conference_id"`
	Role         string        `json:"role"`
}
