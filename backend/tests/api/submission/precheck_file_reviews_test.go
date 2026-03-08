package submission

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPrecheckEndpointValidationAndExecution(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, conferenceID, _ := createConferenceAndSubmissionFixture(t, ctx)

	precheckPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/precheck", conferenceID)
	pdfBytes := loadPDFFixture(t)

	t.Run("precheck requires authentication", func(t *testing.T) {
		resp, err := ctx.MakeMultipartRequestWithFiles(http.MethodPost, precheckPath, map[string]string{}, []testutils.FileUpload{
			{
				FieldName: "file",
				FileName:  "test_paper.pdf",
				Content:   pdfBytes,
				MimeType:  "application/pdf",
			},
		}, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("precheck requires file", func(t *testing.T) {
		resp, err := ctx.MakeMultipartRequest(http.MethodPost, precheckPath, map[string]string{}, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("precheck accepts valid multipart input", func(t *testing.T) {
		resp, err := ctx.MakeMultipartRequestWithFiles(http.MethodPost, precheckPath, map[string]string{}, []testutils.FileUpload{
			{
				FieldName: "file",
				FileName:  "test_paper.pdf",
				Content:   pdfBytes,
				MimeType:  "application/pdf",
			},
		}, chairToken)
		require.NoError(t, err)
		assert.Contains(t, []int{http.StatusOK, http.StatusUnprocessableEntity}, resp.StatusCode)
	})
}

func TestSubmissionFileAndReviewEndpoints(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, conferenceID, fixture := createConferenceAndSubmissionFixture(t, ctx)
	filePath := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/file", conferenceID, fixture.SubmissionID)
	reviewsPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/reviews", conferenceID, fixture.SubmissionID)
	analyticsPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/reviews/analytics", conferenceID, fixture.SubmissionID)

	t.Run("file download requires authentication", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, filePath, nil, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("file download succeeds for authenticated user", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, filePath, nil, fixture.AuthorToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)
		assert.Contains(t, strings.ToLower(resp.Header.Get("Content-Type")), "application/pdf")
	})

	t.Run("file download returns not found for invalid submission", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/file", conferenceID, fixture.SubmissionID+999999)
		resp, err := ctx.MakeRequest(http.MethodGet, path, nil, fixture.AuthorToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})

	t.Run("list reviews requires authentication", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, reviewsPath, nil, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("list reviews works for authenticated user", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, reviewsPath, nil, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data *dto.ReviewListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)
		require.NotNil(t, response.Data)
		assert.GreaterOrEqual(t, response.Data.Total, int64(0))
	})

	t.Run("review analytics requires authentication", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, analyticsPath, nil, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("review analytics works for authenticated user", func(t *testing.T) {
		resp, err := ctx.MakeRequest(http.MethodGet, analyticsPath, nil, chairToken)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data *dto.ReviewAnalyticsResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)
		require.NotNil(t, response.Data)
		assert.GreaterOrEqual(t, response.Data.TotalReviews, 0)
	})

	t.Run("review analytics validates submission id", func(t *testing.T) {
		invalidPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/not-a-number/reviews/analytics", conferenceID)
		resp, err := ctx.MakeRequest(http.MethodGet, invalidPath, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})
}

type submissionFixture struct {
	SubmissionID int64
	AuthorToken  string
}

func createConferenceAndSubmissionFixture(t *testing.T, ctx *testutils.TestContext) (string, int64, submissionFixture) {
	t.Helper()

	chairToken, chairUser, err := ctx.RegisterUniqueUser("precheck-chair", "password123", "Chair", "Precheck", []string{"AI"})
	require.NoError(t, err)
	require.NotNil(t, chairUser)

	authorToken, authorUser, err := ctx.RegisterUniqueUser("precheck-author", "password123", "Author", "Precheck", []string{"AI"})
	require.NoError(t, err)
	require.NotNil(t, authorUser)

	conference := &dto.Conference{
		Title:   "Precheck and File Endpoint Conference",
		Acronym: testutils.UniqueString("PFC"),
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

	submissionClient := NewClient(ctx)
	subReq := &dto.Submission{
		Title:    "Precheck Fixture Submission",
		Abstract: "Fixture abstract for endpoint tests",
		Domain:   []string{"AI"},
		Status:   dto.StatusDraft,
	}

	subResp, err := submissionClient.Create(conferenceID, subReq, authorToken)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, subResp.StatusCode)

	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	require.NotNil(t, subData.Data)

	return chairToken, conferenceID, submissionFixture{
		SubmissionID: subData.Data.ID,
		AuthorToken:  authorToken,
	}
}

func loadPDFFixture(t *testing.T) []byte {
	t.Helper()

	content, err := os.ReadFile("../test_paper.pdf")
	if err == nil {
		return content
	}

	// Keep a tiny valid PDF fallback for environments where fixture path is unavailable.
	return []byte("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n")
}
