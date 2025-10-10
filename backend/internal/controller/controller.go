package controller

import (
	"github.com/dcao/conferencespace/internal/controller/auth"
	"github.com/dcao/conferencespace/internal/controller/user"
	userService "github.com/dcao/conferencespace/internal/service/user"
)

// Controller holds all controller dependencies
type Controller struct {
	Auth *auth.Controller
	User *user.Controller
	// Add more controllers here as needed
}

// NewController creates a new controller instance with all dependencies
func NewController(userSvc *userService.Service) *Controller {
	return &Controller{
		Auth: auth.New(userSvc),
		User: user.New(userSvc),
	}
}
