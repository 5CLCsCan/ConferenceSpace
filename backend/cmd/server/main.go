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
	"github.com/dcao/conferencespace/internal/middleware"
	"github.com/dcao/conferencespace/internal/service"
	"github.com/dcao/conferencespace/internal/storage"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

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

	// Initialize storage layer
	store := storage.NewStorage(db)

	// Initialize service layer
	svc := service.NewService(store.User, cfg.JWT.Secret, cfg.JWT.Expiry)

	// Initialize controller layer
	ctrl := controller.NewController(svc.User)

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
			auth.POST("/register", ctrl.Auth.Register)
			auth.POST("/login", ctrl.Auth.Login)
		}

		// Protected user routes (authentication required)
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
		{
			users.GET("/me", ctrl.User.GetMe)
			users.GET("", ctrl.User.List)
			users.GET("/:id", ctrl.User.Get)
			users.PUT("/:id", ctrl.User.Update)
			users.DELETE("/:id", ctrl.User.Delete)
		}
	}

	return router
}
