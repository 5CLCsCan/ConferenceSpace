package auth

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestForgotPassword(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	client := NewClient(ctx)

	// Register a real user to test with
	email := testutils.UniqueEmail("forgotpw")
	_, err := ctx.RegisterUser(email, "password123", "Forgot", "User", []string{"CS"})
	if err != nil {
		t.Fatalf("Failed to register test user: %v", err)
	}

	tests := []struct {
		name           string
		request        *dto.ForgotPasswordRequest
		expectedStatus int
		expectToken    bool
	}{
		{
			name:           "existing email returns 200 with token in dev mode",
			request:        &dto.ForgotPasswordRequest{Email: email},
			expectedStatus: http.StatusOK,
			expectToken:    true,
		},
		{
			name:           "non-existent email still returns 200 (no enumeration)",
			request:        &dto.ForgotPasswordRequest{Email: testutils.UniqueEmail("nonexistent")},
			expectedStatus: http.StatusOK,
			expectToken:    false,
		},
		{
			name:           "missing email returns 400",
			request:        &dto.ForgotPasswordRequest{},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid email format returns 400",
			request:        &dto.ForgotPasswordRequest{Email: "not-an-email"},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.ForgotPassword(tt.request)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if tt.expectedStatus == http.StatusOK {
				var respData struct {
					Data *dto.ForgotPasswordResponse `json:"data"`
				}
				testutils.DecodeResponse(t, resp, &respData)

				if respData.Data == nil {
					t.Fatal("Expected data in response")
				}
				if respData.Data.Message == "" {
					t.Error("Expected message in response")
				}
				if tt.expectToken && respData.Data.Token == nil {
					t.Error("Expected token in dev mode response for existing email")
				}
				if !tt.expectToken && respData.Data.Token != nil {
					t.Error("Expected no token for non-existent email")
				}
			}
		})
	}
}
