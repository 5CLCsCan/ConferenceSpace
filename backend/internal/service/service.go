package service

import (
	"github.com/dcao/conferencespace/internal/service/user"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
)

// Service holds all service dependencies
type Service struct {
	User *user.Service
	// Add more services here as needed
}

// NewService creates a new service instance with all dependencies
func NewService(userStore *userStorage.Storage, jwtSecret string, jwtExpiryHours int) *Service {
	return &Service{
		User: user.New(userStore, jwtSecret, jwtExpiryHours),
	}
}
