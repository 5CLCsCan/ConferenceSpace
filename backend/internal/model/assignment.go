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
)

// Assignment represents the paper_assignments database entity
type Assignment struct {
	ID                int64           `db:"id"`
	ConferenceID      int64           `db:"conference_id"`
	SubmissionID      int64           `db:"submission_id"`
	ReviewerID        int64           `db:"reviewer_id"`
	Score             float64         `db:"score"`
	Status            string          `db:"status"`
	AssignedAt        time.Time       `db:"assigned_at"`
	CompletedAt       *time.Time      `db:"completed_at"`
	ReviewStatus      *string         `db:"review_status"`
	ReviewScore       *float64        `db:"review_score"`
	ReviewData        json.RawMessage `db:"review_data"`
	ReviewSubmittedAt *time.Time      `db:"review_submitted_at"`
	CreatedAt         time.Time       `db:"created_at"`
	UpdatedAt         time.Time       `db:"updated_at"`
	ReviewerEmail     string          `db:"reviewer_email"`
}

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
	if len(a.ReviewData) > 0 { // "{}" is 2 bytes
		// Parse ReviewData from flat structure in DB to nested DTO structure
		var flatReviewData map[string]interface{}
		if err := json.Unmarshal(a.ReviewData, &flatReviewData); err == nil {
			// Build structured ReviewData
			reviewData := &dto.ReviewData{}

			// Map flat criteria fields to nested Criteria struct
			if originality, ok := flatReviewData["originality"].(float64); ok {
				reviewData.Criteria.Originality = int(originality)
			}
			if techQuality, ok := flatReviewData["technical_quality"].(float64); ok {
				reviewData.Criteria.TechnicalQuality = int(techQuality)
			}
			if clarity, ok := flatReviewData["clarity"].(float64); ok {
				reviewData.Criteria.Clarity = int(clarity)
			}
			if significance, ok := flatReviewData["significance"].(float64); ok {
				reviewData.Criteria.Significance = int(significance)
			}
			if methodology, ok := flatReviewData["methodology"].(float64); ok {
				reviewData.Criteria.Methodology = int(methodology)
			}

			// Map other fields
			if recommendation, ok := flatReviewData["recommendation"].(string); ok {
				reviewData.Recommendation = recommendation
			}
			if confidence, ok := flatReviewData["confidence"].(string); ok {
				reviewData.Confidence = confidence
			}

			// Map feedback (if exists as nested object or flat)
			if feedbackMap, ok := flatReviewData["feedback"].(map[string]interface{}); ok {
				if strengths, ok := feedbackMap["strengths"].(string); ok {
					reviewData.Feedback.Strengths = strengths
				}
				if weaknesses, ok := feedbackMap["weaknesses"].(string); ok {
					reviewData.Feedback.Weaknesses = weaknesses
				}
				if questions, ok := feedbackMap["questions"].(string); ok {
					reviewData.Feedback.Questions = questions
				}
			}

			result.ReviewData = reviewData
		}
	}
	if a.ReviewSubmittedAt != nil {
		result.ReviewSubmittedAt = a.ReviewSubmittedAt
	}

	return result
}
