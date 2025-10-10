package auth

import (
	"github.com/dcao/conferencespace/internal/dto/user"
	"github.com/dcao/conferencespace/internal/orchestrator"
	userOrchestrator "github.com/dcao/conferencespace/internal/orchestrator/user"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	orchestrator userOrchestrator.OrchestratorInterface
}

func New(orch *orchestrator.Orchestrator) *Controller {
	return &Controller{
		orchestrator: orch.User,
	}
}

func (c *Controller) Register(ginCtx *gin.Context, req *user.CreateRequest) (*user.Response, error) {
	ctx := ginCtx.Request.Context()
	return c.orchestrator.Register(ctx, req)
}

func (c *Controller) Login(ginCtx *gin.Context, req *user.LoginRequest) (*user.LoginResponse, error) {
	ctx := ginCtx.Request.Context()
	return c.orchestrator.Login(ctx, req)
}
