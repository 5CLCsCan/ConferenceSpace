package controller

import (
	"github.com/dcao/conferencespace/internal/controller/auth"
	"github.com/dcao/conferencespace/internal/controller/conference"
	"github.com/dcao/conferencespace/internal/controller/user"
	"github.com/dcao/conferencespace/internal/orchestrator"
	"github.com/dcao/conferencespace/internal/storage"
)

type Controller struct {
	Auth       *auth.Controller
	User       *user.Controller
	Conference *conference.Controller
}

func NewController(orch *orchestrator.Orchestrator, store *storage.Storage) *Controller {
	return &Controller{
		Auth:       auth.New(orch),
		User:       user.New(store),
		Conference: conference.New(store),
	}
}
