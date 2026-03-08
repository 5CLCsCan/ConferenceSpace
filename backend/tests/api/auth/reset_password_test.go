package auth

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestResetPassword(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	client := NewClient(ctx)

	t.Run("valid token resets password and allows new login", func(t *testing.T) {
		email := testutils.UniqueEmail("resetpw")
		ctx.RegisterUser(email, "oldpassword123", "Reset", "User", []string{"CS"})

		token, err := client.ForgotPasswordGetToken(email)
		if err != nil {
			t.Fatalf("Failed to get reset token: %v", err)
		}

		resp, err := client.ResetPassword(&dto.ResetPasswordRequest{
			Token:       token,
			NewPassword: "newpassword456",
		})
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		// Verify can login with new password
		newToken, err := ctx.LoginAndGetToken(email, "newpassword456")
		if err != nil || newToken == "" {
			t.Error("Expected successful login with new password")
		}

		// Verify old password no longer works
		oldLoginResp, _ := ctx.MakeRequest("POST", "/api/v1/auth/login", &dto.LoginRequest{
			Email: email, Password: "oldpassword123",
		}, "")
		testutils.AssertStatusCode(t, oldLoginResp, http.StatusUnauthorized)
	})

	t.Run("token can only be used once", func(t *testing.T) {
		email := testutils.UniqueEmail("resetpw2")
		ctx.RegisterUser(email, "password123", "Reset2", "User", []string{"CS"})

		token, _ := client.ForgotPasswordGetToken(email)

		// Use token once
		client.ResetPassword(&dto.ResetPasswordRequest{Token: token, NewPassword: "newpassword1!!"})

		// Try again — should fail
		resp, _ := client.ResetPassword(&dto.ResetPasswordRequest{Token: token, NewPassword: "newpassword2!!"})
		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
	})

	t.Run("invalid token returns 400", func(t *testing.T) {
		resp, err := client.ResetPassword(&dto.ResetPasswordRequest{
			Token:       "totally-invalid-token-abc123",
			NewPassword: "newpassword456",
		})
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
	})

	t.Run("weak new password returns 400", func(t *testing.T) {
		email := testutils.UniqueEmail("resetpw3")
		ctx.RegisterUser(email, "password123", "Reset3", "User", []string{"CS"})
		token, _ := client.ForgotPasswordGetToken(email)

		resp, err := client.ResetPassword(&dto.ResetPasswordRequest{
			Token:       token,
			NewPassword: "short",
		})
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
	})

	t.Run("missing token returns 400", func(t *testing.T) {
		resp, _ := client.ResetPassword(&dto.ResetPasswordRequest{NewPassword: "newpassword456"})
		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
	})
}
