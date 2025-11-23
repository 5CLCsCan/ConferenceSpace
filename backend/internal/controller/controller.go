package controller

import (
	"github.com/dcao/conferencespace/internal/assignment"
	"github.com/dcao/conferencespace/internal/clients"
	assignmentController "github.com/dcao/conferencespace/internal/controller/assignment"
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
	Assignment *assignmentController.Controller
}

func NewController(orch *orchestrator.Orchestrator, store *storage.Storage, fileStore fileStorage.StorageInterface, clients *clients.Clients) *Controller {
	assignmentService := assignment.NewService(store, clients)

	return &Controller{
		Auth:       auth.New(orch),
		User:       user.New(store, assignmentService), // Pass assignment service for COI checks
		Conference: conference.New(store, assignmentService), // Pass assignment service for auto-assign on status change
		Submission: submission.New(store, fileStore, clients.Gemini),
		Reviewer:   reviewer.New(store),
		Assignment: assignmentController.New(store, assignmentService),
	}
}
