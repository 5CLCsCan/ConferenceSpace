package dto

import "time"

// ExternalInvitation is the response DTO for a single external invitation.
type ExternalInvitation struct {
	ID           int64     `json:"id"`
	ConferenceID int64     `json:"conference_id"`
	Role         string    `json:"role"`
	ScholarID    string    `json:"scholar_id,omitempty"`
	Name         string    `json:"name"`
	Email        string    `json:"email,omitempty"`
	Affiliation  string    `json:"affiliation,omitempty"`
	ProfileURL   string    `json:"profile_url,omitempty"`
	Status       string    `json:"status"`
	InvitedBy    int64     `json:"invited_by"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ExternalInvitationCreateItem is one invitation in the batch create request.
type ExternalInvitationCreateItem struct {
	Role        string `json:"role" binding:"required"`
	ScholarID   string `json:"scholar_id"`
	Name        string `json:"name" binding:"required"`
	Email       string `json:"email"`
	Affiliation string `json:"affiliation"`
	ProfileURL  string `json:"profile_url"`
}

// ExternalInvitationFailure represents a single failed invitation in a batch create.
type ExternalInvitationFailure struct {
	ScholarID string `json:"scholar_id"`
	Error     string `json:"error"`
}

// ExternalInvitationBatchCreateRequest is the POST request body.
//
// Note: Invitations intentionally omits binding:"required,min=1". ShouldBindUri
// runs struct-wide validation before the JSON body is bound, so a required tag
// on the body field would fail with "required" before ShouldBindJSON ever runs.
// The controller enforces the non-empty check explicitly.
type ExternalInvitationBatchCreateRequest struct {
	ConferenceID int64                          `uri:"conference_id" binding:"required"`
	Invitations  []ExternalInvitationCreateItem `json:"invitations"`
}

// ExternalInvitationBatchCreateResponse is the POST response.
type ExternalInvitationBatchCreateResponse struct {
	Success []ExternalInvitation        `json:"success"`
	Failed  []ExternalInvitationFailure `json:"failed,omitempty"`
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
