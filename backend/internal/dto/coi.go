package dto

import (
	"encoding/json"
	"time"
)

// ============================================================================
// COI Relationship DTOs
// ============================================================================

// COIRelationship represents a conflict of interest relationship with enriched details
type COIRelationship struct {
	ID               int64      `json:"id"`
	ConferenceID     int64      `json:"conference_id"`
	ReviewerID       int64      `json:"reviewer_id"`
	ReviewerName     string     `json:"reviewer_name"`
	ReviewerEmail    string     `json:"reviewer_email"`
	AuthorEmail      string     `json:"author_email"`
	AuthorName       string     `json:"author_name"`
	AuthorAffiliation string    `json:"author_affiliation,omitempty"`
	SubmissionID     *int64     `json:"submission_id,omitempty"`
	RelationshipType string     `json:"type"`
	Severity         string     `json:"severity"`
	Description      string     `json:"description"`
	Evidence         []string   `json:"evidence,omitempty"`
	StartDate        *time.Time `json:"start_date,omitempty"`
	EndDate          *time.Time `json:"end_date,omitempty"`
	DetectedBy       string     `json:"detected_by"`
	PaperTitles      []string   `json:"paper_titles,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`

	// Internal field for JSONB evidence
	EvidenceJSON []byte `json:"-"`
}

// UnmarshalEvidence parses the JSONB evidence field
func (c *COIRelationship) UnmarshalEvidence() error {
	if len(c.EvidenceJSON) > 0 {
		return json.Unmarshal(c.EvidenceJSON, &c.Evidence)
	}
	c.Evidence = []string{}
	return nil
}

// COIRelationshipListRequest represents query parameters for listing relationships
type COIRelationshipListRequest struct {
	ConferenceID     int64  `form:"conference_id" binding:"required"`
	Severity         string `form:"severity"`
	RelationshipType string `form:"relationship_type"`
	Search           string `form:"search"`
	Limit            int    `form:"limit"`
	Page             int    `form:"page"`
}

// COIRelationshipListResponse represents the paginated response for relationships
type COIRelationshipListResponse struct {
	Relationships []*COIRelationship `json:"relationships"`
	Total         int64              `json:"total"`
	Page          int                `json:"page"`
	Limit         int                `json:"limit"`
}

// ============================================================================
// Dashboard Stats DTOs
// ============================================================================

// COIDashboardStats represents statistics for the COI dashboard
type COIDashboardStats struct {
	ConferenceID          int64 `json:"conference_id"`
	TotalReviewers        int   `json:"total_reviewers"`
	AvailableReviewers    int   `json:"available_reviewers"`
	TotalPapers           int   `json:"total_papers"`
	PapersUnderReview     int   `json:"papers_under_review"`
	COIDetected           int   `json:"coi_detected"`
	TotalRelationships    int   `json:"total_relationships"`
	TotalAssignments      int   `json:"total_assignments"`
	CompletedAssignments  int   `json:"completed_assignments"`
}

// COIDashboardStatsRequest represents the request for dashboard stats
type COIDashboardStatsRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
}

// ============================================================================
// COI Report DTOs (Detailed Check)
// ============================================================================

// COIReport represents a detailed COI analysis for a reviewer-author pair
type COIReport struct {
	ReviewerID          int64               `json:"reviewer_id"`
	ReviewerName        string              `json:"reviewer_name"`
	ReviewerEmail       string              `json:"reviewer_email"`
	ReviewerAffiliation string              `json:"reviewer_affiliation"`
	AuthorEmail         string              `json:"author_email"`
	AuthorName          string              `json:"author_name"`
	AuthorAffiliation   string              `json:"author_affiliation"`
	COIType             string              `json:"coi_type"` // "author"
	Severity            string              `json:"severity"`
	Relationships       []*COIRelationship  `json:"relationships"`
	Summary             string              `json:"summary"`
	Recommendation      string              `json:"recommendation"` // "assign", "review", "avoid"
}

// COICheckRequest represents the request for checking reviewer-author COI
type COICheckRequest struct {
	ReviewerID  int64  `uri:"reviewer_id" binding:"required"`
	AuthorEmail string `uri:"author_email" binding:"required"`
}

// ============================================================================
// Paper COI Summary DTOs
// ============================================================================

// PaperCOISummary represents COI summary for a single paper
type PaperCOISummary struct {
	PaperID              string                   `json:"paper_id"`
	PaperTitle           string                   `json:"paper_title"`
	Authors              []*AuthorInfo            `json:"authors"`
	TotalConflicts       int                      `json:"total_conflicts"`
	HighSeverityCount    int                      `json:"high_severity_count"`
	MediumSeverityCount  int                      `json:"medium_severity_count"`
	LowSeverityCount     int                      `json:"low_severity_count"`
	ConflictedReviewers  []*ConflictedReviewerInfo `json:"conflicted_reviewers"`
}

// AuthorInfo represents basic author information
type AuthorInfo struct {
	Email       string `json:"email"`
	Name        string `json:"name"`
	Affiliation string `json:"affiliation,omitempty"`
}

// ConflictedReviewerInfo represents a reviewer with conflicts for a paper
type ConflictedReviewerInfo struct {
	ReviewerID    int64    `json:"reviewer_id"`
	ReviewerName  string   `json:"reviewer_name"`
	ReviewerEmail string   `json:"reviewer_email"`
	Severity      string   `json:"severity"`
	Reasons       []string `json:"reasons"`
}

// PaperCOIListRequest represents query parameters for listing paper COIs
type PaperCOIListRequest struct {
	ConferenceID int64  `form:"conference_id" binding:"required"`
	Severity     string `form:"severity"`
	Search       string `form:"search"`
	Limit        int    `form:"limit"`
	Page         int    `form:"page"`
}

// PaperCOIListResponse represents the paginated response for paper COIs
type PaperCOIListResponse struct {
	Papers []*PaperCOISummary `json:"papers"`
	Total  int64              `json:"total"`
	Page   int                `json:"page"`
	Limit  int                `json:"limit"`
}

// ============================================================================
// COI Rebuild Request (Admin)
// ============================================================================

// COIRebuildRequest represents the request to rebuild COI relationships
type COIRebuildRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
}

// COIRebuildResponse represents the response after rebuilding COI relationships
type COIRebuildResponse struct {
	ConferenceID        int64 `json:"conference_id"`
	RelationshipsFound  int   `json:"relationships_found"`
	RelationshipsStored int   `json:"relationships_stored"`
	DetectionTimeMs     int64 `json:"detection_time_ms"`
}





