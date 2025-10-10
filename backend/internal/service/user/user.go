package user

import (
	"context"
	"fmt"
	"time"

	"github.com/dcao/conferencespace/internal/dto/user"
	userEntity "github.com/dcao/conferencespace/internal/entity/user"
	"github.com/dcao/conferencespace/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
)

// StorageInterface defines the interface for user storage
type StorageInterface interface {
	Create(ctx context.Context, email, firstName, lastName, hashedPassword string, domain []string) (*userEntity.User, error)
	GetByID(ctx context.Context, id int64) (*userEntity.User, error)
	GetByEmail(ctx context.Context, email string) (*userEntity.User, error)
	List(ctx context.Context) ([]*userEntity.User, error)
	Update(ctx context.Context, id int64, email, firstName, lastName *string, domain []string) (*userEntity.User, error)
	Delete(ctx context.Context, id int64) error
}

// Service handles business logic for users
type Service struct {
	storage   StorageInterface
	jwtSecret string
	jwtExpiry time.Duration
}

// New creates a new user service
func New(storage StorageInterface, jwtSecret string, jwtExpiryHours int) *Service {
	return &Service{
		storage:   storage,
		jwtSecret: jwtSecret,
		jwtExpiry: time.Duration(jwtExpiryHours) * time.Hour,
	}
}

// Register creates a new user (sign up)
func (s *Service) Register(ctx context.Context, req *user.CreateRequest) (*user.Response, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	entity, err := s.storage.Create(ctx, req.Email, req.FirstName, req.LastName, string(hashedPassword), req.Domain)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return entityToDTO(entity), nil
}

// Login authenticates a user and returns a JWT token
func (s *Service) Login(ctx context.Context, req *user.LoginRequest) (*user.LoginResponse, error) {
	// Get user by email
	entity, err := s.storage.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(entity.HashedPassword), []byte(req.Password))
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Generate JWT token
	token, err := jwt.GenerateToken(entity.UserID, entity.Email, s.jwtSecret, s.jwtExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &user.LoginResponse{
		Token: token,
		User:  entityToDTO(entity),
	}, nil
}

// GetByID retrieves a user by ID
func (s *Service) GetByID(ctx context.Context, id int64) (*user.Response, error) {
	entity, err := s.storage.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return entityToDTO(entity), nil
}

// List retrieves all users
func (s *Service) List(ctx context.Context) ([]*user.Response, error) {
	entities, err := s.storage.List(ctx)
	if err != nil {
		return nil, err
	}

	responses := make([]*user.Response, len(entities))
	for i, entity := range entities {
		responses[i] = entityToDTO(entity)
	}
	return responses, nil
}

// Update updates a user
func (s *Service) Update(ctx context.Context, id int64, req *user.UpdateRequest) (*user.Response, error) {
	entity, err := s.storage.Update(ctx, id, req.Email, req.FirstName, req.LastName, req.Domain)
	if err != nil {
		return nil, err
	}
	return entityToDTO(entity), nil
}

// Delete deletes a user
func (s *Service) Delete(ctx context.Context, id int64) error {
	return s.storage.Delete(ctx, id)
}

// entityToDTO converts an entity to a DTO response
func entityToDTO(entity *userEntity.User) *user.Response {
	domain := []string(entity.Domain)
	if domain == nil {
		domain = []string{}
	}

	return &user.Response{
		UserID:    entity.UserID,
		Email:     entity.Email,
		FirstName: entity.FirstName,
		LastName:  entity.LastName,
		Domain:    domain,
		CreatedAt: entity.CreatedAt,
		UpdatedAt: entity.UpdatedAt,
	}
}
