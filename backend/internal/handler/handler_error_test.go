package handler

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHandleError_SanitizesInternalErrorResponse(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/auth/register", nil)

	handleError(ctx, NewErrorResponse(http.StatusInternalServerError, `failed to create user: pq: duplicate key`))

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", w.Code)
	}
	if got := w.Body.String(); got != `{"error":"Something went wrong. Please try again later."}` {
		t.Fatalf("unexpected response body: %s", got)
	}
}

func TestHandleError_KeptClientErrorMessage(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/auth/register", nil)

	handleError(ctx, NewErrorResponse(http.StatusConflict, "an account with this email already exists"))

	if w.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", w.Code)
	}
	if got := w.Body.String(); got != `{"error":"an account with this email already exists"}` {
		t.Fatalf("unexpected response body: %s", got)
	}
}

func TestHandleError_SanitizesUnhandledError(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/v1/users/me", nil)

	handleError(ctx, errors.New(`sql: connection refused`))

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", w.Code)
	}
	if got := w.Body.String(); got != `{"error":"Something went wrong. Please try again later."}` {
		t.Fatalf("unexpected response body: %s", got)
	}
}
