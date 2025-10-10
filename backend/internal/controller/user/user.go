package user

import (
	"net/http"
	"strconv"

	userDto "github.com/dcao/conferencespace/internal/dto/user"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/middleware"
	"github.com/dcao/conferencespace/internal/storage"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	storage userStorage.StorageInterface
}

func New(store *storage.Storage) *Controller {
	return &Controller{
		storage: store.User,
	}
}

func (c *Controller) List(ginCtx *gin.Context, req *userDto.ListRequest) (*userDto.ListResponse, error) {
	ctx := ginCtx.Request.Context()

	params := &userStorage.QueryParams{
		Limit:     req.Limit,
		Offset:    req.Offset,
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
	}

	users, total, err := c.storage.List(ctx, params)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &userDto.ListResponse{
		Users: users,
		Total: total,
	}, nil
}

func (c *Controller) Get(ginCtx *gin.Context) (*userDto.Response, error) {
	ctx := ginCtx.Request.Context()

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid user ID")
	}

	user, err := c.storage.GetByID(ctx, id)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}
	return user, nil
}

func (c *Controller) GetMe(ginCtx *gin.Context) (*userDto.Response, error) {
	ctx := ginCtx.Request.Context()

	userID, exists := middleware.GetUserIDFromContext(ctx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	user, err := c.storage.GetByID(ctx, userID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}
	return user, nil
}

func (c *Controller) Update(ginCtx *gin.Context, req *userDto.UpdateRequest) (*userDto.Response, error) {
	ctx := ginCtx.Request.Context()

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid user ID")
	}

	userID, exists := middleware.GetUserIDFromContext(ctx)
	if !exists || userID != id {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you can only update your own profile")
	}

	if req.User == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "user data is required")
	}

	return c.storage.Update(ctx, id, req.User)
}

func (c *Controller) Delete(ginCtx *gin.Context) error {
	ctx := ginCtx.Request.Context()

	id, err := strconv.ParseInt(ginCtx.Param("id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid user ID")
	}

	userID, exists := middleware.GetUserIDFromContext(ctx)
	if !exists || userID != id {
		return handler.NewErrorResponse(http.StatusForbidden, "you can only delete your own account")
	}

	return c.storage.Delete(ctx, id)
}
