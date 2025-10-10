package controller

import (
	"github.com/dcao/conferencespace/internal/controller/auth"
	"github.com/dcao/conferencespace/internal/controller/user"
	"github.com/dcao/conferencespace/internal/service"
	"github.com/dcao/conferencespace/internal/storage"
)

type Controller struct {
	Auth *auth.Controller
	User *user.Controller
}

func NewController(svc *service.Service, store *storage.Storage) *Controller {
	return &Controller{
		Auth: auth.New(svc),
		User: user.New(store),
	}
}
