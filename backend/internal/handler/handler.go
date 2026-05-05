package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"reflect"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
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

type DetailedErrorResponse struct {
	StatusCode int
	Message    string
	Data       interface{}
}

const genericInternalErrorMessage = "Something went wrong. Please try again later."

// Error implements the error interface
func (e *ErrorResponse) Error() string {
	return e.Message
}

func (e *DetailedErrorResponse) Error() string {
	return e.Message
}

// NewErrorResponse creates a new error response
func NewErrorResponse(statusCode int, message string) *ErrorResponse {
	return &ErrorResponse{
		StatusCode: statusCode,
		Message:    message,
	}
}

func NewDetailedErrorResponse(statusCode int, message string, data interface{}) *DetailedErrorResponse {
	return &DetailedErrorResponse{
		StatusCode: statusCode,
		Message:    message,
		Data:       data,
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

// HandleRequestWithURIAndQuery binds URI parameters and query params
// Priority: URI > Query (URI parameters take precedence)
func HandleRequestWithURIAndQuery[Req any, Res any](handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req

		// Bind URI parameters first
		if err := ctx.ShouldBindUri(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
			return
		}

		// Then bind query parameters
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

// HandleRequestWithAll binds URI, query, and body parameters
// Priority: URI > Query > Body (URI parameters take highest precedence)
func HandleRequestWithAll[Req any, Res any](handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req

		// Bind body first (lowest priority)
		if ctx.Request.ContentLength > 0 {
			if err := ctx.ShouldBindJSON(&req); err != nil {
				ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
				return
			}
		}

		// Then bind query parameters (overrides body)
		if err := ctx.ShouldBindQuery(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
			return
		}

		// Finally bind URI parameters (highest priority, overrides everything)
		if err := ctx.ShouldBindUri(&req); err != nil {
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

// HandleRequestWithAllAndStatus binds URI, query, and body parameters with custom status
// Priority: URI > Query > Body (URI parameters take highest precedence)
func HandleRequestWithAllAndStatus[Req any, Res any](statusCode int, handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req

		// Bind body first (lowest priority)
		if ctx.Request.ContentLength > 0 {
			if err := ctx.ShouldBindJSON(&req); err != nil {
				ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
				return
			}
		}

		// Then bind query parameters (overrides body)
		if err := ctx.ShouldBindQuery(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
			return
		}

		// Finally bind URI parameters (highest priority, overrides everything)
		if err := ctx.ShouldBindUri(&req); err != nil {
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

// HandleRequestWithURI handles endpoints that only have URI parameters (path params)
func HandleRequestWithURI[Req any, Res any](handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req
		if err := ctx.ShouldBindUri(&req); err != nil {
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

// HandleRequestWithURIAndJSON handles endpoints that have both URI parameters and JSON body
func HandleRequestWithURIAndJSON[Req any, Res any](handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req
		// Bind JSON body first.
		if ctx.Request.Body != nil {
			decoder := json.NewDecoder(ctx.Request.Body)
			if err := decoder.Decode(&req); err != nil && !errors.Is(err, io.EOF) {
				ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
				return
			}
		}
		// Then overlay URI params without running validation on JSON-only fields.
		applyURIParams(&req, ctx.Params)

		response, err := handler(ctx, &req)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, Response{Data: response})
	}
}

// HandleRequestWithURIAndJSONWithStatus handles endpoints that have both URI parameters and JSON body with custom status
func HandleRequestWithURIAndJSONWithStatus[Req any, Res any](statusCode int, handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req
		// Bind JSON body first.
		if ctx.Request.Body != nil {
			decoder := json.NewDecoder(ctx.Request.Body)
			if err := decoder.Decode(&req); err != nil && !errors.Is(err, io.EOF) {
				ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
				return
			}
		}
		// Then overlay URI params without running validation on JSON-only fields.
		applyURIParams(&req, ctx.Params)

		// Run struct validation (binding:"required", "dive", etc.) that
		// json.Decoder.Decode does not trigger on its own.
		if err := binding.Validator.ValidateStruct(&req); err != nil {
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

func applyURIParams(target any, params gin.Params) {
	value := reflect.ValueOf(target)
	if value.Kind() != reflect.Ptr || value.IsNil() {
		return
	}

	elem := value.Elem()
	if elem.Kind() != reflect.Struct {
		return
	}

	elemType := elem.Type()
	for i := 0; i < elem.NumField(); i++ {
		field := elem.Field(i)
		structField := elemType.Field(i)
		uriTag := structField.Tag.Get("uri")
		if uriTag == "" || !field.CanSet() {
			continue
		}

		paramValue, ok := params.Get(uriTag)
		if !ok {
			continue
		}

		switch field.Kind() {
		case reflect.String:
			field.SetString(paramValue)
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			var parsed int64
			if _, err := fmt.Sscanf(paramValue, "%d", &parsed); err == nil {
				field.SetInt(parsed)
			}
		case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
			var parsed uint64
			if _, err := fmt.Sscanf(paramValue, "%d", &parsed); err == nil {
				field.SetUint(parsed)
			}
		}
	}
}

// HandleNoRequestWithURIMessage handles DELETE endpoints with URI parameters and custom message
func HandleNoRequestWithURIMessage[Req any](message string, handler func(ctx *gin.Context, req *Req) error) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req
		if err := ctx.ShouldBindUri(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
			return
		}

		if err := handler(ctx, &req); err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": message})
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

// HandleNoRequestWithStatus handles endpoints with no request body but custom status code
func HandleNoRequestWithStatus[Res any](statusCode int, handler func(ctx *gin.Context) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		response, err := handler(ctx)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(statusCode, Response{Data: response})
	}
}

// HandleMultipartOrJSON is a handler that supports both multipart/form-data and JSON requests
// For multipart requests, it extracts JSON from the specified form field name
// For JSON requests, it binds the JSON body directly
// This is useful for endpoints that need to handle file uploads but also support metadata-only updates
func HandleMultipartOrJSON[Req any, Res any](jsonFieldName string, handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req

		// Try to parse as multipart form first
		form, formErr := ctx.MultipartForm()

		if formErr == nil {
			// Store parsed form in context for controller access (avoid re-parsing)
			ctx.Set("multipart_form", form)

			// Multipart form data - extract JSON from form field
			jsonData := ctx.PostForm(jsonFieldName)
			if jsonData == "" {
				ctx.JSON(http.StatusBadRequest, Response{Error: jsonFieldName + " field is required in form data"})
				return
			}

			if err := ctx.ShouldBindJSON(&req); err != nil {
				// Since we have form data, manually unmarshal the JSON string
				var tempReq Req
				if err := json.Unmarshal([]byte(jsonData), &tempReq); err != nil {
					ctx.JSON(http.StatusBadRequest, Response{Error: "invalid " + jsonFieldName + " data format: " + err.Error()})
					return
				}
				req = tempReq
			}
		} else {
			// Regular JSON request
			if err := ctx.ShouldBindJSON(&req); err != nil {
				ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
				return
			}
		}

		response, err := handler(ctx, &req)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, Response{Data: response})
	}
}

// HandleMultipartOrJSONWithStatus is similar to HandleMultipartOrJSON but allows custom success status code
func HandleMultipartOrJSONWithStatus[Req any, Res any](statusCode int, jsonFieldName string, handler func(ctx *gin.Context, req *Req) (*Res, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req Req

		// Try to parse as multipart form first
		form, formErr := ctx.MultipartForm()

		if formErr == nil {
			// Store parsed form in context for controller access (avoid re-parsing)
			ctx.Set("multipart_form", form)

			// Multipart form data - extract JSON from form field
			jsonData := ctx.PostForm(jsonFieldName)
			if jsonData == "" {
				ctx.JSON(http.StatusBadRequest, Response{Error: jsonFieldName + " field is required in form data"})
				return
			}

			// Manually unmarshal the JSON string from form data
			if err := json.Unmarshal([]byte(jsonData), &req); err != nil {
				ctx.JSON(http.StatusBadRequest, Response{Error: "invalid " + jsonFieldName + " data format: " + err.Error()})
				return
			}
		} else {
			// Regular JSON request
			if err := ctx.ShouldBindJSON(&req); err != nil {
				ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
				return
			}
		}

		response, err := handler(ctx, &req)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(statusCode, Response{Data: response})
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

// HandleSubmissionCreate handles submission creation with custom form binding
func HandleSubmissionCreate(handler func(ctx *gin.Context, req *dto.SubmissionCreateRequest) (*dto.Submission, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Parse multipart form
		form, err := ctx.MultipartForm()
		if err != nil {
			ctx.JSON(http.StatusBadRequest, Response{Error: "failed to parse form data: " + err.Error()})
			return
		}

		// Bind form data to request DTO using custom binder
		req, err := utils.BindSubmissionCreateRequest(form)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
			return
		}

		// Call controller
		response, err := handler(ctx, req)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusCreated, Response{Data: response})
	}
}

// HandleSubmissionUpdate handles submission update with custom form binding
func HandleSubmissionUpdate(handler func(ctx *gin.Context, req *dto.SubmissionUpdateRequest) (*dto.Submission, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Try to parse as multipart form first
		form, formErr := ctx.MultipartForm()

		var req *dto.SubmissionUpdateRequest

		if formErr == nil {
			// Multipart request - use custom binder
			var err error
			req, err = utils.BindSubmissionUpdateRequest(form)
			if err != nil {
				ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
				return
			}
		} else {
			// JSON request - use standard binding
			if err := ctx.ShouldBindJSON(&req); err != nil {
				ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
				return
			}
		}

		// Call controller
		response, err := handler(ctx, req)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, Response{Data: response})
	}
}

// HandleSubmissionPublish handles submission publish with custom form binding
func HandleSubmissionPublish(handler func(ctx *gin.Context, req *dto.SubmissionPublishRequest) (*dto.Submission, error)) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Try to parse multipart form (optional - publish can work without new files)
		form, formErr := ctx.MultipartForm()

		var req *dto.SubmissionPublishRequest

		if formErr == nil {
			// Multipart request - use custom binder
			var err error
			req, err = utils.BindSubmissionPublishRequest(form)
			if err != nil {
				ctx.JSON(http.StatusBadRequest, Response{Error: err.Error()})
				return
			}
		} else {
			// No form data - create empty request with empty Submission (no files being uploaded)
			req = &dto.SubmissionPublishRequest{
				Submission: &dto.Submission{},
			}
		}

		// Call controller
		response, err := handler(ctx, req)
		if err != nil {
			handleError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, Response{Data: response})
	}
}

// handleError processes errors and sends appropriate HTTP responses
func handleError(ctx *gin.Context, err error) {
	if errResp, ok := err.(*ErrorResponse); ok {
		if errResp.StatusCode >= http.StatusInternalServerError {
			log.Printf(
				"[api-error] status=%d method=%s path=%s message=%s",
				errResp.StatusCode,
				ctx.Request.Method,
				ctx.Request.URL.Path,
				errResp.Message,
			)
			ctx.JSON(errResp.StatusCode, Response{Error: genericInternalErrorMessage})
			return
		}
		ctx.JSON(errResp.StatusCode, Response{Error: errResp.Message})
		return
	}
	if errResp, ok := err.(*DetailedErrorResponse); ok {
		if errResp.StatusCode >= http.StatusInternalServerError {
			log.Printf(
				"[api-error] status=%d method=%s path=%s message=%s",
				errResp.StatusCode,
				ctx.Request.Method,
				ctx.Request.URL.Path,
				errResp.Message,
			)
			ctx.JSON(errResp.StatusCode, Response{Error: genericInternalErrorMessage})
			return
		}
		ctx.JSON(errResp.StatusCode, Response{Error: errResp.Message, Data: errResp.Data})
		return
	}

	// Default to internal server error
	log.Printf(
		"[api-error] status=%d method=%s path=%s message=%v",
		http.StatusInternalServerError,
		ctx.Request.Method,
		ctx.Request.URL.Path,
		err,
	)
	ctx.JSON(http.StatusInternalServerError, Response{Error: genericInternalErrorMessage})
}
