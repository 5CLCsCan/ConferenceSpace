package submission

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// Client provides methods to call submission management endpoints
type Client struct {
	ctx *testutils.TestContext
}

// NewClient creates a new submission client
func NewClient(ctx *testutils.TestContext) *Client {
	return &Client{ctx: ctx}
}

// Create calls the create submission endpoint with a default test paper file
func (c *Client) Create(conferenceID int64, submission *dto.Submission, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID)

	// Wrap submission in the format expected by backend binder (same as frontend)
	submissionData := map[string]interface{}{
		"submission": submission,
	}
	jsonBytes, err := json.Marshal(submissionData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal submission: %w", err)
	}

	// Send as multipart form data with required paper file
	formData := map[string]string{
		"submission": string(jsonBytes),
	}

	// Include default test paper file (required for create with status="published")
	// Read the valid test PDF file
	testPDFContent, err := os.ReadFile("../test_paper.pdf")
	if err != nil {
		// Fallback to a minimal valid PDF if file doesn't exist
		testPDFContent = []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 0\n>>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000015 00000 n\n0000000068 00000 n\ntrailer\n<<\n/Size 3\n/Root 1 0 R\n>>\nstartxref\n117\n%%EOF")
	}

	files := []testutils.FileUpload{
		{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   testPDFContent,
			MimeType:  "application/pdf",
		},
	}

	return c.ctx.MakeMultipartRequestWithFiles("POST", path, formData, files, token)
}

// Get calls the get submission by ID endpoint
func (c *Client) Get(conferenceID, submissionID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d", conferenceID, submissionID)
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// GetWithReviewers calls the get submission by ID endpoint with includeReviewers parameter
func (c *Client) GetWithReviewers(conferenceID, submissionID int64, includeReviewers bool, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d?includeReviewers=%v", conferenceID, submissionID, includeReviewers)
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// List calls the list submissions endpoint
func (c *Client) List(conferenceID int64, req *dto.SubmissionListRequest, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID)
	if req != nil {
		path += fmt.Sprintf("?limit=%d&offset=%d", req.Limit, req.Offset)
		if req.Author != "" {
			path += fmt.Sprintf("&author=%s", url.QueryEscape(req.Author))
		}
		if req.Status != "" {
			path += fmt.Sprintf("&status=%s", url.QueryEscape(req.Status))
		}
		if req.Title != "" {
			path += fmt.Sprintf("&title=%s", url.QueryEscape(req.Title))
		}
		if req.Track != "" {
			path += fmt.Sprintf("&track=%s", url.QueryEscape(req.Track))
		}
	}
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// Update calls the update submission endpoint
func (c *Client) Update(conferenceID, submissionID int64, submission *dto.Submission, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d", conferenceID, submissionID)
	req := &dto.SubmissionUpdateRequest{
		ConferenceID: conferenceID,
		ID:           submissionID,
		Submission:   submission,
	}
	return c.ctx.MakeRequest("PUT", path, req, token)
}

// Delete calls the delete submission endpoint
func (c *Client) Delete(conferenceID, submissionID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d", conferenceID, submissionID)
	return c.ctx.MakeRequest("DELETE", path, nil, token)
}

// CreateSuccess is a helper that creates a submission and returns the response
func (c *Client) CreateSuccess(conferenceID int64, submission *dto.Submission, token string) (*dto.Submission, error) {
	w, err := c.Create(conferenceID, submission, token)
	if err != nil {
		return nil, fmt.Errorf("failed to make create request: %w", err)
	}

	if w.StatusCode != 201 {
		// Read response body
		bodyBytes, _ := json.Marshal(w)

		// Also try to decode error response
		var errorResp map[string]interface{}
		json.NewDecoder(w.Body).Decode(&errorResp)

		return nil, fmt.Errorf("expected status 201, got %d. Error: %v. Full response: %s", w.StatusCode, errorResp, string(bodyBytes))
	}

	var response struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, w, &response)

	if response.Data == nil {
		return nil, fmt.Errorf("response data is nil")
	}

	return response.Data, nil
}

// GetSuccess is a helper that gets a submission and returns the response
func (c *Client) GetSuccess(conferenceID, submissionID int64, token string) (*dto.Submission, error) {
	w, err := c.Get(conferenceID, submissionID, token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, w, &response)
	return response.Data, nil
}

// GetWithReviewersSuccess is a helper that gets a submission with reviewers and returns the response
func (c *Client) GetWithReviewersSuccess(conferenceID, submissionID int64, includeReviewers bool, token string) (*dto.Submission, error) {
	w, err := c.GetWithReviewers(conferenceID, submissionID, includeReviewers, token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, w, &response)
	return response.Data, nil
}

// ListSuccess is a helper that lists submissions and returns the response
func (c *Client) ListSuccess(conferenceID int64, req *dto.SubmissionListRequest, token string) (*dto.SubmissionListResponse, error) {
	w, err := c.List(conferenceID, req, token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.SubmissionListResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, w, &response)
	return response.Data, nil
}

// CreateWithoutFile tries to create a submission without a paper file (for testing draft creation)
func (c *Client) CreateWithoutFile(conferenceID int64, submission *dto.Submission, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID)

	// Wrap submission in the format expected by backend binder
	submissionData := map[string]interface{}{
		"submission": submission,
	}
	jsonBytes, err := json.Marshal(submissionData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal submission: %w", err)
	}

	// Send as multipart form data WITHOUT paper file
	formData := map[string]string{
		"submission": string(jsonBytes),
	}

	return c.ctx.MakeMultipartRequest("POST", path, formData, token)
}

// CreateWithFile creates a submission with a paper file
func (c *Client) CreateWithFile(conferenceID int64, submission *dto.Submission, paperContent []byte, paperFilename, paperMimeType, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID)

	// Wrap submission in the format expected by backend binder
	submissionData := map[string]interface{}{
		"submission": submission,
	}
	jsonBytes, err := json.Marshal(submissionData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal submission: %w", err)
	}

	formData := map[string]string{
		"submission": string(jsonBytes),
	}

	var files []testutils.FileUpload
	if paperContent != nil {
		files = append(files, testutils.FileUpload{
			FieldName: "file",
			FileName:  paperFilename,
			Content:   paperContent,
			MimeType:  paperMimeType,
		})
	}

	return c.ctx.MakeMultipartRequestWithFiles("POST", path, formData, files, token)
}

// CreateWithCoverLetter creates a submission with a paper file and cover letter
func (c *Client) CreateWithCoverLetter(conferenceID int64, submission *dto.Submission, coverLetterContent []byte, coverLetterFilename, coverLetterMimeType, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID)

	// Wrap submission in the format expected by backend binder
	submissionData := map[string]interface{}{
		"submission": submission,
	}
	jsonBytes, err := json.Marshal(submissionData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal submission: %w", err)
	}

	formData := map[string]string{
		"submission": string(jsonBytes),
	}

	var files []testutils.FileUpload

	// Add paper file (required for create with status="published")
	// Read the valid test PDF file
	testPDFContent, err := os.ReadFile("../test_paper.pdf")
	if err != nil {
		// Fallback to a minimal valid PDF
		testPDFContent = []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 0\n>>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000015 00000 n\n0000000068 00000 n\ntrailer\n<<\n/Size 3\n/Root 1 0 R\n>>\nstartxref\n117\n%%EOF")
	}
	files = append(files, testutils.FileUpload{
		FieldName: "file",
		FileName:  "test_paper.pdf",
		Content:   testPDFContent,
		MimeType:  "application/pdf",
	})

	// Add cover letter if provided
	if coverLetterContent != nil {
		files = append(files, testutils.FileUpload{
			FieldName: "cover_letter",
			FileName:  coverLetterFilename,
			Content:   coverLetterContent,
			MimeType:  coverLetterMimeType,
		})
	}

	return c.ctx.MakeMultipartRequestWithFiles("POST", path, formData, files, token)
}

// UpdateWithCoverLetter updates a submission with an optional cover letter
func (c *Client) UpdateWithCoverLetter(conferenceID, submissionID int64, submission *dto.Submission, coverLetterContent []byte, coverLetterFilename, coverLetterMimeType, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d", conferenceID, submissionID)

	// Wrap submission in the format expected by backend binder
	submissionData := map[string]interface{}{
		"submission": submission,
	}
	jsonBytes, err := json.Marshal(submissionData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal submission: %w", err)
	}

	formData := map[string]string{
		"submission": string(jsonBytes),
	}

	var files []testutils.FileUpload
	if coverLetterContent != nil {
		files = append(files, testutils.FileUpload{
			FieldName: "cover_letter",
			FileName:  coverLetterFilename,
			Content:   coverLetterContent,
			MimeType:  coverLetterMimeType,
		})
	}

	return c.ctx.MakeMultipartRequestWithFiles("PUT", path, formData, files, token)
}

// GetCoverLetter downloads the cover letter for a submission
func (c *Client) GetCoverLetter(conferenceID, submissionID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/cover_letter", conferenceID, submissionID)
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// UpdateWithFiles updates a submission with optional paper file and/or cover letter
func (c *Client) UpdateWithFiles(conferenceID, submissionID int64, submission *dto.Submission, paperContent []byte, paperFilename, paperMimeType string, coverLetterContent []byte, coverLetterFilename, coverLetterMimeType, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d", conferenceID, submissionID)

	// Wrap submission in the format expected by backend binder
	submissionData := map[string]interface{}{
		"submission": submission,
	}
	jsonBytes, err := json.Marshal(submissionData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal submission: %w", err)
	}

	formData := map[string]string{
		"submission": string(jsonBytes),
	}

	var files []testutils.FileUpload

	// Add paper file if provided
	if paperContent != nil {
		files = append(files, testutils.FileUpload{
			FieldName: "file",
			FileName:  paperFilename,
			Content:   paperContent,
			MimeType:  paperMimeType,
		})
	}

	// Add cover letter if provided
	if coverLetterContent != nil {
		files = append(files, testutils.FileUpload{
			FieldName: "cover_letter",
			FileName:  coverLetterFilename,
			Content:   coverLetterContent,
			MimeType:  coverLetterMimeType,
		})
	}

	return c.ctx.MakeMultipartRequestWithFiles("PUT", path, formData, files, token)
}

// Publish calls the publish submission endpoint (without files)
func (c *Client) Publish(conferenceID, submissionID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/publish", conferenceID, submissionID)
	// No body needed for simple publish (when file already exists)
	return c.ctx.MakeRequest("POST", path, nil, token)
}

// PublishWithFiles calls the publish submission endpoint with optional paper file and/or cover letter
func (c *Client) PublishWithFiles(conferenceID, submissionID int64, paperContent []byte, paperFilename, paperMimeType string, coverLetterContent []byte, coverLetterFilename, coverLetterMimeType, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/publish", conferenceID, submissionID)

	// No submission metadata needed for publish - just files
	formData := map[string]string{}

	var files []testutils.FileUpload

	// Add paper file if provided
	if paperContent != nil {
		files = append(files, testutils.FileUpload{
			FieldName: "file",
			FileName:  paperFilename,
			Content:   paperContent,
			MimeType:  paperMimeType,
		})
	}

	// Add cover letter if provided
	if coverLetterContent != nil {
		files = append(files, testutils.FileUpload{
			FieldName: "cover_letter",
			FileName:  coverLetterFilename,
			Content:   coverLetterContent,
			MimeType:  coverLetterMimeType,
		})
	}

	return c.ctx.MakeMultipartRequestWithFiles("POST", path, formData, files, token)
}
