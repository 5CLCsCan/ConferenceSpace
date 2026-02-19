package discussion

import (
	"net/http"
	"strconv"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	discussionService "github.com/dcao/conferencespace/internal/service/discussion"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

// Controller handles discussion-related HTTP requests
type Controller struct {
	service *discussionService.Service
}

// New creates a new discussion controller
func New(service *discussionService.Service) *Controller {
	return &Controller{
		service: service,
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
