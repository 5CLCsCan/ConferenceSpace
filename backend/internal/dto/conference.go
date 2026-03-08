package dto

import "time"

type DeskRejectionThresholds struct {
	DeskRejectScore *float64 `json:"desk_reject_score,omitempty"`
	AcceptScore     *float64 `json:"accept_score,omitempty"`
}

type DeskRejectionCustomRules struct {
	MinDatasets                 *int     `json:"min_datasets,omitempty"`
	MinimumTables               *int     `json:"minimum_tables,omitempty"`
	AuthorAnonymizationRequired *bool    `json:"author_anonymization_required,omitempty"`
	CriticalKeywordsRequired    []string `json:"critical_keywords_required,omitempty"`
	BannedPhrases               []string `json:"banned_phrases,omitempty"`
}

type DeskRejectionSettings struct {
	Enabled          *bool                     `json:"enabled,omitempty"`
	MinReferences    *int                      `json:"min_references,omitempty"`
	RequiredSections []string                  `json:"required_sections,omitempty"`
	TitleMaxWords    *int                      `json:"title_max_words,omitempty"`
	MaxSentenceWords *int                      `json:"max_sentence_words,omitempty"`
	Thresholds       *DeskRejectionThresholds  `json:"thresholds,omitempty"`
	Weights          map[string]float64        `json:"weights,omitempty"`
	CustomRules      *DeskRejectionCustomRules `json:"custom_rules,omitempty"`
	ScopeKeywords    []string                  `json:"scope_keywords,omitempty"`
	PromptFragments  []string                  `json:"prompt_fragments,omitempty"`
}

type DiscussionSettings struct {
	Enabled             *bool      `json:"enabled,omitempty"`
	AllowAuthorResponse *bool      `json:"allow_author_response,omitempty"`
	StartAt             *time.Time `json:"start_at,omitempty"`
	EndAt               *time.Time `json:"end_at,omitempty"`
}

type RebuttalSettings struct {
	Enabled              *bool      `json:"enabled,omitempty"`
	StartAt              *time.Time `json:"start_at,omitempty"`
	EndAt                *time.Time `json:"end_at,omitempty"`
	CharacterLimit       *int       `json:"character_limit,omitempty"`
	AllowRevisions       *bool      `json:"allow_revisions,omitempty"`
	AllowNewResults      *bool      `json:"allow_new_results,omitempty"`
	RequireResponseToAll *bool      `json:"require_response_to_all,omitempty"`
}

type WorkflowSettings struct {
	StrictDeadlines *bool `json:"strict_deadlines,omitempty"`
}

type ConferenceConfiguration struct {
	StartDate                    *time.Time             `json:"start_date,omitempty"`
	EndDate                      *time.Time             `json:"end_date,omitempty"`
	AbstractSubmissionDeadline   *time.Time             `json:"abstract_submission_deadline,omitempty"`
	FullPaperSubmissionDeadline  *time.Time             `json:"full_paper_submission_deadline,omitempty"`
	CameraReadyDeadline          *time.Time             `json:"camera_ready_deadline,omitempty"`
	Format                       *string                `json:"format,omitempty"`
	EstimatedNumberOfSubmission  *int                   `json:"estimated_number_of_submission,omitempty"`
	ReviewType                   *string                `json:"review_type,omitempty"`
	SubmissionType               *string                `json:"submission_type,omitempty"`
	HaveCOI                      *bool                  `json:"have_coi,omitempty"`
	COIWindowYears               *int                   `json:"coi_window_years,omitempty"` // Years to look back for collaborations (e.g., 4)
	MaximumPages                 *int                   `json:"maximum_pages,omitempty"`
	SubmissionFormat             *string                `json:"submission_format,omitempty"`
	RequireCompleteAuthorProfile *bool                  `json:"require_complete_author_profile,omitempty"`
	AllowPaperWithDrawls         *bool                  `json:"allow_paper_withdrawls,omitempty"`
	CallForPaperText             *string                `json:"call_for_paper_text,omitempty"`
	DeskRejectionSettings        *DeskRejectionSettings `json:"desk_rejection_settings,omitempty"`
	DiscussionSettings           *DiscussionSettings    `json:"discussion_settings,omitempty"`
	RebuttalSettings             *RebuttalSettings      `json:"rebuttal_settings,omitempty"`
	WorkflowSettings             *WorkflowSettings      `json:"workflow_settings,omitempty"`
}

type Conference struct {
	Title          string                   `json:"title" binding:"required"`
	Acronym        string                   `json:"acronym" binding:"required"`
	Description    string                   `json:"description"`
	Chair          string                   `json:"chair"`
	CoChairs       []string                 `json:"co_chairs"`
	Domain         []string                 `json:"domain"`
	Tracks         []string                 `json:"tracks"`
	Venue          string                   `json:"venue"`
	Configurations *ConferenceConfiguration `json:"configurations"`
}

type ConferenceResponse struct {
	ID             int64                    `json:"id"`
	Title          string                   `json:"title"`
	Acronym        string                   `json:"acronym"`
	Description    string                   `json:"description"`
	Chair          string                   `json:"chair"`
	CoChairs       []string                 `json:"co_chairs"`
	Domain         []string                 `json:"domain"`
	Tracks         []string                 `json:"tracks"`
	Venue          string                   `json:"venue"`
	Configurations *ConferenceConfiguration `json:"configurations"`
	Status         string                   `json:"status"` // open, reviewing, completed
	CreatedAt      time.Time                `json:"created_at"`
	UpdatedAt      time.Time                `json:"updated_at"`
	UserRole       string                   `json:"user_role,omitempty"` // User's role in this conference (if queried)
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
	Status        string `form:"status" json:"status"`               // Filter by status: "active", "upcoming", "archived"
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

// ConferenceTransitionStatusRequest represents the request to transition conference status
type ConferenceTransitionStatusRequest struct {
	ConferenceID int64  `uri:"conference_id" json:"conference_id" binding:"required"`
	NewStatus    string `json:"new_status" binding:"required,oneof=open reviewing completed"`
}

// ConferenceTransitionStatusResponse represents the response after status transition
type ConferenceTransitionStatusResponse struct {
	Message            string `json:"message"`
	PreviousStatus     string `json:"previous_status"`
	NewStatus          string `json:"new_status"`
	AssignmentsCreated int    `json:"assignments_created,omitempty"` // Only set when transitioning to reviewing
}
