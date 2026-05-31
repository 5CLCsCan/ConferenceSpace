package usageevent

import (
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/storage"
	usageeventStorage "github.com/dcao/conferencespace/internal/storage/usage_event"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	usageEventStorage usageeventStorage.StorageInterface
}

func New(store *storage.Storage) *Controller {
	return &Controller{
		usageEventStorage: store.UsageEvent,
	}
}

func (c *Controller) CreateBatch(ginCtx *gin.Context, req *dto.UsageEventBatchCreateRequest) (*dto.UsageEventBatchCreateResponse, error) {
	userID, exists := utils.GetUserID(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	inserted, err := c.usageEventStorage.CreateBatch(ginCtx.Request.Context(), userID, req.Events)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &dto.UsageEventBatchCreateResponse{Inserted: inserted}, nil
}
