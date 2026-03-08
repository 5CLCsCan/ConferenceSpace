package notification

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// Client provides methods to call notification management endpoints
type Client struct {
	ctx *testutils.TestContext
}

// NewClient creates a new notification client
func NewClient(ctx *testutils.TestContext) *Client {
	return &Client{ctx: ctx}
}

// List calls the list notifications endpoint
func (c *Client) List(req *dto.NotificationListRequest, token string) (*http.Response, error) {
	path := "/api/v1/notifications"
	if req != nil {
		params := url.Values{}
		if req.Limit > 0 {
			params.Add("limit", fmt.Sprintf("%d", req.Limit))
		}
		if req.Offset > 0 {
			params.Add("offset", fmt.Sprintf("%d", req.Offset))
		}
		if req.Unread {
			params.Add("unread", "true")
		}
		if req.Type != "" {
			params.Add("type", req.Type)
		}
		if len(params) > 0 {
			path += "?" + params.Encode()
		}
	}
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// GetUnreadCount calls the get unread count endpoint
func (c *Client) GetUnreadCount(token string) (*http.Response, error) {
	path := "/api/v1/notifications/unread-count"
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// GetPreferences calls the get notification preferences endpoint
func (c *Client) GetPreferences(token string) (*http.Response, error) {
	path := "/api/v1/notifications/preferences"
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// UpdatePreferences calls the update notification preferences endpoint
func (c *Client) UpdatePreferences(req *dto.NotificationPreferencesUpdateRequest, token string) (*http.Response, error) {
	path := "/api/v1/notifications/preferences"
	return c.ctx.MakeRequest("PUT", path, req, token)
}

// MarkAsRead calls the mark notification as read endpoint
func (c *Client) MarkAsRead(notificationID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/notifications/%d/read", notificationID)
	return c.ctx.MakeRequest("PATCH", path, nil, token)
}

// MarkAllAsRead calls the mark all notifications as read endpoint
func (c *Client) MarkAllAsRead(token string) (*http.Response, error) {
	path := "/api/v1/notifications/read-all"
	return c.ctx.MakeRequest("PATCH", path, nil, token)
}

// Get calls the get notification by ID endpoint
func (c *Client) Get(notificationID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/notifications/%d", notificationID)
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// Delete calls the delete notification endpoint
func (c *Client) Delete(notificationID int64, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/notifications/%d", notificationID)
	return c.ctx.MakeRequest("DELETE", path, nil, token)
}

// === Helper methods that return parsed responses ===

// ListSuccess lists notifications and returns the parsed response
func (c *Client) ListSuccess(req *dto.NotificationListRequest, token string) (*dto.NotificationListResponse, error) {
	resp, err := c.List(req, token)
	if err != nil {
		return nil, fmt.Errorf("failed to make list request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("expected status 200, got %d", resp.StatusCode)
	}

	var response struct {
		Data *dto.NotificationListResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)

	if response.Data == nil {
		return nil, fmt.Errorf("response data is nil")
	}

	return response.Data, nil
}

// GetUnreadCountSuccess gets unread count and returns the parsed response
func (c *Client) GetUnreadCountSuccess(token string) (*dto.UnreadCountResponse, error) {
	resp, err := c.GetUnreadCount(token)
	if err != nil {
		return nil, fmt.Errorf("failed to make get unread count request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("expected status 200, got %d", resp.StatusCode)
	}

	var response struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)

	if response.Data == nil {
		return nil, fmt.Errorf("response data is nil")
	}

	return response.Data, nil
}

// MarkAsReadSuccess marks a notification as read and returns the parsed response
func (c *Client) MarkAsReadSuccess(notificationID int64, token string) (*dto.Notification, error) {
	resp, err := c.MarkAsRead(notificationID, token)
	if err != nil {
		return nil, fmt.Errorf("failed to make mark as read request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("expected status 200, got %d", resp.StatusCode)
	}

	var response struct {
		Data *dto.Notification `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)

	if response.Data == nil {
		return nil, fmt.Errorf("response data is nil")
	}

	return response.Data, nil
}

// MarkAllAsReadSuccess marks all notifications as read and returns success
func (c *Client) MarkAllAsReadSuccess(token string) error {
	resp, err := c.MarkAllAsRead(token)
	if err != nil {
		return fmt.Errorf("failed to make mark all as read request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("expected status 200, got %d", resp.StatusCode)
	}

	return nil
}

// GetSuccess gets a notification by ID and returns the parsed response
func (c *Client) GetSuccess(notificationID int64, token string) (*dto.Notification, error) {
	resp, err := c.Get(notificationID, token)
	if err != nil {
		return nil, fmt.Errorf("failed to make get request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("expected status 200, got %d", resp.StatusCode)
	}

	var response struct {
		Data *dto.Notification `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)

	if response.Data == nil {
		return nil, fmt.Errorf("response data is nil")
	}

	return response.Data, nil
}
