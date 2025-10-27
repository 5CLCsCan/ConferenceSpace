package user

import (
	"context"
	"fmt"
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
		return nil, fmt.Errorf("user data is required")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	return o.userStorage.Create(ctx, req.User, string(hashedPassword))
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
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &dto.LoginResponse{
		Token: token,
		User:  userResp,
	}, nil
}
