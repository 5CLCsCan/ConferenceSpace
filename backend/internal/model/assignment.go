package model

import (
	"encoding/json"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

const (
	AssignmentTableName = "paper_assignments"

	ColReviewerID        = "reviewer_id"
	ColScore             = "score"
	ColAssignedAt        = "assigned_at"
	ColCompletedAt       = "completed_at"
	ColReviewStatus      = "review_status"
	ColReviewScore       = "review_score"
	ColReviewData        = "review_data"
	ColReviewSubmittedAt = "review_submitted_at"
	ColReviewAuditState  = "review_audit_state"
)

// Assignment represents the paper_assignments database entity
type Assignment struct {
	ID                         int64           `db:"id"`
	ConferenceID               int64           `db:"conference_id"`
	SubmissionID               int64           `db:"submission_id"`
	ReviewerID                 int64           `db:"reviewer_id"`
	Score                      float64         `db:"score"`
	Status                     string          `db:"status"`
	AssignedAt                 time.Time       `db:"assigned_at"`
	CompletedAt                *time.Time      `db:"completed_at"`
	ReviewStatus               *string         `db:"review_status"`
	ReviewScore                *float64        `db:"review_score"`
	ReviewData                 json.RawMessage `db:"review_data"`
	ReviewSubmittedAt          *time.Time      `db:"review_submitted_at"`
	RebuttalStatus             string          `db:"rebuttal_status"`
	RebuttalSubmittedAt        *time.Time      `db:"rebuttal_submitted_at"`
	RebuttalAcknowledgedAt     *time.Time      `db:"rebuttal_acknowledged_at"`
	PostRebuttalScore          *int            `db:"post_rebuttal_score"`
	PostRebuttalRecommendation *string         `db:"post_rebuttal_recommendation"`
	PostRebuttalComment        *string         `db:"post_rebuttal_comment"`
	PostRebuttalUpdatedAt      *time.Time      `db:"post_rebuttal_updated_at"`
	CreatedAt                  time.Time       `db:"created_at"`
	UpdatedAt                  time.Time       `db:"updated_at"`
	ReviewerEmail              string          `db:"reviewer_email"`
}

// Rebuttal status constants (per assignment)
const (
	RebuttalStatusNone         = "none"
	RebuttalStatusSubmitted    = "submitted"
	RebuttalStatusAcknowledged = "acknowledged"
)

// Assignment status constants
const (
	AssignmentStatusSuggested = "suggested"
	AssignmentStatusPending   = "pending"
	AssignmentStatusAccepted  = "accepted"
	AssignmentStatusDeclined  = "declined"
	AssignmentStatusCompleted = "completed"
)

// Review status constants
const (
	ReviewStatusDraft     = "draft"
	ReviewStatusSubmitted = "submitted"
)

// Review recommendation constants
const (
	RecommendationStrongAccept = "strong_accept"
	RecommendationAccept       = "accept"
	RecommendationWeakAccept   = "weak_accept"
	RecommendationBorderline   = "borderline"
	RecommendationWeakReject   = "weak_reject"
	RecommendationReject       = "reject"
	RecommendationStrongReject = "strong_reject"
)

// Review confidence constants
const (
	ConfidenceHigh   = "high"
	ConfidenceMedium = "medium"
	ConfidenceLow    = "low"
)

// Post-rebuttal recommendation constants
const (
	PostRebuttalRecommendationAccept     = "accept"
	PostRebuttalRecommendationReject     = "reject"
	PostRebuttalRecommendationBorderline = "borderline"
)

// ToDTO converts model to DTO
func (a *Assignment) ToDTO() *dto.Assignment {
	result := &dto.Assignment{
		ID:            a.ID,
		ConferenceID:  a.ConferenceID,
		SubmissionID:  a.SubmissionID,
		ReviewerID:    a.ReviewerID,
		ReviewerEmail: a.ReviewerEmail,
		Score:         a.Score,
		Status:        a.Status,
		AssignedAt:    a.AssignedAt,
		CompletedAt:   a.CompletedAt,
		CreatedAt:     a.CreatedAt,
		UpdatedAt:     a.UpdatedAt,
	}

	// Add review fields if present
	result.ReviewStatus = a.ReviewStatus
	result.ReviewScore = a.ReviewScore
	// Only populate ReviewData if it's more than just an empty object
	if len(a.ReviewData) > 2 { // "{}" is 2 bytes
		// Unmarshal directly into dto.ReviewData — the stored JSON already
		// matches the nested structure of the struct (criteria/feedback/etc.)
		reviewData := &dto.ReviewData{}
		if err := json.Unmarshal(a.ReviewData, reviewData); err == nil {
			result.ReviewData = reviewData
		}
	}
	if a.ReviewSubmittedAt != nil {
		result.ReviewSubmittedAt = a.ReviewSubmittedAt
	}

	// Add rebuttal fields
	result.RebuttalStatus = a.RebuttalStatus
	result.RebuttalSubmittedAt = a.RebuttalSubmittedAt
	result.RebuttalAcknowledgedAt = a.RebuttalAcknowledgedAt

	// Add post-rebuttal fields
	result.PostRebuttalScore = a.PostRebuttalScore
	result.PostRebuttalRecommendation = a.PostRebuttalRecommendation
	result.PostRebuttalComment = a.PostRebuttalComment
	result.PostRebuttalUpdatedAt = a.PostRebuttalUpdatedAt

	return result
}
