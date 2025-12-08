package notification

import (
	"net/http"
	"strconv"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/storage"
	notificationStorage "github.com/dcao/conferencespace/internal/storage/notification"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

// Controller handles notification-related HTTP requests
type Controller struct {
	notificationStorage notificationStorage.StorageInterface
}

// New creates a new notification controller
func New(store *storage.Storage) *Controller {
	return &Controller{
		notificationStorage: store.Notification,
	}
}

// List godoc
// @Summary      List notifications
// @Description  Get list of notifications for the authenticated user with pagination and filters
// @Tags         notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        limit query int false "Limit results (default: 20)"
// @Param        offset query int false "Offset for pagination"
// @Param        unread query bool false "Filter to only unread notifications"
// @Param        type query string false "Filter by notification type"
// @Success      200 {object} dto.NotificationListResponse
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /notifications [get]
func (c *Controller) List(ginCtx *gin.Context, req *dto.NotificationListRequest) (*dto.NotificationListResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	// Set default limit
	if req.Limit == 0 {
		req.Limit = 20
	}

	params := &notificationStorage.QueryParams{
		Limit:     req.Limit,
		Offset:    req.Offset,
		UserEmail: userEmail,
		Unread:    req.Unread,
		Type:      req.Type,
	}

	notifications, total, err := c.notificationStorage.GetByUserEmail(ctx, params)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &dto.NotificationListResponse{
		Notifications: notifications,
		Total:         total,
	}, nil
}

// GetUnreadCount godoc
// @Summary      Get unread notification count
// @Description  Get the count of unread notifications for the authenticated user
// @Tags         notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} dto.UnreadCountResponse
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /notifications/unread-count [get]
func (c *Controller) GetUnreadCount(ginCtx *gin.Context) (*dto.UnreadCountResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	count, err := c.notificationStorage.GetUnreadCount(ctx, userEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &dto.UnreadCountResponse{
		Count: count,
	}, nil
}

// Get godoc
// @Summary      Get notification by ID
// @Description  Get a specific notification by its ID
// @Tags         notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Notification ID"
// @Success      200 {object} dto.Notification
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /notifications/{id} [get]
func (c *Controller) Get(ginCtx *gin.Context) (*dto.Notification, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid notification ID")
	}

	notification, err := c.notificationStorage.GetByID(ctx, id)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "notification not found")
	}

	// Verify the notification belongs to the user
	if notification.UserEmail != userEmail {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "notification not found")
	}

	return notification, nil
}

// MarkAsRead godoc
// @Summary      Mark notification as read
// @Description  Mark a specific notification as read
// @Tags         notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Notification ID"
// @Success      200 {object} dto.Notification
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /notifications/{id}/read [patch]
func (c *Controller) MarkAsRead(ginCtx *gin.Context) (*dto.Notification, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid notification ID")
	}

	notification, err := c.notificationStorage.MarkAsRead(ctx, id, userEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "notification not found")
	}

	return notification, nil
}

// MarkAllAsRead godoc
// @Summary      Mark all notifications as read
// @Description  Mark all notifications as read for the authenticated user
// @Tags         notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} dto.MarkAllAsReadResponse
// @Failure      401 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /notifications/read-all [patch]
func (c *Controller) MarkAllAsRead(ginCtx *gin.Context) (*dto.MarkAllAsReadResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	markedCount, err := c.notificationStorage.MarkAllAsRead(ctx, userEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &dto.MarkAllAsReadResponse{
		MarkedCount: markedCount,
	}, nil
}

// Delete godoc
// @Summary      Delete notification
// @Description  Delete a specific notification
// @Tags         notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Notification ID"
// @Success      200 {object} map[string]string
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /notifications/{id} [delete]
func (c *Controller) Delete(ginCtx *gin.Context) error {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid notification ID")
	}

	err = c.notificationStorage.Delete(ctx, id, userEmail)
	if err != nil {
		return handler.NewErrorResponse(http.StatusNotFound, "notification not found")
	}

	return nil
}

