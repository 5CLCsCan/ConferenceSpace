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

	ColSubmissionID            = "submission_id"
	ColAuthor                  = "author"
	ColAbstract                = "abstract"
	ColLink                    = "link"
	ColDomain                  = "domain"
	ColTrack                   = "track"
	ColInformation             = "information"
	ColFilePath                = "file_path"
	ColFileOriginalName        = "file_original_name"
	ColFileSize                = "file_size"
	ColFileMimeType            = "file_mime_type"
	ColFileUploadedAt          = "file_uploaded_at"
	ColCoverLetterPath         = "cover_letter_path"
	ColCoverLetterOriginalName = "cover_letter_original_name"
	ColCoverLetterSize         = "cover_letter_size"
	ColCoverLetterMimeType     = "cover_letter_mime_type"
	ColCoverLetterUploadedAt   = "cover_letter_uploaded_at"
	ColCreatedAt               = "created_at"
	ColUpdatedAt               = "updated_at"
)

type Submission struct {
	SubmissionID            int64          `db:"submission_id"`
	ConferenceID            int64          `db:"conference_id"`
	Author                  string         `db:"author"`
	Title                   string         `db:"title"`
	Abstract                string         `db:"abstract"`
	Link                    string         `db:"link"`
	Domain                  pq.StringArray `db:"domain"`
	Track                   *string        `db:"track"`
	Status                  string         `db:"status"`
	Information             []byte         `db:"information"`
	FilePath                *string        `db:"file_path"`
	FileOriginalName        *string        `db:"file_original_name"`
	FileSize                *int64         `db:"file_size"`
	FileMimeType            *string        `db:"file_mime_type"`
	FileUploadedAt          *time.Time     `db:"file_uploaded_at"`
	CoverLetterPath         *string        `db:"cover_letter_path"`
	CoverLetterOriginalName *string        `db:"cover_letter_original_name"`
	CoverLetterSize         *int64         `db:"cover_letter_size"`
	CoverLetterMimeType     *string        `db:"cover_letter_mime_type"`
	CoverLetterUploadedAt   *time.Time     `db:"cover_letter_uploaded_at"`
	CameraReadyPath         *string        `db:"camera_ready_path"`
	CameraReadyOriginalName *string        `db:"camera_ready_original_name"`
	CameraReadySize         *int64         `db:"camera_ready_size"`
	CameraReadyMimeType     *string        `db:"camera_ready_mime_type"`
	CameraReadyUploadedAt   *time.Time     `db:"camera_ready_uploaded_at"`
	RebuttalPhase           string         `db:"rebuttal_phase"`
	RebuttalGeneralResponse *string        `db:"rebuttal_general_response"`
	CreatedAt               time.Time      `db:"created_at"`
	UpdatedAt               time.Time      `db:"updated_at"`
}

// Rebuttal phase constants
const (
	RebuttalPhaseAwaiting   = "awaiting"
	RebuttalPhaseSubmitted  = "submitted"
	RebuttalPhaseDiscussion = "discussion"
	RebuttalPhaseFinalized  = "finalized"
)

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

	var track string
	if s.Track != nil {
		track = *s.Track
	}

	var coverLetterMetadata *dto.SubmissionFileMetadata
	if s.CoverLetterPath != nil && s.CoverLetterOriginalName != nil && s.CoverLetterSize != nil && s.CoverLetterMimeType != nil {
		coverLetterMetadata = &dto.SubmissionFileMetadata{
			Filename:     filepath.Base(*s.CoverLetterPath),
			OriginalName: *s.CoverLetterOriginalName,
			Size:         *s.CoverLetterSize,
			MimeType:     *s.CoverLetterMimeType,
			Path:         *s.CoverLetterPath,
		}
	}

	var cameraReadyMetadata *dto.SubmissionFileMetadata
	if s.CameraReadyPath != nil && s.CameraReadyOriginalName != nil && s.CameraReadySize != nil && s.CameraReadyMimeType != nil {
		cameraReadyMetadata = &dto.SubmissionFileMetadata{
			Filename:     filepath.Base(*s.CameraReadyPath),
			OriginalName: *s.CameraReadyOriginalName,
			Size:         *s.CameraReadySize,
			MimeType:     *s.CameraReadyMimeType,
			Path:         *s.CameraReadyPath,
		}
	}

	return &dto.Submission{
		ID:                      s.SubmissionID,
		ConferenceID:            s.ConferenceID,
		Author:                  s.Author,
		Title:                   s.Title,
		Abstract:                s.Abstract,
		Link:                    s.Link,
		Domain:                  domain,
		Track:                   track,
		Status:                  s.Status,
		Information:             info,
		File:                    fileMetadata,
		CoverLetter:             coverLetterMetadata,
		CameraReady:             cameraReadyMetadata,
		RebuttalPhase:           s.RebuttalPhase,
		RebuttalGeneralResponse: s.RebuttalGeneralResponse,
		CreatedAt:               s.CreatedAt,
		UpdatedAt:               s.UpdatedAt,
	}
}

func SerializeSubmissionInformation(info *dto.SubmissionInformation) ([]byte, error) {
	if info == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(info)
}
