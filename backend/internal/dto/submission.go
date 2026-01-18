package dto

import "time"

const (
	StatusDraft     = "draft"
	StatusPublished = "published"
	StatusReviewing = "reviewing"
	StatusAccepted  = "accepted"
	StatusRejected  = "rejected"
)

type ConflictDeclaration struct {
	Email  string `json:"email" binding:"required,email"`
	Reason string `json:"reason" binding:"required"`
}

type SubmissionInformation struct {
	CoAuthors         []string               `json:"co_authors,omitempty"`
	DeclaredConflicts []ConflictDeclaration  `json:"declared_conflicts,omitempty"`
	Keywords          []string               `json:"keywords,omitempty"`
	PaperType         string                 `json:"paper_type,omitempty"`
	TrackName         string                 `json:"track_name,omitempty"`
	AdditionalNotes   string                 `json:"additional_notes,omitempty"`
	Metadata          map[string]interface{} `json:"metadata,omitempty"`
}

type SubmissionFileMetadata struct {
	Filename     string `json:"filename"`
	OriginalName string `json:"original_name"`
	Size         int64  `json:"size"`
	MimeType     string `json:"mime_type"`
	Path         string `json:"path"`
	Content      []byte `json:"-"` // File content for upload (not serialized to JSON)
}

type Submission struct {
	ID           int64                   `json:"id"`
	ConferenceID int64                   `json:"conference_id"`                              // Set by controller from path parameter
	Author       string                  `json:"author,omitempty" binding:"omitempty,email"` // Set by controller from auth context
	Title        string                  `json:"title"`
	Abstract     string                  `json:"abstract"`
	Link         string                  `json:"link"`
	Domain       []string                `json:"domain"`
	Track        string                  `json:"track"`                                                                // Must be one of the conference's tracks
	Status       string                  `json:"status,omitempty" binding:"omitempty,oneof=draft published reviewing accepted rejected"` // Optional for updates
	Information  *SubmissionInformation  `json:"information"`
	File         *SubmissionFileMetadata `json:"file,omitempty"`
	CoverLetter  *SubmissionFileMetadata `json:"cover_letter,omitempty"` // Optional cover letter (PDF, DOCX, or TXT)
	Reviewers    []Reviewer              `json:"reviewers,omitempty"`    // Only populated when includeReviewers=true
	CreatedAt    time.Time               `json:"created_at"`
	UpdatedAt    time.Time               `json:"updated_at"`
}

type SubmissionCreateRequest struct {
	ConferenceID int64       `uri:"conference_id" binding:"required"`
	Submission   *Submission `json:"submission" form:"submission" binding:"required"`
}

type SubmissionGetRequest struct {
	ConferenceID     int64 `uri:"conference_id" binding:"required"`
	ID               int64 `uri:"submission_id" binding:"required"`
	IncludeReviewers bool  `form:"includeReviewers" json:"includeReviewers"`
}

type SubmissionUpdateRequest struct {
	ConferenceID int64       `uri:"conference_id" binding:"required"`
	ID           int64       `uri:"submission_id" binding:"required"`
	Submission   *Submission `json:"submission" form:"submission" binding:"required"`
}

type SubmissionPublishRequest struct {
	ConferenceID int64       `uri:"conference_id" binding:"required"`
	ID           int64       `uri:"submission_id" binding:"required"`
	Submission   *Submission `form:"submission"` // Contains File and CoverLetter if provided
}

type SubmissionDeleteRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
	ID           int64 `uri:"submission_id" binding:"required"`
}

type SubmissionListRequest struct {
	Limit        int    `form:"limit" json:"limit"`
	Offset       int    `form:"offset" json:"offset"`
	ConferenceID int64  `form:"conference_id" json:"conference_id"`
	Author       string `form:"author" json:"author"`
	Status       string `form:"status" json:"status"`
	Title        string `form:"title" json:"title"`
	Track        string `form:"track" json:"track"`
}

type SubmissionListResponse struct {
	Submissions []*Submission `json:"submissions"`
	Total       int64         `json:"total"`
}

type UpdateStatusRequest struct {
	ConferenceID int64  `uri:"conference_id" json:"conference_id"`
	ID           int64  `uri:"submission_id" json:"submission_id"`
	Status       string `json:"status" binding:"required,oneof=draft published reviewing accepted rejected"`
}
