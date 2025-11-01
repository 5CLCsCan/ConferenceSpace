package dto

import "time"

type ConferenceConfiguration struct {
	StartDate                    *time.Time `json:"start_date,omitempty"`
	EndDate                      *time.Time `json:"end_date,omitempty"`
	AbstractSubmissionDeadline   *time.Time `json:"abstract_submission_deadline,omitempty"`
	FullPaperSubmissionDeadline  *time.Time `json:"full_paper_submission_deadline,omitempty"`
	CameraReadyDeadline          *time.Time `json:"camera_ready_deadline,omitempty"`
	Format                       *string    `json:"format,omitempty"`
	EstimatedNumberOfSubmission  *int       `json:"estimated_number_of_submission,omitempty"`
	ReviewType                   *string    `json:"review_type,omitempty"`
	SubmissionType               *string    `json:"submission_type,omitempty"`
	HaveCOI                      *bool      `json:"have_coi,omitempty"`
	COIWindowYears               *int       `json:"coi_window_years,omitempty"` // Years to look back for collaborations (e.g., 4)
	MaximumPages                 *int       `json:"maximum_pages,omitempty"`
	SubmissionFormat             *string    `json:"submission_format,omitempty"`
	RequireCompleteAuthorProfile *bool      `json:"require_complete_author_profile,omitempty"`
	AllowPaperWithDrawls         *bool      `json:"allow_paper_withdrawls,omitempty"`
}

type Conference struct {
	Title          string                   `json:"title" binding:"required"`
	Acronym        string                   `json:"acronym" binding:"required"`
	Description    string                   `json:"description"`
	Chair          string                   `json:"chair"`
	PrimaryContact int64                    `json:"primary_contact"`
	AreaChair      int64                    `json:"area_chair"`
	Domain         []string                 `json:"domain"`
	Configurations *ConferenceConfiguration `json:"configurations"`
}

type ConferenceResponse struct {
	ID             int64                    `json:"id"`
	Title          string                   `json:"title"`
	Acronym        string                   `json:"acronym"`
	Description    string                   `json:"description"`
	Chair          string                   `json:"chair"`
	PrimaryContact int64                    `json:"primary_contact"`
	AreaChair      int64                    `json:"area_chair"`
	Domain         []string                 `json:"domain"`
	Configurations *ConferenceConfiguration `json:"configurations"`
	CreatedAt      time.Time                `json:"created_at"`
	UpdatedAt      time.Time                `json:"updated_at"`
}

type ConferenceCreateRequest struct {
	Conference *Conference `json:"conference" binding:"required"`
}

type ConferenceGetRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
}

type ConferenceUpdateRequest struct {
	ConferenceID int64       `uri:"conference_id" binding:"required"`
	Conference   *Conference `json:"conference"`
}

type ConferenceDeleteRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
}

type ConferenceListRequest struct {
	Limit         int    `form:"limit" json:"limit"`
	Offset        int    `form:"offset" json:"offset"`
	Title         string `form:"title" json:"title"`
	Acronym       string `form:"acronym" json:"acronym"`
	Chair         string `form:"chair" json:"chair"`
	MyConferences bool   `form:"myConferences" json:"myConferences"` // Filter conferences where user has a role
	Role          string `form:"role" json:"role"`                   // Filter by specific role: "chair", "author", "reviewer"
	MyBookmark    bool   `form:"myBookmark" json:"myBookmark"`       // Filter conferences that user has bookmarked
}

type UserConferenceResponse struct {
	ConferenceResponse
	UserRole string `json:"user_role,omitempty"` // "chair", "author", "reviewer", or empty
}

type ConferenceListResponse struct {
	Conferences []*ConferenceResponse `json:"conferences"`
	Total       int64                 `json:"total"`
}

type UserConferenceListResponse struct {
	Conferences []*UserConferenceResponse `json:"conferences"`
	Total       int64                     `json:"total"`
}

type ConferenceBookmarkRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
}

type ConferenceBookmarkResponse struct {
	Message      string `json:"message"`
	IsBookmarked bool   `json:"is_bookmarked"`
}
