package usageevent

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

type fakeUsageEventStorage struct {
	inserted int
	err      error
	events   []dto.UsageEventCreateRequest
	userID   int64
}

func (f *fakeUsageEventStorage) CreateBatch(ctx context.Context, userID int64, events []dto.UsageEventCreateRequest) (int, error) {
	f.userID = userID
	f.events = events
	return f.inserted, f.err
}

func TestCreateBatch(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("requires authenticated user", func(t *testing.T) {
		ctrl := &Controller{usageEventStorage: &fakeUsageEventStorage{}}
		ginCtx, _ := gin.CreateTestContext(httptest.NewRecorder())
		ginCtx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/usage-events", nil)

		res, err := ctrl.CreateBatch(ginCtx, &dto.UsageEventBatchCreateRequest{
			Events: []dto.UsageEventCreateRequest{{SessionID: "s1", EventName: "role_selected"}},
		})

		require.Nil(t, res)
		require.Error(t, err)
		var apiErr *handler.ErrorResponse
		require.True(t, errors.As(err, &apiErr))
		require.Equal(t, http.StatusUnauthorized, apiErr.StatusCode)
	})

	t.Run("inserts events for authenticated user", func(t *testing.T) {
		storage := &fakeUsageEventStorage{inserted: 2}
		ctrl := &Controller{usageEventStorage: storage}
		ginCtx, _ := gin.CreateTestContext(httptest.NewRecorder())
		ginCtx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/usage-events", nil)
		ginCtx.Set("user_id", int64(42))

		res, err := ctrl.CreateBatch(ginCtx, &dto.UsageEventBatchCreateRequest{
			Events: []dto.UsageEventCreateRequest{
				{SessionID: "s1", EventName: "playwright.session_started"},
				{SessionID: "s1", EventName: "playwright.session_completed"},
			},
		})

		require.NoError(t, err)
		require.Equal(t, 2, res.Inserted)
		require.Equal(t, int64(42), storage.userID)
		require.Len(t, storage.events, 2)
	})
}
