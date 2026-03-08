package notification

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNotificationPreferencesEndpoints(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	token, user, err := ctx.RegisterUniqueUser("notif-pref", "password123", "Notify", "User", []string{"AI"})
	require.NoError(t, err)
	require.NotNil(t, user)

	t.Run("get preferences requires authentication", func(t *testing.T) {
		resp, err := client.GetPreferences("")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("get preferences returns user settings", func(t *testing.T) {
		resp, err := client.GetPreferences(token)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data *dto.NotificationPreferencesResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)
		require.NotNil(t, response.Data)
		assert.Equal(t, user.Email, response.Data.UserEmail)
	})

	t.Run("update preferences persists values", func(t *testing.T) {
		updateReq := &dto.NotificationPreferencesUpdateRequest{
			SubmissionReceived: boolPtr(false),
			ReviewAssigned:     boolPtr(false),
			ReviewSubmitted:    boolPtr(true),
			EmailNotifications: boolPtr(false),
		}

		updateResp, err := client.UpdatePreferences(updateReq, token)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, updateResp.StatusCode)

		var updateResponse struct {
			Data *dto.NotificationPreferencesResponse `json:"data"`
		}
		testutils.DecodeResponse(t, updateResp, &updateResponse)
		require.NotNil(t, updateResponse.Data)
		assert.False(t, updateResponse.Data.SubmissionReceived)
		assert.False(t, updateResponse.Data.ReviewAssigned)
		assert.True(t, updateResponse.Data.ReviewSubmitted)
		assert.False(t, updateResponse.Data.EmailNotifications)

		verifyResp, err := client.GetPreferences(token)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, verifyResp.StatusCode)

		var verifyResponse struct {
			Data *dto.NotificationPreferencesResponse `json:"data"`
		}
		testutils.DecodeResponse(t, verifyResp, &verifyResponse)
		require.NotNil(t, verifyResponse.Data)
		assert.False(t, verifyResponse.Data.SubmissionReceived)
		assert.False(t, verifyResponse.Data.ReviewAssigned)
		assert.True(t, verifyResponse.Data.ReviewSubmitted)
		assert.False(t, verifyResponse.Data.EmailNotifications)
	})

	t.Run("update preferences requires authentication", func(t *testing.T) {
		resp, err := client.UpdatePreferences(&dto.NotificationPreferencesUpdateRequest{
			EmailNotifications: boolPtr(true),
		}, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})
}

func TestGetNotificationEndpointBasics(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	token, _, err := ctx.RegisterUniqueUser("notif-get", "password123", "Notify", "Get", []string{"AI"})
	require.NoError(t, err)

	t.Run("requires authentication", func(t *testing.T) {
		resp, err := client.Get(1, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("returns not found for missing notification", func(t *testing.T) {
		resp, err := client.Get(999999, token)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})

	t.Run("returns bad request for invalid notification id", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, "/api/v1/notifications/not-a-number", nil, token)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})
}

func boolPtr(v bool) *bool {
	return &v
}
