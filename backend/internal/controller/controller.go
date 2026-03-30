package controller

import (
	"github.com/dcao/conferencespace/internal/assignment"
	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/clients"
	assignmentController "github.com/dcao/conferencespace/internal/controller/assignment"
	"github.com/dcao/conferencespace/internal/controller/auth"
	coiController "github.com/dcao/conferencespace/internal/controller/coi"
	"github.com/dcao/conferencespace/internal/controller/conference"
	discussionController "github.com/dcao/conferencespace/internal/controller/discussion"
	notificationController "github.com/dcao/conferencespace/internal/controller/notification"
	"github.com/dcao/conferencespace/internal/controller/reviewer"
	semanticscholarController "github.com/dcao/conferencespace/internal/controller/semantic_scholar"
	"github.com/dcao/conferencespace/internal/controller/submission"
	"github.com/dcao/conferencespace/internal/controller/user"
	"github.com/dcao/conferencespace/internal/orchestrator"
	coiService "github.com/dcao/conferencespace/internal/service/coi"
	discussionService "github.com/dcao/conferencespace/internal/service/discussion"
	notificationService "github.com/dcao/conferencespace/internal/service/notification"
	"github.com/dcao/conferencespace/internal/storage"
	fileStorage "github.com/dcao/conferencespace/internal/storage/file"
	"github.com/dcao/conferencespace/internal/websocket"
)

type Controller struct {
	Auth            *auth.Controller
	User            *user.Controller
	Conference      *conference.Controller
	Submission      *submission.Controller
	Reviewer        *reviewer.Controller
	Assignment      *assignmentController.Controller
	COI             *coiController.Controller
	Notification    *notificationController.Controller
	SemanticScholar *semanticscholarController.Controller
	Discussion      *discussionController.Controller
}

func NewController(orch *orchestrator.Orchestrator, store *storage.Storage, fileStore fileStorage.StorageInterface, clients *clients.Clients, serverEnv string) *Controller {
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

	// Create discussion service
	discSvc := discussionService.NewWithNotification(store.Discussion, notifSvc)

	// Create Semantic Scholar controller (only if client is available)
	var semanticScholarCtrl *semanticscholarController.Controller
	if clients != nil && clients.SemanticScholar != nil {
		semanticScholarCtrl = semanticscholarController.New(clients.SemanticScholar, store.Cache, store.Scholar)
	}

	return &Controller{
		Auth:            auth.New(orch, serverEnv),
		User:            user.New(store, assignmentService, semanticScholarCtrl), // Pass assignment service for COI checks
		Conference:      conference.NewWithNotifications(store, assignmentService, notifSvc), // Pass assignment service for auto-assign on status change
		Submission:      submission.NewWithNotifications(store, fileStore, getAIServiceClient(clients), coiSvc, notifSvc),
		Reviewer:        reviewer.NewWithNotifications(store, coiSvc, notifSvc),
		Assignment:      assignmentController.NewWithNotifications(store, fileStore, clients.AIService, assignmentService, notifSvc, coiSvc),
		COI:             coiController.New(coiSvc, store.ConferenceUserRole),
		Notification:    notificationController.New(store),
		SemanticScholar: semanticScholarCtrl,
		Discussion:      discussionController.New(discSvc, "./uploads/discussions"),
	}
}

// NewControllerWithHub creates a new controller with WebSocket hub support
func NewControllerWithHub(orch *orchestrator.Orchestrator, store *storage.Storage, fileStore fileStorage.StorageInterface, clients *clients.Clients, hub *websocket.Hub, serverEnv string) *Controller {
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

	// Create discussion service with notification support
	discSvc := discussionService.NewWithNotification(store.Discussion, notifSvc)

	// Create Semantic Scholar controller (only if client is available)
	var semanticScholarCtrl *semanticscholarController.Controller
	if clients != nil && clients.SemanticScholar != nil {
		semanticScholarCtrl = semanticscholarController.New(clients.SemanticScholar, store.Cache, store.Scholar)
	}

	return &Controller{
		Auth:            auth.New(orch, serverEnv),
		User:            user.New(store, assignmentService, semanticScholarCtrl),
		Conference:      conference.NewWithNotifications(store, assignmentService, notifSvc),
		Submission:      submission.NewWithNotifications(store, fileStore, getAIServiceClient(clients), coiSvc, notifSvc),
		Reviewer:        reviewer.NewWithNotifications(store, coiSvc, notifSvc),
		Assignment:      assignmentController.NewWithNotifications(store, fileStore, clients.AIService, assignmentService, notifSvc, coiSvc),
		COI:             coiController.New(coiSvc, store.ConferenceUserRole),
		Notification:    notificationController.New(store),
		SemanticScholar: semanticScholarCtrl,
		Discussion:      discussionController.New(discSvc, "./uploads/discussions"),
	}
}

func getAIServiceClient(clients *clients.Clients) submission.GatingClient {
	if clients == nil {
		return nil
	}
	return clients.AIService
}
