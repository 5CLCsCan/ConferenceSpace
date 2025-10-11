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

// Register godoc
// @Summary      Register a new user
// @Description  Create a new user account
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body user.CreateRequest true "User registration data"
// @Success      200 {object} user.Response
// @Failure      400 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /auth/register [post]
func (c *Controller) Register(ginCtx *gin.Context, req *user.CreateRequest) (*user.Response, error) {
	ctx := ginCtx.Request.Context()
	return c.orchestrator.Register(ctx, req)
}

// Login godoc
// @Summary      User login
// @Description  Authenticate user and return JWT token
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body user.LoginRequest true "Login credentials"
// @Success      200 {object} user.LoginResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Router       /auth/login [post]
func (c *Controller) Login(ginCtx *gin.Context, req *user.LoginRequest) (*user.LoginResponse, error) {
	ctx := ginCtx.Request.Context()
	return c.orchestrator.Login(ctx, req)
}
