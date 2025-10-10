package auth

import (
	"github.com/dcao/conferencespace/internal/dto/user"
	"github.com/dcao/conferencespace/internal/service"
	userService "github.com/dcao/conferencespace/internal/service/user"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	service userService.ServiceInterface
}

func New(svc *service.Service) *Controller {
	return &Controller{
		service: svc.User,
	}
}

func (c *Controller) Register(ctx *gin.Context, req *user.CreateRequest) (*user.Response, error) {
	return c.service.Register(ctx.Request.Context(), req)
}

func (c *Controller) Login(ctx *gin.Context, req *user.LoginRequest) (*user.LoginResponse, error) {
	return c.service.Login(ctx.Request.Context(), req)
}
