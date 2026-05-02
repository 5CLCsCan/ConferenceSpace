package conference

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// createChairConferenceForExternalInvites is a small fixture that registers a
// chair user and creates a conference, returning the chair token and the new
// conference ID. It mirrors the helper used by the reviewer detail tests.
func createChairConferenceForExternalInvites(t *testing.T, ctx *testutils.TestContext) (string, int64) {
	t.Helper()

	chairToken, chairUser, err := ctx.RegisterUniqueUser(
		"extinv-chair", "password123", "Chair", "User", []string{"AI"},
	)
	require.NoError(t, err)
	require.NotNil(t, chairUser)

	conference := &dto.Conference{
		Title:   "External Invitation Test Conference",
		Acronym: testutils.UniqueString("EITC"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, err := ctx.MakeRequest(
		http.MethodPost,
		"/api/v1/conferences",
		map[string]interface{}{"conference": conference},
		chairToken,
	)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, confResp.StatusCode)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	require.NotNil(t, confData.Data)

	return chairToken, confData.Data.ID
}

// TestExternalInvitationCreate covers the happy path for POST
// /conferences/:conference_id/external-invitations and the error paths that
// the DTO + controller guard against (empty body, missing role/name).
func TestExternalInvitationCreate(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, conferenceID := createChairConferenceForExternalInvites(t, ctx)
	path := fmt.Sprintf("/api/v1/conferences/%d/external-invitations", conferenceID)

	t.Run("creates an invitation for a Semantic Scholar author", func(t *testing.T) {
		scholarID := testutils.UniqueString("scholar")
		req := &dto.ExternalInvitationBatchCreateRequest{
			ConferenceID: conferenceID,
			Invitations: []dto.ExternalInvitationCreateItem{
				{
					Role:        "reviewer",
					ScholarID:   scholarID,
					Name:        "Jane Doe",
					Email:       "jane@university.edu",
					Affiliation: "MIT",
					ProfileURL:  "https://www.semanticscholar.org/author/" + scholarID,
				},
			},
		}

		resp, err := ctx.MakeRequest(http.MethodPost, path, req, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusCreated, resp.StatusCode, testutils.ReadResponseBody(t, resp))

		var out struct {
			Data dto.ExternalInvitationBatchCreateResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &out)
		require.Len(t, out.Data.Success, 1)
		assert.Empty(t, out.Data.Failed)

		invited := out.Data.Success[0]
		assert.Equal(t, conferenceID, invited.ConferenceID)
		assert.Equal(t, "reviewer", invited.Role)
		assert.Equal(t, scholarID, invited.ScholarID)
		assert.Equal(t, "Jane Doe", invited.Name)
		assert.Equal(t, "jane@university.edu", invited.Email)
		assert.Equal(t, "MIT", invited.Affiliation)
		assert.Equal(t, "pending", invited.Status)
		assert.Greater(t, invited.ID, int64(0))
		assert.Greater(t, invited.InvitedBy, int64(0))
	})

	t.Run("handles an invitee without scholar_id or email", func(t *testing.T) {
		req := &dto.ExternalInvitationBatchCreateRequest{
			ConferenceID: conferenceID,
			Invitations: []dto.ExternalInvitationCreateItem{
				{
					Role: "pc",
					Name: "Anonymous Reviewer",
				},
			},
		}

		resp, err := ctx.MakeRequest(http.MethodPost, path, req, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusCreated, resp.StatusCode, testutils.ReadResponseBody(t, resp))

		var out struct {
			Data dto.ExternalInvitationBatchCreateResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &out)
		require.Len(t, out.Data.Success, 1)
		assert.Equal(t, "pc", out.Data.Success[0].Role)
		assert.Empty(t, out.Data.Success[0].ScholarID)
		assert.Empty(t, out.Data.Success[0].Email)
	})

	t.Run("returns duplicate as a failed entry when scholar_id is already invited", func(t *testing.T) {
		scholarID := testutils.UniqueString("dup-scholar")
		body := &dto.ExternalInvitationBatchCreateRequest{
			ConferenceID: conferenceID,
			Invitations: []dto.ExternalInvitationCreateItem{
				{Role: "reviewer", ScholarID: scholarID, Name: "Dup One"},
			},
		}

		// First invite succeeds.
		firstResp, err := ctx.MakeRequest(http.MethodPost, path, body, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusCreated, firstResp.StatusCode)

		// Second invite with the same scholar_id should land in `failed` with
		// "already invited" — the (conference_id, scholar_id) unique index.
		secondResp, err := ctx.MakeRequest(http.MethodPost, path, body, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusCreated, secondResp.StatusCode)

		var out struct {
			Data dto.ExternalInvitationBatchCreateResponse `json:"data"`
		}
		testutils.DecodeResponse(t, secondResp, &out)
		assert.Empty(t, out.Data.Success)
		require.Len(t, out.Data.Failed, 1)
		assert.Equal(t, scholarID, out.Data.Failed[0].ScholarID)
		assert.Equal(t, "already invited", out.Data.Failed[0].Error)
	})

	t.Run("rejects empty invitations array with 400", func(t *testing.T) {
		body := map[string]interface{}{"invitations": []interface{}{}}

		resp, err := ctx.MakeRequest(http.MethodPost, path, body, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("rejects missing required role with 400", func(t *testing.T) {
		// Role has binding:"required" on the item — omitting it should 400.
		body := map[string]interface{}{
			"invitations": []map[string]interface{}{
				{"name": "No Role"},
			},
		}

		resp, err := ctx.MakeRequest(http.MethodPost, path, body, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("rejects missing required name with 400", func(t *testing.T) {
		body := map[string]interface{}{
			"invitations": []map[string]interface{}{
				{"role": "reviewer"},
			},
		}

		resp, err := ctx.MakeRequest(http.MethodPost, path, body, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("requires authentication", func(t *testing.T) {
		req := &dto.ExternalInvitationBatchCreateRequest{
			ConferenceID: conferenceID,
			Invitations: []dto.ExternalInvitationCreateItem{
				{Role: "reviewer", Name: "Noop"},
			},
		}

		resp, err := ctx.MakeRequest(http.MethodPost, path, req, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("non-chair caller is forbidden", func(t *testing.T) {
		otherToken, _, err := ctx.RegisterUniqueUser(
			"extinv-outsider", "password123", "Outsider", "User", []string{"AI"},
		)
		require.NoError(t, err)

		req := &dto.ExternalInvitationBatchCreateRequest{
			ConferenceID: conferenceID,
			Invitations: []dto.ExternalInvitationCreateItem{
				{Role: "reviewer", Name: "Noop"},
			},
		}

		resp, err := ctx.MakeRequest(http.MethodPost, path, req, otherToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	})
}

// TestExternalInvitationList covers the listing endpoint end-to-end: pagination
// metadata, role filter, and auth.
func TestExternalInvitationList(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, conferenceID := createChairConferenceForExternalInvites(t, ctx)
	path := fmt.Sprintf("/api/v1/conferences/%d/external-invitations", conferenceID)

	// Seed: one reviewer invite + one pc invite.
	reviewerScholar := testutils.UniqueString("list-rev")
	pcScholar := testutils.UniqueString("list-pc")

	createReq := &dto.ExternalInvitationBatchCreateRequest{
		ConferenceID: conferenceID,
		Invitations: []dto.ExternalInvitationCreateItem{
			{Role: "reviewer", ScholarID: reviewerScholar, Name: "Rev A"},
			{Role: "pc", ScholarID: pcScholar, Name: "PC A"},
		},
	}
	createResp, err := ctx.MakeRequest(http.MethodPost, path, createReq, chairToken)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, createResp.StatusCode)

	t.Run("returns all invitations for the conference", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, path, nil, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var out struct {
			Data dto.ExternalInvitationListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &out)
		assert.Equal(t, int64(2), out.Data.Total)
		assert.Len(t, out.Data.Invitations, 2)
		assert.Equal(t, 20, out.Data.Limit) // default
		assert.Equal(t, 0, out.Data.Offset)

		// Ordering is created_at DESC, so the most recently-inserted (pc) comes
		// first. Don't rely on that — just assert both are present.
		seen := map[string]string{}
		for _, inv := range out.Data.Invitations {
			seen[inv.ScholarID] = inv.Role
		}
		assert.Equal(t, "reviewer", seen[reviewerScholar])
		assert.Equal(t, "pc", seen[pcScholar])
	})

	t.Run("filters by role=reviewer", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, path+"?role=reviewer", nil, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var out struct {
			Data dto.ExternalInvitationListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &out)
		assert.Equal(t, int64(1), out.Data.Total)
		require.Len(t, out.Data.Invitations, 1)
		assert.Equal(t, "reviewer", out.Data.Invitations[0].Role)
		assert.Equal(t, reviewerScholar, out.Data.Invitations[0].ScholarID)
	})

	t.Run("honors pagination limit & offset", func(t *testing.T) {
		// limit=1: total should still be 2 but only one row returned.
		resp, err := ctx.MakeRequest(http.MethodGet, path+"?limit=1&offset=0", nil, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var out struct {
			Data dto.ExternalInvitationListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &out)
		assert.Equal(t, int64(2), out.Data.Total)
		assert.Len(t, out.Data.Invitations, 1)
		assert.Equal(t, 1, out.Data.Limit)
		assert.Equal(t, 0, out.Data.Offset)

		// offset=1: the remaining row.
		resp2, err := ctx.MakeRequest(http.MethodGet, path+"?limit=1&offset=1", nil, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp2.StatusCode)

		var out2 struct {
			Data dto.ExternalInvitationListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp2, &out2)
		assert.Equal(t, int64(2), out2.Data.Total)
		assert.Len(t, out2.Data.Invitations, 1)
	})

	t.Run("requires authentication", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, path, nil, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})
}

// TestExternalInvitationDelete covers the delete endpoint and its error paths.
func TestExternalInvitationDelete(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, conferenceID := createChairConferenceForExternalInvites(t, ctx)
	basePath := fmt.Sprintf("/api/v1/conferences/%d/external-invitations", conferenceID)

	// Seed one invitation so we have something to delete.
	scholarID := testutils.UniqueString("del-scholar")
	createReq := &dto.ExternalInvitationBatchCreateRequest{
		ConferenceID: conferenceID,
		Invitations: []dto.ExternalInvitationCreateItem{
			{Role: "reviewer", ScholarID: scholarID, Name: "To Be Deleted"},
		},
	}
	createResp, err := ctx.MakeRequest(http.MethodPost, basePath, createReq, chairToken)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, createResp.StatusCode)

	var createOut struct {
		Data dto.ExternalInvitationBatchCreateResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &createOut)
	require.Len(t, createOut.Data.Success, 1)
	invitationID := createOut.Data.Success[0].ID

	t.Run("deletes the invitation and returns a friendly message", func(t *testing.T) {
		delPath := fmt.Sprintf("%s/%d", basePath, invitationID)
		resp, err := ctx.MakeRequest(http.MethodDelete, delPath, nil, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var msg map[string]string
		testutils.DecodeResponse(t, resp, &msg)
		assert.Equal(t, "external invitation removed successfully", msg["message"])

		// Verify the row is really gone via the list endpoint.
		listResp, err := ctx.MakeRequest(http.MethodGet, basePath, nil, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, listResp.StatusCode)

		var list struct {
			Data dto.ExternalInvitationListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, listResp, &list)
		for _, inv := range list.Data.Invitations {
			assert.NotEqual(t, invitationID, inv.ID, "deleted invitation should not appear in list")
		}
	})

	t.Run("returns 404 when invitation does not exist", func(t *testing.T) {
		delPath := fmt.Sprintf("%s/%d", basePath, 999999999)
		resp, err := ctx.MakeRequest(http.MethodDelete, delPath, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})

	t.Run("requires authentication", func(t *testing.T) {
		delPath := fmt.Sprintf("%s/%d", basePath, invitationID)
		resp, err := ctx.MakeRequest(http.MethodDelete, delPath, nil, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})
}
