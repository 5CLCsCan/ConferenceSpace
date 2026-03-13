package discussion

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	discussionService "github.com/dcao/conferencespace/internal/service/discussion"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

// Controller handles discussion-related HTTP requests
type Controller struct {
	service        *discussionService.Service
	uploadBasePath string
}

// New creates a new discussion controller
func New(service *discussionService.Service, uploadBasePath string) *Controller {
	return &Controller{
		service:        service,
		uploadBasePath: uploadBasePath,
	}
}

// CreateThread godoc
// @Summary      Create a discussion thread
// @Description  Create a new discussion thread for a submission (reviewer only)
// @Tags         discussions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Param        request body dto.CreateThreadRequest true "Thread creation request"
// @Success      201 {object} dto.CreateThreadResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{submission_id}/threads [post]
func (c *Controller) CreateThread(ginCtx *gin.Context) (*dto.CreateThreadResponse, error) {
	ctx := ginCtx.Request.Context()

	userID, exists := utils.GetUserID(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	submissionID, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid submission ID")
	}

	var req dto.CreateThreadRequest
	if err := ginCtx.ShouldBindJSON(&req); err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
	}

	response, err := c.service.CreateThread(ctx, userID, userEmail, submissionID, &req)
	if err != nil {
		// Check for specific error types
		errMsg := err.Error()
		if errMsg == "only assigned reviewers can create discussion threads" ||
			errMsg == "discussions are only allowed during the reviewing phase" {
			return nil, handler.NewErrorResponse(http.StatusForbidden, errMsg)
		}
		if errMsg == "submission not found" {
			return nil, handler.NewErrorResponse(http.StatusNotFound, errMsg)
		}
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return response, nil
}

// GetThreads godoc
// @Summary      Get discussion threads
// @Description  Get all discussion threads for a submission (filtered by user role)
// @Tags         discussions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Success      200 {object} dto.ThreadListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{submission_id}/threads [get]
func (c *Controller) GetThreads(ginCtx *gin.Context) (*dto.ThreadListResponse, error) {
	ctx := ginCtx.Request.Context()

	userID, exists := utils.GetUserID(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	submissionID, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid submission ID")
	}

	response, err := c.service.GetThreadsForUser(ctx, userID, userEmail, submissionID)
	if err != nil {
		errMsg := err.Error()
		if errMsg == "you do not have access to discussions for this submission" {
			return nil, handler.NewErrorResponse(http.StatusForbidden, errMsg)
		}
		if errMsg == "submission not found" {
			return nil, handler.NewErrorResponse(http.StatusNotFound, errMsg)
		}
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return response, nil
}

// GetThread godoc
// @Summary      Get a discussion thread
// @Description  Get a specific discussion thread by ID
// @Tags         discussions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        thread_id path int true "Thread ID"
// @Success      200 {object} dto.DiscussionThread
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /threads/{thread_id} [get]
func (c *Controller) GetThread(ginCtx *gin.Context) (*dto.DiscussionThread, error) {
	ctx := ginCtx.Request.Context()

	userID, exists := utils.GetUserID(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	threadID, err := strconv.ParseInt(ginCtx.Param("thread_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid thread ID")
	}

	response, err := c.service.GetThread(ctx, userID, userEmail, threadID)
	if err != nil {
		errMsg := err.Error()
		if errMsg == "you do not have access to this thread" {
			return nil, handler.NewErrorResponse(http.StatusForbidden, errMsg)
		}
		if errMsg == "thread not found" {
			return nil, handler.NewErrorResponse(http.StatusNotFound, errMsg)
		}
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return response, nil
}

// CreateMessage godoc
// @Summary      Add a message to a thread
// @Description  Add a new message to an existing discussion thread
// @Tags         discussions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        thread_id path int true "Thread ID"
// @Param        request body dto.CreateMessageRequest true "Message creation request"
// @Success      201 {object} dto.DiscussionMessage
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /threads/{thread_id}/messages [post]
func (c *Controller) CreateMessage(ginCtx *gin.Context) (*dto.DiscussionMessage, error) {
	ctx := ginCtx.Request.Context()

	userID, exists := utils.GetUserID(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	threadID, err := strconv.ParseInt(ginCtx.Param("thread_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid thread ID")
	}

	var req dto.CreateMessageRequest
	if err := ginCtx.ShouldBindJSON(&req); err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
	}

	response, err := c.service.AddMessage(ctx, userID, userEmail, threadID, &req)
	if err != nil {
		errMsg := err.Error()
		if errMsg == "only thread participants can add messages" ||
			errMsg == "discussions are only allowed during the reviewing phase" {
			return nil, handler.NewErrorResponse(http.StatusForbidden, errMsg)
		}
		if errMsg == "thread not found" {
			return nil, handler.NewErrorResponse(http.StatusNotFound, errMsg)
		}
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return response, nil
}

// GetMessages godoc
// @Summary      Get messages in a thread
// @Description  Get all messages in a discussion thread
// @Tags         discussions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        thread_id path int true "Thread ID"
// @Success      200 {object} dto.MessageListResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /threads/{thread_id}/messages [get]
func (c *Controller) GetMessages(ginCtx *gin.Context) (*dto.MessageListResponse, error) {
	ctx := ginCtx.Request.Context()

	userID, exists := utils.GetUserID(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	threadID, err := strconv.ParseInt(ginCtx.Param("thread_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid thread ID")
	}

	response, err := c.service.GetMessages(ctx, userID, userEmail, threadID)
	if err != nil {
		errMsg := err.Error()
		if errMsg == "you do not have access to this thread" {
			return nil, handler.NewErrorResponse(http.StatusForbidden, errMsg)
		}
		if errMsg == "thread not found" {
			return nil, handler.NewErrorResponse(http.StatusNotFound, errMsg)
		}
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return response, nil
}

// DeleteMessage godoc
// @Summary      Delete a message
// @Description  Delete a message authored by the current user
// @Tags         discussions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        thread_id path int true "Thread ID"
// @Param        message_id path int true "Message ID"
// @Success      200 {object} map[string]string
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /threads/{thread_id}/messages/{message_id} [delete]
func (c *Controller) DeleteMessage(ginCtx *gin.Context) error {
	ctx := ginCtx.Request.Context()

	userID, exists := utils.GetUserID(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	messageID, err := strconv.ParseInt(ginCtx.Param("message_id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid message ID")
	}

	if err := c.service.DeleteMessage(ctx, userID, messageID); err != nil {
		errMsg := err.Error()
		if errMsg == "message not found or not authorized" {
			return handler.NewErrorResponse(http.StatusForbidden, errMsg)
		}
		return handler.NewErrorResponse(http.StatusInternalServerError, errMsg)
	}

	return nil
}

// UploadAttachment uploads a file attachment for a discussion thread message
// @Router /threads/{thread_id}/attachments [post]
func (c *Controller) UploadAttachment(ginCtx *gin.Context) {
	_, exists := utils.GetUserID(ginCtx)
	if !exists {
		ginCtx.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	threadID := ginCtx.Param("thread_id")
	if threadID == "" {
		ginCtx.JSON(http.StatusBadRequest, gin.H{"error": "invalid thread ID"})
		return
	}

	fileHeader, err := ginCtx.FormFile("file")
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
		return
	}

	const maxSize = 20 * 1024 * 1024 // 20MB
	if fileHeader.Size > maxSize {
		ginCtx.JSON(http.StatusBadRequest, gin.H{"error": "file size must not exceed 20MB"})
		return
	}

	dirPath := filepath.Join(c.uploadBasePath, threadID)
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		ginCtx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create upload directory"})
		return
	}

	ext := filepath.Ext(fileHeader.Filename)
	nameWithoutExt := strings.TrimSuffix(fileHeader.Filename, ext)
	sanitized := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			return r
		}
		return '_'
	}, nameWithoutExt)
	filename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), sanitized, ext)
	filePath := filepath.Join(dirPath, filename)

	src, err := fileHeader.Open()
	if err != nil {
		ginCtx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open uploaded file"})
		return
	}
	defer src.Close()

	dst, err := os.Create(filePath)
	if err != nil {
		ginCtx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		os.Remove(filePath)
		ginCtx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to write file"})
		return
	}

	downloadURL := fmt.Sprintf("/api/v1/threads/%s/attachments/%s", threadID, filename)
	ginCtx.JSON(http.StatusOK, gin.H{
		"url":         downloadURL,
		"filename":    fileHeader.Filename,
		"stored_name": filename,
	})
}

// DownloadAttachment serves a file attachment for a discussion thread
// @Router /threads/{thread_id}/attachments/{filename} [get]
func (c *Controller) DownloadAttachment(ginCtx *gin.Context) {
	_, exists := utils.GetUserID(ginCtx)
	if !exists {
		ginCtx.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	threadID := ginCtx.Param("thread_id")
	filename := ginCtx.Param("filename")

	// Prevent path traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") {
		ginCtx.JSON(http.StatusBadRequest, gin.H{"error": "invalid filename"})
		return
	}

	filePath := filepath.Join(c.uploadBasePath, threadID, filename)
	ginCtx.FileAttachment(filePath, filename)
}
