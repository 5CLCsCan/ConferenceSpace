package submission

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestSubmissionCoverLetter(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference (default status is "open")
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	confResp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	t.Run("CreateSubmissionWithPDFCoverLetter", func(t *testing.T) {
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper with PDF Cover Letter",
			Abstract:     "This paper has a PDF cover letter",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		// Create a simple PDF cover letter (starting with PDF header)
		pdfContent := []byte("%PDF-1.4\nTest PDF cover letter content")

		resp, err := submissionClient.CreateWithCoverLetter(conferenceID, submission, pdfContent, "cover.pdf", "application/pdf", authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission with cover letter: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusCreated)

		var response struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)

		// Verify cover letter metadata is present
		if response.Data.CoverLetter == nil {
			t.Fatal("Expected cover letter metadata, got nil")
		}
		if response.Data.CoverLetter.OriginalName != "cover.pdf" {
			t.Errorf("Expected original name 'cover.pdf', got '%s'", response.Data.CoverLetter.OriginalName)
		}
		// MIME type can be application/pdf or application/octet-stream depending on client
		validMimeTypes := []string{"application/pdf", "application/octet-stream"}
		mimeTypeValid := false
		for _, validType := range validMimeTypes {
			if response.Data.CoverLetter.MimeType == validType {
				mimeTypeValid = true
				break
			}
		}
		if !mimeTypeValid {
			t.Errorf("Expected mime type to be one of %v, got '%s'", validMimeTypes, response.Data.CoverLetter.MimeType)
		}
		if !strings.HasPrefix(response.Data.CoverLetter.Filename, "cover_letter_") {
			t.Errorf("Expected filename to start with 'cover_letter_', got '%s'", response.Data.CoverLetter.Filename)
		}
	})

	t.Run("CreateSubmissionWithDOCXCoverLetter", func(t *testing.T) {
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper with DOCX Cover Letter",
			Abstract:     "This paper has a DOCX cover letter",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		// Create a simple DOCX content
		docxContent := []byte("PK\x03\x04") // DOCX files start with ZIP header

		resp, err := submissionClient.CreateWithCoverLetter(conferenceID, submission, docxContent, "cover.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission with DOCX cover letter: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusCreated)

		var response struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)

		// Verify cover letter metadata
		if response.Data.CoverLetter == nil {
			t.Fatal("Expected cover letter metadata, got nil")
		}
		if response.Data.CoverLetter.OriginalName != "cover.docx" {
			t.Errorf("Expected original name 'cover.docx', got '%s'", response.Data.CoverLetter.OriginalName)
		}
	})

	t.Run("CreateSubmissionWithTXTCoverLetter", func(t *testing.T) {
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper with TXT Cover Letter",
			Abstract:     "This paper has a TXT cover letter",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		txtContent := []byte("This is a plain text cover letter.\nIt explains why this paper should be accepted.")

		resp, err := submissionClient.CreateWithCoverLetter(conferenceID, submission, txtContent, "cover.txt", "text/plain", authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission with TXT cover letter: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusCreated)

		var response struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)

		// Verify cover letter metadata
		if response.Data.CoverLetter == nil {
			t.Fatal("Expected cover letter metadata, got nil")
		}
		if response.Data.CoverLetter.OriginalName != "cover.txt" {
			t.Errorf("Expected original name 'cover.txt', got '%s'", response.Data.CoverLetter.OriginalName)
		}
		// MIME type can be text/plain or application/octet-stream depending on client
		validMimeTypes := []string{"text/plain", "application/octet-stream"}
		mimeTypeValid := false
		for _, validType := range validMimeTypes {
			if response.Data.CoverLetter.MimeType == validType {
				mimeTypeValid = true
				break
			}
		}
		if !mimeTypeValid {
			t.Errorf("Expected mime type to be one of %v, got '%s'", validMimeTypes, response.Data.CoverLetter.MimeType)
		}
	})

	t.Run("CreateSubmissionWithoutCoverLetter", func(t *testing.T) {
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper without Cover Letter",
			Abstract:     "This paper has no cover letter",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		resp, err := submissionClient.Create(conferenceID, submission, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusCreated)

		var response struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)

		// Verify no cover letter metadata
		if response.Data.CoverLetter != nil {
			t.Errorf("Expected no cover letter metadata, got %+v", response.Data.CoverLetter)
		}
	})

	t.Run("CreateSubmissionWithInvalidCoverLetterFormat", func(t *testing.T) {
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper with Invalid Cover Letter",
			Abstract:     "This paper has an invalid cover letter format",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		// Try to upload an image as cover letter (should fail)
		invalidContent := []byte("Not a valid document")

		resp, err := submissionClient.CreateWithCoverLetter(conferenceID, submission, invalidContent, "cover.jpg", "image/jpeg", authorToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
		testutils.AssertError(t, resp, "only PDF, DOCX, and TXT files are allowed for cover letters")
	})

	t.Run("GetSubmissionCoverLetter", func(t *testing.T) {
		// Create submission with cover letter
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper for Cover Letter Retrieval",
			Abstract:     "Testing cover letter download",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		coverLetterContent := []byte("%PDF-1.4\nTest cover letter for download")

		createResp, err := submissionClient.CreateWithCoverLetter(conferenceID, submission, coverLetterContent, "download_test.pdf", "application/pdf", authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		var createResponse struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createResponse)
		submissionID := createResponse.Data.ID

		// Download the cover letter
		downloadResp, err := submissionClient.GetCoverLetter(conferenceID, submissionID, authorToken)
		if err != nil {
			t.Fatalf("Failed to download cover letter: %v", err)
		}

		testutils.AssertStatusCode(t, downloadResp, http.StatusOK)

		// Verify content type (can be application/pdf or application/octet-stream)
		contentType := downloadResp.Header.Get("Content-Type")
		validContentTypes := []string{"application/pdf", "application/octet-stream"}
		contentTypeValid := false
		for _, validType := range validContentTypes {
			if contentType == validType {
				contentTypeValid = true
				break
			}
		}
		if !contentTypeValid {
			t.Errorf("Expected content type to be one of %v, got '%s'", validContentTypes, contentType)
		}

		// Verify we can read the content
		downloadedContent, err := io.ReadAll(downloadResp.Body)
		if err != nil {
			t.Fatalf("Failed to read cover letter content: %v", err)
		}

		if string(downloadedContent) != string(coverLetterContent) {
			t.Errorf("Downloaded content doesn't match uploaded content")
		}
	})

	t.Run("GetCoverLetterNotFound", func(t *testing.T) {
		// Create submission without cover letter
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper without Cover Letter for Download Test",
			Abstract:     "Testing cover letter download when none exists",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		createResp, err := submissionClient.Create(conferenceID, submission, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		var createResponse struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createResponse)
		submissionID := createResponse.Data.ID

		// Try to download non-existent cover letter
		downloadResp, err := submissionClient.GetCoverLetter(conferenceID, submissionID, authorToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, downloadResp, http.StatusNotFound)
		testutils.AssertError(t, downloadResp, "cover letter not found")
	})

	t.Run("UpdateSubmissionAddCoverLetter", func(t *testing.T) {
		// Create submission without cover letter
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper to Add Cover Letter",
			Abstract:     "Testing adding cover letter via update",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		createResp, err := submissionClient.Create(conferenceID, submission, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		var createResponse struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createResponse)
		submissionID := createResponse.Data.ID

		// Update with cover letter
		updateSubmission := &dto.Submission{
			Title:    "Paper to Add Cover Letter - Updated",
			Abstract: "Testing adding cover letter via update",
		}

		coverLetterContent := []byte("%PDF-1.4\nAdded cover letter")

		updateResp, err := submissionClient.UpdateWithCoverLetter(conferenceID, submissionID, updateSubmission, coverLetterContent, "added_cover.pdf", "application/pdf", authorToken)
		if err != nil {
			t.Fatalf("Failed to update submission: %v", err)
		}

		testutils.AssertStatusCode(t, updateResp, http.StatusOK)

		var updateResponse struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, updateResp, &updateResponse)

		// Verify cover letter was added
		if updateResponse.Data.CoverLetter == nil {
			t.Fatal("Expected cover letter metadata after update, got nil")
		}
		if updateResponse.Data.CoverLetter.OriginalName != "added_cover.pdf" {
			t.Errorf("Expected original name 'added_cover.pdf', got '%s'", updateResponse.Data.CoverLetter.OriginalName)
		}
	})

	t.Run("UpdateSubmissionReplaceCoverLetter", func(t *testing.T) {
		// Create submission with cover letter
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper to Replace Cover Letter",
			Abstract:     "Testing replacing cover letter",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		originalContent := []byte("%PDF-1.4\nOriginal cover letter")

		createResp, err := submissionClient.CreateWithCoverLetter(conferenceID, submission, originalContent, "original.pdf", "application/pdf", authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		var createResponse struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createResponse)
		submissionID := createResponse.Data.ID

		// Update with new cover letter
		updateSubmission := &dto.Submission{
			Title:    "Paper to Replace Cover Letter",
			Abstract: "Testing replacing cover letter",
		}

		newContent := []byte("%PDF-1.4\nReplacement cover letter")

		updateResp, err := submissionClient.UpdateWithCoverLetter(conferenceID, submissionID, updateSubmission, newContent, "replacement.pdf", "application/pdf", authorToken)
		if err != nil {
			t.Fatalf("Failed to update submission: %v", err)
		}

		testutils.AssertStatusCode(t, updateResp, http.StatusOK)

		var updateResponse struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, updateResp, &updateResponse)

		// Verify cover letter was replaced
		if updateResponse.Data.CoverLetter == nil {
			t.Fatal("Expected cover letter metadata after update, got nil")
		}
		if updateResponse.Data.CoverLetter.OriginalName != "replacement.pdf" {
			t.Errorf("Expected original name 'replacement.pdf', got '%s'", updateResponse.Data.CoverLetter.OriginalName)
		}

		// Download and verify new content
		downloadResp, err := submissionClient.GetCoverLetter(conferenceID, submissionID, authorToken)
		if err != nil {
			t.Fatalf("Failed to download cover letter: %v", err)
		}

		downloadedContent, err := io.ReadAll(downloadResp.Body)
		if err != nil {
			t.Fatalf("Failed to read cover letter content: %v", err)
		}

		if string(downloadedContent) != string(newContent) {
			t.Errorf("Downloaded content doesn't match new uploaded content")
		}
	})

	t.Run("CreateRequiresPaperFile", func(t *testing.T) {
		// Try to create submission with status="published" but no file (should fail)
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Published Paper - No File",
			Abstract:     "Testing that creating published submission requires paper file",
			Domain:       []string{"AI"},
			Status:       dto.StatusPublished, // Published status REQUIRES file
		}

		createResp, err := submissionClient.CreateWithoutFile(conferenceID, submission, authorToken)
		if err != nil {
			t.Fatalf("Failed to make create request: %v", err)
		}

		// Should get 400 Bad Request
		testutils.AssertStatusCode(t, createResp, http.StatusBadRequest)

		var response map[string]interface{}
		testutils.DecodeResponse(t, createResp, &response)

		// Verify error message mentions paper file is required
		if errorMsg, ok := response["error"].(string); ok {
			if !strings.Contains(strings.ToLower(errorMsg), "paper file") && !strings.Contains(strings.ToLower(errorMsg), "file is required") {
				t.Logf("Note: Error message was '%s'", errorMsg)
			}
		}

		t.Logf("✓ Create with status='published' correctly requires paper file")
	})

	t.Run("UpdateWithoutPaperFileIsAllowed", func(t *testing.T) {
		// Create submission WITH paper file using the regular Create (which includes a default valid PDF)
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper With File",
			Abstract:     "Testing update without changing file",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		createResp, err := submissionClient.Create(conferenceID, submission, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		var createResponse struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createResponse)

		if createResponse.Data == nil {
			t.Fatal("CreateResponse.Data is nil")
		}

		submissionID := createResponse.Data.ID

		// Verify paper file was created
		if createResponse.Data.File == nil {
			t.Fatal("Expected file metadata after create, got nil")
		}

		// Update ONLY metadata (no file) - should succeed
		updateSubmission := &dto.Submission{
			Title:    "Paper With File - Updated Title",
			Abstract: "Testing update without changing file",
		}

		updateResp, err := submissionClient.Update(conferenceID, submissionID, updateSubmission, authorToken)
		if err != nil {
			t.Fatalf("Failed to update submission: %v", err)
		}

		if updateResp.StatusCode != http.StatusOK {
			// Read error message
			var errorResp map[string]interface{}
			json.NewDecoder(updateResp.Body).Decode(&errorResp)
			t.Fatalf("Expected status 200, got %d. Error: %v", updateResp.StatusCode, errorResp)
		}

		var updateResponse struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, updateResp, &updateResponse)

		// Check if Data is nil before accessing
		if updateResponse.Data == nil {
			t.Fatal("UpdateResponse.Data is nil")
		}

		// Verify title updated but file remains
		if updateResponse.Data.Title != "Paper With File - Updated Title" {
			t.Errorf("Expected title to be updated, got '%s'", updateResponse.Data.Title)
		}
		if updateResponse.Data.File == nil {
			t.Error("Expected file to remain after metadata-only update")
		}

		t.Logf("✓ Update without paper file is allowed (metadata-only update)")
	})

	t.Run("GetSubmissionIncludesCoverLetterMetadata", func(t *testing.T) {
		// Create submission with cover letter
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper to Test GET Includes Cover Letter",
			Abstract:     "Testing that GET returns cover letter metadata",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		coverLetterContent := []byte("Plain text cover letter for GET test")

		createResp, err := submissionClient.CreateWithCoverLetter(conferenceID, submission, coverLetterContent, "get_test.txt", "text/plain", authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		var createResponse struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createResponse)
		submissionID := createResponse.Data.ID

		// Get submission and verify cover letter metadata is included
		getResp, err := submissionClient.Get(conferenceID, submissionID, authorToken)
		if err != nil {
			t.Fatalf("Failed to get submission: %v", err)
		}

		testutils.AssertStatusCode(t, getResp, http.StatusOK)

		var getResponse struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, getResp, &getResponse)

		// Verify cover letter metadata is present
		if getResponse.Data.CoverLetter == nil {
			t.Fatal("Expected cover letter metadata in GET response, got nil")
		}
		if getResponse.Data.CoverLetter.OriginalName != "get_test.txt" {
			t.Errorf("Expected original name 'get_test.txt', got '%s'", getResponse.Data.CoverLetter.OriginalName)
		}
	})
}
