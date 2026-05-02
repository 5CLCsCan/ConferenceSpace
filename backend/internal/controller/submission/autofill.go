package submission

import (
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

const (
	submissionAutofillMaxFiles      = 6
	submissionAutofillMaxFileBytes  = 20 * 1024 * 1024
	submissionAutofillMaxTotalBytes = 60 * 1024 * 1024
)

type submissionAutofillFormRequest struct {
	ExtraDetails    string   `json:"extra_details"`
	AvailableTracks []string `json:"available_tracks"`
}

// Autofill extracts draft submission metadata from uploaded materials without mutating a submission.
func (c *Controller) Autofill(ginCtx *gin.Context) (*aiServiceClient.SubmissionAutofillRunResponse, error) {
	if c.autofillClient == nil {
		return nil, handler.NewErrorResponse(http.StatusServiceUnavailable, "submission autofill service is not configured")
	}

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}
	userID, _ := utils.GetUserID(ginCtx)

	conference, err := c.conferenceStorage.GetByID(ginCtx.Request.Context(), conferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}
	if conference.Status != model.ConferenceStatusOpen {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "submissions are not allowed for this conference")
	}

	form, err := ginCtx.MultipartForm()
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "failed to parse autofill form data")
	}

	var formRequest submissionAutofillFormRequest
	if rawRequest := strings.TrimSpace(ginCtx.PostForm("request")); rawRequest != "" {
		if err := json.Unmarshal([]byte(rawRequest), &formRequest); err != nil {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid request field")
		}
	}

	fileHeaders := form.File["files"]
	if len(fileHeaders) == 0 {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "at least one material file is required")
	}
	if len(fileHeaders) > submissionAutofillMaxFiles {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, fmt.Sprintf("at most %d material files are allowed", submissionAutofillMaxFiles))
	}

	fileMetadata := make([]aiServiceClient.SubmissionAutofillFileMetadata, 0, len(fileHeaders))
	fileContents := make([]aiServiceClient.SubmissionAutofillFileContent, 0, len(fileHeaders))
	var totalBytes int64
	for index, fileHeader := range fileHeaders {
		content, contentType, err := readAutofillMaterial(fileHeader)
		if err != nil {
			return nil, err
		}
		totalBytes += int64(len(content))
		if totalBytes > submissionAutofillMaxTotalBytes {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, "autofill material files exceed the total size limit")
		}

		fileID := fmt.Sprintf("file-%d", index+1)
		fileMetadata = append(fileMetadata, aiServiceClient.SubmissionAutofillFileMetadata{
			FileID:           fileID,
			OriginalFilename: filepath.Base(fileHeader.Filename),
			SizeBytes:        int64(len(content)),
			ContentType:      contentType,
		})
		fileContents = append(fileContents, aiServiceClient.SubmissionAutofillFileContent{
			FileID:   fileID,
			Filename: filepath.Base(fileHeader.Filename),
			Content:  content,
		})
	}

	requestPayload := &aiServiceClient.SubmissionAutofillRunRequest{
		ConferenceID:    conferenceID,
		Actor:           aiServiceClient.ActorPayload{UserID: userID, Email: userEmail, Role: "author"},
		ExtraDetails:    strings.TrimSpace(formRequest.ExtraDetails),
		AvailableTracks: compactStrings(formRequest.AvailableTracks),
		Files:           fileMetadata,
	}

	response, err := c.autofillClient.RunSubmissionAutofill(
		ginCtx.Request.Context(),
		ginCtx.GetHeader("Authorization"),
		requestPayload,
		fileContents,
	)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadGateway, "submission autofill workflow failed")
	}

	return response, nil
}

func readAutofillMaterial(fileHeader *multipart.FileHeader) ([]byte, string, error) {
	if fileHeader == nil {
		return nil, "", handler.NewErrorResponse(http.StatusBadRequest, "material file is required")
	}
	if fileHeader.Size > submissionAutofillMaxFileBytes {
		return nil, "", handler.NewErrorResponse(http.StatusBadRequest, "material file exceeds the size limit")
	}
	extension := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if extension != ".pdf" && extension != ".docx" && extension != ".tex" {
		return nil, "", handler.NewErrorResponse(http.StatusBadRequest, "material file type is not supported")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return nil, "", handler.NewErrorResponse(http.StatusInternalServerError, "failed to open material file")
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		return nil, "", handler.NewErrorResponse(http.StatusInternalServerError, "failed to read material file")
	}
	if len(content) == 0 {
		return nil, "", handler.NewErrorResponse(http.StatusBadRequest, "material file is empty")
	}
	if len(content) > submissionAutofillMaxFileBytes {
		return nil, "", handler.NewErrorResponse(http.StatusBadRequest, "material file exceeds the size limit")
	}

	return content, resolveContentType(fileHeader.Filename, fileHeader.Header.Get("Content-Type")), nil
}
