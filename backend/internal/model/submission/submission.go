package submission

import (
	"encoding/json"
	"path/filepath"
	"time"

	submissionDto "github.com/dcao/conferencespace/internal/dto/submission"
	"github.com/lib/pq"
)

const (
	TableName = "conference_submissions"

	ColSubmissionID      = "submission_id"
	ColConferenceID      = "conference_id"
	ColAuthor            = "author"
	ColTitle             = "title"
	ColAbstract          = "abstract"
	ColLink              = "link"
	ColDomain            = "domain"
	ColStatus            = "status"
	ColInformation       = "information"
	ColFilePath          = "file_path"
	ColFileOriginalName  = "file_original_name"
	ColFileSize          = "file_size"
	ColFileMimeType      = "file_mime_type"
	ColFileUploadedAt    = "file_uploaded_at"
	ColCreatedAt         = "created_at"
	ColUpdatedAt         = "updated_at"
)

type Submission struct {
	SubmissionID     int64          `db:"submission_id"`
	ConferenceID     int64          `db:"conference_id"`
	Author           string         `db:"author"`
	Title            string         `db:"title"`
	Abstract         string         `db:"abstract"`
	Link             string         `db:"link"`
	Domain           pq.StringArray `db:"domain"`
	Status           string         `db:"status"`
	Information      []byte         `db:"information"`
	FilePath         *string        `db:"file_path"`
	FileOriginalName *string        `db:"file_original_name"`
	FileSize         *int64         `db:"file_size"`
	FileMimeType     *string        `db:"file_mime_type"`
	FileUploadedAt   *time.Time     `db:"file_uploaded_at"`
	CreatedAt        time.Time      `db:"created_at"`
	UpdatedAt        time.Time      `db:"updated_at"`
}

func (s *Submission) ToDTO() *submissionDto.Response {
	domain := []string(s.Domain)
	if domain == nil {
		domain = []string{}
	}

	var info *submissionDto.Information
	if len(s.Information) > 0 {
		info = &submissionDto.Information{}
		if err := json.Unmarshal(s.Information, info); err != nil {
			info = nil
		}
	}

	var fileMetadata *submissionDto.FileMetadata
	if s.FilePath != nil && s.FileOriginalName != nil && s.FileSize != nil && s.FileMimeType != nil {
		fileMetadata = &submissionDto.FileMetadata{
			Filename:     filepath.Base(*s.FilePath),
			OriginalName: *s.FileOriginalName,
			Size:         *s.FileSize,
			MimeType:     *s.FileMimeType,
			Path:         *s.FilePath,
		}
	}

	return &submissionDto.Response{
		ID:           s.SubmissionID,
		ConferenceID: s.ConferenceID,
		Author:       s.Author,
		Title:        s.Title,
		Abstract:     s.Abstract,
		Link:         s.Link,
		Domain:       domain,
		Status:       s.Status,
		Information:  info,
		File:         fileMetadata,
		CreatedAt:    s.CreatedAt,
		UpdatedAt:    s.UpdatedAt,
	}
}

func SerializeInformation(info *submissionDto.Information) ([]byte, error) {
	if info == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(info)
}
