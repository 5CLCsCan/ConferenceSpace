package auth

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
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// TestController handles test authentication endpoints
type TestController struct {
	userStorage userStorage.StorageInterface
	jwtSecret   string
	jwtExpiry   time.Duration
	serverEnv   string
}

// NewTestController creates a new test auth controller
func NewTestController(store *storage.Storage, jwtSecret string, jwtExpiry time.Duration, serverEnv string) *TestController {
	return &TestController{
		userStorage: store.User,
		jwtSecret:   jwtSecret,
		jwtExpiry:   jwtExpiry,
		serverEnv:   serverEnv,
	}
}

// TestLoginRequest represents the request for test login
type TestLoginRequest struct {
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// TestLogin creates a test user if needed and returns a JWT token
// This endpoint should only be available in development/test environments
func (c *TestController) TestLogin(ginCtx *gin.Context, req *TestLoginRequest) (*dto.LoginResponse, error) {
	// Safety check: only allow in development environment
	if c.serverEnv != "" && c.serverEnv != "development" && c.serverEnv != "test" {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "test login only available in development")
	}

	ctx := ginCtx.Request.Context()

	// Set defaults if not provided
	email := req.Email
	if email == "" {
		email = "test.profile@example.com"
	}
	firstName := req.FirstName
	if firstName == "" {
		firstName = "Test"
	}
	lastName := req.LastName
	if lastName == "" {
		lastName = "User"
	}

	// Try to get existing user
	userResp, _, err := c.userStorage.GetByEmailWithPassword(ctx, email)

	// If user doesn't exist, create it
	if err != nil {
		userResp, err = c.createTestUser(ctx, email, firstName, lastName)
		if err != nil {
			return nil, fmt.Errorf("failed to create test user: %w", err)
		}
	}

	// Generate JWT token
	token, err := jwt.GenerateToken(userResp.ID, userResp.Email, c.jwtSecret, c.jwtExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &dto.LoginResponse{
		Token: token,
		User:  userResp,
	}, nil
}

func (c *TestController) createTestUser(ctx context.Context, email, firstName, lastName string) (*dto.UserResponse, error) {
	// Use a default password for test users
	testPassword := "testpassword123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(testPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &dto.User{
		Email:     email,
		FirstName: firstName,
		LastName:  lastName,
		Domain:    []string{"Computer Science"},
	}

	return c.userStorage.Create(ctx, user, string(hashedPassword))
}
