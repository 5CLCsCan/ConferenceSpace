package discussion

import (
	"fmt"
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// Client provides methods to call discussion management endpoints
type Client struct {
	ctx *testutils.TestContext
}

// NewClient creates a new discussion client
func NewClient(ctx *testutils.TestContext) *Client {
	return &Client{ctx: ctx}
}

// CreateThread creates a new discussion thread
func (c *Client) CreateThread(conferenceID, submissionID int64, req *dto.CreateThreadRequest, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/threads", conferenceID, submissionID)
	return c.ctx.MakeRequest("POST", path, req, token)
}

// GetThreads gets all threads for a submission
func (c *Client) GetThreads(conferenceID, submissionID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/threads", conferenceID, submissionID)
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// GetThread gets a specific thread by ID
func (c *Client) GetThread(threadID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/threads/%d", threadID)
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// CreateMessage adds a message to a thread
func (c *Client) CreateMessage(threadID int64, req *dto.CreateMessageRequest, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/threads/%d/messages", threadID)
	return c.ctx.MakeRequest("POST", path, req, token)
}

// GetMessages gets all messages in a thread
func (c *Client) GetMessages(threadID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/threads/%d/messages", threadID)
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// === Helper methods that return parsed responses ===

// CreateThreadSuccess creates a thread and returns the parsed response
func (c *Client) CreateThreadSuccess(conferenceID, submissionID int64, req *dto.CreateThreadRequest, token string) (*dto.CreateThreadResponse, error) {
	resp, err := c.CreateThread(conferenceID, submissionID, req, token)
	if err != nil {
		return nil, fmt.Errorf("failed to make create thread request: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		body := testutils.ReadResponseBody(c.ctx.T, resp)
		return nil, fmt.Errorf("expected status 201, got %d. Body: %s", resp.StatusCode, body)
	}

	var response struct {
		Data *dto.CreateThreadResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)

	if response.Data == nil {
		return nil, fmt.Errorf("response data is nil")
	}

	return response.Data, nil
}

// GetThreadsSuccess gets threads and returns the parsed response
func (c *Client) GetThreadsSuccess(conferenceID, submissionID int64, token string) (*dto.ThreadListResponse, error) {
	resp, err := c.GetThreads(conferenceID, submissionID, token)
	if err != nil {
		return nil, fmt.Errorf("failed to make get threads request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		body := testutils.ReadResponseBody(c.ctx.T, resp)
		return nil, fmt.Errorf("expected status 200, got %d. Body: %s", resp.StatusCode, body)
	}

	var response struct {
		Data *dto.ThreadListResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)

	if response.Data == nil {
		return nil, fmt.Errorf("response data is nil")
	}

	return response.Data, nil
}

// GetThreadSuccess gets a thread and returns the parsed response
func (c *Client) GetThreadSuccess(threadID int64, token string) (*dto.DiscussionThread, error) {
	resp, err := c.GetThread(threadID, token)
	if err != nil {
		return nil, fmt.Errorf("failed to make get thread request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		body := testutils.ReadResponseBody(c.ctx.T, resp)
		return nil, fmt.Errorf("expected status 200, got %d. Body: %s", resp.StatusCode, body)
	}

	var response struct {
		Data *dto.DiscussionThread `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)

	if response.Data == nil {
		return nil, fmt.Errorf("response data is nil")
	}

	return response.Data, nil
}

// CreateMessageSuccess adds a message and returns the parsed response
func (c *Client) CreateMessageSuccess(threadID int64, req *dto.CreateMessageRequest, token string) (*dto.DiscussionMessage, error) {
	resp, err := c.CreateMessage(threadID, req, token)
	if err != nil {
		return nil, fmt.Errorf("failed to make create message request: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		body := testutils.ReadResponseBody(c.ctx.T, resp)
		return nil, fmt.Errorf("expected status 201, got %d. Body: %s", resp.StatusCode, body)
	}

	var response struct {
		Data *dto.DiscussionMessage `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)

	if response.Data == nil {
		return nil, fmt.Errorf("response data is nil")
	}

	return response.Data, nil
}

// GetMessagesSuccess gets messages and returns the parsed response
func (c *Client) GetMessagesSuccess(threadID int64, token string) (*dto.MessageListResponse, error) {
	resp, err := c.GetMessages(threadID, token)
	if err != nil {
		return nil, fmt.Errorf("failed to make get messages request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		body := testutils.ReadResponseBody(c.ctx.T, resp)
		return nil, fmt.Errorf("expected status 200, got %d. Body: %s", resp.StatusCode, body)
	}

	var response struct {
		Data *dto.MessageListResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)

	if response.Data == nil {
		return nil, fmt.Errorf("response data is nil")
	}

	return response.Data, nil
}
