package auth

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestVerifyEmail(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	client := NewClient(ctx)

	t.Run("valid verification token verifies email", func(t *testing.T) {
		email := testutils.UniqueEmail("verifyemail")
		ctx.RegisterUser(email, "password123", "Verify", "User", []string{"CS"})

		token, err := client.ResendVerificationGetToken(email)
		if err != nil {
			t.Fatalf("Failed to get verification token: %v", err)
		}

		resp, err := client.VerifyEmail(token)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)
	})

	t.Run("token can only be used once", func(t *testing.T) {
		email := testutils.UniqueEmail("verifyemail2")
		ctx.RegisterUser(email, "password123", "Verify2", "User", []string{"CS"})

		token, _ := client.ResendVerificationGetToken(email)
		client.VerifyEmail(token) // use it once

		resp, _ := client.VerifyEmail(token) // try again
		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
	})

	t.Run("invalid token returns 400", func(t *testing.T) {
		resp, err := client.VerifyEmail("invalid-token-xyz")
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
	})
}

func TestResendVerification(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	client := NewClient(ctx)

	t.Run("existing email returns 200 with token in dev mode", func(t *testing.T) {
		email := testutils.UniqueEmail("resendverify")
		ctx.RegisterUser(email, "password123", "Resend", "User", []string{"CS"})

		resp, err := client.ResendVerification(&dto.ResendVerificationRequest{Email: email})
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var respData struct {
			Data *dto.ResendVerificationResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &respData)

		if respData.Data == nil || respData.Data.Token == nil {
			t.Error("Expected token in dev mode response")
		}
	})

	t.Run("non-existent email still returns 200", func(t *testing.T) {
		resp, err := client.ResendVerification(&dto.ResendVerificationRequest{
			Email: testutils.UniqueEmail("doesnotexist"),
		})
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)
	})

	t.Run("missing email returns 400", func(t *testing.T) {
		resp, err := client.ResendVerification(&dto.ResendVerificationRequest{})
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
	})
}
