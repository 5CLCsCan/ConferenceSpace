package user

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/dcao/conferencespace/internal/clients/brevo"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/dcao/conferencespace/internal/storage"
	authTokenStorage "github.com/dcao/conferencespace/internal/storage/auth_token"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/dcao/conferencespace/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
)

type OrchestratorInterface interface {
	Register(ctx context.Context, req *dto.UserCreateRequest) (*dto.UserResponse, error)
	Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error)
	ForgotPassword(ctx context.Context, req *dto.ForgotPasswordRequest, devMode bool) (*dto.ForgotPasswordResponse, error)
	ResetPassword(ctx context.Context, req *dto.ResetPasswordRequest) (*dto.MessageResponse, error)
	ChangePassword(ctx context.Context, email string, req *dto.ChangePasswordRequest) (*dto.MessageResponse, error)
	VerifyEmail(ctx context.Context, token string) (*dto.MessageResponse, error)
	ResendVerification(ctx context.Context, req *dto.ResendVerificationRequest, devMode bool) (*dto.ResendVerificationResponse, error)
}

type Orchestrator struct {
	userStorage         userStorage.StorageInterface
	authTokenStorage    authTokenStorage.StorageInterface
	brevo               *brevo.Client
	jwtSecret           string
	jwtExpiry           time.Duration
	requireVerification bool
	appBaseURL          string
}

func New(store *storage.Storage, jwtSecret string, jwtExpiryHours int, brevoClient *brevo.Client, requireVerification bool, appBaseURL string) *Orchestrator {
	return &Orchestrator{
		userStorage:         store.User,
		authTokenStorage:    store.AuthToken,
		brevo:               brevoClient,
		jwtSecret:           jwtSecret,
		jwtExpiry:           time.Duration(jwtExpiryHours) * time.Hour,
		requireVerification: requireVerification,
		appBaseURL:          appBaseURL,
	}
}

func (o *Orchestrator) Register(ctx context.Context, req *dto.UserCreateRequest) (*dto.UserResponse, error) {
	if req.User == nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "user data is required")
	}

	existingUser, err := o.userStorage.GetByEmail(ctx, req.User.Email)
	if err == nil && existingUser != nil {
		return nil, handler.NewErrorResponse(http.StatusConflict, "an account with this email already exists")
	}
	if err != nil && !errors.Is(err, userStorage.ErrUserNotFound) {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "unable to create account")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "unable to create account")
	}

	emailVerified := !o.requireVerification
	userResp, err := o.userStorage.Create(ctx, req.User, string(hashedPassword), emailVerified)
	if err != nil {
		if errors.Is(err, userStorage.ErrEmailAlreadyExists) {
			return nil, handler.NewErrorResponse(http.StatusConflict, "an account with this email already exists")
		}
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "unable to create account")
	}

	if o.requireVerification {
		token, err := o.authTokenStorage.Create(ctx, req.User.Email, model.AuthTokenTypeEmailVerification, model.EmailVerificationTokenExpiry)
		if err != nil {
			return nil, fmt.Errorf("failed to create verification token: %w", err)
		}
		link := fmt.Sprintf("%s/verify-email?token=%s", o.appBaseURL, token)
		html := fmt.Sprintf(`<p>Please verify your email by clicking <a href="%s">here</a>.</p>`, link)
		_ = o.brevo.SendEmail(ctx, req.User.Email, "Verify your ConferenceSpace email", html)
	}

	return userResp, nil
}

func (o *Orchestrator) Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error) {
	userResp, hashedPassword, err := o.userStorage.GetByEmailWithPassword(ctx, req.Email)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password))
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "invalid credentials")
	}

	token, err := jwt.GenerateToken(userResp.ID, userResp.Email, o.jwtSecret, o.jwtExpiry)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "unable to complete login")
	}

	return &dto.LoginResponse{
		Token: token,
		User:  userResp,
	}, nil
}

func (o *Orchestrator) ForgotPassword(ctx context.Context, req *dto.ForgotPasswordRequest, devMode bool) (*dto.ForgotPasswordResponse, error) {
	const genericMsg = "If that email address is registered, you will receive a password reset link shortly."

	_, err := o.userStorage.GetByEmail(ctx, req.Email)
	if err != nil {
		return &dto.ForgotPasswordResponse{Message: genericMsg}, nil
	}

	token, err := o.authTokenStorage.Create(ctx, req.Email, model.AuthTokenTypePasswordReset, model.PasswordResetTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to create reset token: %w", err)
	}

	link := fmt.Sprintf("%s/reset-password?token=%s", o.appBaseURL, token)
	html := fmt.Sprintf(`<p>Click <a href="%s">here</a> to reset your password. This link expires in 1 hour.</p>`, link)
	_ = o.brevo.SendEmail(ctx, req.Email, "Reset your ConferenceSpace password", html)

	resp := &dto.ForgotPasswordResponse{Message: genericMsg}
	if devMode {
		resp.Token = &token
	}
	return resp, nil
}

func (o *Orchestrator) ResetPassword(ctx context.Context, req *dto.ResetPasswordRequest) (*dto.MessageResponse, error) {
	authToken, err := o.authTokenStorage.GetByToken(ctx, req.Token)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid or expired token")
	}

	if authToken.TokenType != model.AuthTokenTypePasswordReset {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid token type")
	}
	if time.Now().After(authToken.ExpiresAt) {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "token has expired")
	}
	if authToken.UsedAt != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "token has already been used")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	if err := o.userStorage.UpdatePassword(ctx, authToken.UserEmail, string(hashedPassword)); err != nil {
		return nil, fmt.Errorf("failed to update password: %w", err)
	}

	if err := o.authTokenStorage.MarkUsed(ctx, req.Token); err != nil {
		return nil, fmt.Errorf("failed to mark token as used: %w", err)
	}

	return &dto.MessageResponse{Message: "Password reset successfully."}, nil
}

func (o *Orchestrator) ChangePassword(ctx context.Context, email string, req *dto.ChangePasswordRequest) (*dto.MessageResponse, error) {
	_, hashedPassword, err := o.userStorage.GetByEmailWithPassword(ctx, email)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.CurrentPassword)); err != nil {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "current password is incorrect")
	}

	newHashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	if err := o.userStorage.UpdatePassword(ctx, email, string(newHashed)); err != nil {
		return nil, fmt.Errorf("failed to update password: %w", err)
	}

	return &dto.MessageResponse{Message: "Password changed successfully."}, nil
}

func (o *Orchestrator) VerifyEmail(ctx context.Context, token string) (*dto.MessageResponse, error) {
	authToken, err := o.authTokenStorage.GetByToken(ctx, token)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid or expired token")
	}

	if authToken.TokenType != model.AuthTokenTypeEmailVerification {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid token type")
	}
	if time.Now().After(authToken.ExpiresAt) {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "token has expired")
	}
	if authToken.UsedAt != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "email already verified")
	}

	if err := o.userStorage.SetEmailVerified(ctx, authToken.UserEmail, true); err != nil {
		return nil, fmt.Errorf("failed to set email verified: %w", err)
	}

	if err := o.authTokenStorage.MarkUsed(ctx, token); err != nil {
		return nil, fmt.Errorf("failed to mark token as used: %w", err)
	}

	return &dto.MessageResponse{Message: "Email verified successfully."}, nil
}

func (o *Orchestrator) ResendVerification(ctx context.Context, req *dto.ResendVerificationRequest, devMode bool) (*dto.ResendVerificationResponse, error) {
	const genericMsg = "If that email address is registered and unverified, you will receive a new verification email shortly."

	_, err := o.userStorage.GetByEmail(ctx, req.Email)
	if err != nil {
		return &dto.ResendVerificationResponse{Message: genericMsg}, nil
	}

	token, err := o.authTokenStorage.Create(ctx, req.Email, model.AuthTokenTypeEmailVerification, model.EmailVerificationTokenExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to create verification token: %w", err)
	}

	link := fmt.Sprintf("%s/verify-email?token=%s", o.appBaseURL, token)
	html := fmt.Sprintf(`<p>Click <a href="%s">here</a> to verify your email. This link expires in 24 hours.</p>`, link)
	_ = o.brevo.SendEmail(ctx, req.Email, "Verify your ConferenceSpace email", html)

	resp := &dto.ResendVerificationResponse{Message: genericMsg}
	if devMode {
		resp.Token = &token
	}
	return resp, nil
}
