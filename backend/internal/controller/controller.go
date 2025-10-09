package controller

import (
	"github.com/dcao/conferencespace/internal/controller/conference"
	serviceConference "github.com/dcao/conferencespace/internal/service/conference"
)

// Controller holds all controller dependencies
type Controller struct {
	Conference *conference.Conference
	// Add more controllers here as needed
}

// NewController creates a new controller instance with all dependencies
func NewController(conferenceService *serviceConference.Conference) *Controller {
	return &Controller{
		Conference: conference.New(conferenceService),
	}
}
