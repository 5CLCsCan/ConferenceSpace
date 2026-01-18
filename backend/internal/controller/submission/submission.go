package submission

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	notificationService "github.com/dcao/conferencespace/internal/service/notification"
	"github.com/dcao/conferencespace/internal/storage"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	fileStorage "github.com/dcao/conferencespace/internal/storage/file"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	submissionStorage   submissionStorage.StorageInterface
	conferenceStorage   conferenceStorage.StorageInterface
	fileStorage         fileStorage.StorageInterface
	roleStorage         conferenceuserrole.StorageInterface
	geminiClient        interface{} // Store as interface to allow nil checks
	notificationService *notificationService.Service
}

func New(store *storage.Storage, fileStore fileStorage.StorageInterface, geminiClient interface{}) *Controller {
	return &Controller{
		submissionStorage: store.Submission,
		conferenceStorage: store.Conference,
		fileStorage:       fileStore,
		roleStorage:       store.ConferenceUserRole,
		geminiClient:      geminiClient,
	}
}

// NewWithNotifications creates a new controller with notification support
func NewWithNotifications(store *storage.Storage, fileStore fileStorage.StorageInterface, geminiClient interface{}, notifSvc *notificationService.Service) *Controller {
	return &Controller{
		submissionStorage:   store.Submission,
		conferenceStorage:   store.Conference,
		fileStorage:         fileStore,
		roleStorage:         store.ConferenceUserRole,
		geminiClient:        geminiClient,
		notificationService: notifSvc,
	}
}

// Create godoc
// @Summary      Create a new submission
// @Description  Create a new conference submission with required paper file and optional cover letter. The paper PDF file is mandatory when creating a submission. Submission can include a track field to categorize the paper into one of the conference tracks.
// @Tags         submissions
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission formData string true "Submission data as JSON string (includes title, abstract, author, track, status, domain[], information)"
// @Param        file formData file true "PDF file to upload (main paper) - REQUIRED"
// @Param        cover_letter formData file false "Cover letter file (PDF, DOCX, or TXT) - OPTIONAL"
// @Success      201 {object} dto.Submission
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions [post]
func (c *Controller) Create(ginCtx *gin.Context, req *dto.SubmissionCreateRequest) (*dto.Submission, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	if req.Submission == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "submission data is required")
	}

	// Validate required fields for published status
	if req.Submission.Status == dto.StatusPublished {
		if req.Submission.Title == "" {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, "title is required for published submissions")
		}
		if req.Submission.Abstract == "" {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, "abstract is required for published submissions")
		}
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	// Check if conference is open for submissions
	conference, err := c.conferenceStorage.GetByID(ctx, conferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	if conference.Status != model.ConferenceStatusOpen {
		return nil, handler.NewErrorResponse(http.StatusForbidden,
			fmt.Sprintf("submissions are not allowed. Conference status is '%s', but must be 'open'", conference.Status))
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

	// Add author to conference_user_roles table
	roleAssignment := model.RoleAssignment{
		ConferenceID: conferenceID,
		UserEmail:    userEmail,
		Role:         model.RoleAuthor,
	}
	err = c.roleStorage.AddRole(ctx, roleAssignment.ConferenceID, roleAssignment.UserEmail, roleAssignment.Role)
	if err != nil {
		// Log error but don't fail the submission creation
		// (role might already exist or have other non-critical issues)
		fmt.Printf("Warning: Failed to add author role for %s in conference %d: %v\n", userEmail, conferenceID, err)
	}

	// Handle file upload
	// - For draft: file is OPTIONAL (can save empty draft)
	// - For published: file is REQUIRED
	if req.Submission.Status == dto.StatusPublished && req.Submission.File == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "paper file is required when publishing a submission")
	}

	// If file is provided, save it
	if req.Submission.File != nil {
		// Save file using file storage service
		// Create a bytes reader from the content and wrap in ReadCloser
		fileReader := io.NopCloser(bytes.NewReader(req.Submission.File.Content))

		// Create a temporary file header for the storage service
		fileHeader := &multipart.FileHeader{
			Filename: req.Submission.File.OriginalName,
			Size:     req.Submission.File.Size,
			Header:   make(map[string][]string),
		}
		fileHeader.Header.Set("Content-Type", req.Submission.File.MimeType)

		fileMetadata, err := c.fileStorage.SaveFile(fileReader, fileHeader, conferenceID, submission.ID)
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

	// Handle cover letter upload if present
	if req.Submission.CoverLetter != nil {
		// Save cover letter using file storage service
		coverReader := io.NopCloser(bytes.NewReader(req.Submission.CoverLetter.Content))

		// Create a temporary file header for the storage service
		coverHeader := &multipart.FileHeader{
			Filename: req.Submission.CoverLetter.OriginalName,
			Size:     req.Submission.CoverLetter.Size,
			Header:   make(map[string][]string),
		}
		coverHeader.Header.Set("Content-Type", req.Submission.CoverLetter.MimeType)

		coverLetterMetadata, err := c.fileStorage.SaveCoverLetter(coverReader, coverHeader, conferenceID, submission.ID)
		if err != nil {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
		}

		// Update submission with cover letter metadata
		updateData := &dto.Submission{
			CoverLetter: coverLetterMetadata,
		}
		_, err = c.submissionStorage.Update(ctx, submission.ID, updateData)
		if err != nil {
			// Clean up cover letter if update fails
			c.fileStorage.DeleteCoverLetter(conferenceID, submission.ID, coverLetterMetadata.Filename)
			return nil, err
		}

		// Update the returned submission with cover letter info
		submission.CoverLetter = coverLetterMetadata
	}

	// Send notification to chair about new submission (only for published submissions)
	if c.notificationService != nil && req.Submission.Status == dto.StatusPublished {
		// Capture values for goroutine (use background context since request context will be cancelled)
		chairEmail := conference.Chair
		submissionTitle := submission.Title
		confID := conferenceID
		subID := submission.ID
		notifSvc := c.notificationService
		go func() {
			// Notify chair about the new submission
			if chairEmail != "" {
				err := notifSvc.NotifySubmissionReceived(
					context.Background(),
					chairEmail,
					submissionTitle,
					confID,
					subID,
				)
				if err != nil {
					fmt.Printf("Warning: Failed to notify chair about new submission: %v\n", err)
				}
			}
		}()
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
// @Param        author query string false "Filter by author email"
// @Param        status query string false "Filter by status (draft, submitted, reviewing)"
// @Param        title query string false "Filter by title (partial match)"
// @Param        track query string false "Filter by track name"
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
		Track:        req.Track,
	}

	// Debug logging
	fmt.Printf("[SUBMISSION LIST] Request received:\n")
	fmt.Printf("  ConferenceID: %d\n", params.ConferenceID)
	fmt.Printf("  Author filter: '%s'\n", params.Author)
	fmt.Printf("  Status filter: '%s'\n", params.Status)
	fmt.Printf("  Title filter: '%s'\n", params.Title)
	fmt.Printf("  Track filter: '%s'\n", params.Track)
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
// @Param        includeReviewers query bool false "Include reviewers assigned to this submission"
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

	id, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid submission ID")
	}

	// Parse includeReviewers query parameter
	includeReviewers := ginCtx.Query("includeReviewers") == "true"

	submission, err := c.submissionStorage.GetByID(ctx, id)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	if submission.ConferenceID != conferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found in this conference")
	}

	// Fetch reviewers if requested
	if includeReviewers {
		reviewers, err := c.submissionStorage.GetReviewersBySubmissionID(ctx, id)
		if err != nil {
			// Log error but don't fail the request
			// Just return submission without reviewers
			fmt.Printf("Warning: failed to fetch reviewers for submission %d: %v\n", id, err)
		} else {
			submission.Reviewers = reviewers
		}
	}

	return submission, nil
}

// Update godoc
// @Summary      Update submission
// @Description  Update submission details including metadata, paper file, and cover letter. Supports both JSON (metadata only) and multipart/form-data (with file uploads). Only draft submissions can be updated, and only by the author.
// @Tags         submissions
// @Accept       json,multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "Submission ID"
// @Param        submission formData string false "Updated submission data as JSON string (for multipart requests)"
// @Param        file formData file false "Paper PDF file (replaces existing paper)"
// @Param        cover_letter formData file false "Cover letter file in PDF, DOCX, or TXT format"
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

	id, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
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

	// Update the submission metadata
	updatedSubmission, err := c.submissionStorage.Update(ctx, id, req.Submission)
	if err != nil {
		return nil, err
	}

	// Handle paper file update if provided
	if req.Submission.File != nil {
		// Delete old paper file if exists
		if existing.File != nil {
			c.fileStorage.DeleteFile(conferenceID, id, existing.File.Filename)
		}

		// Save new paper file
		fileReader := io.NopCloser(bytes.NewReader(req.Submission.File.Content))
		fileHeader := &multipart.FileHeader{
			Filename: req.Submission.File.OriginalName,
			Size:     req.Submission.File.Size,
			Header:   make(map[string][]string),
		}
		fileHeader.Header.Set("Content-Type", req.Submission.File.MimeType)

		fileMetadata, err := c.fileStorage.SaveFile(fileReader, fileHeader, conferenceID, id)
		if err != nil {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
		}

		// Update submission with file metadata
		updateData := &dto.Submission{
			File: fileMetadata,
		}
		updatedSubmission, err = c.submissionStorage.Update(ctx, id, updateData)
		if err != nil {
			// Clean up file if update fails
			c.fileStorage.DeleteFile(conferenceID, id, fileMetadata.Filename)
			return nil, err
		}
	}

	// Handle cover letter update if provided
	if req.Submission.CoverLetter != nil {
		// Delete old cover letter if exists
		if existing.CoverLetter != nil {
			c.fileStorage.DeleteCoverLetter(conferenceID, id, existing.CoverLetter.Filename)
		}

		// Save new cover letter
		coverReader := io.NopCloser(bytes.NewReader(req.Submission.CoverLetter.Content))
		coverHeader := &multipart.FileHeader{
			Filename: req.Submission.CoverLetter.OriginalName,
			Size:     req.Submission.CoverLetter.Size,
			Header:   make(map[string][]string),
		}
		coverHeader.Header.Set("Content-Type", req.Submission.CoverLetter.MimeType)

		coverLetterMetadata, err := c.fileStorage.SaveCoverLetter(coverReader, coverHeader, conferenceID, id)
		if err != nil {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
		}

		// Update submission with cover letter metadata
		updateData := &dto.Submission{
			CoverLetter: coverLetterMetadata,
		}
		updatedSubmission, err = c.submissionStorage.Update(ctx, id, updateData)
		if err != nil {
			// Clean up cover letter if update fails
			c.fileStorage.DeleteCoverLetter(conferenceID, id, coverLetterMetadata.Filename)
			return nil, err
		}
	}

	return updatedSubmission, nil
}

// Publish godoc
// @Summary      Publish a draft submission
// @Description  Publish a draft submission. Requires paper file if not already uploaded. Changes status from draft to published.
// @Tags         submissions
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "Submission ID"
// @Param        file formData file false "Paper PDF file (required if not already uploaded)"
// @Param        cover_letter formData file false "Cover letter file (PDF, DOCX, or TXT)"
// @Success      200 {object} dto.Submission
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{id}/publish [post]
func (c *Controller) Publish(ginCtx *gin.Context, req *dto.SubmissionPublishRequest) (*dto.Submission, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	id, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid submission ID")
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
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only the author can publish this submission")
	}

	if existing.Status != dto.StatusDraft {
		return nil, handler.NewErrorResponse(http.StatusForbidden, fmt.Sprintf("cannot publish submission with status '%s', only draft submissions can be published", existing.Status))
	}

	// Handle paper file upload if provided
	if req.Submission.File != nil {
		// Delete old paper file if exists
		if existing.File != nil {
			c.fileStorage.DeleteFile(conferenceID, id, existing.File.Filename)
		}

		// Save new paper file
		fileReader := io.NopCloser(bytes.NewReader(req.Submission.File.Content))
		fileHeader := &multipart.FileHeader{
			Filename: req.Submission.File.OriginalName,
			Size:     req.Submission.File.Size,
			Header:   make(map[string][]string),
		}
		fileHeader.Header.Set("Content-Type", req.Submission.File.MimeType)

		fileMetadata, err := c.fileStorage.SaveFile(fileReader, fileHeader, conferenceID, id)
		if err != nil {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
		}

		// Update submission with file metadata
		updateData := &dto.Submission{
			File: fileMetadata,
		}
		existing, err = c.submissionStorage.Update(ctx, id, updateData)
		if err != nil {
			// Clean up file if update fails
			c.fileStorage.DeleteFile(conferenceID, id, fileMetadata.Filename)
			return nil, err
		}
	}

	// Check if paper file exists (either uploaded now or already exists)
	if existing.File == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "paper file is required to publish submission")
	}

	// Handle cover letter upload if provided
	if req.Submission.CoverLetter != nil {
		// Delete old cover letter if exists
		if existing.CoverLetter != nil {
			c.fileStorage.DeleteCoverLetter(conferenceID, id, existing.CoverLetter.Filename)
		}

		// Save new cover letter
		coverReader := io.NopCloser(bytes.NewReader(req.Submission.CoverLetter.Content))
		coverHeader := &multipart.FileHeader{
			Filename: req.Submission.CoverLetter.OriginalName,
			Size:     req.Submission.CoverLetter.Size,
			Header:   make(map[string][]string),
		}
		coverHeader.Header.Set("Content-Type", req.Submission.CoverLetter.MimeType)

		coverLetterMetadata, err := c.fileStorage.SaveCoverLetter(coverReader, coverHeader, conferenceID, id)
		if err != nil {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
		}

		// Update submission with cover letter metadata
		updateData := &dto.Submission{
			CoverLetter: coverLetterMetadata,
		}
		existing, err = c.submissionStorage.Update(ctx, id, updateData)
		if err != nil {
			// Clean up cover letter if update fails
			c.fileStorage.DeleteCoverLetter(conferenceID, id, coverLetterMetadata.Filename)
			return nil, err
		}
	}

	// Update status to published
	publishData := &dto.Submission{
		Status: dto.StatusPublished,
	}
	publishedSubmission, err := c.submissionStorage.Update(ctx, id, publishData)
	if err != nil {
		return nil, err
	}

	return publishedSubmission, nil
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

	id, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
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

	id, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
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

// UpdateStatus godoc
// @Summary      Update submission status
// @Description  Update the status of a submission (role-based: chair for accepted/rejected, author for draft/published/reviewing)
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "Submission ID"
// @Param        status body object true "New status value"
// @Success      200 {object} dto.Submission
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{id}/status [patch]
func (c *Controller) UpdateStatus(ginCtx *gin.Context, req *dto.UpdateStatusRequest) (*dto.Submission, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	submission, err := c.submissionStorage.GetByID(ctx, req.ID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}
	if submission.ConferenceID != req.ConferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found in this conference")
	}

	// Only allow valid statuses
	validStatuses := map[string]bool{
		dto.StatusDraft:     true,
		dto.StatusPublished: true,
		dto.StatusReviewing: true,
		dto.StatusAccepted:  true,
		dto.StatusRejected:  true,
	}
	if !validStatuses[req.Status] {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid status value")
	}

	// Role-based status update logic
	switch req.Status {
	case dto.StatusAccepted, dto.StatusRejected:
		// Check if user has chair permissions
		if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail) {
			return nil, handler.NewErrorResponse(http.StatusForbidden, "only the chair or co-chairs can update this conference")
		}
	case dto.StatusDraft, dto.StatusPublished, dto.StatusReviewing:
		if submission.Author != userEmail {
			return nil, handler.NewErrorResponse(http.StatusForbidden, "only author can set this status")
		}
	}

	updateData := &dto.Submission{
		Status: req.Status,
	}
	updatedSubmission, err := c.submissionStorage.Update(ctx, req.ID, updateData)
	if err != nil {
		return nil, err
	}

	// Send notification to author about paper decision
	if c.notificationService != nil {
		// Capture values for goroutine (use background context since request context will be cancelled)
		status := req.Status
		authorEmail := submission.Author
		submissionTitle := submission.Title
		confID := req.ConferenceID
		subID := req.ID
		notifSvc := c.notificationService
		go func() {
			switch status {
			case dto.StatusAccepted:
				err := notifSvc.NotifyPaperAccepted(
					context.Background(),
					authorEmail,
					submissionTitle,
					confID,
					subID,
				)
				if err != nil {
					fmt.Printf("Warning: Failed to notify author about paper acceptance: %v\n", err)
				}
			case dto.StatusRejected:
				err := notifSvc.NotifyPaperRejected(
					context.Background(),
					authorEmail,
					submissionTitle,
					confID,
					subID,
				)
				if err != nil {
					fmt.Printf("Warning: Failed to notify author about paper rejection: %v\n", err)
				}
			}
		}()
	}

	return updatedSubmission, nil
}

// GetCoverLetter godoc
// @Summary      Get submission cover letter
// @Description  Download the cover letter associated with a submission
// @Tags         submissions
// @Accept       json
// @Produce      application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        id path int true "Submission ID"
// @Success      200 {file} file
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{id}/cover_letter [get]
func (c *Controller) GetCoverLetter(ginCtx *gin.Context) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "invalid conference ID"})
		return
	}

	id, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
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

	if submission.CoverLetter == nil || submission.CoverLetter.Path == "" {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "cover letter not found"})
		return
	}

	// Use the path stored in the database (full path)
	filePath := submission.CoverLetter.Path

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "cover letter file not found"})
		return
	}

	// Set headers for file download
	ginCtx.Header("Content-Type", submission.CoverLetter.MimeType)
	ginCtx.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", submission.CoverLetter.OriginalName))
	ginCtx.Header("Content-Length", fmt.Sprintf("%d", submission.CoverLetter.Size))

	// Serve the file
	ginCtx.File(filePath)
}
