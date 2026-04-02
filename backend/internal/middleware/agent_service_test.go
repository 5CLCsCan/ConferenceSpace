package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	jwtpkg "github.com/dcao/conferencespace/pkg/jwt"
	"github.com/gin-gonic/gin"
)

func TestRequireAgentServiceTokenMiddleware(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(RequireAgentServiceTokenMiddleware("agent-secret"))
	router.GET("/agent/query", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/agent/query", nil)
	req.Header.Set("X-Agent-Service-Token", "agent-secret")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}
}

func TestRequireAgentServiceTokenMiddlewareRejectsMissingToken(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(RequireAgentServiceTokenMiddleware("agent-secret"))
	router.GET("/agent/query", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/agent/query", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", resp.Code)
	}
}

func TestUserAuthMiddlewareRejectsAdminBypass(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(UserAuthMiddleware("jwt-secret"))
	router.GET("/agent/query", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/agent/query", nil)
	req.Header.Set("X-Admin-Token", "admin-secret")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", resp.Code)
	}
}

func TestUserAuthMiddlewareAcceptsBearerToken(t *testing.T) {
	t.Parallel()

	token, err := jwtpkg.GenerateToken(99, "chair@example.com", "jwt-secret", time.Hour)
	if err != nil {
		t.Fatalf("GenerateToken returned error: %v", err)
	}

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(UserAuthMiddleware("jwt-secret"))
	router.GET("/agent/query", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"user_id": c.GetInt64("user_id"), "user_email": c.GetString("user_email")})
	})

	req := httptest.NewRequest(http.MethodGet, "/agent/query", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}
	if body := resp.Body.String(); body != `{"user_email":"chair@example.com","user_id":99}` {
		t.Fatalf("unexpected body: %s", body)
	}
}
