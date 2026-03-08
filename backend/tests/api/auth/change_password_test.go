package auth

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestChangePassword(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	client := NewClient(ctx)

	email := testutils.UniqueEmail("changepw")
	token, _, err := ctx.RegisterAndLogin(email, "oldpassword123", "Change", "User", []string{"CS"})
	if err != nil {
		t.Fatalf("Failed to register and login: %v", err)
	}

	t.Run("correct current password changes successfully", func(t *testing.T) {
		resp, err := client.ChangePassword(&dto.ChangePasswordRequest{
			CurrentPassword: "oldpassword123",
			NewPassword:     "brandnewpassword456",
		}, token)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		// Verify login with new password works
		newToken, err := ctx.LoginAndGetToken(email, "brandnewpassword456")
		if err != nil || newToken == "" {
			t.Error("Expected login with new password to succeed")
		}
	})

	t.Run("wrong current password returns 401", func(t *testing.T) {
		freshToken, _ := ctx.LoginAndGetToken(email, "brandnewpassword456")
		resp, err := client.ChangePassword(&dto.ChangePasswordRequest{
			CurrentPassword: "wrongpassword",
			NewPassword:     "anothernewpassword789",
		}, freshToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusUnauthorized)
	})

	t.Run("unauthenticated returns 401", func(t *testing.T) {
		resp, err := client.ChangePassword(&dto.ChangePasswordRequest{
			CurrentPassword: "brandnewpassword456",
			NewPassword:     "anothernewpassword789",
		}, "")
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusUnauthorized)
	})

	t.Run("weak new password returns 400", func(t *testing.T) {
		freshToken, _ := ctx.LoginAndGetToken(email, "brandnewpassword456")
		resp, err := client.ChangePassword(&dto.ChangePasswordRequest{
			CurrentPassword: "brandnewpassword456",
			NewPassword:     "short",
		}, freshToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
	})
}
