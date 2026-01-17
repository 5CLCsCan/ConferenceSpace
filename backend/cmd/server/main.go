package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dcao/conferencespace/internal/clients"
	"github.com/dcao/conferencespace/internal/config"
	"github.com/dcao/conferencespace/internal/controller"
	"github.com/dcao/conferencespace/internal/controller/auth"
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
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
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
	Controller *controller.Controller
	Hub        *websocket.Hub
	Store      *storage.Storage
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
		log.Printf("Continuing without graph-based COI detection")
		clients = nil
	}

	// Initialize file storage service
	fileStore := fileStorage.NewLocalFileStorage("./uploads/submissions")
	if err != nil {
		return nil, nil, err
	}

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	orch := orchestrator.NewOrchestrator(store, cfg.JWT.Secret, cfg.JWT.Expiry)
	ctrl := controller.NewControllerWithHub(orch, store, fileStore, clients, hub)

	cleanup := func() {
		if err := db.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}

		if err := clients.Close(context.Background()); err != nil {
			log.Printf("Error closing clients: %v", err)
		}
	}

	appCtx := &AppContext{
		Controller: ctrl,
		Hub:        hub,
		Store:      store,
	}

	return appCtx, cleanup, nil
}

// setupRouter configures all routes
func setupRouter(appCtx *AppContext, cfg *config.Config) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Authorization", "Content-Type", "Upgrade", "Connection"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	ctrl := appCtx.Controller
	hub := appCtx.Hub

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

		// Protected user routes (authentication required)
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			users.GET("/me", handler.HandleNoRequest(ctrl.User.GetMe))
			users.GET("/me/academic-profile", handler.HandleNoRequest(ctrl.User.GetAcademicProfile))
			users.POST("/link-academic-profile", handler.HandleRequest(ctrl.User.LinkAcademicProfile))
			users.POST("/unlink-academic-profile", handler.HandleNoRequest(ctrl.User.UnlinkAcademicProfile))
			users.GET("/search", handler.HandleNoRequest(ctrl.User.Search))
			users.GET("", handler.HandleRequestWithQuery(ctrl.User.List))
			users.GET("/:email", handler.HandleNoRequest(ctrl.User.Get))
			users.GET("/:email/coi-check", handler.HandleRequestWithURIAndQuery(ctrl.User.CheckCOI))
			users.PUT("/:email", handler.HandleRequest(ctrl.User.Update))
			users.DELETE("/:email", handler.HandleNoRequestWithMessage("user deleted successfully", ctrl.User.Delete))
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

			// Reviewer routes nested under conferences (all protected - authentication required)
			reviewers := conferences.Group("/:conference_id/reviewers")
			{
				reviewers.GET("", handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.List))
				reviewers.GET("/:reviewer_id", handler.HandleRequestWithURI(ctrl.Reviewer.Get))
				reviewers.POST("", handler.HandleRequestWithURIAndJSONWithStatus(http.StatusCreated, ctrl.Reviewer.BatchInvite))
				reviewers.PUT("/:reviewer_id/status", handler.HandleRequestWithURIAndJSON(ctrl.Reviewer.UpdateStatus))
				reviewers.DELETE("/:reviewer_id", handler.HandleNoRequestWithURIMessage("reviewer removed successfully", ctrl.Reviewer.Delete))
			}

			// Submission routes nested under conferences (all protected - authentication required)
			submissions := conferences.Group("/:conference_id/submissions")
			{
				submissions.POST("/precheck", handler.HandleNoRequest(ctrl.Submission.PreCheck))
				submissions.GET("", handler.HandleRequestWithURIAndQuery(ctrl.Submission.List))
				submissions.GET("/:id", handler.HandleNoRequest(ctrl.Submission.Get))
				submissions.GET("/:id/file", ctrl.Submission.GetFile)
				submissions.GET("/:id/cover_letter", ctrl.Submission.GetCoverLetter)
				submissions.POST("", handler.HandleSubmissionCreate(ctrl.Submission.Create))
				submissions.PUT("/:id", handler.HandleSubmissionUpdate(ctrl.Submission.Update))
				submissions.POST("/:id/publish", handler.HandleSubmissionPublish(ctrl.Submission.Publish))
				submissions.PUT("/:id/status", handler.HandleRequestWithAll(ctrl.Submission.UpdateStatus))
				submissions.DELETE("/:id", handler.HandleNoRequestWithMessage("submission deleted successfully", ctrl.Submission.Delete))

				// Auto-assignment endpoint - automatically sets submissions to "reviewing" status
				submissions.POST("/auto-assign", handler.HandleRequest(ctrl.Assignment.AutoAssign))

				// Review endpoints for chair (list reviews and analytics)
				submissions.GET("/:id/reviews", handler.HandleRequestWithURIAndQuery(ctrl.Assignment.ListReviews))
				submissions.GET("/:id/reviews/analytics", handler.HandleNoRequest(ctrl.Assignment.GetReviewAnalytics))
			}
		}

		// Reviewer dashboard routes (authentication required)
		reviewer := v1.Group("/reviewer")
		reviewer.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			reviewer.GET("/:reviewer_email/dashboard", handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.GetDashboard))
			reviewer.GET("/:reviewer_email/conferences/:conference_id/papers", handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.GetConferencePapers))
			reviewer.GET("/:reviewer_email/completed-papers", handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.GetCompletedPapers))
		}

		// Assignment review routes (authentication required)
		assignments := conferences.Group("/:conference_id/assignments")
		{
			assignments.PUT("/:assignment_id/review", handler.HandleRequestWithAll(ctrl.Assignment.SaveReview))
			assignments.GET("/:assignment_id/review", handler.HandleRequestWithURI(ctrl.Assignment.GetReview))
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
			notifications.GET("/unread-count", handler.HandleNoRequest(ctrl.Notification.GetUnreadCount))
			notifications.GET("/:id", handler.HandleNoRequest(ctrl.Notification.Get))
			notifications.PATCH("/:id/read", handler.HandleNoRequest(ctrl.Notification.MarkAsRead))
			notifications.PATCH("/read-all", handler.HandleNoRequest(ctrl.Notification.MarkAllAsRead))
			notifications.DELETE("/:id", handler.HandleNoRequestWithMessage("notification deleted successfully", ctrl.Notification.Delete))
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
