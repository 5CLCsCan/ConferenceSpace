package conference

import (
	"fmt"
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// Client provides methods to call conference management endpoints
type Client struct {
	ctx *testutils.TestContext
}

// NewClient creates a new conference client
func NewClient(ctx *testutils.TestContext) *Client {
	return &Client{ctx: ctx}
}

// Create calls the create conference endpoint
func (c *Client) Create(conference *dto.Conference, token string) (*http.Response, error) {
	req := &dto.ConferenceCreateRequest{
		Conference: conference,
	}
	return c.ctx.MakeRequest("POST", "/api/v1/conferences", req, token)
}

// Get calls the get conference by ID endpoint
func (c *Client) Get(conferenceID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d", conferenceID)
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// List calls the list conferences endpoint
func (c *Client) List(req *dto.ConferenceListRequest, token string) (*http.Response, error) {
	path := "/api/v1/conferences"
	if req != nil {
		path += fmt.Sprintf("?limit=%d&offset=%d", req.Limit, req.Offset)
		if req.Title != "" {
			path += fmt.Sprintf("&title=%s", req.Title)
		}
		if req.Acronym != "" {
			path += fmt.Sprintf("&acronym=%s", req.Acronym)
		}
		if req.Chair != "" {
			path += fmt.Sprintf("&chair=%s", req.Chair)
		}
	}
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// Update calls the update conference endpoint
func (c *Client) Update(conferenceID int64, conference *dto.Conference, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d", conferenceID)
	// Send only the JSON body part (conference field), not the whole request
	// The conference_id comes from the URL path, not the JSON body
	body := map[string]interface{}{
		"conference": conference,
	}
	return c.ctx.MakeRequest("PUT", path, body, token)
}

// Delete calls the delete conference endpoint
func (c *Client) Delete(conferenceID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d", conferenceID)
	return c.ctx.MakeRequest("DELETE", path, nil, token)
}

// CreateSuccess is a helper that creates a conference and returns the response
func (c *Client) CreateSuccess(conference *dto.Conference, token string) (*dto.ConferenceResponse, error) {
	w, err := c.Create(conference, token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, w, &response)
	return response.Data, nil
}

// GetSuccess is a helper that gets a conference and returns the response
func (c *Client) GetSuccess(conferenceID int64, token string) (*dto.ConferenceResponse, error) {
	w, err := c.Get(conferenceID, token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, w, &response)
	return response.Data, nil
}

// ListSuccess is a helper that lists conferences and returns the response
func (c *Client) ListSuccess(req *dto.ConferenceListRequest, token string) (*dto.ConferenceListResponse, error) {
	w, err := c.List(req, token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.ConferenceListResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, w, &response)
	return response.Data, nil
}

// ToggleBookmark calls the toggle bookmark endpoint
func (c *Client) ToggleBookmark(conferenceID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/bookmark", conferenceID)
	return c.ctx.MakeRequest("PUT", path, nil, token)
}

// ToggleBookmarkSuccess is a helper that toggles a bookmark and returns the response
func (c *Client) ToggleBookmarkSuccess(conferenceID int64, token string) (*dto.ConferenceBookmarkResponse, error) {
	w, err := c.ToggleBookmark(conferenceID, token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.ConferenceBookmarkResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, w, &response)
	return response.Data, nil
}

// GetStats calls the conference stats endpoint
func (c *Client) GetStats(conferenceID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/stats", conferenceID)
	return c.ctx.MakeRequest("GET", path, nil, token)
}
