package dto

import "time"

const (
	StatusDraft     = "draft"
	StatusPublished = "published"
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
}

type Submission struct {
	ID           int64                   `json:"id"`
	ConferenceID int64                   `json:"conference_id" binding:"required"`
	Author       string                  `json:"author" binding:"required,email"`
	Title        string                  `json:"title" binding:"required"`
	Abstract     string                  `json:"abstract" binding:"required"`
	Link         string                  `json:"link"`
	Domain       []string                `json:"domain"`
	Status       string                  `json:"status" binding:"required,oneof=draft published"`
	Information  *SubmissionInformation  `json:"information"`
	File         *SubmissionFileMetadata `json:"file,omitempty"`
	CreatedAt    time.Time               `json:"created_at"`
	UpdatedAt    time.Time               `json:"updated_at"`
}

type SubmissionCreateRequest struct {
	ConferenceID int64       `uri:"conference_id" binding:"required"`
	Submission   *Submission `json:"submission" binding:"required"`
}

type SubmissionGetRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
	ID           int64 `uri:"id" binding:"required"`
}

type SubmissionUpdateRequest struct {
	ConferenceID int64       `uri:"conference_id" binding:"required"`
	ID           int64       `uri:"id" binding:"required"`
	Submission   *Submission `json:"submission" binding:"required"`
}

type SubmissionDeleteRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
	ID           int64 `uri:"id" binding:"required"`
}

type SubmissionListRequest struct {
	Limit        int    `form:"limit" json:"limit"`
	Offset       int    `form:"offset" json:"offset"`
	ConferenceID int64  `form:"conference_id" json:"conference_id"`
	Author       string `form:"author" json:"author"`
	Status       string `form:"status" json:"status"`
	Title        string `form:"title" json:"title"`
}

type SubmissionListResponse struct {
	Submissions []*Submission `json:"submissions"`
	Total       int64         `json:"total"`
}
