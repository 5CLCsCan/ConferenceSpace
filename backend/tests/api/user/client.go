package user

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// Client provides methods to call user management endpoints
type Client struct {
	ctx *testutils.TestContext
}

// NewClient creates a new user client
func NewClient(ctx *testutils.TestContext) *Client {
	return &Client{ctx: ctx}
}

// GetMe calls the get current user endpoint
func (c *Client) GetMe(token string) (*http.Response, error) {
	return c.ctx.MakeRequest("GET", "/api/v1/users/me", nil, token)
}

// Get calls the get user by email endpoint
func (c *Client) Get(userEmail string, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/users/%s", url.PathEscape(userEmail))
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// List calls the list users endpoint
func (c *Client) List(req *dto.UserListRequest, token string) (*http.Response, error) {
	path := "/api/v1/users"
	if req != nil {
		path += fmt.Sprintf("?limit=%d&offset=%d", req.Limit, req.Offset)
		if req.Email != "" {
			path += fmt.Sprintf("&email=%s", req.Email)
		}
		if req.FirstName != "" {
			path += fmt.Sprintf("&first_name=%s", req.FirstName)
		}
		if req.LastName != "" {
			path += fmt.Sprintf("&last_name=%s", req.LastName)
		}
	}
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// Update calls the update user endpoint
func (c *Client) Update(userEmail string, user *dto.User, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/users/%s", url.PathEscape(userEmail))
	req := &dto.UserUpdateRequest{
		User: user,
	}
	return c.ctx.MakeRequest("PUT", path, req, token)
}

// Delete calls the delete user endpoint
func (c *Client) Delete(userEmail string, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/users/%s", url.PathEscape(userEmail))
	return c.ctx.MakeRequest("DELETE", path, nil, token)
}

// GetMeSuccess is a helper that gets the current user and returns the response
func (c *Client) GetMeSuccess(token string) (*dto.UserResponse, error) {
	w, err := c.GetMe(token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.UserResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, w, &response)
	return response.Data, nil
}

// ListSuccess is a helper that lists users and returns the response
func (c *Client) ListSuccess(req *dto.UserListRequest, token string) (*dto.UserListResponse, error) {
	w, err := c.List(req, token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.UserListResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, w, &response)
	return response.Data, nil
}
