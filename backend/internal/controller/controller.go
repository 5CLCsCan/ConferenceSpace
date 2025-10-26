package controller

import (
	"github.com/dcao/conferencespace/internal/controller/auth"
	"github.com/dcao/conferencespace/internal/controller/conference"
	"github.com/dcao/conferencespace/internal/controller/reviewer"
	"github.com/dcao/conferencespace/internal/controller/submission"
	"github.com/dcao/conferencespace/internal/controller/user"
	"github.com/dcao/conferencespace/internal/orchestrator"
	"github.com/dcao/conferencespace/internal/storage"
	fileStorage "github.com/dcao/conferencespace/internal/storage/file"
)

type Controller struct {
	Auth       *auth.Controller
	User       *user.Controller
	Conference *conference.Controller
	Submission *submission.Controller
	Reviewer   *reviewer.Controller
}

func NewController(orch *orchestrator.Orchestrator, store *storage.Storage, fileStore fileStorage.StorageInterface) *Controller {
	return &Controller{
		Auth:       auth.New(orch),
		User:       user.New(store),
		Conference: conference.New(store),
		Submission: submission.New(store, fileStore),
		Reviewer:   reviewer.New(store),
	}
}
