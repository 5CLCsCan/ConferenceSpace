package user

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/storage"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/dcao/conferencespace/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
)

type OrchestratorInterface interface {
	Register(ctx context.Context, req *dto.UserCreateRequest) (*dto.UserResponse, error)
	Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error)
}

type Orchestrator struct {
	userStorage userStorage.StorageInterface
	jwtSecret   string
	jwtExpiry   time.Duration
}

func New(store *storage.Storage, jwtSecret string, jwtExpiryHours int) *Orchestrator {
	return &Orchestrator{
		userStorage: store.User,
		jwtSecret:   jwtSecret,
		jwtExpiry:   time.Duration(jwtExpiryHours) * time.Hour,
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

	userResp, err := o.userStorage.Create(ctx, req.User, string(hashedPassword))
	if err != nil {
		if errors.Is(err, userStorage.ErrEmailAlreadyExists) {
			return nil, handler.NewErrorResponse(http.StatusConflict, "an account with this email already exists")
		}
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "unable to create account")
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
