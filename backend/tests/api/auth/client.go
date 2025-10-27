package auth

import (
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// Client provides methods to call authentication endpoints
type Client struct {
	ctx *testutils.TestContext
}

// NewClient creates a new auth client
func NewClient(ctx *testutils.TestContext) *Client {
	return &Client{ctx: ctx}
}

// Register calls the user registration endpoint
func (c *Client) Register(req *dto.UserCreateRequest) (*http.Response, error) {
	return c.ctx.MakeRequest("POST", "/api/v1/auth/register", req, "")
}

// Login calls the user login endpoint
func (c *Client) Login(req *dto.LoginRequest) (*http.Response, error) {
	return c.ctx.MakeRequest("POST", "/api/v1/auth/login", req, "")
}

// RegisterSuccess is a helper that registers a user and returns the response
func (c *Client) RegisterSuccess(email, password, firstName, lastName string, domain []string) (*dto.UserResponse, error) {
	req := &dto.UserCreateRequest{
		User: &dto.User{
			Email:     email,
			FirstName: firstName,
			LastName:  lastName,
			Domain:    domain,
		},
		Password: password,
	}

	resp, err := c.Register(req)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.UserResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)
	return response.Data, nil
}

// LoginSuccess is a helper that logs in and returns the token and user
func (c *Client) LoginSuccess(email, password string) (*dto.LoginResponse, error) {
	req := &dto.LoginRequest{
		Email:    email,
		Password: password,
	}

	resp, err := c.Login(req)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.LoginResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)
	return response.Data, nil
}
