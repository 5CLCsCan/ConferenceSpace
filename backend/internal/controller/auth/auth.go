package auth

import (
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/orchestrator"
	userOrchestrator "github.com/dcao/conferencespace/internal/orchestrator/user"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	orchestrator userOrchestrator.OrchestratorInterface
	serverEnv    string
}

func New(orch *orchestrator.Orchestrator, serverEnv string) *Controller {
	return &Controller{
		orchestrator: orch.User,
		serverEnv:    serverEnv,
	}
}

func (c *Controller) isDevMode() bool {
	return c.serverEnv == "development" || c.serverEnv == "test" || c.serverEnv == ""
}

// Register godoc
// @Summary      Register a new user
// @Description  Create a new user account
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body dto.UserCreateRequest true "User registration data"
// @Success      201 {object} dto.UserResponse
// @Failure      400 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /auth/register [post]
func (c *Controller) Register(ginCtx *gin.Context, req *dto.UserCreateRequest) (*dto.UserResponse, error) {
	ctx := ginCtx.Request.Context()
	return c.orchestrator.Register(ctx, req)
}

// Login godoc
// @Summary      User login
// @Description  Authenticate user and return JWT token
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body dto.LoginRequest true "Login credentials"
// @Success      200 {object} dto.LoginResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Router       /auth/login [post]
func (c *Controller) Login(ginCtx *gin.Context, req *dto.LoginRequest) (*dto.LoginResponse, error) {
	ctx := ginCtx.Request.Context()
	return c.orchestrator.Login(ctx, req)
}

// ForgotPassword godoc
// @Summary      Request password reset email
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body dto.ForgotPasswordRequest true "Email address"
// @Success      200 {object} dto.ForgotPasswordResponse
// @Failure      400 {object} handler.Response
// @Router       /auth/forgot-password [post]
func (c *Controller) ForgotPassword(ginCtx *gin.Context, req *dto.ForgotPasswordRequest) (*dto.ForgotPasswordResponse, error) {
	return c.orchestrator.ForgotPassword(ginCtx.Request.Context(), req, c.isDevMode())
}

// ResetPassword godoc
// @Summary      Reset password using token
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body dto.ResetPasswordRequest true "Reset token and new password"
// @Success      200 {object} dto.MessageResponse
// @Failure      400 {object} handler.Response
// @Router       /auth/reset-password [post]
func (c *Controller) ResetPassword(ginCtx *gin.Context, req *dto.ResetPasswordRequest) (*dto.MessageResponse, error) {
	return c.orchestrator.ResetPassword(ginCtx.Request.Context(), req)
}

// ChangePassword godoc
// @Summary      Change password (authenticated)
// @Tags         auth
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request body dto.ChangePasswordRequest true "Current and new password"
// @Success      200 {object} dto.MessageResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Router       /auth/change-password [post]
func (c *Controller) ChangePassword(ginCtx *gin.Context, req *dto.ChangePasswordRequest) (*dto.MessageResponse, error) {
	email, ok := utils.GetEmail(ginCtx)
	if !ok {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "unauthorized")
	}
	return c.orchestrator.ChangePassword(ginCtx.Request.Context(), email, req)
}

// VerifyEmail godoc
// @Summary      Verify email address
// @Tags         auth
// @Produce      json
// @Param        token query string true "Verification token"
// @Success      200 {object} dto.MessageResponse
// @Failure      400 {object} handler.Response
// @Router       /auth/verify-email [get]
func (c *Controller) VerifyEmail(ginCtx *gin.Context, req *dto.VerifyEmailRequest) (*dto.MessageResponse, error) {
	return c.orchestrator.VerifyEmail(ginCtx.Request.Context(), req.Token)
}

// ResendVerification godoc
// @Summary      Resend email verification
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body dto.ResendVerificationRequest true "Email address"
// @Success      200 {object} dto.ResendVerificationResponse
// @Failure      400 {object} handler.Response
// @Router       /auth/resend-verification [post]
func (c *Controller) ResendVerification(ginCtx *gin.Context, req *dto.ResendVerificationRequest) (*dto.ResendVerificationResponse, error) {
	return c.orchestrator.ResendVerification(ginCtx.Request.Context(), req, c.isDevMode())
}
