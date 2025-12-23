package controller

import (
	"github.com/dcao/conferencespace/internal/assignment"
	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/clients"
	assignmentController "github.com/dcao/conferencespace/internal/controller/assignment"
	"github.com/dcao/conferencespace/internal/controller/auth"
	coiController "github.com/dcao/conferencespace/internal/controller/coi"
	"github.com/dcao/conferencespace/internal/controller/conference"
	notificationController "github.com/dcao/conferencespace/internal/controller/notification"
	"github.com/dcao/conferencespace/internal/controller/reviewer"
	"github.com/dcao/conferencespace/internal/controller/submission"
	"github.com/dcao/conferencespace/internal/controller/user"
	"github.com/dcao/conferencespace/internal/orchestrator"
	coiService "github.com/dcao/conferencespace/internal/service/coi"
	notificationService "github.com/dcao/conferencespace/internal/service/notification"
	"github.com/dcao/conferencespace/internal/storage"
	fileStorage "github.com/dcao/conferencespace/internal/storage/file"
	"github.com/dcao/conferencespace/internal/websocket"
)

type Controller struct {
	Auth         *auth.Controller
	User         *user.Controller
	Conference   *conference.Controller
	Submission   *submission.Controller
	Reviewer     *reviewer.Controller
	Assignment   *assignmentController.Controller
	COI          *coiController.Controller
	Notification *notificationController.Controller
}

func NewController(orch *orchestrator.Orchestrator, store *storage.Storage, fileStore fileStorage.StorageInterface, clients *clients.Clients) *Controller {
	assignmentService := assignment.NewService(store, clients)

	// Create COI detector - include RelationshipDetector if Neo4j is available
	var coiDetector detectors.ConflictDetector
	if clients != nil && clients.Neo4j != nil {
		// Full detector with Neo4j graph-based COI detection
		coiDetector = detectors.NewCompositeDetector(
			detectors.NewSelfAuthorDetector(),
			detectors.NewDeclaredConflictsDetector(),
			detectors.NewRelationshipDetector(clients.Neo4j, detectors.DefaultCOIWindowYears),
		)
	} else {
		// Fallback: basic detectors without graph-based COI
		coiDetector = detectors.NewCompositeDetector(
			detectors.NewSelfAuthorDetector(),
			detectors.NewDeclaredConflictsDetector(),
		)
	}

	// Create COI service
	coiSvc := coiService.New(
		coiDetector,
		store.COI,
		store.Submission,
		store.Reviewer,
		store.User,
	)

	// Create notification service
	notifSvc := notificationService.New(store.Notification)

	return &Controller{
		Auth:         auth.New(orch),
		User:         user.New(store, assignmentService), // Pass assignment service for COI checks
		Conference:   conference.New(store, assignmentService), // Pass assignment service for auto-assign on status change
		Submission:   submission.NewWithNotifications(store, fileStore, clients.Gemini, notifSvc),
		Reviewer:     reviewer.NewWithNotifications(store, notifSvc),
		Assignment:   assignmentController.NewWithNotifications(store, assignmentService, notifSvc, coiSvc),
		COI:          coiController.New(coiSvc),
		Notification: notificationController.New(store),
	}
}

// NewControllerWithHub creates a new controller with WebSocket hub support
func NewControllerWithHub(orch *orchestrator.Orchestrator, store *storage.Storage, fileStore fileStorage.StorageInterface, clients *clients.Clients, hub *websocket.Hub) *Controller {
	assignmentService := assignment.NewService(store, clients)

	// Create COI detector - include RelationshipDetector if Neo4j is available
	var coiDetector detectors.ConflictDetector
	if clients != nil && clients.Neo4j != nil {
		// Full detector with Neo4j graph-based COI detection
		coiDetector = detectors.NewCompositeDetector(
			detectors.NewSelfAuthorDetector(),
			detectors.NewDeclaredConflictsDetector(),
			detectors.NewRelationshipDetector(clients.Neo4j, detectors.DefaultCOIWindowYears),
		)
	} else {
		// Fallback: basic detectors without graph-based COI
		coiDetector = detectors.NewCompositeDetector(
			detectors.NewSelfAuthorDetector(),
			detectors.NewDeclaredConflictsDetector(),
		)
	}

	// Create COI service
	coiSvc := coiService.New(
		coiDetector,
		store.COI,
		store.Submission,
		store.Reviewer,
		store.User,
	)

	// Create notification service with WebSocket support
	notifSvc := notificationService.NewWithWebSocket(store.Notification, hub)

	return &Controller{
		Auth:         auth.New(orch),
		User:         user.New(store, assignmentService),
		Conference:   conference.New(store, assignmentService),
		Submission:   submission.NewWithNotifications(store, fileStore, clients.Gemini, notifSvc),
		Reviewer:     reviewer.NewWithNotifications(store, notifSvc),
		Assignment:   assignmentController.NewWithNotifications(store, assignmentService, notifSvc, coiSvc),
		COI:          coiController.New(coiSvc),
		Notification: notificationController.New(store),
	}
}
