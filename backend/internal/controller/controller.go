package controller

import (
	"github.com/dcao/conferencespace/internal/assignment"
	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/clients"
	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	assignmentController "github.com/dcao/conferencespace/internal/controller/assignment"
	"github.com/dcao/conferencespace/internal/controller/auth"
	coiController "github.com/dcao/conferencespace/internal/controller/coi"
	"github.com/dcao/conferencespace/internal/controller/conference"
	discussionController "github.com/dcao/conferencespace/internal/controller/discussion"
	externalInvitationController "github.com/dcao/conferencespace/internal/controller/external_invitation"
	notificationController "github.com/dcao/conferencespace/internal/controller/notification"
	"github.com/dcao/conferencespace/internal/controller/reviewer"
	reviewerSuggestionController "github.com/dcao/conferencespace/internal/controller/reviewer_suggestion"
	semanticscholarController "github.com/dcao/conferencespace/internal/controller/semantic_scholar"
	"github.com/dcao/conferencespace/internal/controller/submission"
	"github.com/dcao/conferencespace/internal/controller/user"
	"github.com/dcao/conferencespace/internal/orchestrator"
	coiService "github.com/dcao/conferencespace/internal/service/coi"
	discussionService "github.com/dcao/conferencespace/internal/service/discussion"
	notificationService "github.com/dcao/conferencespace/internal/service/notification"
	reviewerSuggestionService "github.com/dcao/conferencespace/internal/service/reviewer_suggestion"
	"github.com/dcao/conferencespace/internal/storage"
	fileStorage "github.com/dcao/conferencespace/internal/storage/file"
	"github.com/dcao/conferencespace/internal/websocket"
)

type Controller struct {
	Auth               *auth.Controller
	User               *user.Controller
	Conference         *conference.Controller
	Submission         *submission.Controller
	Reviewer           *reviewer.Controller
	Assignment         *assignmentController.Controller
	COI                *coiController.Controller
	Notification       *notificationController.Controller
	SemanticScholar    *semanticscholarController.Controller
	Discussion         *discussionController.Controller
	ReviewerSuggestion *reviewerSuggestionController.Controller
	ExternalInvitation *externalInvitationController.Controller
}

// buildReviewerSuggestionService wires the reviewer suggestion service.
// When the Semantic Scholar client is unavailable, only the internal-suggestion algorithm runs.
// We pass a literal nil into the service constructor (rather than a nil-typed pointer) to keep
// the interface comparison `s.s2Client == nil` true.
//
// The returned service is reused by both the reviewer-suggestion controller AND the user
// controller (for /users/search?conference_id= match annotation).
func buildReviewerSuggestionService(store *storage.Storage, clients *clients.Clients) *reviewerSuggestionService.Service {
	if clients != nil && clients.SemanticScholar != nil {
		return reviewerSuggestionService.New(
			store.Conference,
			store.Submission,
			store.User,
			store.Reviewer,
			store.Scholar,
			clients.SemanticScholar,
		)
	}
	return reviewerSuggestionService.New(
		store.Conference,
		store.Submission,
		store.User,
		store.Reviewer,
		store.Scholar,
		nil,
	)
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
		semanticScholarCtrl = semanticscholarController.New(clients.SemanticScholar, store.Cache, store.Scholar, store.User, clients.AIService)
	}

	reviewerSuggestionSvc := buildReviewerSuggestionService(store, clients)

	// Wire the S2 controller into the external invitation orchestrator so
	// AcceptInvitation can auto-link Semantic Scholar profiles.
	if semanticScholarCtrl != nil {
		orch.ExternalInvitation.SetSemanticScholarCtrl(semanticScholarCtrl)
	}
	orch.ExternalInvitation.SetNotificationService(notifSvc)

	return &Controller{
		Auth:               auth.New(orch, serverEnv),
		User:               user.New(store, assignmentService, semanticScholarCtrl, reviewerSuggestionSvc), // Pass assignment service for COI checks; suggestion service for /users/search?conference_id= annotation
		Conference:         conference.NewWithNotifications(store, assignmentService, notifSvc),            // Pass assignment service for auto-assign on status change
		Submission:         submission.NewWithNotifications(store, fileStore, getAIServiceClient(clients), coiSvc, notifSvc),
		Reviewer:           reviewer.NewWithNotifications(store, coiSvc, notifSvc),
		Assignment:         assignmentController.NewWithNotifications(store, fileStore, getReviewerWorkflowClient(clients), assignmentService, notifSvc, coiSvc),
		COI:                coiController.New(coiSvc, store.ConferenceUserRole),
		Notification:       notificationController.New(store),
		SemanticScholar:    semanticScholarCtrl,
		Discussion:         discussionController.New(discSvc, "./uploads/discussions"),
		ReviewerSuggestion: reviewerSuggestionController.New(reviewerSuggestionSvc),
		ExternalInvitation: externalInvitationController.New(store.ExternalInvitation, orch.ExternalInvitation),
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
		semanticScholarCtrl = semanticscholarController.New(clients.SemanticScholar, store.Cache, store.Scholar, store.User, clients.AIService)
	}

	reviewerSuggestionSvc := buildReviewerSuggestionService(store, clients)

	// Wire the S2 controller into the external invitation orchestrator so
	// AcceptInvitation can auto-link Semantic Scholar profiles.
	if semanticScholarCtrl != nil {
		orch.ExternalInvitation.SetSemanticScholarCtrl(semanticScholarCtrl)
	}
	orch.ExternalInvitation.SetNotificationService(notifSvc)

	return &Controller{
		Auth:               auth.New(orch, serverEnv),
		User:               user.New(store, assignmentService, semanticScholarCtrl, reviewerSuggestionSvc),
		Conference:         conference.NewWithNotifications(store, assignmentService, notifSvc),
		Submission:         submission.NewWithNotifications(store, fileStore, getAIServiceClient(clients), coiSvc, notifSvc),
		Reviewer:           reviewer.NewWithNotifications(store, coiSvc, notifSvc),
		Assignment:         assignmentController.NewWithNotifications(store, fileStore, getReviewerWorkflowClient(clients), assignmentService, notifSvc, coiSvc),
		COI:                coiController.New(coiSvc, store.ConferenceUserRole),
		Notification:       notificationController.New(store),
		SemanticScholar:    semanticScholarCtrl,
		Discussion:         discussionController.New(discSvc, "./uploads/discussions"),
		ReviewerSuggestion: reviewerSuggestionController.New(reviewerSuggestionSvc),
		ExternalInvitation: externalInvitationController.New(store.ExternalInvitation, orch.ExternalInvitation),
	}
}

func getAIServiceClient(clients *clients.Clients) submission.AIWorkflowClient {
	if clients == nil {
		return nil
	}
	return clients.AIService
}

func getReviewerWorkflowClient(clients *clients.Clients) *aiServiceClient.Client {
	if clients == nil {
		return nil
	}
	return clients.AIService
}
