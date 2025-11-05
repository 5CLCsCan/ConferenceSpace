package submission

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/storage"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	fileStorage "github.com/dcao/conferencespace/internal/storage/file"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	submissionStorage submissionStorage.StorageInterface
	conferenceStorage conferenceStorage.StorageInterface
	fileStorage       fileStorage.StorageInterface
	geminiClient      interface{} // Store as interface to allow nil checks
}

func New(store *storage.Storage, fileStore fileStorage.StorageInterface, geminiClient interface{}) *Controller {
	return &Controller{
		submissionStorage: store.Submission,
		conferenceStorage: store.Conference,
		fileStorage:       fileStore,
		geminiClient:      geminiClient,
	}
}

// Create godoc
// @Summary      Create a new submission
// @Description  Create a new conference submission with optional file upload
// @Tags         submissions
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission formData string true "Submission data as JSON string"
// @Param        file formData file false "PDF file to upload"
// @Success      201 {object} dto.Submission
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions [post]
func (c *Controller) Create(ginCtx *gin.Context) (*dto.Submission, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	// Parse multipart form
	form, err := ginCtx.MultipartForm()
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "failed to parse form data")
	}

	// Get submission data from form
	submissionData := ginCtx.PostForm("submission")
	if submissionData == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "submission data is required")
	}

	var req dto.SubmissionCreateRequest
	// For multipart/form-data, parse the submission data from the form field
	if err := json.Unmarshal([]byte(submissionData), &req); err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid submission data format")
	}

	if req.Submission == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "submission data is required")
	}

	// Validate required fields
	if req.Submission.Title == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "title is required")
	}
	if req.Submission.Abstract == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "abstract is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	req.Submission.Author = userEmail
	req.Submission.ConferenceID = conferenceID

	if req.Submission.Status == "" {
		req.Submission.Status = dto.StatusDraft
	}

	// Create the submission first
	submission, err := c.submissionStorage.Create(ctx, req.Submission)
	if err != nil {
		return nil, err
	}

	// Handle file upload if present
	files := form.File["file"]
	if len(files) > 0 {
		file := files[0]

		// Open the uploaded file
		src, err := file.Open()
		if err != nil {
			return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to open uploaded file")
		}
		defer src.Close()

		// Save file using file storage service with correct submission ID
		fileMetadata, err := c.fileStorage.SaveFile(src, file, conferenceID, submission.ID)
		if err != nil {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
		}

		// Update submission with file metadata
		updateData := &dto.Submission{
			File: fileMetadata,
		}
		_, err = c.submissionStorage.Update(ctx, submission.ID, updateData)
		if err != nil {
			// Clean up file if update fails
			c.fileStorage.DeleteFile(conferenceID, submission.ID, fileMetadata.Filename)
			return nil, err
		}

		// Update the returned submission with file info
		submission.File = fileMetadata
	}

	return submission, nil
}

// List godoc
// @Summary      List submissions
// @Description  Get list of submissions for a conference with pagination and filters
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        limit query int false "Limit results"
// @Param        offset query int false "Offset for pagination"
// @Param        author query string false "Filter by author"
// @Param        status query string false "Filter by status"
// @Param        title query string false "Filter by title"
// @Success      200 {object} dto.SubmissionListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions [get]
func (c *Controller) List(ginCtx *gin.Context, req *dto.SubmissionListRequest) (*dto.SubmissionListResponse, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	params := &submissionStorage.QueryParams{
		Limit:        req.Limit,
		Offset:       req.Offset,
		ConferenceID: conferenceID,
		Author:       req.Author,
		Status:       req.Status,
		Title:        req.Title,
	}

	// Debug logging
	fmt.Printf("[SUBMISSION LIST] Request received:\n")
	fmt.Printf("  ConferenceID: %d\n", params.ConferenceID)
	fmt.Printf("  Author filter: '%s'\n", params.Author)
	fmt.Printf("  Status filter: '%s'\n", params.Status)
	fmt.Printf("  Title filter: '%s'\n", params.Title)
	fmt.Printf("  Limit: %d, Offset: %d\n", params.Limit, params.Offset)

	submissions, total, err := c.submissionStorage.List(ctx, params)
	if err != nil {
		fmt.Printf("[SUBMISSION LIST] Storage error: %v\n", err)
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	fmt.Printf("[SUBMISSION LIST] Results:\n")
	fmt.Printf("  Total found: %d\n", total)
	fmt.Printf("  Submissions returned: %d\n", len(submissions))
	for i, sub := range submissions {
		fmt.Printf("  [%d] ID=%d, Author='%s', Title='%s', Status='%s'\n", i+1, sub.ID, sub.Author, sub.Title, sub.Status)
	}

	return &dto.SubmissionListResponse{
		Submissions: submissions,
		Total:       total,
	}, nil
}

// Get godoc
// @Summary      Get submission by ID
// @Description  Get a specific submission by its ID
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "Submission ID"
// @Success      200 {object} dto.Submission
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{id} [get]
func (c *Controller) Get(ginCtx *gin.Context) (*dto.Submission, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid submission ID")
	}

	submission, err := c.submissionStorage.GetByID(ctx, id)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	if submission.ConferenceID != conferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found in this conference")
	}

	return submission, nil
}

// Update godoc
// @Summary      Update submission
// @Description  Update submission (only if status is draft, only author can update)
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "Submission ID"
// @Param        request body dto.SubmissionUpdateRequest true "Updated submission data"
// @Success      200 {object} dto.Submission
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{id} [put]
func (c *Controller) Update(ginCtx *gin.Context, req *dto.SubmissionUpdateRequest) (*dto.Submission, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid submission ID")
	}

	if req.Submission == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "submission data is required")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	existing, err := c.submissionStorage.GetByID(ctx, id)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	if existing.ConferenceID != conferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found in this conference")
	}

	if existing.Author != userEmail {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only the author can update this submission")
	}

	if existing.Status == dto.StatusPublished {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "cannot update published submission")
	}

	req.Submission.Author = userEmail
	req.Submission.ConferenceID = conferenceID

	return c.submissionStorage.Update(ctx, id, req.Submission)
}

// Delete godoc
// @Summary      Delete submission
// @Description  Delete submission (only if status is draft, only author can delete)
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "Submission ID"
// @Success      200 {object} map[string]string
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{id} [delete]
func (c *Controller) Delete(ginCtx *gin.Context) error {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid submission ID")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	existing, err := c.submissionStorage.GetByID(ctx, id)
	if err != nil {
		return handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	if existing.ConferenceID != conferenceID {
		return handler.NewErrorResponse(http.StatusNotFound, "submission not found in this conference")
	}

	if existing.Author != userEmail {
		return handler.NewErrorResponse(http.StatusForbidden, "only the author can delete this submission")
	}

	if existing.Status == dto.StatusPublished {
		return handler.NewErrorResponse(http.StatusForbidden, "cannot delete published submission")
	}

	return c.submissionStorage.Delete(ctx, id)
}

// GetFile godoc
// @Summary      Get submission file
// @Description  Download the file associated with a submission
// @Tags         submissions
// @Accept       json
// @Produce      application/pdf
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "Submission ID"
// @Success      200 {file} file
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{id}/file [get]
func (c *Controller) GetFile(ginCtx *gin.Context) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "invalid conference ID"})
		return
	}

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "invalid submission ID"})
		return
	}

	submission, err := c.submissionStorage.GetByID(ctx, id)
	if err != nil {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "submission not found"})
		return
	}

	if submission.ConferenceID != conferenceID {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "submission not found in this conference"})
		return
	}

	if submission.File == nil || submission.File.Path == "" {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "file not found"})
		return
	}

	// Use the path stored in the database (full path)
	filePath := submission.File.Path

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "file not found"})
		return
	}

	// Set headers for file download
	ginCtx.Header("Content-Type", submission.File.MimeType)
	ginCtx.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", submission.File.OriginalName))
	ginCtx.Header("Content-Length", fmt.Sprintf("%d", submission.File.Size))

	// Serve the file
	ginCtx.File(filePath)
}
