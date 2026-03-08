package dto

import "time"

type ConferenceConfigTemplatePayload struct {
	Description         *string    `json:"description,omitempty"`
	Location            *string    `json:"location,omitempty"`
	LocationType        *string    `json:"location_type,omitempty"`
	Topics              []string   `json:"topics,omitempty"`
	Tracks              []string   `json:"tracks,omitempty"`
	ConferenceStartDate *time.Time `json:"conference_start_date,omitempty"`
	ConferenceEndDate   *time.Time `json:"conference_end_date,omitempty"`
	AbstractDeadline    *time.Time `json:"abstract_deadline,omitempty"`
	FullPaperDeadline   *time.Time `json:"full_paper_deadline,omitempty"`
	CameraReadyDeadline *time.Time `json:"camera_ready_deadline,omitempty"`
	MaxPages            *int       `json:"max_pages,omitempty"`
	AbstractMaxWords    *int       `json:"abstract_max_words,omitempty"`
	MinKeywords         *int       `json:"min_keywords,omitempty"`
	MaxKeywords         *int       `json:"max_keywords,omitempty"`
	AllowSupplementary  *bool      `json:"allow_supplementary,omitempty"`
	SupplementaryTypes  []string   `json:"supplementary_types,omitempty"`
	StrictDeadlines     *bool      `json:"strict_deadlines,omitempty"`
	ReviewType          *string    `json:"review_type,omitempty"`
	RebuttalStartDate   *time.Time `json:"rebuttal_start_date,omitempty"`
	RebuttalEndDate     *time.Time `json:"rebuttal_end_date,omitempty"`
	FinalDecisionDate   *time.Time `json:"final_decision_date,omitempty"`
	FileFormats         []string   `json:"file_formats,omitempty"`
	CallForPaperText    *string    `json:"call_for_paper_text,omitempty"`
	CoChairs            []string   `json:"co_chairs,omitempty"`
}

type ConferenceConfigTemplate struct {
	Name        string                           `json:"name" binding:"required"`
	Description string                           `json:"description"`
	Payload     *ConferenceConfigTemplatePayload `json:"payload" binding:"required"`
}

type ConferenceConfigTemplateResponse struct {
	ID          int64                            `json:"id"`
	Name        string                           `json:"name"`
	Description string                           `json:"description"`
	Payload     *ConferenceConfigTemplatePayload `json:"payload"`
	CreatedAt   time.Time                        `json:"created_at"`
	UpdatedAt   time.Time                        `json:"updated_at"`
}

type ConferenceConfigTemplateListResponse struct {
	Templates []*ConferenceConfigTemplateResponse `json:"templates"`
}

type ConferenceConfigTemplateListRequest struct {
	Search string `form:"search" json:"search"`
}

type ConferenceConfigTemplateCreateRequest struct {
	Template *ConferenceConfigTemplate `json:"template" binding:"required"`
}

type ConferenceConfigTemplateUpdateRequest struct {
	TemplateID int64                     `uri:"template_id" binding:"required"`
	Template   *ConferenceConfigTemplate `json:"template" binding:"required"`
}

type ConferenceConfigTemplateDeleteRequest struct {
	TemplateID int64 `uri:"template_id" binding:"required"`
}
