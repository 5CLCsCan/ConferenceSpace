package middleware

import (
	"context"

	"github.com/gin-gonic/gin"
)

type contextKey string

const (
	userIDKey    contextKey = "user_id"
	userEmailKey contextKey = "user_email"
)

func ContextMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		if userID, exists := c.Get("user_id"); exists {
			ctx = context.WithValue(ctx, userIDKey, userID)
		}

		if userEmail, exists := c.Get("user_email"); exists {
			ctx = context.WithValue(ctx, userEmailKey, userEmail)
		}

		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

func GetUserIDFromContext(ctx context.Context) (int64, bool) {
	userID, ok := ctx.Value(userIDKey).(int64)
	return userID, ok
}

func GetUserEmailFromContext(ctx context.Context) (string, bool) {
	email, ok := ctx.Value(userEmailKey).(string)
	return email, ok
}
