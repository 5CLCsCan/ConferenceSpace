package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"strings"

	"github.com/dcao/conferencespace/internal/dto"
)

// BindSubmissionCreateRequest binds multipart form data to SubmissionCreateRequest
func BindSubmissionCreateRequest(form *multipart.Form) (*dto.SubmissionCreateRequest, error) {
	req := &dto.SubmissionCreateRequest{
		Submission: &dto.Submission{},
	}

	// Check if submission data is provided as JSON string (backward compatibility)
	if submissionJSON, ok := form.Value["submission"]; ok && len(submissionJSON) > 0 {
		// Parse JSON string
		var submissionData struct {
			Submission *dto.Submission `json:"submission"`
		}
		if err := json.Unmarshal([]byte(submissionJSON[0]), &submissionData); err != nil {
			return nil, fmt.Errorf("invalid submission JSON: %w", err)
		}
		req.Submission = submissionData.Submission
	} else {
		// Bind individual form fields to Submission
		if err := bindFormToSubmission(form, req.Submission); err != nil {
			return nil, err
		}
	}

	// Bind file into Submission.File
	if err := bindFile(form, "file", &req.Submission.File); err != nil {
		return nil, err
	}

	// Bind cover letter into Submission.CoverLetter
	if err := bindFile(form, "cover_letter", &req.Submission.CoverLetter); err != nil {
		return nil, err
	}

	return req, nil
}

// BindSubmissionUpdateRequest binds multipart form data to SubmissionUpdateRequest
func BindSubmissionUpdateRequest(form *multipart.Form) (*dto.SubmissionUpdateRequest, error) {
	req := &dto.SubmissionUpdateRequest{
		Submission: &dto.Submission{},
	}

	// Check if submission data is provided as JSON string (backward compatibility)
	if submissionJSON, ok := form.Value["submission"]; ok && len(submissionJSON) > 0 {
		// Parse JSON string
		var submissionData struct {
			Submission *dto.Submission `json:"submission"`
		}
		if err := json.Unmarshal([]byte(submissionJSON[0]), &submissionData); err != nil {
			return nil, fmt.Errorf("invalid submission JSON: %w", err)
		}
		req.Submission = submissionData.Submission
	} else {
		// Bind individual form fields to Submission
		if err := bindFormToSubmission(form, req.Submission); err != nil {
			return nil, err
		}
	}

	// Bind file into Submission.File (optional for update)
	if err := bindFile(form, "file", &req.Submission.File); err != nil {
		return nil, err
	}

	// Bind cover letter into Submission.CoverLetter (optional for update)
	if err := bindFile(form, "cover_letter", &req.Submission.CoverLetter); err != nil {
		return nil, err
	}

	return req, nil
}

// bindFormToSubmission binds individual form fields to Submission struct
func bindFormToSubmission(form *multipart.Form, submission *dto.Submission) error {
	// Simple string fields
	if title, ok := form.Value["title"]; ok && len(title) > 0 {
		submission.Title = title[0]
	}
	if abstract, ok := form.Value["abstract"]; ok && len(abstract) > 0 {
		submission.Abstract = abstract[0]
	}
	if link, ok := form.Value["link"]; ok && len(link) > 0 {
		submission.Link = link[0]
	}
	if status, ok := form.Value["status"]; ok && len(status) > 0 {
		submission.Status = status[0]
	}
	if track, ok := form.Value["track"]; ok && len(track) > 0 {
		submission.Track = track[0]
	}

	// Array fields
	if domain, ok := form.Value["domain"]; ok {
		submission.Domain = domain
	} else if domain, ok := form.Value["domain[]"]; ok {
		submission.Domain = domain
	}

	// Information object (nested fields)
	if hasInformationFields(form) {
		submission.Information = &dto.SubmissionInformation{}

		// Keywords array
		if keywords, ok := form.Value["keywords"]; ok {
			submission.Information.Keywords = keywords
		} else if keywords, ok := form.Value["keywords[]"]; ok {
			submission.Information.Keywords = keywords
		}

		// Co-authors array
		if coAuthors, ok := form.Value["co_authors"]; ok {
			submission.Information.CoAuthors = coAuthors
		} else if coAuthors, ok := form.Value["co_authors[]"]; ok {
			submission.Information.CoAuthors = coAuthors
		}

		// Other information fields
		if paperType, ok := form.Value["paper_type"]; ok && len(paperType) > 0 {
			submission.Information.PaperType = paperType[0]
		}
		if trackName, ok := form.Value["track_name"]; ok && len(trackName) > 0 {
			submission.Information.TrackName = trackName[0]
		}
		if notes, ok := form.Value["additional_notes"]; ok && len(notes) > 0 {
			submission.Information.AdditionalNotes = notes[0]
		}

		// Metadata (if provided as JSON string)
		if metadata, ok := form.Value["metadata"]; ok && len(metadata) > 0 {
			var meta map[string]interface{}
			if err := json.Unmarshal([]byte(metadata[0]), &meta); err == nil {
				submission.Information.Metadata = meta
			}
		}

		// Declared conflicts (if provided as JSON string)
		if conflicts, ok := form.Value["declared_conflicts"]; ok && len(conflicts) > 0 {
			var declaredConflicts []dto.ConflictDeclaration
			if err := json.Unmarshal([]byte(conflicts[0]), &declaredConflicts); err == nil {
				submission.Information.DeclaredConflicts = declaredConflicts
			}
		}
	}

	return nil
}

// hasInformationFields checks if form contains any information-related fields
func hasInformationFields(form *multipart.Form) bool {
	infoFields := []string{"keywords", "keywords[]", "co_authors", "co_authors[]",
		"paper_type", "track_name", "additional_notes", "metadata", "declared_conflicts"}

	for _, field := range infoFields {
		if _, ok := form.Value[field]; ok {
			return true
		}
	}
	return false
}

// bindFile reads file from form and creates SubmissionFileMetadata with content
func bindFile(form *multipart.Form, fieldName string, target **dto.SubmissionFileMetadata) error {
	files, ok := form.File[fieldName]
	if !ok || len(files) == 0 {
		// No file provided, leave nil
		return nil
	}

	fileHeader := files[0]

	// Open and read file content
	file, err := fileHeader.Open()
	if err != nil {
		return fmt.Errorf("failed to open file %s: %w", fieldName, err)
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("failed to read file %s: %w", fieldName, err)
	}

	// Create SubmissionFileMetadata with content
	*target = &dto.SubmissionFileMetadata{
		OriginalName: fileHeader.Filename,
		Size:         fileHeader.Size,
		MimeType:     fileHeader.Header.Get("Content-Type"),
		Content:      content,
	}

	return nil
}

// BindSubmissionPublishRequest binds multipart form data to SubmissionPublishRequest
func BindSubmissionPublishRequest(form *multipart.Form) (*dto.SubmissionPublishRequest, error) {
	req := &dto.SubmissionPublishRequest{
		Submission: &dto.Submission{}, // Initialize to hold files
	}

	// Bind file into Submission.File (optional if already uploaded)
	if err := bindFile(form, "file", &req.Submission.File); err != nil {
		return nil, err
	}

	// Bind cover letter into Submission.CoverLetter (optional)
	if err := bindFile(form, "cover_letter", &req.Submission.CoverLetter); err != nil {
		return nil, err
	}

	return req, nil
}

// Helper to get first value from form field
func getFormValue(form *multipart.Form, key string) string {
	if values, ok := form.Value[key]; ok && len(values) > 0 {
		return values[0]
	}
	return ""
}

// Helper to get array from form field (supports both "key" and "key[]" formats)
func getFormArray(form *multipart.Form, key string) []string {
	if values, ok := form.Value[key]; ok {
		return values
	}
	if values, ok := form.Value[key+"[]"]; ok {
		return values
	}
	// Also try comma-separated values
	if values, ok := form.Value[key]; ok && len(values) > 0 {
		return strings.Split(values[0], ",")
	}
	return nil
}
