package model

import (
	"encoding/json"
	"path/filepath"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/lib/pq"
)

const (
	SubmissionTableName = "conference_submissions"

	SubmissionColSubmissionID     = "submission_id"
	SubmissionColConferenceID     = "conference_id"
	SubmissionColAuthor           = "author"
	SubmissionColTitle            = "title"
	SubmissionColAbstract         = "abstract"
	SubmissionColLink             = "link"
	SubmissionColDomain           = "domain"
	SubmissionColStatus           = "status"
	SubmissionColInformation      = "information"
	SubmissionColFilePath         = "file_path"
	SubmissionColFileOriginalName = "file_original_name"
	SubmissionColFileSize         = "file_size"
	SubmissionColFileMimeType     = "file_mime_type"
	SubmissionColFileUploadedAt   = "file_uploaded_at"
	SubmissionColCreatedAt        = "created_at"
	SubmissionColUpdatedAt        = "updated_at"
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

func (s *Submission) ToDTO() *dto.Submission {
	domain := []string(s.Domain)
	if domain == nil {
		domain = []string{}
	}

	var info *dto.SubmissionInformation
	if len(s.Information) > 0 {
		info = &dto.SubmissionInformation{}
		if err := json.Unmarshal(s.Information, info); err != nil {
			info = nil
		}
	}

	var fileMetadata *dto.SubmissionFileMetadata
	if s.FilePath != nil && s.FileOriginalName != nil && s.FileSize != nil && s.FileMimeType != nil {
		fileMetadata = &dto.SubmissionFileMetadata{
			Filename:     filepath.Base(*s.FilePath),
			OriginalName: *s.FileOriginalName,
			Size:         *s.FileSize,
			MimeType:     *s.FileMimeType,
			Path:         *s.FilePath,
		}
	}

	return &dto.Submission{
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

func SerializeSubmissionInformation(info *dto.SubmissionInformation) ([]byte, error) {
	if info == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(info)
}
