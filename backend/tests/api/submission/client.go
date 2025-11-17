package submission

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

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

// Create calls the create submission endpoint
func (c *Client) Create(conferenceID int64, submission *dto.Submission, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID)

	// Submission API requires multipart/form-data
	req := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission:   submission,
	}

	// Convert submission to JSON string
	jsonBytes, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal submission: %w", err)
	}

	// Send as multipart form data
	formData := map[string]string{
		"submission": string(jsonBytes),
	}

	return c.ctx.MakeMultipartRequest("POST", path, formData, token)
}

// Get calls the get submission by ID endpoint
func (c *Client) Get(conferenceID, submissionID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d", conferenceID, submissionID)
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
		return nil, err
	}

	var response struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, w, &response)
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
