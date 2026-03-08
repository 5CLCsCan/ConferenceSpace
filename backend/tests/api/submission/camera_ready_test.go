package submission

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	conferenceTestClient "github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// readTestPDF returns the test PDF bytes, falling back to a minimal valid PDF.
func readTestPDF() []byte {
	b, err := os.ReadFile("../test_paper.pdf")
	if err != nil {
		// Minimal valid PDF
		return []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n" +
			"2 0 obj\n<<\n/Type /Pages\n/Count 0\n>>\nendobj\n" +
			"xref\n0 3\n0000000000 65535 f\n0000000015 00000 n\n0000000068 00000 n\n" +
			"trailer\n<<\n/Size 3\n/Root 1 0 R\n>>\nstartxref\n117\n%%EOF")
	}
	return b
}

// uploadCameraReady posts a PDF to the camera-ready endpoint.
func uploadCameraReady(ctx *testutils.TestContext, conferenceID, submissionID int64, pdfContent []byte, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/camera-ready", conferenceID, submissionID)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", `form-data; name="file"; filename="camera_ready.pdf"`)
	h.Set("Content-Type", "application/pdf")
	part, err := writer.CreatePart(h)
	if err != nil {
		return nil, err
	}
	if _, err := io.Copy(part, bytes.NewReader(pdfContent)); err != nil {
		return nil, err
	}
	writer.Close()

	req, err := http.NewRequest("POST", ctx.BaseURL+path, &body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := ctx.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}

	// Buffer body
	respBody, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	resp.Body = io.NopCloser(bytes.NewReader(respBody))
	return resp, nil
}

// setupCameraReadyScenario creates a conference + submission and returns tokens/IDs.
func setupCameraReadyScenario(t *testing.T, ctx *testutils.TestContext) (
	chairToken, authorToken string,
	conferenceID, submissionID int64,
) {
	t.Helper()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	conferenceClient := conferenceTestClient.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Camera Ready Test Conference",
		Acronym: testutils.UniqueString("CRTC"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID = createdConf.ID

	submissionClient := NewClient(ctx)
	submission := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Camera Ready Paper",
		Abstract:     "Abstract for camera ready test",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	createdSub, err := submissionClient.CreateSuccess(conferenceID, submission, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	submissionID = createdSub.ID
	return
}

// TestUploadCameraReady_AuthorCanUpload verifies the author can upload a camera-ready PDF.
func TestUploadCameraReady_AuthorCanUpload(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, conferenceID, submissionID := setupCameraReadyScenario(t, ctx)

	pdfContent := readTestPDF()
	resp, err := uploadCameraReady(ctx, conferenceID, submissionID, pdfContent, authorToken)
	if err != nil {
		t.Fatalf("Upload request failed: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200, got %d", resp.StatusCode)
	}

	var result struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &result)

	if result.Data == nil {
		t.Fatal("Expected submission data, got nil")
	}
	if result.Data.CameraReady == nil {
		t.Fatal("Expected camera_ready metadata to be set")
	}
	if result.Data.CameraReady.OriginalName == "" {
		t.Error("Expected camera_ready.original_name to be set")
	}
	if result.Data.CameraReady.Size <= 0 {
		t.Error("Expected camera_ready.size > 0")
	}
	t.Logf("Camera-ready uploaded: %s (%d bytes)", result.Data.CameraReady.OriginalName, result.Data.CameraReady.Size)
}

// TestDownloadCameraReady_AfterUpload verifies the camera-ready file can be downloaded after upload.
func TestDownloadCameraReady_AfterUpload(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, conferenceID, submissionID := setupCameraReadyScenario(t, ctx)

	pdfContent := readTestPDF()
	uploadResp, err := uploadCameraReady(ctx, conferenceID, submissionID, pdfContent, authorToken)
	if err != nil || uploadResp.StatusCode != http.StatusOK {
		t.Fatalf("Upload failed: err=%v status=%d", err, uploadResp.StatusCode)
	}

	// Download
	downloadResp, err := ctx.MakeRequest("GET",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/camera-ready", conferenceID, submissionID),
		nil, authorToken)
	if err != nil {
		t.Fatalf("Download request failed: %v", err)
	}

	if downloadResp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 on download, got %d", downloadResp.StatusCode)
	}

	contentType := downloadResp.Header.Get("Content-Type")
	if contentType != "application/pdf" {
		t.Errorf("Expected Content-Type=application/pdf, got %q", contentType)
	}

	body, _ := io.ReadAll(downloadResp.Body)
	if len(body) == 0 {
		t.Error("Expected non-empty file body")
	}
	t.Logf("Downloaded %d bytes", len(body))
}

// TestDownloadCameraReady_NotFound returns 404 when no camera-ready file exists.
func TestDownloadCameraReady_NotFound(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, conferenceID, submissionID := setupCameraReadyScenario(t, ctx)

	resp, err := ctx.MakeRequest("GET",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/camera-ready", conferenceID, submissionID),
		nil, authorToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("Expected 404, got %d", resp.StatusCode)
	}
}

// TestUploadCameraReady_NonAuthorForbidden verifies non-authors cannot upload.
func TestUploadCameraReady_NonAuthorForbidden(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, _, conferenceID, submissionID := setupCameraReadyScenario(t, ctx)

	pdfContent := readTestPDF()
	resp, err := uploadCameraReady(ctx, conferenceID, submissionID, pdfContent, chairToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d", resp.StatusCode)
	}
}

// TestUploadCameraReady_Unauthenticated verifies unauthenticated requests are rejected.
func TestUploadCameraReady_Unauthenticated(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, _, conferenceID, submissionID := setupCameraReadyScenario(t, ctx)

	pdfContent := readTestPDF()
	resp, err := uploadCameraReady(ctx, conferenceID, submissionID, pdfContent, "")
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("Expected 401, got %d", resp.StatusCode)
	}
}
