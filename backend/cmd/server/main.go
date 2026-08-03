package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/dcao/conferencespace/internal/agentquery"
	"github.com/dcao/conferencespace/internal/clients"
	"github.com/dcao/conferencespace/internal/config"
	"github.com/dcao/conferencespace/internal/controller"
	"github.com/dcao/conferencespace/internal/controller/auth"
	"github.com/dcao/conferencespace/internal/cron"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/middleware"
	"github.com/dcao/conferencespace/internal/orchestrator"
	"github.com/dcao/conferencespace/internal/storage"
	fileStorage "github.com/dcao/conferencespace/internal/storage/file"
	"github.com/dcao/conferencespace/internal/websocket"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"

	_ "github.com/dcao/conferencespace/docs"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title           ConferenceSpace API
// @version         1.0
// @description     API for managing conference submissions and reviews
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize dependencies using dependency injection
	appCtx, cleanup, err := initializeApp(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize application: %v", err)
	}
	defer cleanup()

	// Setup Gin router
	router := setupRouter(appCtx, cfg)

	// Create HTTP server
	writeTimeout := 15 * time.Second
	if cfg.AIService.TimeoutSeconds > 15 {
		writeTimeout = time.Duration(cfg.AIService.TimeoutSeconds) * time.Second
	}
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: writeTimeout,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

// AppContext holds application-level dependencies
type AppContext struct {
	Controller       *controller.Controller
	AgentQueryEngine *agentquery.Engine
	Hub              *websocket.Hub
	Store            *storage.Storage
}

// initializeApp sets up all dependencies using dependency injection pattern
func initializeApp(cfg *config.Config) (*AppContext, func(), error) {
	// Initialize database connection
	db, err := storage.NewDB(cfg.Database)
	if err != nil {
		return nil, nil, err
	}

	store := storage.NewStorage(db)

	// Initialize external service clients (Neo4j, etc.)
	clients, err := clients.NewClients(cfg)
	if err != nil {
		log.Printf("Warning: Failed to initialize clients: %v", err)
	}

	// Initialize file storage service
	fileStore, err := initializeFileStorage(cfg)
	if err != nil {
		return nil, nil, err
	}

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Start rebuttal auto-finalize cron (checks every hour for overdue deadlines)
	cron.StartRebuttalAutoFinalize(store.Conference)

	orch := orchestrator.NewOrchestrator(store, cfg)
	ctrl := controller.NewControllerWithHub(orch, store, fileStore, clients, hub, cfg.Server.Env)

	cleanup := func() {
		if err := db.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}

		if clients != nil {
			if err := clients.Close(context.Background()); err != nil {
				log.Printf("Error closing clients: %v", err)
			}
		}
	}

	appCtx := &AppContext{
		Controller:       ctrl,
		AgentQueryEngine: agentquery.NewEngine(db),
		Hub:              hub,
		Store:            store,
	}

	return appCtx, cleanup, nil
}

func initializeFileStorage(cfg *config.Config) (fileStorage.StorageInterface, error) {
	switch strings.ToLower(strings.TrimSpace(cfg.FileStorage.Provider)) {
	case "", "local":
		basePath := cfg.FileStorage.LocalBasePath
		if strings.TrimSpace(basePath) == "" {
			basePath = "./uploads/submissions"
		}
		log.Printf("Using local file storage at %s", basePath)
		return fileStorage.NewLocalFileStorage(basePath), nil
	case "supabase":
		storage, err := fileStorage.NewSupabaseFileStorage(fileStorage.SupabaseFileStorageConfig{
			URL:            cfg.FileStorage.SupabaseURL,
			ServiceRoleKey: cfg.FileStorage.SupabaseServiceRoleKey,
			Bucket:         cfg.FileStorage.SupabaseBucket,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to initialize supabase file storage: %w", err)
		}
		log.Printf("Using supabase file storage bucket %s", cfg.FileStorage.SupabaseBucket)
		return storage, nil
	default:
		return nil, fmt.Errorf("unsupported file storage provider: %s", cfg.FileStorage.Provider)
	}
}

// setupRouter configures all routes
func setupRouter(appCtx *AppContext, cfg *config.Config) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.Server.CORSAllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Authorization", "Content-Type", "Upgrade", "Connection"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	ctrl := appCtx.Controller
	hub := appCtx.Hub
	store := appCtx.Store

	// Authorization middleware instances
	requireChair := middleware.RequireChairOrCoChair(store.ConferenceUserRole)
	requireChairOrPC := middleware.RequireChairCoChairOrPC(store.ConferenceUserRole)
	requireSubmissionAccess := middleware.RequireSubmissionAccess(store.Submission, store.Assignment, store.ConferenceUserRole, store.Reviewer)
	requireThreadParticipant := middleware.RequireThreadParticipant(store.Discussion, store.ConferenceUserRole)
	requireSelfReviewer := middleware.RequireSelfReviewerEmail()
	requireAssignmentOwner := middleware.RequireAssignmentOwner(store.Assignment, store.Reviewer)
	requireCOICheck := middleware.RequireCOICheckAuthorization(store.ConferenceUserRole)

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"time":   time.Now().Unix(),
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public auth routes (no authentication required)
		authRoutes := v1.Group("/auth")
		{
			authRoutes.POST("/register", handler.HandleRequestWithStatus(http.StatusCreated, ctrl.Auth.Register))
			authRoutes.POST("/login", handler.HandleRequest(ctrl.Auth.Login))
			authRoutes.POST("/forgot-password", handler.HandleRequest(ctrl.Auth.ForgotPassword))
			authRoutes.POST("/reset-password", handler.HandleRequest(ctrl.Auth.ResetPassword))
			authRoutes.POST("/resend-verification", handler.HandleRequest(ctrl.Auth.ResendVerification))
			authRoutes.GET("/verify-email", handler.HandleRequestWithQuery(ctrl.Auth.VerifyEmail))

			// Test endpoint for development - creates test user and returns token
			if cfg.Server.Env == "" || cfg.Server.Env == "development" || cfg.Server.Env == "test" {
				testCtrl := auth.NewTestController(
					appCtx.Store,
					cfg.JWT.Secret,
					time.Duration(cfg.JWT.Expiry)*time.Hour,
					cfg.Server.Env,
				)
				authRoutes.POST("/test-login", handler.HandleRequest(testCtrl.TestLogin))
			}
		}

		// Protected auth routes
		authProtected := v1.Group("/auth")
		authProtected.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			authProtected.POST("/change-password", handler.HandleRequest(ctrl.Auth.ChangePassword))
		}

		// Public external invitation accept flow (no auth required)
		extInvPublic := v1.Group("/external-invitations")
		{
			extInvPublic.GET("/accept", handler.HandleRequestWithQuery(ctrl.ExternalInvitation.ValidateToken))
			extInvPublic.POST("/accept", handler.HandleRequestWithStatus(http.StatusCreated, ctrl.ExternalInvitation.Accept))
		}

		// Protected user routes (authentication required)
		usageEvents := v1.Group("/usage-events")
		usageEvents.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			usageEvents.POST("", handler.HandleRequest(ctrl.UsageEvent.CreateBatch))
		}

		// Protected user routes (authentication required)
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			users.GET("/me", handler.HandleNoRequest(ctrl.User.GetMe))
			users.GET("/me/profile-sync-status", handler.HandleNoRequest(ctrl.User.GetProfileSyncStatus))
			users.GET("/me/academic-profile", handler.HandleNoRequest(ctrl.User.GetAcademicProfile))
			users.GET("/:email/academic-profile", handler.HandleNoRequest(ctrl.User.GetAcademicProfileByEmail))
			users.POST("/link-academic-profile", handler.HandleRequest(ctrl.User.LinkAcademicProfile))
			users.POST("/unlink-academic-profile", handler.HandleNoRequest(ctrl.User.UnlinkAcademicProfile))
			users.GET("/search", handler.HandleNoRequest(ctrl.User.Search))
			users.GET("", handler.HandleRequestWithQuery(ctrl.User.List))
			users.GET("/:email", handler.HandleNoRequest(ctrl.User.Get))
			users.GET("/:email/coi-check", requireCOICheck, handler.HandleRequestWithURIAndQuery(ctrl.User.CheckCOI))
			users.PUT("/:email", handler.HandleRequest(ctrl.User.Update))
			users.DELETE("/:email", handler.HandleNoRequestWithMessage("user deleted successfully", ctrl.User.Delete))
		}

		agentQuery := v1.Group("/agent")
		agentQuery.Use(middleware.UserAuthMiddleware(cfg.JWT.Secret))
		agentQuery.Use(middleware.RequireAgentServiceTokenMiddleware(cfg.Server.AgentServiceToken))
		{
			agentQuery.POST("/query", func(c *gin.Context) {
				var req agentquery.Request
				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(http.StatusBadRequest, handler.Response{Error: err.Error()})
					return
				}

				response, err := appCtx.AgentQueryEngine.Execute(
					c.Request.Context(),
					agentquery.Actor{
						UserID:    c.GetInt64("user_id"),
						UserEmail: c.GetString("user_email"),
					},
					&req,
				)
				if err != nil {
					if apiErr, ok := err.(*agentquery.Error); ok {
						if apiErr.StatusCode >= http.StatusInternalServerError {
							log.Printf(
								"[api-error] status=%d method=%s path=%s message=%s",
								apiErr.StatusCode,
								c.Request.Method,
								c.Request.URL.Path,
								apiErr.Message,
							)
							c.JSON(apiErr.StatusCode, handler.Response{Error: "Something went wrong. Please try again later."})
							return
						}
						c.JSON(apiErr.StatusCode, handler.Response{Error: apiErr.Message})
						return
					}

					log.Printf(
						"[api-error] status=%d method=%s path=%s message=%v",
						http.StatusInternalServerError,
						c.Request.Method,
						c.Request.URL.Path,
						err,
					)
					c.JSON(http.StatusInternalServerError, handler.Response{Error: "Something went wrong. Please try again later."})
					return
				}

				c.JSON(http.StatusOK, handler.Response{Data: response})
			})
		}

		// Conference routes (all protected - authentication required)
		conferences := v1.Group("/conferences")
		conferences.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			conferences.GET("", handler.HandleRequestWithQuery(ctrl.Conference.List))
			conferences.GET("/:conference_id", handler.HandleRequestWithURI(ctrl.Conference.Get))
			conferences.POST("", handler.HandleRequestWithStatus(http.StatusCreated, ctrl.Conference.Create))
			conferences.PUT("/:conference_id", handler.HandleRequestWithURIAndJSON(ctrl.Conference.Update))
			conferences.DELETE("/:conference_id", handler.HandleNoRequestWithURIMessage("conference deleted successfully", ctrl.Conference.Delete))
			conferences.PUT("/:conference_id/bookmark", handler.HandleRequestWithURI(ctrl.Conference.ToggleBookmark))
			conferences.PUT("/:conference_id/status", handler.HandleRequestWithAll(ctrl.Conference.TransitionStatus))
			conferences.GET("/:conference_id/stats", handler.HandleRequestWithURI(ctrl.Conference.GetStats))
			// Reviewer routes nested under conferences (all protected - authentication required)
			reviewers := conferences.Group("/:conference_id/reviewers")
			{
				reviewers.GET("", requireChairOrPC, handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.List))
				reviewers.GET("/:reviewer_id", requireChairOrPC, handler.HandleRequestWithURI(ctrl.Reviewer.Get))
				reviewers.POST("", requireChair, handler.HandleRequestWithURIAndJSONWithStatus(http.StatusCreated, ctrl.Reviewer.BatchInvite))
				reviewers.PUT("/:reviewer_id/status", handler.HandleRequestWithURIAndJSON(ctrl.Reviewer.UpdateStatus)) // Auth in controller: chair or invited reviewer
				reviewers.DELETE("/:reviewer_id", requireChair, handler.HandleNoRequestWithURIMessage("reviewer removed successfully", ctrl.Reviewer.Delete))
			}

			// Reviewer suggestion route — discover potential reviewers for a conference
			conferences.GET("/:conference_id/reviewer-suggestions", requireChair, handler.HandleRequestWithURIAndQuery(ctrl.ReviewerSuggestion.GetSuggestions))

			// External invitation routes (chair only)
			extInvitations := conferences.Group("/:conference_id/external-invitations")
			{
				extInvitations.POST("", requireChair, handler.HandleRequestWithURIAndJSONWithStatus(http.StatusCreated, ctrl.ExternalInvitation.BatchCreate))
				extInvitations.GET("", requireChair, handler.HandleRequestWithURIAndQuery(ctrl.ExternalInvitation.List))
				extInvitations.DELETE("/:id", requireChair, handler.HandleNoRequestWithURIMessage("external invitation removed successfully", ctrl.ExternalInvitation.Delete))
			}

			// Submission routes nested under conferences (all protected - authentication required)
			submissions := conferences.Group("/:conference_id/submissions")
			{
				submissions.POST("/precheck", handler.HandleNoRequest(ctrl.Submission.PreCheck))
				submissions.POST("/autofill", handler.HandleNoRequest(ctrl.Submission.Autofill))
				submissions.POST("/track-recommendation", handler.HandleRequestWithURIAndJSON(ctrl.Submission.RecommendTracks))
				submissions.GET("", handler.HandleRequestWithURIAndQuery(ctrl.Submission.List))
				submissions.GET("/:submission_id", requireSubmissionAccess, handler.HandleNoRequest(ctrl.Submission.Get))
				submissions.GET("/:submission_id/file", requireSubmissionAccess, ctrl.Submission.GetFile)
				submissions.GET("/:submission_id/cover_letter", requireSubmissionAccess, ctrl.Submission.GetCoverLetter)
				submissions.POST("", handler.HandleSubmissionCreate(ctrl.Submission.Create))
				submissions.PUT("/:submission_id", handler.HandleSubmissionUpdate(ctrl.Submission.Update))
				submissions.POST("/:submission_id/publish", handler.HandleSubmissionPublish(ctrl.Submission.Publish))
				submissions.PUT("/:submission_id/status", handler.HandleRequestWithAll(ctrl.Submission.UpdateStatus))
				submissions.PUT("/:submission_id/rebuttal", handler.HandleRequestWithAll(ctrl.Submission.SubmitRebuttal))
				submissions.GET("/:submission_id/rebuttal", requireSubmissionAccess, handler.HandleRequestWithURI(ctrl.Submission.GetRebuttal))
				submissions.GET("/:submission_id/decision-copilot", handler.HandleRequestWithURI(ctrl.Submission.GetDecisionCopilot))
				submissions.POST("/:submission_id/decision-copilot/generate", handler.HandleRequestWithURI(ctrl.Submission.GenerateDecisionCopilot))
				submissions.POST("/:submission_id/decision-copilot/regenerate", handler.HandleRequestWithURI(ctrl.Submission.RegenerateDecisionCopilot))
				submissions.POST("/:submission_id/camera-ready", ctrl.Submission.UploadCameraReady)
				submissions.GET("/:submission_id/camera-ready", requireSubmissionAccess, ctrl.Submission.GetCameraReady)
				submissions.DELETE("/:submission_id", handler.HandleNoRequestWithMessage("submission deleted successfully", ctrl.Submission.Delete))

				// Auto-assignment endpoint - automatically sets submissions to "reviewing" status
				submissions.POST("/auto-assign", handler.HandleRequest(ctrl.Assignment.AutoAssign))

				// Review endpoints for chair (list reviews and analytics)
				submissions.GET("/:submission_id/reviews", requireChairOrPC, handler.HandleRequestWithURIAndQuery(ctrl.Assignment.ListReviews))
				submissions.GET("/:submission_id/reviews/analytics", requireChairOrPC, handler.HandleNoRequest(ctrl.Assignment.GetReviewAnalytics))

				// Discussion threads for submissions
				submissions.POST("/:submission_id/threads", handler.HandleNoRequestWithStatus(http.StatusCreated, ctrl.Discussion.CreateThread))
				submissions.GET("/:submission_id/threads", handler.HandleNoRequest(ctrl.Discussion.GetThreads))
			}
		}

		// Rebuttal management routes (chair only)
		rebuttalMgmt := conferences.Group("/:conference_id/rebuttal")
		{
			rebuttalMgmt.GET("/settings", handler.HandleRequestWithURI(ctrl.Conference.GetRebuttalSettings))
			rebuttalMgmt.PATCH("/settings", handler.HandleRequestWithAll(ctrl.Conference.SaveRebuttalSettings))
			rebuttalMgmt.POST("/open", handler.HandleRequestWithURI(ctrl.Conference.OpenRebuttal))
			rebuttalMgmt.POST("/finalize", handler.HandleRequestWithURI(ctrl.Conference.FinalizeRebuttal))
			rebuttalMgmt.POST("/open-discussion", handler.HandleRequestWithURI(ctrl.Conference.OpenDiscussion))
		}

		conferenceTemplates := v1.Group("/conference-config-templates")
		conferenceTemplates.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			conferenceTemplates.GET("", handler.HandleRequestWithQuery(ctrl.Conference.ListTemplates))
			conferenceTemplates.POST("", handler.HandleRequestWithStatus(http.StatusCreated, ctrl.Conference.CreateTemplate))
			conferenceTemplates.PUT("/:template_id", handler.HandleRequestWithURIAndJSON(ctrl.Conference.UpdateTemplate))
			conferenceTemplates.DELETE("/:template_id", handler.HandleNoRequestWithURIMessage("conference config template deleted successfully", ctrl.Conference.DeleteTemplate))
		}

		// Reviewer dashboard routes (authentication required)
		reviewer := v1.Group("/reviewer")
		reviewer.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			reviewer.GET("/:reviewer_email/dashboard", requireSelfReviewer, handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.GetDashboard))
			reviewer.GET("/:reviewer_email/conferences/:conference_id/papers", requireSelfReviewer, handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.GetConferencePapers))
			reviewer.GET("/:reviewer_email/completed-papers", requireSelfReviewer, handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.GetCompletedPapers))
			reviewer.GET("/:reviewer_email/assignments/:assignment_id/invitation", requireSelfReviewer, handler.HandleNoRequest(ctrl.Assignment.GetInvitation))
			reviewer.PUT("/:reviewer_email/assignments/:assignment_id/respond", requireSelfReviewer, handler.HandleRequest(ctrl.Assignment.Respond))
		}

		// Assignment review routes (authentication required)
		assignments := conferences.Group("/:conference_id/assignments")
		{
			assignments.PUT("/:assignment_id/review", handler.HandleRequest(ctrl.Assignment.SaveReview))
			assignments.GET("/:assignment_id/review", handler.HandleRequestWithURI(ctrl.Assignment.GetReview))
			assignments.POST("/:assignment_id/review-audit", handler.HandleRequest(ctrl.Assignment.RunReviewAudit))
			assignments.PUT("/:assignment_id/review-audit/dismissals", handler.HandleRequest(ctrl.Assignment.UpdateReviewAuditDismissal))
			assignments.GET("/:assignment_id/initial-analysis", handler.HandleRequestWithURI(ctrl.Assignment.GetReviewerInitialAnalysis))
			assignments.POST("/:assignment_id/initial-analysis/generate", handler.HandleRequestWithURI(ctrl.Assignment.GenerateReviewerInitialAnalysis))
			assignments.PUT("/:assignment_id/rebuttal/acknowledge", requireAssignmentOwner, handler.HandleRequestWithURI(ctrl.Reviewer.AcknowledgeRebuttal))
			assignments.PUT("/:assignment_id/rebuttal/points/:point_id/acknowledge", requireAssignmentOwner, handler.HandleRequestWithAll(ctrl.Reviewer.AcknowledgePoint))

			// Suggestion routes (chair only for writes, chair/PC for reads)
			suggestions := assignments.Group("/suggestions")
			{
				suggestions.GET("", requireChairOrPC, handler.HandleNoRequest(ctrl.Assignment.GetSuggestions))
				suggestions.POST("", requireChair, handler.HandleRequestWithStatus(http.StatusCreated, ctrl.Assignment.AddSuggestion))
				suggestions.POST("/confirm", requireChair, handler.HandleRequest(ctrl.Assignment.ConfirmSuggestions))
				suggestions.DELETE("/:assignment_id", requireChair, handler.HandleNoRequestWithMessage("suggestion deleted successfully", ctrl.Assignment.DeleteSuggestion))
			}

			// Post-rebuttal score route (reviewer)
			assignments.PUT("/:assignment_id/post-rebuttal-score", handler.HandleRequestWithAll(ctrl.Reviewer.UpdatePostRebuttalScore))

			// Confirmed assignments route (chair and PC for reads)
			assignments.GET("/confirmed", requireChairOrPC, handler.HandleNoRequest(ctrl.Assignment.GetConfirmedAssignments))
			assignments.POST("/:assignment_id/reinvite", requireChair, handler.HandleNoRequest(ctrl.Assignment.ReinviteAssignment))
		}

		// COI (Conflict of Interest) routes (authentication required)
		coi := v1.Group("/coi")
		coi.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			// Dashboard stats
			coi.GET("/dashboard/stats/:conference_id", handler.HandleRequestWithURI(ctrl.COI.GetDashboardStats))

			// All relationships (with filters and pagination)
			coi.GET("/relationships", handler.HandleRequestWithQuery(ctrl.COI.GetAllRelationships))

			// Detailed check for reviewer-author pair
			coi.GET("/check/reviewer/:reviewer_id/author/:author_email", handler.HandleRequestWithURI(ctrl.COI.CheckReviewerAuthorCOI))

			// Paper COI summaries
			coi.GET("/papers", handler.HandleRequestWithQuery(ctrl.COI.GetPaperCOIs))

			// Rebuild COI relationships (admin/chair only)
			coi.POST("/conferences/:conference_id/rebuild", handler.HandleRequestWithURI(ctrl.COI.RebuildCOI))
		}

		// Notification routes (authentication required)
		notifications := v1.Group("/notifications")
		notifications.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			notifications.GET("", handler.HandleRequestWithQuery(ctrl.Notification.List))
			notifications.GET("/preferences", handler.HandleNoRequest(ctrl.Notification.GetPreferences))
			notifications.PUT("/preferences", handler.HandleRequest(ctrl.Notification.UpdatePreferences))
			notifications.GET("/unread-count", handler.HandleNoRequest(ctrl.Notification.GetUnreadCount))
			notifications.GET("/:id", handler.HandleNoRequest(ctrl.Notification.Get))
			notifications.PATCH("/:id/read", handler.HandleNoRequest(ctrl.Notification.MarkAsRead))
			notifications.PATCH("/read-all", handler.HandleNoRequest(ctrl.Notification.MarkAllAsRead))
			notifications.DELETE("/:id", handler.HandleNoRequestWithMessage("notification deleted successfully", ctrl.Notification.Delete))
		}

		// Discussion thread routes (authentication required)
		threads := v1.Group("/threads")
		threads.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			threads.GET("/:thread_id", handler.HandleNoRequest(ctrl.Discussion.GetThread))
			threads.POST("/:thread_id/messages", handler.HandleNoRequestWithStatus(http.StatusCreated, ctrl.Discussion.CreateMessage))
			threads.GET("/:thread_id/messages", handler.HandleNoRequest(ctrl.Discussion.GetMessages))
			threads.DELETE("/:thread_id/messages/:message_id", handler.HandleNoRequestWithMessage("message deleted successfully", ctrl.Discussion.DeleteMessage))
			threads.POST("/:thread_id/attachments", requireThreadParticipant, ctrl.Discussion.UploadAttachment)
			threads.GET("/:thread_id/attachments/:filename", requireThreadParticipant, ctrl.Discussion.DownloadAttachment)
		}

		// Semantic Scholar routes (authentication required)
		semanticScholar := v1.Group("/semantic-scholar")
		semanticScholar.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			// Only register if controller is available (enabled in config)
			if ctrl.SemanticScholar != nil {
				semanticScholar.GET("/authors/search", handler.HandleNoRequest(ctrl.SemanticScholar.SearchAuthors))
				semanticScholar.GET("/authors/:authorId", handler.HandleNoRequest(ctrl.SemanticScholar.GetAuthorDetails))
				semanticScholar.GET("/authors/:authorId/papers", handler.HandleNoRequest(ctrl.SemanticScholar.GetAuthorPapers))
			}
		}
	}

	// WebSocket endpoint for real-time notifications (outside v1 group, uses custom auth)
	router.GET("/ws/notifications", func(c *gin.Context) {
		// Get token from query parameter (WebSocket doesn't support headers easily)
		token := c.Query("token")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token required"})
			return
		}

		// Validate token and extract user email
		userEmail, err := middleware.ValidateTokenAndGetEmail(token, cfg.JWT.Secret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		// Upgrade to WebSocket
		websocket.ServeWs(hub, c.Writer, c.Request, userEmail)
	})

	return router
}
