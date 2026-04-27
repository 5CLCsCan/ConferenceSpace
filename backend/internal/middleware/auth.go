package middleware

import (
	"crypto/subtle"
	"fmt"
	"net/http"
	"strings"

	"github.com/dcao/conferencespace/pkg/jwt"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT tokens or X-Admin-Token header
func AuthMiddleware(jwtSecret string, adminToken string) gin.HandlerFunc {
	return authMiddleware(jwtSecret, adminToken, true)
}

// UserAuthMiddleware validates JWT tokens only and does not allow X-Admin-Token bypasses.
func UserAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return authMiddleware(jwtSecret, "", false)
}

func authMiddleware(jwtSecret string, adminToken string, allowAdminBypass bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		adminTokenHeader := c.GetHeader("X-Admin-Token")
		if allowAdminBypass && adminTokenHeader != "" && adminToken != "" && adminTokenHeader == adminToken {
			// Admin token matches - bypass JWT authentication
			// Set admin context values (use 0 for admin user_id and admin@system for email)
			c.Set("user_id", int64(0))
			c.Set("user_email", "admin@system")
			c.Set("is_admin", true)
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
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

// RequireAgentServiceTokenMiddleware enforces the shared service token used by ai-service.
func RequireAgentServiceTokenMiddleware(expectedToken string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if strings.TrimSpace(expectedToken) == "" {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "agent service token is not configured"})
			c.Abort()
			return
		}

		provided := c.GetHeader("X-Agent-Service-Token")
		if strings.TrimSpace(provided) == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "x-agent-service-token header required"})
			c.Abort()
			return
		}

		if subtle.ConstantTimeCompare([]byte(provided), []byte(expectedToken)) != 1 {
			c.JSON(http.StatusForbidden, gin.H{"error": "invalid agent service token"})
			c.Abort()
			return
		}

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
