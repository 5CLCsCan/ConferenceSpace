package service

import (
	"github.com/dcao/conferencespace/internal/service/conference"
	storageConference "github.com/dcao/conferencespace/internal/storage/conference"
)

// Service holds all service dependencies
type Service struct {
	Conference *conference.Conference
	// Add more services here as needed
}

// NewService creates a new service instance with all dependencies
func NewService(conferenceStorage *storageConference.Conference) *Service {
	return &Service{
		Conference: conference.New(conferenceStorage),
	}
}
