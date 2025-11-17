package user

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestGetMe(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Register user via API
	token, _, err := ctx.RegisterAndLogin(
		"testuser@example.com",
		"password123",
		"Test",
		"User",
		[]string{"Computer Science"},
	)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	tests := []struct {
		name           string
		token          string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "successful request with valid token",
			token:          token,
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:           "request without token",
			token:          "",
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
		{
			name:           "request with invalid token",
			token:          "invalid.token.here",
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.GetMe(tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if !tt.expectError {
				var respData struct {
					Data *dto.UserResponse `json:"data"`
				}
				testutils.DecodeResponse(t, resp, &respData)

				if respData.Data.Email != "testuser@example.com" {
					t.Errorf("Expected email 'testuser@example.com', got %s", respData.Data.Email)
				}
			}
		})
	}
}

func TestListUsers(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create multiple test users via API
	token1, _, _ := ctx.RegisterAndLogin("user1@example.com", "password123", "User", "One", []string{"AI"})
	_, _, _ = ctx.RegisterAndLogin("user2@example.com", "password123", "User", "Two", []string{"ML"})
	_, _, _ = ctx.RegisterAndLogin("user3@example.com", "password123", "User", "Three", []string{"NLP"})

	tests := []struct {
		name           string
		request        *dto.UserListRequest
		expectedStatus int
		minCount       int
	}{
		{
			name:           "list all users",
			request:        &dto.UserListRequest{},
			expectedStatus: http.StatusOK,
			minCount:       3,
		},
		{
			name: "list with limit",
			request: &dto.UserListRequest{
				Limit: 2,
			},
			expectedStatus: http.StatusOK,
			minCount:       2,
		},
		{
			name: "filter by email",
			request: &dto.UserListRequest{
				Email: "user1@example.com",
			},
			expectedStatus: http.StatusOK,
			minCount:       1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.List(tt.request, token1)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			var respData struct {
				Data *dto.UserListResponse `json:"data"`
			}
			testutils.DecodeResponse(t, resp, &respData)

			if len(respData.Data.Users) < tt.minCount {
				t.Errorf("Expected at least %d users, got %d", tt.minCount, len(respData.Data.Users))
			}
		})
	}
}

func TestUpdateUser(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test users via API
	token1, user1, err := ctx.RegisterUniqueUser("user1", "password123", "User", "One", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user1: %v", err)
	}
	_, user2, err := ctx.RegisterUniqueUser("user2", "password123", "User", "Two", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register user2: %v", err)
	}

	tests := []struct {
		name           string
		userEmail      string
		token          string
		updateData     *dto.User
		expectedStatus int
		expectError    bool
	}{
		{
			name:      "successfully update own profile",
			userEmail: user1.Email,
			token:     token1,
			updateData: &dto.User{
				Email:     user1.Email, // Keep original email
				FirstName: "Updated",
				LastName:  "Name",
				Domain:    []string{"Computer Science", "AI"},
			},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:      "cannot update another user's profile",
			userEmail: user2.Email,
			token:     token1,
			updateData: &dto.User{
				Email:     "user2@example.com",
				FirstName: "Hacker",
				LastName:  "User",
			},
			expectedStatus: http.StatusForbidden,
			expectError:    true,
		},
		{
			name:      "update without authentication",
			userEmail: user1.Email,
			token:     "",
			updateData: &dto.User{
				Email:     "user1@example.com",
				FirstName: "Anonymous",
				LastName:  "User",
			},
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.Update(tt.userEmail, tt.updateData, tt.token)
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
			}
		})
	}
}

func TestDeleteUser(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test users via API
	_, user1, err := ctx.RegisterUniqueUser("delete1", "password123", "Delete", "One", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user1: %v", err)
	}
	token2, user2, err := ctx.RegisterUniqueUser("delete2", "password123", "Delete", "Two", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register user2: %v", err)
	}

	tests := []struct {
		name           string
		userEmail      string
		token          string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "cannot delete another user's account",
			userEmail:      user1.Email,
			token:          token2,
			expectedStatus: http.StatusForbidden,
			expectError:    true,
		},
		{
			name:           "delete without authentication",
			userEmail:      user1.Email,
			token:          "",
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
		{
			name:           "successfully delete own account",
			userEmail:      user2.Email,
			token:          token2,
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.Delete(tt.userEmail, tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if !tt.expectError {
				var respMap map[string]interface{}
				testutils.DecodeResponse(t, resp, &respMap)
				if respMap["message"] != "user deleted successfully" {
					t.Error("Expected success message")
				}
			}
		})
	}
}
