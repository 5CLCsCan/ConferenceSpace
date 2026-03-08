package user

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserSearchAndProfileSyncStatusEndpoints(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	token, user, err := ctx.RegisterUniqueUser("search-sync", "password123", "Search", "Sync", []string{"AI"})
	require.NoError(t, err)
	require.NotNil(t, user)
	require.NotEmpty(t, token)

	t.Run("profile sync status returns default empty fields", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, "/api/v1/users/me/profile-sync-status", nil, token)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data *dto.ProfileSyncStatusResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)
		require.NotNil(t, response.Data)
		assert.Nil(t, response.Data.SemanticScholarID)
		assert.Nil(t, response.Data.ProfileSyncStatus)
	})

	t.Run("profile sync status requires authentication", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, "/api/v1/users/me/profile-sync-status", nil, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("search requires query", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, "/api/v1/users/search", nil, token)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("search requires authentication", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, "/api/v1/users/search?q=search", nil, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("search returns matching users", func(t *testing.T) {
		fragment := strings.Split(user.Email, "@")[0]
		path := fmt.Sprintf("/api/v1/users/search?q=%s&limit=10", url.QueryEscape(fragment))

		resp, err := ctx.MakeRequest(http.MethodGet, path, nil, token)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data *dto.UserSearchResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)
		require.NotNil(t, response.Data)
		assert.GreaterOrEqual(t, response.Data.Total, int64(1))

		found := false
		for _, candidate := range response.Data.Users {
			if candidate.Email == user.Email {
				found = true
				break
			}
		}
		assert.True(t, found, "expected search results to contain %s", user.Email)
	})

	t.Run("get user by email endpoint works", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/users/%s", url.PathEscape(user.Email))
		resp, err := ctx.MakeRequest(http.MethodGet, path, nil, token)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data *dto.UserResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)
		require.NotNil(t, response.Data)
		assert.Equal(t, user.Email, response.Data.Email)
	})
}

func TestAcademicProfileLinkAndUnlinkEndpoints(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	token, _, err := ctx.RegisterUniqueUser("profile-sync", "password123", "Profile", "Sync", []string{"AI"})
	require.NoError(t, err)

	t.Run("academic profile before linking returns not available", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, "/api/v1/users/me/academic-profile", nil, token)
		require.NoError(t, err)
		assert.Contains(t, []int{http.StatusNotFound, http.StatusInternalServerError}, resp.StatusCode)
	})

	t.Run("link validation requires semanticScholarId", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodPost, "/api/v1/users/link-academic-profile", map[string]string{}, token)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("link profile succeeds and updates status", func(t *testing.T) {
		requestBody := map[string]string{
			"semanticScholarId": testutils.UniqueString("author"),
		}

		resp, err := ctx.MakeRequest(http.MethodPost, "/api/v1/users/link-academic-profile", requestBody, token)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var linkedResponse struct {
			Data *dto.UserResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &linkedResponse)
		require.NotNil(t, linkedResponse.Data)
		require.NotNil(t, linkedResponse.Data.SemanticScholarID)
		assert.Equal(t, requestBody["semanticScholarId"], *linkedResponse.Data.SemanticScholarID)

		statusResp, err := ctx.MakeRequest(http.MethodGet, "/api/v1/users/me/profile-sync-status", nil, token)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, statusResp.StatusCode)

		var statusData struct {
			Data *dto.ProfileSyncStatusResponse `json:"data"`
		}
		testutils.DecodeResponse(t, statusResp, &statusData)
		require.NotNil(t, statusData.Data)
		require.NotNil(t, statusData.Data.SemanticScholarID)
		assert.Equal(t, requestBody["semanticScholarId"], *statusData.Data.SemanticScholarID)
	})

	t.Run("unlink returns success or pending conflict based on sync lifecycle", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodPost, "/api/v1/users/unlink-academic-profile", nil, token)
		require.NoError(t, err)
		require.Contains(t, []int{http.StatusOK, http.StatusConflict}, resp.StatusCode)

		if resp.StatusCode == http.StatusConflict {
			body := testutils.ReadResponseBody(t, resp)
			assert.Contains(t, strings.ToLower(body), "progress")
			return
		}

		statusResp, err := ctx.MakeRequest(http.MethodGet, "/api/v1/users/me/profile-sync-status", nil, token)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, statusResp.StatusCode)

		var statusData struct {
			Data *dto.ProfileSyncStatusResponse `json:"data"`
		}
		testutils.DecodeResponse(t, statusResp, &statusData)
		require.NotNil(t, statusData.Data)
		assert.Nil(t, statusData.Data.SemanticScholarID)
		assert.Nil(t, statusData.Data.ProfileSyncStatus)
	})
}

func TestUnlinkAcademicProfileWithoutLink(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	token, _, err := ctx.RegisterUniqueUser("unlink-empty", "password123", "Unlink", "Empty", []string{"AI"})
	require.NoError(t, err)

	resp, err := ctx.MakeRequest(http.MethodPost, "/api/v1/users/unlink-academic-profile", nil, token)
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}
