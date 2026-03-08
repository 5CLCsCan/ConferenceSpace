package auth

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTestLoginEndpoint(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	req := map[string]string{
		"email":      testutils.UniqueEmail("test-login"),
		"first_name": "Test",
		"last_name":  "Login",
	}

	resp, err := ctx.MakeRequest(http.MethodPost, "/api/v1/auth/test-login", req, "")
	require.NoError(t, err)

	if resp.StatusCode == http.StatusNotFound {
		t.Skip("test-login endpoint is not enabled in this server environment")
	}

	require.Equal(t, http.StatusOK, resp.StatusCode)

	var response struct {
		Data *dto.LoginResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &response)
	require.NotNil(t, response.Data)
	require.NotEmpty(t, response.Data.Token)
	require.NotNil(t, response.Data.User)
	assert.Equal(t, req["email"], response.Data.User.Email)
}
