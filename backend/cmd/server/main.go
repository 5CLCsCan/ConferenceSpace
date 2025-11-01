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
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/middleware"
	"github.com/dcao/conferencespace/internal/orchestrator"
	"github.com/dcao/conferencespace/internal/storage"
	fileStorage "github.com/dcao/conferencespace/internal/storage/file"
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
	ctrl, cleanup, err := initializeApp(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize application: %v", err)
	}
	defer cleanup()

	// Setup Gin router
	router := setupRouter(ctrl, cfg)

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

// initializeApp sets up all dependencies using dependency injection pattern
func initializeApp(cfg *config.Config) (*controller.Controller, func(), error) {
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

	// Initialize external clients
	clients, err := clients.NewClients(cfg)
	if err != nil {
		return nil, nil, err
	}

	orch := orchestrator.NewOrchestrator(store, cfg.JWT.Secret, cfg.JWT.Expiry)
	ctrl := controller.NewController(orch, store, fileStore, clients.Gemini)

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

	return ctrl, cleanup, nil
}

// setupRouter configures all routes
func setupRouter(ctrl *controller.Controller, cfg *config.Config) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

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
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handler.HandleRequestWithStatus(http.StatusCreated, ctrl.Auth.Register))
			auth.POST("/login", handler.HandleRequest(ctrl.Auth.Login))
		}

		// Protected user routes (authentication required)
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware(cfg.JWT.Secret, cfg.Server.AdminToken))
		{
			users.GET("/me", handler.HandleNoRequest(ctrl.User.GetMe))
			users.GET("", handler.HandleRequestWithQuery(ctrl.User.List))
			users.GET("/:id", handler.HandleNoRequest(ctrl.User.Get))
			users.GET("/:id/coi-check", handler.HandleRequestWithURIAndQuery(ctrl.User.CheckCOI))
			users.PUT("/:id", handler.HandleRequest(ctrl.User.Update))
			users.DELETE("/:id", handler.HandleNoRequestWithMessage("user deleted successfully", ctrl.User.Delete))
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
				submissions.GET("/:id", handler.HandleNoRequest(ctrl.Submission.Get))
				submissions.POST("", handler.HandleNoRequestWithStatus(http.StatusCreated, ctrl.Submission.Create))
				submissions.PUT("/:id", handler.HandleRequest(ctrl.Submission.Update))
				submissions.DELETE("/:id", handler.HandleNoRequestWithMessage("submission deleted successfully", ctrl.Submission.Delete))

				// Auto-assignment endpoint - automatically sets submissions to "reviewing" status
				submissions.POST("/auto-assign", handler.HandleRequest(ctrl.Assignment.AutoAssign))
			}
		}
	}

	return router
}
