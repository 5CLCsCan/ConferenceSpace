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
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	coiService "github.com/dcao/conferencespace/internal/service/coi"
	notificationService "github.com/dcao/conferencespace/internal/service/notification"

	"github.com/dcao/conferencespace/internal/storage"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	fileStorage "github.com/dcao/conferencespace/internal/storage/file"
	assignmentStorage "github.com/dcao/conferencespace/internal/storage/assignment"
	rebuttalStorage "github.com/dcao/conferencespace/internal/storage/rebuttal"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	submissionStorage   submissionStorage.StorageInterface
	assignmentStorage   assignmentStorage.StorageInterface
	rebuttalStorage     rebuttalStorage.StorageInterface
	conferenceStorage   conferenceStorage.StorageInterface
	fileStorage         fileStorage.StorageInterface
	roleStorage         conferenceuserrole.StorageInterface
	geminiClient        interface{} // Store as interface to allow nil checks
	coiService          *coiService.Service
	notificationService *notificationService.Service
}

func New(store *storage.Storage, fileStore fileStorage.StorageInterface, geminiClient interface{}, coiSvc *coiService.Service) *Controller {
	return &Controller{
		submissionStorage: store.Submission,
		assignmentStorage: store.Assignment,
		rebuttalStorage:   store.RebuttalPoint,
		conferenceStorage: store.Conference,
		fileStorage:       fileStore,
		roleStorage:       store.ConferenceUserRole,
		geminiClient:      geminiClient,
		coiService:        coiSvc,
	}
}

// NewWithNotifications creates a new controller with notification support
func NewWithNotifications(
	store *storage.Storage,
	fileStore fileStorage.StorageInterface,
	geminiClient interface{},
	coiSvc *coiService.Service,
	notifSvc *notificationService.Service,
) *Controller {
	return &Controller{
		submissionStorage:   store.Submission,
		assignmentStorage:   store.Assignment,
		rebuttalStorage:     store.RebuttalPoint,
		conferenceStorage:   store.Conference,
		fileStorage:         fileStore,
		roleStorage:         store.ConferenceUserRole,
		geminiClient:        geminiClient,
		coiService:          coiSvc,
		notificationService: notifSvc,
	}
}

func (c *Controller) deleteStoredFileByMetadata(conferenceID, submissionID int64, metadata *dto.SubmissionFileMetadata, isCoverLetter bool) {
	if metadata == nil {
		return
	}
	if metadata.Path != "" {
		_ = c.fileStorage.DeleteByPath(metadata.Path)
		return
	}
	if isCoverLetter {
		_ = c.fileStorage.DeleteCoverLetter(conferenceID, submissionID, metadata.Filename)
		return
	}
	_ = c.fileStorage.DeleteFile(conferenceID, submissionID, metadata.Filename)
}

func (c *Controller) markSubmissionDirty(ctx context.Context, conferenceID, submissionID int64, reason string) {
	if c.coiService == nil {
		return
	}

	if err := c.coiService.MarkSubmissionDirty(ctx, conferenceID, submissionID, reason); err != nil {
		fmt.Printf("Warning: failed to mark submission %d dirty for COI refresh: %v\n", submissionID, err)
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

	// Check submission deadline when creating a published submission
	if req.Submission.Status == dto.StatusPublished {
		if conference.Configurations != nil && conference.Configurations.FullPaperSubmissionDeadline != nil {
			if time.Now().After(*conference.Configurations.FullPaperSubmissionDeadline) {
				return nil, handler.NewErrorResponse(http.StatusForbidden, "submission deadline has passed")
			}
		}
	}

	req.Submission.Author = userEmail
	req.Submission.ConferenceID = conferenceID

	if req.Submission.Status == "" {
		req.Submission.Status = dto.StatusDraft
	}

	// For published submissions, a file is mandatory and must pass precheck.
	if req.Submission.Status == dto.StatusPublished {
		if req.Submission.File == nil || len(req.Submission.File.Content) == 0 {
			return nil, handler.NewErrorResponse(http.StatusBadRequest, "paper file is required when publishing a submission")
		}

		if err := c.ensureSubmissionPrecheckApprovedFromBytes(
			ctx,
			conference,
			req.Submission.File.Content,
			req.Submission.File.OriginalName,
		); err != nil {
			return nil, err
		}
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
	// - For published: file has already been validated above
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
			c.deleteStoredFileByMetadata(conferenceID, submission.ID, fileMetadata, false)
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
			c.deleteStoredFileByMetadata(conferenceID, submission.ID, coverLetterMetadata, true)
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

	c.markSubmissionDirty(ctx, conferenceID, submission.ID, "submission_created")

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

	// Check submission deadline when updating to published status
	if req.Submission.Status == dto.StatusPublished {
		conference, err := c.conferenceStorage.GetByID(ctx, conferenceID)
		if err != nil {
			return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
		}
		if conference.Configurations != nil && conference.Configurations.FullPaperSubmissionDeadline != nil {
			if time.Now().After(*conference.Configurations.FullPaperSubmissionDeadline) {
				return nil, handler.NewErrorResponse(http.StatusForbidden, "submission deadline has passed")
			}
		}
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
		c.deleteStoredFileByMetadata(conferenceID, id, existing.File, false)

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
			c.deleteStoredFileByMetadata(conferenceID, id, fileMetadata, false)
			return nil, err
		}
	}

	// Handle cover letter update if provided
	if req.Submission.CoverLetter != nil {
		// Delete old cover letter if exists
		c.deleteStoredFileByMetadata(conferenceID, id, existing.CoverLetter, true)

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
			c.deleteStoredFileByMetadata(conferenceID, id, coverLetterMetadata, true)
			return nil, err
		}
	}

	c.markSubmissionDirty(ctx, conferenceID, id, "submission_updated")

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

	// Check submission deadline before allowing publication.
	conference, err := c.conferenceStorage.GetByID(ctx, conferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}
	if conference.Configurations != nil && conference.Configurations.FullPaperSubmissionDeadline != nil {
		if time.Now().After(*conference.Configurations.FullPaperSubmissionDeadline) {
			return nil, handler.NewErrorResponse(http.StatusForbidden, "submission deadline has passed")
		}
	}

	// Hard gate: only allow publish when the current paper passes precheck.
	if req.Submission.File != nil && len(req.Submission.File.Content) > 0 {
		if err := c.ensureSubmissionPrecheckApprovedFromBytes(
			ctx,
			conference,
			req.Submission.File.Content,
			req.Submission.File.OriginalName,
		); err != nil {
			return nil, err
		}
	} else if existing.File != nil && existing.File.Path != "" {
		if err := c.ensureSubmissionPrecheckApprovedForStoredFile(ctx, conference, existing.File); err != nil {
			return nil, err
		}
	}

	// Handle paper file upload if provided
	if req.Submission.File != nil {
		// Delete old paper file if exists
		c.deleteStoredFileByMetadata(conferenceID, id, existing.File, false)

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
			c.deleteStoredFileByMetadata(conferenceID, id, fileMetadata, false)
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
		c.deleteStoredFileByMetadata(conferenceID, id, existing.CoverLetter, true)

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
			c.deleteStoredFileByMetadata(conferenceID, id, coverLetterMetadata, true)
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

	c.markSubmissionDirty(ctx, conferenceID, id, "submission_published")

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

	if err := c.submissionStorage.Delete(ctx, id); err != nil {
		return err
	}

	c.markSubmissionDirty(ctx, conferenceID, id, "submission_deleted")
	return nil
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

	reader, err := c.fileStorage.Open(submission.File.Path)
	if err != nil {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "file not found"})
		return
	}
	defer reader.Close()

	// Set headers for file download
	ginCtx.DataFromReader(http.StatusOK, submission.File.Size, submission.File.MimeType, reader, map[string]string{
		"Content-Disposition": fmt.Sprintf("inline; filename=\"%s\"", submission.File.OriginalName),
		"Content-Length":      fmt.Sprintf("%d", submission.File.Size),
	})
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

	c.markSubmissionDirty(ctx, req.ConferenceID, req.ID, "submission_status_updated")

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

	reader, err := c.fileStorage.Open(submission.CoverLetter.Path)
	if err != nil {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "cover letter file not found"})
		return
	}
	defer reader.Close()

	// Set headers for file download
	ginCtx.DataFromReader(http.StatusOK, submission.CoverLetter.Size, submission.CoverLetter.MimeType, reader, map[string]string{
		"Content-Disposition": fmt.Sprintf("inline; filename=\"%s\"", submission.CoverLetter.OriginalName),
		"Content-Length":      fmt.Sprintf("%d", submission.CoverLetter.Size),
	})
}

// SubmitRebuttal godoc
// @Summary      Submit author rebuttal
// @Description  Author submits a rebuttal (general response + per-reviewer responses) for a submission
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Param        request body dto.SubmitRebuttalRequest true "Rebuttal content"
// @Success      200 {object} dto.RebuttalStatusResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{submission_id}/rebuttal [put]
func (c *Controller) SubmitRebuttal(ginCtx *gin.Context, req *dto.SubmitRebuttalRequest) (*dto.RebuttalStatusResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	sub, err := c.submissionStorage.GetByID(ctx, req.SubmissionID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	if sub.ConferenceID != req.ConferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found in this conference")
	}

	if sub.Author != userEmail {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only the submission author can submit a rebuttal")
	}

	// Phase guard: conference must be in 'awaiting' rebuttal phase
	confRebuttal, err := c.conferenceStorage.GetRebuttalSettings(ctx, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to check rebuttal phase")
	}
	if confRebuttal.Phase != model.ConferenceRebuttalPhaseAwaiting {
		return nil, handler.NewErrorResponse(http.StatusBadRequest,
			fmt.Sprintf("rebuttal is not open (current phase: %s)", confRebuttal.Phase))
	}

	// Char limit validation
	if confRebuttal.CharLimitGeneral > 0 && len(req.GeneralResponse) > confRebuttal.CharLimitGeneral {
		return nil, handler.NewErrorResponse(http.StatusBadRequest,
			fmt.Sprintf("general response exceeds %d character limit", confRebuttal.CharLimitGeneral))
	}
	for _, p := range req.Points {
		if confRebuttal.CharLimitPerPoint > 0 && len(p.AuthorResponse) > confRebuttal.CharLimitPerPoint {
			return nil, handler.NewErrorResponse(http.StatusBadRequest,
				fmt.Sprintf("response for point %s exceeds %d character limit", p.PointID, confRebuttal.CharLimitPerPoint))
		}
	}

	if err := c.submissionStorage.SubmitRebuttal(ctx, req.SubmissionID, req.GeneralResponse); err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	if len(req.Points) > 0 {
		modelPoints := make([]model.RebuttalPoint, 0, len(req.Points))
		for _, p := range req.Points {
			modelPoints = append(modelPoints, model.RebuttalPoint{
				SubmissionID:    req.SubmissionID,
				ConferenceID:    req.ConferenceID,
				AssignmentID:    p.AssignmentID,
				PointID:         p.PointID,
				Category:        p.Category,
				Section:         p.Section,
				OriginalComment: p.OriginalComment,
				AuthorResponse:  p.AuthorResponse,
			})
		}
		if err := c.rebuttalStorage.UpsertPoints(ctx, modelPoints); err != nil {
			return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
		}
	}

	// Notify all assigned reviewers about the rebuttal submission (fire-and-forget)
	if c.notificationService != nil {
		conf, _ := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
		assignments, _, _ := c.assignmentStorage.GetReviewsBySubmission(ctx, req.SubmissionID, 100, 0)
		if conf != nil && len(assignments) > 0 {
			go func() {
				bgCtx := context.Background()
				for _, a := range assignments {
					if a.ReviewerEmail != "" {
						if err := c.notificationService.NotifyRebuttalSubmitted(bgCtx, a.ReviewerEmail, sub.Title, conf.Title, req.ConferenceID, req.SubmissionID); err != nil {
							fmt.Printf("Warning: failed to notify reviewer %s: %v\n", a.ReviewerEmail, err)
						}
					}
				}
			}()
		}
	}

	now := time.Now()
	return &dto.RebuttalStatusResponse{
		RebuttalPhase:       model.RebuttalPhaseSubmitted,
		RebuttalStatus:      model.RebuttalStatusSubmitted,
		RebuttalSubmittedAt: &now,
	}, nil
}

// GetRebuttal godoc
// @Summary      Get rebuttal state for a submission
// @Description  Returns rebuttal phase, general response, and per-point data
// @Tags         submissions
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Success      200 {object} dto.GetRebuttalResponse
// @Router       /conferences/{conference_id}/submissions/{submission_id}/rebuttal [get]
func (c *Controller) GetRebuttal(ginCtx *gin.Context, req *dto.GetRebuttalRequest) (*dto.GetRebuttalResponse, error) {
	ctx := ginCtx.Request.Context()

	sub, err := c.submissionStorage.GetByID(ctx, req.SubmissionID)
	if err != nil || sub.ConferenceID != req.ConferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	points, err := c.rebuttalStorage.GetBySubmission(ctx, req.SubmissionID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	generalResponse := ""
	if sub.RebuttalGeneralResponse != nil {
		generalResponse = *sub.RebuttalGeneralResponse
	}

	submittedAt := &sub.UpdatedAt

	// Fetch assignment rebuttal statuses for ack progress display
	var assignmentStatuses []dto.RebuttalAssignmentStatus
	assignments, _, _ := c.assignmentStorage.GetReviewsBySubmission(ctx, req.SubmissionID, 100, 0)
	for _, a := range assignments {
		assignmentStatuses = append(assignmentStatuses, dto.RebuttalAssignmentStatus{
			AssignmentID:   a.ID,
			RebuttalStatus: a.RebuttalStatus,
		})
	}
	if assignmentStatuses == nil {
		assignmentStatuses = []dto.RebuttalAssignmentStatus{}
	}

	// Fetch conference rebuttal config for char limits and deadline
	var charLimitGeneral, charLimitPerPoint int
	var deadline *time.Time
	if confCfg, err := c.conferenceStorage.GetRebuttalSettings(ctx, req.ConferenceID); err == nil {
		charLimitGeneral = confCfg.CharLimitGeneral
		charLimitPerPoint = confCfg.CharLimitPerPoint
		deadline = confCfg.Deadline
	}

	return &dto.GetRebuttalResponse{
		Phase:             sub.RebuttalPhase,
		GeneralResponse:   generalResponse,
		SubmittedAt:       submittedAt,
		Points:            points,
		Assignments:       assignmentStatuses,
		CharLimitGeneral:  charLimitGeneral,
		CharLimitPerPoint: charLimitPerPoint,
		Deadline:          deadline,
	}, nil
}

// UploadCameraReady godoc
// @Summary      Upload camera-ready version
// @Description  Upload the camera-ready (final) version of an accepted submission (author only)
// @Tags         submissions
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Param        file formData file true "Camera-ready PDF"
// @Success      200 {object} dto.Submission
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{submission_id}/camera-ready [post]
func (c *Controller) UploadCameraReady(ginCtx *gin.Context) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "invalid conference ID"})
		return
	}
	submissionID, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "invalid submission ID"})
		return
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		ginCtx.JSON(http.StatusUnauthorized, handler.Response{Error: "user not authenticated"})
		return
	}

	sub, err := c.submissionStorage.GetByID(ctx, submissionID)
	if err != nil || sub.ConferenceID != conferenceID {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "submission not found"})
		return
	}
	if sub.Author != userEmail {
		ginCtx.JSON(http.StatusForbidden, handler.Response{Error: "only the submission author can upload camera-ready"})
		return
	}

	fileHeader, err := ginCtx.FormFile("file")
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "file is required"})
		return
	}
	f, err := fileHeader.Open()
	if err != nil {
		ginCtx.JSON(http.StatusInternalServerError, handler.Response{Error: "failed to open file"})
		return
	}
	defer f.Close()

	meta, err := c.fileStorage.SaveCameraReady(f, fileHeader, conferenceID, submissionID)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: err.Error()})
		return
	}

	updated, err := c.submissionStorage.UpdateCameraReady(ctx, submissionID, meta)
	if err != nil {
		_ = c.fileStorage.DeleteCameraReady(conferenceID, submissionID, meta.Filename)
		ginCtx.JSON(http.StatusInternalServerError, handler.Response{Error: err.Error()})
		return
	}

	ginCtx.JSON(http.StatusOK, handler.Response{Data: updated})
}

// GetCameraReady godoc
// @Summary      Download camera-ready file
// @Description  Download the camera-ready PDF for a submission
// @Tags         submissions
// @Produce      application/pdf
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Success      200  {file}   binary
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{submission_id}/camera-ready [get]
func (c *Controller) GetCameraReady(ginCtx *gin.Context) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "invalid conference ID"})
		return
	}
	submissionID, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "invalid submission ID"})
		return
	}

	sub, err := c.submissionStorage.GetByID(ctx, submissionID)
	if err != nil || sub.ConferenceID != conferenceID {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "submission not found"})
		return
	}
	if sub.CameraReady == nil || sub.CameraReady.Path == "" {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "camera-ready file not found"})
		return
	}
	if _, err := os.Stat(sub.CameraReady.Path); os.IsNotExist(err) {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "camera-ready file not found on disk"})
		return
	}

	ginCtx.Header("Content-Type", sub.CameraReady.MimeType)
	ginCtx.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", sub.CameraReady.OriginalName))
	ginCtx.Header("Content-Length", fmt.Sprintf("%d", sub.CameraReady.Size))
	ginCtx.File(sub.CameraReady.Path)
}