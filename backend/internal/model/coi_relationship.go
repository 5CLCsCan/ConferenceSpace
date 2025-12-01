package model

import (
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

const (
	COIRelationshipTableName = "coi_relationships"

	COIColID               = "id"
	COIColConferenceID     = "conference_id"
	COIColReviewerID       = "reviewer_id"
	COIColAuthorEmail      = "author_email"
	COIColSubmissionID     = "submission_id"
	COIColRelationshipType = "relationship_type"
	COIColSeverity         = "severity"
	COIColDescription      = "description"
	COIColEvidence         = "evidence"
	COIColStartDate        = "start_date"
	COIColEndDate          = "end_date"
	COIColDetectedBy       = "detected_by"
	COIColCreatedAt        = "created_at"
	COIColUpdatedAt        = "updated_at"
)

// Relationship types
const (
	RelationshipTypeCoAuthor          = "co_author"
	RelationshipTypeSameOrganization  = "same_organization"
	RelationshipTypeAdvisorAdvisee    = "advisor_advisee"
	RelationshipTypeCollaborator      = "collaborator"
	RelationshipTypeCompetitor        = "competitor"
	RelationshipTypeCitation          = "citation"
	RelationshipTypeReviewHistory     = "review_history"
	RelationshipTypeDeclared          = "declared"
	RelationshipTypeSelfAuthor        = "self_author"
)

// Severity levels
const (
	SeverityHigh   = "high"
	SeverityMedium = "medium"
	SeverityLow    = "low"
	SeverityNone   = "none"
)

// Detector names
const (
	DetectorSelfAuthor         = "self_author"
	DetectorDeclaredConflicts  = "declared_conflicts"
	DetectorRelationship       = "relationship"
)

// COIRelationship represents a conflict of interest relationship in the database
type COIRelationship struct {
	ID               int64      `db:"id"`
	ConferenceID     int64      `db:"conference_id"`
	ReviewerID       int64      `db:"reviewer_id"`
	AuthorEmail      string     `db:"author_email"`
	SubmissionID     *int64     `db:"submission_id"`
	RelationshipType string     `db:"relationship_type"`
	Severity         string     `db:"severity"`
	Description      string     `db:"description"`
	Evidence         []byte     `db:"evidence"` // JSONB stored as bytes
	StartDate        *time.Time `db:"start_date"`
	EndDate          *time.Time `db:"end_date"`
	DetectedBy       string     `db:"detected_by"`
	CreatedAt        time.Time  `db:"created_at"`
	UpdatedAt        time.Time  `db:"updated_at"`
}

// ToDTO converts the model to a DTO
func (c *COIRelationship) ToDTO() *dto.COIRelationship {
	rel := &dto.COIRelationship{
		ID:               c.ID,
		ConferenceID:     c.ConferenceID,
		ReviewerID:       c.ReviewerID,
		AuthorEmail:      c.AuthorEmail,
		SubmissionID:     c.SubmissionID,
		RelationshipType: c.RelationshipType,
		Severity:         c.Severity,
		Description:      c.Description,
		DetectedBy:       c.DetectedBy,
		CreatedAt:        c.CreatedAt,
		UpdatedAt:        c.UpdatedAt,
	}

	// Parse evidence from JSONB
	if len(c.Evidence) > 0 {
		// Evidence will be unmarshaled in the DTO layer
		rel.EvidenceJSON = c.Evidence
	}

	// Copy dates
	if c.StartDate != nil {
		rel.StartDate = c.StartDate
	}
	if c.EndDate != nil {
		rel.EndDate = c.EndDate
	}

	return rel
}





