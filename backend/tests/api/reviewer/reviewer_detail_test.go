package reviewer

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestReviewerGetAndDeleteEndpoints(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, conferenceID, reviewerID := createConferenceAndInvitedReviewer(t, ctx)

	t.Run("get reviewer by id", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d", conferenceID, reviewerID)
		resp, err := ctx.MakeRequest(http.MethodGet, path, nil, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data *dto.Reviewer `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)
		require.NotNil(t, response.Data)
		assert.Equal(t, reviewerID, response.Data.ID)
		assert.Equal(t, conferenceID, response.Data.ConferenceID)
	})

	t.Run("get reviewer requires authentication", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d", conferenceID, reviewerID)
		resp, err := ctx.MakeRequest(http.MethodGet, path, nil, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("get reviewer with wrong conference returns not found", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d", conferenceID+99999, reviewerID)
		resp, err := ctx.MakeRequest(http.MethodGet, path, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})

	t.Run("delete reviewer requires authentication", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d", conferenceID, reviewerID)
		resp, err := ctx.MakeRequest(http.MethodDelete, path, nil, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("delete reviewer by id", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d", conferenceID, reviewerID)
		resp, err := ctx.MakeRequest(http.MethodDelete, path, nil, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var response map[string]string
		testutils.DecodeResponse(t, resp, &response)
		assert.Equal(t, "reviewer removed successfully", response["message"])
	})

	t.Run("deleted reviewer is no longer retrievable", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d", conferenceID, reviewerID)
		resp, err := ctx.MakeRequest(http.MethodGet, path, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})
}

func createConferenceAndInvitedReviewer(t *testing.T, ctx *testutils.TestContext) (string, int64, int64) {
	t.Helper()

	chairToken, chairUser, err := ctx.RegisterUniqueUser("reviewer-chair", "password123", "Chair", "User", []string{"AI"})
	require.NoError(t, err)
	require.NotNil(t, chairUser)

	reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser("reviewer-target", "password123", "Reviewer", "User", []string{"AI"})
	require.NoError(t, err)
	require.NotNil(t, reviewerUser)
	_ = reviewerToken

	conference := &dto.Conference{
		Title:   "Reviewer Detail Test Conference",
		Acronym: testutils.UniqueString("RDTC"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, err := ctx.MakeRequest(http.MethodPost, "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, confResp.StatusCode)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	require.NotNil(t, confData.Data)
	conferenceID := confData.Data.ID

	inviteReq := &dto.ReviewerBatchInviteRequest{
		ConferenceID: conferenceID,
		Reviewers: []dto.Reviewer{
			{
				UserID: reviewerUser.ID,
				Domain: []string{"AI"},
			},
		},
	}

	invitePath := fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID)
	inviteResp, err := ctx.MakeRequest(http.MethodPost, invitePath, inviteReq, chairToken)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, inviteResp.StatusCode)

	var inviteData struct {
		Data dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, inviteResp, &inviteData)
	require.NotEmpty(t, inviteData.Data.Success, "expected invited reviewer in success response")

	return chairToken, conferenceID, inviteData.Data.Success[0].ID
}
