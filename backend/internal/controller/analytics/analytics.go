package analytics

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/storage"
	analyticsStorage "github.com/dcao/conferencespace/internal/storage/analytics"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	analyticsStorage analyticsStorage.StorageInterface
}

func New(store *storage.Storage) *Controller {
	return &Controller{analyticsStorage: store.Analytics}
}

func (c *Controller) RecordEvents(ginCtx *gin.Context, req *dto.AnalyticsBatchRequest) (*dto.AnalyticsBatchResponse, error) {
	ctx := ginCtx.Request.Context()
	userID, exists := utils.GetUserID(ginCtx)
	if !exists || userID <= 0 {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	if err := validateBatch(req); err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
	}

	inserted, err := c.analyticsStorage.RecordBatch(ctx, userID, ginCtx.GetHeader("User-Agent"), req)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &dto.AnalyticsBatchResponse{
		Inserted: inserted,
		Accepted: len(req.Events),
	}, nil
}

func validateBatch(req *dto.AnalyticsBatchRequest) error {
	if !analyticsStorage.IsValidUUID(req.SessionID) {
		return validationError("session_id must be a valid UUID")
	}

	validTypes := analyticsStorage.RecordableEventTypes()
	validRoles := map[string]struct{}{
		"":         {},
		"author":   {},
		"reviewer": {},
		"chair":    {},
		"pc":       {},
		"admin":    {},
	}
	for i, event := range req.Events {
		if !analyticsStorage.IsValidUUID(event.EventID) {
			return validationErrorf("events[%d].event_id must be a valid UUID", i)
		}
		if strings.TrimSpace(event.EventName) == "" {
			return validationErrorf("events[%d].event_name is required", i)
		}
		if _, ok := validTypes[event.EventType]; !ok {
			return validationErrorf("events[%d].event_type is invalid", i)
		}
		if strings.TrimSpace(event.Route) == "" {
			return validationErrorf("events[%d].route is required", i)
		}
		if _, ok := validRoles[event.Role]; !ok {
			return validationErrorf("events[%d].role is invalid", i)
		}
		if event.OccurredAt.IsZero() {
			return validationErrorf("events[%d].occurred_at is required", i)
		}
		if event.EventType == dto.AnalyticsEventTypeFlowStep {
			if !analyticsStorage.IsValidUUID(event.FlowID) {
				return validationErrorf("events[%d].flow_id must be a valid UUID for flow steps", i)
			}
			if strings.TrimSpace(event.FlowName) == "" || strings.TrimSpace(event.StepName) == "" || event.StepIndex == nil {
				return validationErrorf("events[%d] must include flow_name, step_name, and step_index for flow steps", i)
			}
		}
		if event.FlowID != "" && !analyticsStorage.IsValidUUID(event.FlowID) {
			return validationErrorf("events[%d].flow_id must be a valid UUID", i)
		}
		if event.ActiveMS != nil && *event.ActiveMS < 0 {
			return validationErrorf("events[%d].active_ms cannot be negative", i)
		}
	}
	return nil
}

type validationError string

func (e validationError) Error() string { return string(e) }

func validationErrorf(format string, args ...interface{}) error {
	return validationError(strings.TrimSpace(fmt.Sprintf(format, args...)))
}
