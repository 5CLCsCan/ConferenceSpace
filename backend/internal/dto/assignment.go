package dto

import "time"

// Assignment represents a paper assignment for both request and response
type Assignment struct {
	ID                int64       `json:"id,omitempty"`
	ConferenceID      int64       `json:"conference_id,omitempty"`
	SubmissionID      int64       `json:"submission_id" binding:"required"`
	ReviewerID        int64       `json:"reviewer_id" binding:"required"`
	Score             float64     `json:"score,omitempty"`
	Status            string      `json:"status,omitempty"` // pending, accepted, declined, completed
	AssignedAt        time.Time   `json:"assigned_at,omitempty"`
	CompletedAt       *time.Time  `json:"completed_at,omitempty"`
	ReviewStatus      *string     `json:"review_status,omitempty"` // draft, submitted
	ReviewScore       *float64    `json:"review_score,omitempty"`
	ReviewData        *ReviewData `json:"review_data,omitempty"`
	ReviewSubmittedAt *time.Time  `json:"review_submitted_at,omitempty"`
	CreatedAt         time.Time   `json:"created_at,omitempty"`
	UpdatedAt         time.Time   `json:"updated_at,omitempty"`
	ReviewerEmail     string      `json:"reviewer_email,omitempty"`
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
	Strengths  string `json:"strengths"`
	Weaknesses string `json:"weaknesses,omitempty"`
	Questions  string `json:"questions,omitempty"`
}

// ReviewSaveRequest represents the request to save or submit a review
type ReviewSaveRequest struct {
	AssignmentID int64       `uri:"assignment_id" json:"assignment_id" binding:"required"`
	ConferenceID int64       `uri:"conference_id" json:"conference_id" binding:"required"`
	ReviewScore  *float64    `json:"review_score" binding:"omitempty,min=0,max=10"`
	ReviewData   *ReviewData `json:"review_data,omitempty"`
	Status       string      `json:"status" binding:"required,oneof=draft submitted"`
}

// ReviewGetRequest represents the request to get a review
type ReviewGetRequest struct {
	AssignmentID int64 `uri:"assignment_id" binding:"required"`
	ConferenceID int64 `uri:"conference_id" binding:"required"`
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
