package service

import (
	"github.com/dcao/conferencespace/internal/service/user"
	"github.com/dcao/conferencespace/internal/storage"
)

type Service struct {
	User *user.Service
}

func NewService(store *storage.Storage, jwtSecret string, jwtExpiryHours int) *Service {
	return &Service{
		User: user.New(store, jwtSecret, jwtExpiryHours),
	}
}
