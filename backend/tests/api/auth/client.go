package auth

import (
	"fmt"
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

// ForgotPassword calls the forgot-password endpoint
func (c *Client) ForgotPassword(req *dto.ForgotPasswordRequest) (*http.Response, error) {
	return c.ctx.MakeRequest("POST", "/api/v1/auth/forgot-password", req, "")
}

// ResetPassword calls the reset-password endpoint
func (c *Client) ResetPassword(req *dto.ResetPasswordRequest) (*http.Response, error) {
	return c.ctx.MakeRequest("POST", "/api/v1/auth/reset-password", req, "")
}

// ChangePassword calls the change-password endpoint (requires auth token)
func (c *Client) ChangePassword(req *dto.ChangePasswordRequest, token string) (*http.Response, error) {
	return c.ctx.MakeRequest("POST", "/api/v1/auth/change-password", req, token)
}

// VerifyEmail calls the verify-email endpoint
func (c *Client) VerifyEmail(token string) (*http.Response, error) {
	return c.ctx.MakeRequest("GET", "/api/v1/auth/verify-email?token="+token, nil, "")
}

// ResendVerification calls the resend-verification endpoint
func (c *Client) ResendVerification(req *dto.ResendVerificationRequest) (*http.Response, error) {
	return c.ctx.MakeRequest("POST", "/api/v1/auth/resend-verification", req, "")
}

// ForgotPasswordGetToken is a helper that calls forgot-password and extracts the dev-mode token
func (c *Client) ForgotPasswordGetToken(email string) (string, error) {
	resp, err := c.ForgotPassword(&dto.ForgotPasswordRequest{Email: email})
	if err != nil {
		return "", err
	}

	var response struct {
		Data *dto.ForgotPasswordResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)
	if response.Data == nil || response.Data.Token == nil {
		return "", fmt.Errorf("no token in response (is server in dev mode?)")
	}
	return *response.Data.Token, nil
}

// ResendVerificationGetToken is a helper that calls resend-verification and extracts the dev-mode token
func (c *Client) ResendVerificationGetToken(email string) (string, error) {
	resp, err := c.ResendVerification(&dto.ResendVerificationRequest{Email: email})
	if err != nil {
		return "", err
	}

	var response struct {
		Data *dto.ResendVerificationResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)
	if response.Data == nil || response.Data.Token == nil {
		return "", fmt.Errorf("no token in response (is server in dev mode?)")
	}
	return *response.Data.Token, nil
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
