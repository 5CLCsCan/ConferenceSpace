package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/dcao/conferencespace/pkg/jwt"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT tokens or X-Admin-Token header
func AuthMiddleware(jwtSecret string, adminToken string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check for X-Admin-Token header first (bypass authentication)
		adminTokenHeader := c.GetHeader("X-Admin-Token")
		if adminTokenHeader != "" && adminToken != "" && adminTokenHeader == adminToken {
			// Admin token matches - bypass JWT authentication
			// Set admin context values (use 0 for admin user_id and admin@system for email)
			c.Set("user_id", int64(0))
			c.Set("user_email", "admin@system")
			c.Set("is_admin", true)
			c.Next()
			return
		}

		// Fall back to JWT authentication
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			c.Abort()
			return
		}

		// Check if it's a Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := jwt.ValidateToken(tokenString, jwtSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		// Store user info in context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("is_admin", false)

		c.Next()
	}
}

// ValidateTokenAndGetEmail validates a JWT token and returns the user email
// This is used for WebSocket authentication where we can't use middleware
func ValidateTokenAndGetEmail(tokenString string, jwtSecret string) (string, error) {
	claims, err := jwt.ValidateToken(tokenString, jwtSecret)
	if err != nil {
		return "", fmt.Errorf("invalid token: %w", err)
	}
	return claims.Email, nil
}
