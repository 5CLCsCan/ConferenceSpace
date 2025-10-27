package auth

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestRegister(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	tests := []struct {
		name           string
		request        *dto.UserCreateRequest
		expectedStatus int
		expectError    bool
	}{
		{
			name: "successful registration",
			request: &dto.UserCreateRequest{
				User: &dto.User{
					Email:     testutils.UniqueEmail("newuser"),
					FirstName: "New",
					LastName:  "User",
					Domain:    []string{"Computer Science"},
				},
				Password: "securepassword123",
			},
			expectedStatus: http.StatusCreated,
			expectError:    false,
		},
		{
			name: "missing email",
			request: &dto.UserCreateRequest{
				User: &dto.User{
					FirstName: "New",
					LastName:  "User",
					Domain:    []string{"Computer Science"},
				},
				Password: "securepassword123",
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
		{
			name: "missing password",
			request: &dto.UserCreateRequest{
				User: &dto.User{
					Email:     testutils.UniqueEmail("newuser2"),
					FirstName: "New",
					LastName:  "User",
					Domain:    []string{"Computer Science"},
				},
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
		{
			name: "short password",
			request: &dto.UserCreateRequest{
				User: &dto.User{
					Email:     testutils.UniqueEmail("newuser3"),
					FirstName: "New",
					LastName:  "User",
					Domain:    []string{"Computer Science"},
				},
				Password: "123",
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.Register(tt.request)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if tt.expectError {
				var respMap map[string]interface{}
				testutils.DecodeResponse(t, resp, &respMap)
				if _, ok := respMap["error"]; !ok {
					t.Error("Expected error field in response")
				}
			} else {
				var respData struct {
					Data *dto.UserResponse `json:"data"`
				}
				testutils.DecodeResponse(t, resp, &respData)

				if respData.Data.Email != tt.request.User.Email {
					t.Errorf("Expected email %s, got %s", tt.request.User.Email, respData.Data.Email)
				}
			}
		})
	}
}

func TestLogin(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Register a test user first using the API with unique email
	testEmail := testutils.UniqueEmail("testuser")
	_, err := ctx.RegisterUser(
		testEmail,
		"password123",
		"Test",
		"User",
		[]string{"Computer Science"},
	)
	if err != nil {
		t.Fatalf("Failed to register test user: %v", err)
	}

	tests := []struct {
		name           string
		request        *dto.LoginRequest
		expectedStatus int
		expectError    bool
		checkToken     bool
	}{
		{
			name: "successful login",
			request: &dto.LoginRequest{
				Email:    testEmail,
				Password: "password123",
			},
			expectedStatus: http.StatusOK,
			expectError:    false,
			checkToken:     true,
		},
		{
			name: "wrong password",
			request: &dto.LoginRequest{
				Email:    testEmail,
				Password: "wrongpassword",
			},
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
			checkToken:     false,
		},
		{
			name: "non-existent user",
			request: &dto.LoginRequest{
				Email:    testutils.UniqueEmail("nonexistent"),
				Password: "password123",
			},
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
			checkToken:     false,
		},
		{
			name: "missing email",
			request: &dto.LoginRequest{
				Password: "password123",
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
			checkToken:     false,
		},
		{
			name: "missing password",
			request: &dto.LoginRequest{
				Email: testEmail,
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
			checkToken:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.Login(tt.request)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if tt.expectError {
				var respMap map[string]interface{}
				testutils.DecodeResponse(t, resp, &respMap)
				if _, ok := respMap["error"]; !ok {
					t.Error("Expected error field in response")
				}
			} else {
				var respData struct {
					Data *dto.LoginResponse `json:"data"`
				}
				testutils.DecodeResponse(t, resp, &respData)

				if tt.checkToken {
					if respData.Data.Token == "" {
						t.Error("Expected token in response")
					}

					if respData.Data.User == nil {
						t.Error("Expected user in response")
					} else if respData.Data.User.Email != tt.request.Email {
						t.Errorf("Expected user email %s, got %s", tt.request.Email, respData.Data.User.Email)
					}
				}
			}
		})
	}
}
