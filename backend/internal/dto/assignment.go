package dto

import "time"

// Assignment represents a paper assignment for both request and response
type Assignment struct {
	ID                         int64       `json:"id,omitempty"`
	ConferenceID               int64       `json:"conference_id,omitempty"`
	SubmissionID               int64       `json:"submission_id" binding:"required"`
	ReviewerID                 int64       `json:"reviewer_id" binding:"required"`
	Score                      float64     `json:"score,omitempty"`
	Status                     string      `json:"status,omitempty"` // pending, accepted, declined, completed
	AssignedAt                 time.Time   `json:"assigned_at,omitempty"`
	CompletedAt                *time.Time  `json:"completed_at,omitempty"`
	ReviewStatus               *string     `json:"review_status,omitempty"` // draft, submitted
	ReviewScore                *float64    `json:"review_score,omitempty"`
	ReviewData                 *ReviewData `json:"review_data,omitempty"`
	ReviewSubmittedAt          *time.Time  `json:"review_submitted_at,omitempty"`
	RebuttalStatus             string      `json:"rebuttal_status,omitempty"`
	RebuttalSubmittedAt        *time.Time  `json:"rebuttal_submitted_at,omitempty"`
	RebuttalAcknowledgedAt     *time.Time  `json:"rebuttal_acknowledged_at,omitempty"`
	PostRebuttalScore          *int        `json:"post_rebuttal_score,omitempty"`
	PostRebuttalRecommendation *string     `json:"post_rebuttal_recommendation,omitempty"`
	PostRebuttalComment        *string     `json:"post_rebuttal_comment,omitempty"`
	PostRebuttalUpdatedAt      *time.Time  `json:"post_rebuttal_updated_at,omitempty"`
	CreatedAt                  time.Time   `json:"created_at,omitempty"`
	UpdatedAt                  time.Time   `json:"updated_at,omitempty"`
	ReviewerEmail              string      `json:"reviewer_email,omitempty"`
}

// AssignmentCreateRequest represents the request to create a single assignment
type AssignmentCreateRequest struct {
	Assignment *Assignment `json:"assignment" binding:"required"`
}

// AssignmentListRequest represents the request for listing assignments with pagination and filters
type AssignmentListRequest struct {
	Limit        int    `form:"limit" json:"limit"`
	Offset       int    `form:"offset" json:"offset"`
	SubmissionID int64  `form:"submission_id" json:"submission_id"`
	ReviewerID   int64  `form:"reviewer_id" json:"reviewer_id"`
	Status       string `form:"status" json:"status"`
}

// AssignmentListResponse represents the response for listing assignments
type AssignmentListResponse struct {
	Assignments []*Assignment `json:"assignments"`
	Total       int64         `json:"total"`
	Limit       int           `json:"limit"`
	Offset      int           `json:"offset"`
}

// AssignmentUpdateStatusRequest represents the request to update an assignment's status
type AssignmentUpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending accepted declined completed"`
}

// AutoAssignRequest represents the request for auto-assignment
type AutoAssignRequest struct {
	MinReviewersPerPaper int     `json:"min_reviewers_per_paper" binding:"required,min=1"`
	MaxReviewersPerPaper int     `json:"max_reviewers_per_paper" binding:"required,min=1"`
	MaxPapersPerReviewer *int    `json:"max_papers_per_reviewer,omitempty"`
	MinScoreThreshold    float64 `json:"min_score_threshold"`
	DryRun               bool    `json:"dry_run"`
}

// AutoAssignResponse represents the response for auto-assignment
type AutoAssignResponse struct {
	TotalSubmissions int           `json:"total_submissions"`
	TotalReviewers   int           `json:"total_reviewers"`
	TotalAssignments int           `json:"total_assignments"`
	AverageScore     float64       `json:"average_score"`
	UnassignedPapers []int64       `json:"unassigned_papers"`
	ReviewerLoad     map[int64]int `json:"reviewer_load"`
	Assignments      []*Assignment `json:"assignments,omitempty"` // Only populated if DryRun=true
}

// ================== Review DTOs ==================

// ReviewData represents the structured review data stored in JSONB
type ReviewData struct {
	Criteria       ReviewCriteria `json:"criteria" binding:"required"`
	Feedback       ReviewFeedback `json:"feedback" binding:"required"`
	Recommendation string         `json:"recommendation" binding:"required,oneof=strong_accept accept weak_accept borderline weak_reject reject strong_reject"`
	Confidence     string         `json:"confidence" binding:"required,oneof=high medium low"`
}

// ReviewCriteria represents individual scoring criteria
type ReviewCriteria struct {
	Originality      int `json:"originality" binding:"required,min=1,max=10"`
	TechnicalQuality int `json:"technical_quality" binding:"required,min=1,max=10"`
	Clarity          int `json:"clarity" binding:"required,min=1,max=10"`
	Significance     int `json:"significance" binding:"required,min=1,max=10"`
	Methodology      int `json:"methodology" binding:"required,min=1,max=10"`
}

// ReviewFeedback represents textual feedback sections
type ReviewFeedback struct {
	Summary    string `json:"summary,omitempty"`
	Strengths  string `json:"strengths"`
	Weaknesses string `json:"weaknesses,omitempty"`
	Questions  string `json:"questions,omitempty"`
}

// ReviewSaveRequest represents the request to save or submit a review
type ReviewSaveRequest struct {
	AssignmentID                  int64       `json:"-"`
	ConferenceID                  int64       `json:"-"`
	ReviewScore                   *float64    `json:"review_score" binding:"omitempty,min=0,max=10"`
	ReviewData                    *ReviewData `json:"review_data,omitempty"`
	Status                        string      `json:"status" binding:"required,oneof=draft submitted"`
	AuditFailureOverrideConfirmed bool        `json:"audit_failure_override_confirmed,omitempty"`
}

// ReviewGetRequest represents the request to get a review
type ReviewGetRequest struct {
	AssignmentID int64 `uri:"assignment_id" binding:"required"`
	ConferenceID int64 `uri:"conference_id" binding:"required"`
}

type ReviewerBriefingRequest struct {
	AssignmentID int64 `uri:"assignment_id" binding:"required"`
	ConferenceID int64 `uri:"conference_id" binding:"required"`
}

type PaperAnnotationRequest struct {
	AssignmentID int64 `uri:"assignment_id" binding:"required"`
	ConferenceID int64 `uri:"conference_id" binding:"required"`
}

type ReviewAuditMode string

const (
	ReviewAuditModeDraftSave         ReviewAuditMode = "draft_save"
	ReviewAuditModeSubmitPreflight   ReviewAuditMode = "submit_preflight"
	ReviewAuditModeSubmitEnforcement ReviewAuditMode = "submit_enforcement"
)

type ReviewAuditRequest struct {
	AssignmentID int64           `json:"-"`
	ConferenceID int64           `json:"-"`
	Mode         ReviewAuditMode `json:"mode" binding:"required,oneof=draft_save submit_preflight submit_enforcement"`
	ReviewScore  *float64        `json:"review_score" binding:"omitempty,min=0,max=10"`
	ReviewData   *ReviewData     `json:"review_data" binding:"required"`
}

type ReviewAuditFinding struct {
	Code                 string `json:"code"`
	Severity             string `json:"severity"`
	Field                string `json:"field"`
	Message              string `json:"message"`
	Suggestion           string `json:"suggestion"`
	ConditionFingerprint string `json:"condition_fingerprint"`
}

type ReviewAuditResponse struct {
	Status            string               `json:"status"`
	RunID             string               `json:"run_id,omitempty"`
	ActiveFindings    []ReviewAuditFinding `json:"active_findings,omitempty"`
	DismissedFindings []ReviewAuditFinding `json:"dismissed_findings,omitempty"`
}

type ReviewAuditDismissal struct {
	Code                 string    `json:"code"`
	ConditionFingerprint string    `json:"condition_fingerprint"`
	DismissedAt          time.Time `json:"dismissed_at"`
}

type ReviewAuditState struct {
	DismissedWarnings []ReviewAuditDismissal `json:"dismissed_warnings,omitempty"`
}

type ReviewAuditDismissalRequest struct {
	AssignmentID int64                   `json:"-"`
	ConferenceID int64                   `json:"-"`
	Action       string                  `json:"action" binding:"required,oneof=dismiss undismiss"`
	Finding      ReviewAuditDismissalRef `json:"finding" binding:"required"`
}

type ReviewAuditDismissalRef struct {
	Code                 string `json:"code" binding:"required"`
	Severity             string `json:"severity" binding:"required,oneof=warning blocking"`
	Field                string `json:"field" binding:"required"`
	ConditionFingerprint string `json:"condition_fingerprint" binding:"required"`
}

type ReviewAuditDismissalResponse struct {
	State ReviewAuditState `json:"state"`
}

type ReviewAuditEvent struct {
	AssignmentID int64                  `json:"assignment_id"`
	ConferenceID int64                  `json:"conference_id"`
	ActorID      int64                  `json:"actor_id"`
	ActorEmail   string                 `json:"actor_email"`
	EventType    string                 `json:"event_type"`
	Payload      map[string]interface{} `json:"payload,omitempty"`
}

// ReviewListRequest represents the request to list reviews for a submission
type ReviewListRequest struct {
	ConferenceID int64 `uri:"conference_id"`
	SubmissionID int64 `uri:"submission_id"`
	Limit        int   `form:"limit" json:"limit"`
	Offset       int   `form:"offset" json:"offset"`
}

// ReviewListResponse represents the response for listing reviews
type ReviewListResponse struct {
	Reviews []*Assignment `json:"reviews"`
	Total   int64         `json:"total"`
	Limit   int           `json:"limit"`
	Offset  int           `json:"offset"`
}

// ReviewAnalyticsResponse represents aggregated analytics for submission reviews
type ReviewAnalyticsResponse struct {
	TotalReviews           int                          `json:"total_reviews"`
	AverageScore           float64                      `json:"average_score"`
	ScoreDistribution      ReviewScoreDistribution      `json:"score_distribution"`
	ConfidenceDistribution ReviewConfidenceDistribution `json:"confidence_distribution"`
	CriteriaAverages       ReviewCriteriaAverages       `json:"criteria_averages"`
}

// ReviewScoreDistribution represents recommendation distribution
type ReviewScoreDistribution struct {
	StrongAccept int `json:"strong_accept"`
	Accept       int `json:"accept"`
	WeakAccept   int `json:"weak_accept"`
	Borderline   int `json:"borderline"`
	WeakReject   int `json:"weak_reject"`
	Reject       int `json:"reject"`
	StrongReject int `json:"strong_reject"`
}

// ReviewConfidenceDistribution represents confidence level distribution
type ReviewConfidenceDistribution struct {
	High   int `json:"high"`
	Medium int `json:"medium"`
	Low    int `json:"low"`
}

// ReviewCriteriaAverages represents average scores for each criterion
type ReviewCriteriaAverages struct {
	Originality      float64 `json:"originality"`
	TechnicalQuality float64 `json:"technical_quality"`
	Clarity          float64 `json:"clarity"`
	Significance     float64 `json:"significance"`
	Methodology      float64 `json:"methodology"`
}

// ================== Suggestion DTOs ==================

// SuggestedReviewer represents a suggested reviewer for a paper
type SuggestedReviewer struct {
	AssignmentID  int64   `json:"assignment_id"`
	ReviewerID    int64   `json:"reviewer_id"`
	ReviewerEmail string  `json:"reviewer_email"`
	Score         float64 `json:"score"`
}

// SuggestionGroup represents suggestions grouped by submission
type SuggestionGroup struct {
	SubmissionID    int64               `json:"submission_id"`
	SubmissionTitle string              `json:"submission_title"`
	Reviewers       []SuggestedReviewer `json:"reviewers"`
}

// SuggestionsListResponse is the response for listing suggestions
type SuggestionsListResponse struct {
	Suggestions      []*SuggestionGroup `json:"suggestions"`
	TotalPapers      int                `json:"total_papers"`
	TotalSuggestions int64              `json:"total_suggestions"`
}

// ConfirmSuggestionsRequest is the request to confirm suggestions
type ConfirmSuggestionsRequest struct {
	AssignmentIDs []int64 `json:"assignment_ids,omitempty"`
}

// ConfirmSuggestionsResponse is the response for confirming suggestions
type ConfirmSuggestionsResponse struct {
	ConfirmedCount int64  `json:"confirmed_count"`
	Message        string `json:"message"`
}

// AddSuggestionRequest is the request to manually add a suggested reviewer
type AddSuggestionRequest struct {
	SubmissionID int64 `json:"submission_id" binding:"required"`
	ReviewerID   int64 `json:"reviewer_id" binding:"required"`
}

// AddSuggestionResponse is the response for adding a suggestion
type AddSuggestionResponse struct {
	Assignment *Assignment `json:"assignment"`
	COIWarning *COIWarning `json:"coi_warning,omitempty"`
}

// COIWarning represents a conflict of interest warning
type COIWarning struct {
	HasConflict bool     `json:"has_conflict"`
	Reasons     []string `json:"reasons"`
}

// COICheckResponse is the response for checking COI
type COICheckResponse struct {
	ReviewerID  int64    `json:"reviewer_id"`
	HasConflict bool     `json:"has_conflict"`
	Reasons     []string `json:"reasons"`
}

// ConfirmedReviewer represents a reviewer with confirmed assignment
type ConfirmedReviewer struct {
	AssignmentID  int64   `json:"assignment_id"`
	ReviewerID    int64   `json:"reviewer_id"`
	ReviewerEmail string  `json:"reviewer_email"`
	Score         float64 `json:"score"`
	Status        string  `json:"status"`        // pending, accepted, declined, completed
	ReviewStatus  string  `json:"review_status"` // not_started, in_progress, submitted
}

// ConfirmedAssignmentGroup represents confirmed assignments grouped by submission
type ConfirmedAssignmentGroup struct {
	SubmissionID    int64               `json:"submission_id"`
	SubmissionTitle string              `json:"submission_title"`
	Reviewers       []ConfirmedReviewer `json:"reviewers"`
}

// ConfirmedAssignmentsListResponse is the response for listing confirmed assignments
type ConfirmedAssignmentsListResponse struct {
	Assignments      []*ConfirmedAssignmentGroup `json:"assignments"`
	TotalPapers      int                         `json:"total_papers"`
	TotalAssignments int64                       `json:"total_assignments"`
}

// ================== Rebuttal DTOs ==================

// RebuttalPointResponse is the author's response to a single review point.
type RebuttalPointResponse struct {
	PointID        string `json:"point_id"`
	AuthorResponse string `json:"author_response"`
}

// RebuttalPerReviewerResponse is the author's structured response to one reviewer's points.
type RebuttalPerReviewerResponse struct {
	Points []RebuttalPointResponse `json:"points"`
}

// SubmitRebuttalPointInput is one point inside the PUT rebuttal request body.
type SubmitRebuttalPointInput struct {
	PointID         string `json:"point_id"`
	AssignmentID    int64  `json:"assignment_id"`
	Category        string `json:"category"`
	Section         string `json:"section"`
	OriginalComment string `json:"original_comment"`
	AuthorResponse  string `json:"author_response"`
}

// SubmitRebuttalRequest is the body for PUT /conferences/:id/submissions/:id/rebuttal
type SubmitRebuttalRequest struct {
	ConferenceID    int64                      `uri:"conference_id" json:"conference_id"`
	SubmissionID    int64                      `uri:"submission_id" json:"submission_id"`
	GeneralResponse string                     `json:"general_response" binding:"required"`
	Points          []SubmitRebuttalPointInput `json:"points"`
}

// AcknowledgeRebuttalRequest is the URI for PUT /conferences/:id/assignments/:id/rebuttal/acknowledge
type AcknowledgeRebuttalRequest struct {
	ConferenceID int64 `uri:"conference_id" json:"conference_id"`
	AssignmentID int64 `uri:"assignment_id" json:"assignment_id"`
}

// RebuttalStatusResponse is returned after submit or acknowledge actions.
type RebuttalStatusResponse struct {
	RebuttalPhase          string     `json:"rebuttal_phase"`
	RebuttalStatus         string     `json:"rebuttal_status"`
	RebuttalSubmittedAt    *time.Time `json:"rebuttal_submitted_at,omitempty"`
	RebuttalAcknowledgedAt *time.Time `json:"rebuttal_acknowledged_at,omitempty"`
}

// RebuttalPointDTO represents a single per-reviewer review point.
type RebuttalPointDTO struct {
	PointID              string `json:"point_id"`
	AssignmentID         int64  `json:"assignment_id"`
	Category             string `json:"category"`
	Section              string `json:"section"`
	OriginalComment      string `json:"original_comment"`
	AuthorResponse       string `json:"author_response"`
	Status               string `json:"status"`
	ReviewerAcknowledged bool   `json:"reviewer_acknowledged"`
	ReviewerNote         string `json:"reviewer_note,omitempty"`
}

// GetRebuttalRequest is the URI for GET .../rebuttal
type GetRebuttalRequest struct {
	ConferenceID int64 `uri:"conference_id" json:"conference_id"`
	SubmissionID int64 `uri:"submission_id" json:"submission_id"`
}

// RebuttalAssignmentStatus carries per-assignment rebuttal acknowledgment info.
type RebuttalAssignmentStatus struct {
	AssignmentID               int64   `json:"assignment_id"`
	RebuttalStatus             string  `json:"rebuttal_status"` // none | submitted | acknowledged
	ReviewScore                float64     `json:"review_score"`
	ReviewData                 *ReviewData `json:"review_data,omitempty"`
	PostRebuttalScore          int         `json:"post_rebuttal_score"`
	PostRebuttalRecommendation string      `json:"post_rebuttal_recommendation"`
}

// GetRebuttalResponse is the full rebuttal state returned by GET .../rebuttal
type GetRebuttalResponse struct {
	Phase             string                     `json:"phase"`
	GeneralResponse   string                     `json:"general_response"`
	SubmittedAt       *time.Time                 `json:"submitted_at,omitempty"`
	Points            []RebuttalPointDTO         `json:"points"`
	Assignments       []RebuttalAssignmentStatus `json:"assignments"`
	CharLimitGeneral  int                        `json:"char_limit_general"`
	CharLimitPerPoint int                        `json:"char_limit_per_point"`
	Deadline          *time.Time                 `json:"deadline,omitempty"`
}

// AcknowledgePointRequest is URI + body for PUT .../rebuttal/points/:point_id/acknowledge
type AcknowledgePointRequest struct {
	ConferenceID int64  `uri:"conference_id" json:"conference_id"`
	AssignmentID int64  `uri:"assignment_id" json:"assignment_id"`
	PointID      string `uri:"point_id" json:"point_id"`
	Status       string `json:"status" binding:"required,oneof=addressed partially_addressed not_addressed pending_review"`
	Note         string `json:"note"`
}

// PostRebuttalScoreRequest is the body for PUT .../assignments/:id/post-rebuttal-score
type PostRebuttalScoreRequest struct {
	ConferenceID   int64  `uri:"conference_id"`
	AssignmentID   int64  `uri:"assignment_id"`
	Score          int    `json:"score" binding:"required,min=1,max=10"`
	Recommendation string `json:"recommendation" binding:"required,oneof=accept reject borderline"`
	Comment        string `json:"comment"`
}
