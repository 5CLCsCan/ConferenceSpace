package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dcao/conferencespace/internal/config"
	"github.com/dcao/conferencespace/internal/controller"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/middleware"
	"github.com/dcao/conferencespace/internal/orchestrator"
	"github.com/dcao/conferencespace/internal/storage"
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
	orch := orchestrator.NewOrchestrator(store, cfg.JWT.Secret, cfg.JWT.Expiry)
	ctrl := controller.NewController(orch, store)

	cleanup := func() {
		if err := db.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
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
		users.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
		{
			users.GET("/me", handler.HandleNoRequest(ctrl.User.GetMe))
			users.GET("", handler.HandleRequestWithQuery(ctrl.User.List))
			users.GET("/:id", handler.HandleNoRequest(ctrl.User.Get))
			users.PUT("/:id", handler.HandleRequest(ctrl.User.Update))
			users.DELETE("/:id", handler.HandleNoRequestWithMessage("user deleted successfully", ctrl.User.Delete))
		}

		// Conference routes (all protected - authentication required)
		conferences := v1.Group("/conferences")
		conferences.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
		{
			conferences.GET("", handler.HandleRequestWithQuery(ctrl.Conference.List))
			conferences.GET("/:id", handler.HandleNoRequest(ctrl.Conference.Get))
			conferences.POST("", handler.HandleRequestWithStatus(http.StatusCreated, ctrl.Conference.Create))
			conferences.PUT("/:id", handler.HandleRequest(ctrl.Conference.Update))
			conferences.DELETE("/:id", handler.HandleNoRequestWithMessage("conference deleted successfully", ctrl.Conference.Delete))

			// Submission routes nested under conferences (all protected - authentication required)
			submissions := conferences.Group("/:conference_id/submissions")
			{
				submissions.GET("", handler.HandleRequestWithQuery(ctrl.Submission.List))
				submissions.GET("/:id", handler.HandleNoRequest(ctrl.Submission.Get))
				submissions.POST("", handler.HandleRequestWithStatus(http.StatusCreated, ctrl.Submission.Create))
				submissions.PUT("/:id", handler.HandleRequest(ctrl.Submission.Update))
				submissions.DELETE("/:id", handler.HandleNoRequestWithMessage("submission deleted successfully", ctrl.Submission.Delete))
			}
		}
	}

	return router
}
