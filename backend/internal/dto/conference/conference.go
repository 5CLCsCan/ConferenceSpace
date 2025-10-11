package conference

import "time"

type Configuration struct {
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
	MaximumPages                 *int       `json:"maximum_pages,omitempty"`
	SubmissionFormat             *string    `json:"submission_format,omitempty"`
	RequireCompleteAuthorProfile *bool      `json:"require_complete_author_profile,omitempty"`
	AllowPaperWithDrawls         *bool      `json:"allow_paper_withdrawls,omitempty"`
}

type Conference struct {
	Title          string         `json:"title" binding:"required"`
	Acronym        string         `json:"acronym" binding:"required"`
	Description    string         `json:"description"`
	Chair          string         `json:"chair" binding:"required"`
	PrimaryContact int64          `json:"primary_contact" binding:"required"`
	AreaChair      int64          `json:"area_chair" binding:"required"`
	Domain         []string       `json:"domain"`
	Configurations *Configuration `json:"configurations"`
}

type Response struct {
	ID             int64          `json:"id"`
	Title          string         `json:"title"`
	Acronym        string         `json:"acronym"`
	Description    string         `json:"description"`
	Chair          string         `json:"chair"`
	PrimaryContact int64          `json:"primary_contact"`
	AreaChair      int64          `json:"area_chair"`
	Domain         []string       `json:"domain"`
	Configurations *Configuration `json:"configurations"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

type CreateRequest struct {
	Conference *Conference `json:"conference" binding:"required"`
}

type UpdateRequest struct {
	Conference *Conference `json:"conference" binding:"required"`
}

type ListRequest struct {
	Limit   int    `form:"limit" json:"limit"`
	Offset  int    `form:"offset" json:"offset"`
	Title   string `form:"title" json:"title"`
	Acronym string `form:"acronym" json:"acronym"`
	Chair   string `form:"chair" json:"chair"`
}

type ListResponse struct {
	Conferences []*Response `json:"conferences"`
	Total       int64       `json:"total"`
}
