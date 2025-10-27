package testutils

import (
	"github.com/dcao/conferencespace/internal/dto"
)

// LoginAndGetToken is a helper to login and get a JWT token
func (tc *TestContext) LoginAndGetToken(email, password string) (string, error) {
	loginReq := &dto.LoginRequest{
		Email:    email,
		Password: password,
	}

	resp, err := tc.MakeRequest("POST", "/api/v1/auth/login", loginReq, "")
	if err != nil {
		return "", err
	}

	var response struct {
		Data *dto.LoginResponse `json:"data"`
	}
	DecodeResponse(tc.T, resp, &response)

	return response.Data.Token, nil
}

// RegisterUser is a helper to register a new user
func (tc *TestContext) RegisterUser(email, password, firstName, lastName string, domain []string) (*dto.UserResponse, error) {
	req := &dto.UserCreateRequest{
		User: &dto.User{
			Email:     email,
			FirstName: firstName,
			LastName:  lastName,
			Domain:    domain,
		},
		Password: password,
	}

	resp, err := tc.MakeRequest("POST", "/api/v1/auth/register", req, "")
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.UserResponse `json:"data"`
	}
	DecodeResponse(tc.T, resp, &response)

	return response.Data, nil
}

// RegisterAndLogin is a helper that registers a user and returns their token
func (tc *TestContext) RegisterAndLogin(email, password, firstName, lastName string, domain []string) (string, *dto.UserResponse, error) {
	user, err := tc.RegisterUser(email, password, firstName, lastName, domain)
	if err != nil {
		return "", nil, err
	}

	token, err := tc.LoginAndGetToken(email, password)
	if err != nil {
		return "", nil, err
	}

	return token, user, nil
}

// RegisterUniqueUser registers a user with a unique email based on the base name
func (tc *TestContext) RegisterUniqueUser(baseName, password, firstName, lastName string, domain []string) (string, *dto.UserResponse, error) {
	email := UniqueEmail(baseName)
	return tc.RegisterAndLogin(email, password, firstName, lastName, domain)
}
