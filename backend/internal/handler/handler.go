package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response represents a standard API response
type Response struct {
	Data  interface{} `json:"data,omitempty"`
	Error string      `json:"error,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	StatusCode int
	Message    string
}

// Error implements the error interface
func (e *ErrorResponse) Error() string {
	return e.Message
}

// NewErrorResponse creates a new error response
func NewErrorResponse(statusCode int, message string) *ErrorResponse {
	return &ErrorResponse{
		StatusCode: statusCode,
		Message:    message,
	}
}

// HandleRequest is a generic handler wrapper that:
// 1. Binds JSON request to the request object
// 2. Calls the handler function
// 3. Serializes the response
func HandleRequest[Req any, Res any](handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
			return
		}

		response, err := handler(ctx, &req)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, Response{Data: response})
	}
}

// HandleRequestWithStatus is similar to HandleRequest but allows custom success status code
func HandleRequestWithStatus[Req any, Res any](statusCode int, handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
			return
		}

		response, err := handler(ctx, &req)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(statusCode, Response{Data: response})
	}
}

// HandleRequestWithQuery binds both body and query params (query params take priority)
func HandleRequestWithQuery[Req any, Res any](handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req

		if ctx.Request.ContentLength > 0 {
			if err := ctx.ShouldBindJSON(&req); err != nil {
				ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
				return
			}
		}

		if err := ctx.ShouldBindQuery(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
			return
		}

		response, err := handler(ctx, &req)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, Response{Data: response})
	}
}

// HandleRequestWithQueryAndStatus binds both body and query params with custom status code
func HandleRequestWithQueryAndStatus[Req any, Res any](statusCode int, handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req

		if ctx.Request.ContentLength > 0 {
			if err := ctx.ShouldBindJSON(&req); err != nil {
				ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
				return
			}
		}

		if err := ctx.ShouldBindQuery(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
			return
		}

		response, err := handler(ctx, &req)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(statusCode, Response{Data: response})
	}
}

// HandleNoRequest handles endpoints with no request body (GET, DELETE)
func HandleNoRequest[Res any](handler func(ctx *gin.Context) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		response, err := handler(ctx)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, Response{Data: response})
	}
}

// HandleNoRequestList handles list endpoints with no request body (GET)
func HandleNoRequestList[Res any](handler func(ctx *gin.Context) ([]*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		response, err := handler(ctx)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, Response{Data: response})
	}
}

// HandleNoRequestNoResponse handles endpoints with no request body and no response data (DELETE)
func HandleNoRequestNoResponse(handler func(ctx *gin.Context) error) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if err := handler(ctx); err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "success"})
	}
}

// HandleNoRequestWithMessage handles DELETE operations with custom success message
func HandleNoRequestWithMessage(message string, handler func(ctx *gin.Context) error) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if err := handler(ctx); err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": message})
	}
}

// handleError processes errors and sends appropriate HTTP responses
func handleError(ctx *gin.Context, err error) {
	if errResp, ok := err.(*ErrorResponse); ok {
		ctx.JSON(errResp.StatusCode, Response{Error: errResp.Message})
		return
	}

	// Default to internal server error
	ctx.JSON(http.StatusInternalServerError, Response{Error: err.Error()})
}
