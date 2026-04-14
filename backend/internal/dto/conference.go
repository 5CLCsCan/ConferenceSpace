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
	PCMembers      []string                 `json:"pc_members"`
	Domain         []string                 `json:"domain"`
	Tracks         []string                 `json:"tracks"`
	Venue          string                   `json:"venue"`
	Configurations *ConferenceConfiguration `json:"configurations"`
	Status         string                   `json:"status,omitempty"`
}

type ConferenceResponse struct {
	ID             int64                    `json:"id"`
	Title          string                   `json:"title"`
	Acronym        string                   `json:"acronym"`
	Description    string                   `json:"description"`
	Chair          string                   `json:"chair"`
	CoChairs       []string                 `json:"co_chairs"`
	PCMembers      []string                 `json:"pc_members"`
	Domain         []string                 `json:"domain"`
	Tracks         []string                 `json:"tracks"`
	Venue          string                   `json:"venue"`
	Configurations *ConferenceConfiguration `json:"configurations"`
	Status         string                   `json:"status"` // draft, open, reviewing, completed, archived
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
	NewStatus    string `json:"new_status" binding:"required,oneof=draft open reviewing completed archived"`
}

// ConferenceTransitionStatusResponse represents the response after status transition
type ConferenceTransitionStatusResponse struct {
	Message            string `json:"message"`
	PreviousStatus     string `json:"previous_status"`
	NewStatus          string `json:"new_status"`
	AssignmentsCreated int    `json:"assignments_created,omitempty"` // Only set when transitioning to reviewing
}

// ConferenceStatsRequest is the URI binding for GET /conferences/:conference_id/stats
type ConferenceStatsRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
}

// ConferenceSubmissionStats holds submission counts broken down by status.
type ConferenceSubmissionStats struct {
	Total     int `json:"total"`
	Draft     int `json:"draft"`
	Submitted int `json:"submitted"`
	Accepted  int `json:"accepted"`
	Rejected  int `json:"rejected"`
}

// ConferenceReviewStats holds review/assignment progress counts.
type ConferenceReviewStats struct {
	TotalAssigned int `json:"total_assigned"`
	Completed     int `json:"completed"`
	Pending       int `json:"pending"`
}

// ConferenceTrackStats holds per-track submission counts.
type ConferenceTrackStats struct {
	Name            string `json:"name"`
	SubmissionCount int    `json:"submission_count"`
	AcceptedCount   int    `json:"accepted_count"`
}

// ConferenceStatsResponse is the response for GET /conferences/:conference_id/stats
type ConferenceStatsResponse struct {
	Submissions ConferenceSubmissionStats `json:"submissions"`
	Reviews     ConferenceReviewStats     `json:"reviews"`
	Tracks      []ConferenceTrackStats    `json:"tracks"`
}

// ConferenceRebuttalConfig represents the dedicated rebuttal configuration columns on conferences table.
// This is separate from the legacy RebuttalSettings inside ConferenceConfiguration (JSONB).
type ConferenceRebuttalConfig struct {
	Enabled           bool       `json:"enabled"`
	Phase             string     `json:"phase"`
	StartAt           *time.Time `json:"start_at,omitempty"`
	Deadline          *time.Time `json:"deadline,omitempty"`
	CharLimitGeneral  int        `json:"char_limit_general"`
	CharLimitPerPoint int        `json:"char_limit_per_point"`
	AllowDiscussion   bool       `json:"allow_discussion"`
}

// SaveRebuttalConfigRequest is the body for PATCH /conferences/:id/rebuttal/settings
type SaveRebuttalConfigRequest struct {
	ConferenceID      int64      `uri:"conference_id"`
	Enabled           bool       `json:"enabled"`
	StartAt           *time.Time `json:"start_at,omitempty"`
	Deadline          *time.Time `json:"deadline,omitempty"`
	CharLimitGeneral  int        `json:"char_limit_general"`
	CharLimitPerPoint int        `json:"char_limit_per_point"`
	AllowDiscussion   bool       `json:"allow_discussion"`
}

// RebuttalPhaseRequest is the URI for phase transition endpoints
type RebuttalPhaseRequest struct {
	ConferenceID int64 `uri:"conference_id"`
}

// RebuttalOverviewRow is one row in the chair's rebuttal management table
type RebuttalOverviewRow struct {
	SubmissionID   int64  `json:"submission_id"`
	Title          string `json:"title"`
	RebuttalPhase  string `json:"rebuttal_phase"`
	HasResponse    bool   `json:"has_response"`
	TotalReviewers int    `json:"total_reviewers"`
	AckedReviewers int    `json:"acked_reviewers"`
}

// RebuttalOverviewResponse is returned by GET .../rebuttal/settings
type RebuttalOverviewResponse struct {
	Settings    ConferenceRebuttalConfig `json:"settings"`
	Submissions []RebuttalOverviewRow    `json:"submissions"`
}
