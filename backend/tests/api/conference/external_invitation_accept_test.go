package conference

import (
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExternalInvitationAcceptFlow(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, conferenceID := createChairConferenceForExternalInvites(t, ctx)

	// 1. Chair creates an invitation for a reviewer.
	createPath := fmt.Sprintf("/api/v1/conferences/%d/external-invitations", conferenceID)
	create := &dto.ExternalInvitationBatchCreateRequest{
		ConferenceID: conferenceID,
		Invitations: []dto.ExternalInvitationCreateItem{{
			Role:        "reviewer",
			Name:        "Yoshua Bengio",
			ScholarID:   testutils.UniqueString("scholar"),
			Affiliation: "Mila",
		}},
	}
	resp, err := ctx.MakeRequest(http.MethodPost, createPath, create, chairToken)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, resp.StatusCode)

	var createOut struct {
		Data dto.ExternalInvitationBatchCreateResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &createOut)
	require.Len(t, createOut.Data.Success, 1)
	// The invitation URL is the only delivery channel — assert it's well-formed
	// and contains a token query parameter.
	inviteURL := createOut.Data.Success[0].InvitationURL
	require.NotEmpty(t, inviteURL)
	require.Contains(t, inviteURL, "/invitation/accept?token=")

	// 2. Extract the token and call the public validate endpoint (no auth).
	token := extractTokenFromURL(t, inviteURL)
	valResp, err := ctx.MakeRequest(http.MethodGet,
		"/api/v1/external-invitations/accept?token="+token, nil, "")
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, valResp.StatusCode)

	// 3. POST to accept and confirm response shape.
	acceptResp, err := ctx.MakeRequest(http.MethodPost,
		"/api/v1/external-invitations/accept", &dto.ExternalInvitationAcceptRequest{
			Token:     token,
			Email:     "yoshua-accepted@example.com",
			Password:  "password123",
			FirstName: "Yoshua",
			LastName:  "Bengio",
			Domain:    []string{"AI"},
		}, "")
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, acceptResp.StatusCode)
	var acceptOut struct {
		Data dto.ExternalInvitationAcceptResponse `json:"data"`
	}
	testutils.DecodeResponse(t, acceptResp, &acceptOut)
	assert.NotEmpty(t, acceptOut.Data.Token)
	assert.Equal(t, conferenceID, acceptOut.Data.ConferenceID)
	assert.Equal(t, "reviewer", acceptOut.Data.Role)

	// 4. Use the returned JWT to verify the new user can access an authed
	//    endpoint (proves the token is valid and the user was created).
	meResp, err := ctx.MakeRequest(http.MethodGet,
		"/api/v1/users/me", nil, acceptOut.Data.Token)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, meResp.StatusCode)

	// 5. Re-validating the same token must now 410 (used).
	secondValidate, err := ctx.MakeRequest(http.MethodGet,
		"/api/v1/external-invitations/accept?token="+token, nil, "")
	require.NoError(t, err)
	assert.Equal(t, http.StatusGone, secondValidate.StatusCode)

	// 6. Double-submit the accept endpoint with the same token → 410 (already
	//    accepted). MarkAccepted uses WHERE status='pending', so the second
	//    call sees 0 rows affected and rejects.
	doubleAcceptResp, err := ctx.MakeRequest(http.MethodPost,
		"/api/v1/external-invitations/accept", &dto.ExternalInvitationAcceptRequest{
			Token:     token,
			Email:     "yoshua-second@example.com",
			Password:  "password456",
			FirstName: "Fake",
			LastName:  "Attacker",
			Domain:    []string{"AI"},
		}, "")
	require.NoError(t, err)
	assert.Equal(t, http.StatusGone, doubleAcceptResp.StatusCode)
}

func extractTokenFromURL(t *testing.T, u string) string {
	t.Helper()
	i := strings.Index(u, "token=")
	require.GreaterOrEqual(t, i, 0)
	return u[i+len("token="):]
}
