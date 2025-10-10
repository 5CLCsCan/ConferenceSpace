package user

import (
	"context"
	"fmt"
	"time"

	"github.com/dcao/conferencespace/internal/dto/user"
	"github.com/dcao/conferencespace/internal/storage"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
	"github.com/dcao/conferencespace/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
)

type OrchestratorInterface interface {
	Register(ctx context.Context, req *user.CreateRequest) (*user.Response, error)
	Login(ctx context.Context, req *user.LoginRequest) (*user.LoginResponse, error)
}

type Orchestrator struct {
	storage   userStorage.StorageInterface
	jwtSecret string
	jwtExpiry time.Duration
}

func New(store *storage.Storage, jwtSecret string, jwtExpiryHours int) *Orchestrator {
	return &Orchestrator{
		storage:   store.User,
		jwtSecret: jwtSecret,
		jwtExpiry: time.Duration(jwtExpiryHours) * time.Hour,
	}
}

func (o *Orchestrator) Register(ctx context.Context, req *user.CreateRequest) (*user.Response, error) {
	if req.User == nil {
		return nil, fmt.Errorf("user data is required")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	return o.storage.Create(ctx, req.User, string(hashedPassword))
}

func (o *Orchestrator) Login(ctx context.Context, req *user.LoginRequest) (*user.LoginResponse, error) {
	userResp, hashedPassword, err := o.storage.GetByEmailWithPassword(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password))
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	token, err := jwt.GenerateToken(userResp.ID, userResp.Email, o.jwtSecret, o.jwtExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &user.LoginResponse{
		Token: token,
		User:  userResp,
	}, nil
}
