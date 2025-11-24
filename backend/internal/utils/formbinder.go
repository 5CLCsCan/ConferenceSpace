package utils

import (
	"encoding/json"
	"fmt"

	"github.com/gin-gonic/gin"
)

// BindMultipartForm binds multipart form data to a struct
// It looks for a JSON field in the form data and unmarshals it into the target struct
// This allows us to handle complex nested structures in multipart forms
//
// Usage:
//   var req dto.SubmissionCreateRequest
//   if err := utils.BindMultipartForm(ginCtx, "submission", &req); err != nil {
//       return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
//   }
func BindMultipartForm(ctx *gin.Context, jsonFieldName string, target interface{}) error {
	// Get the JSON field from form data
	jsonData := ctx.PostForm(jsonFieldName)
	if jsonData == "" {
		return fmt.Errorf("%s field is required in form data", jsonFieldName)
	}

	// Unmarshal JSON into target struct
	if err := json.Unmarshal([]byte(jsonData), target); err != nil {
		return fmt.Errorf("invalid %s data format: %w", jsonFieldName, err)
	}

	return nil
}

// ShouldBindFormOrJSON attempts to bind data from either multipart form or JSON
// First tries to parse as multipart form with a JSON field
// Falls back to standard JSON binding if multipart parsing fails
//
// This enables endpoints to accept both:
// - Content-Type: application/json (standard JSON body)
// - Content-Type: multipart/form-data (with JSON in a form field + optional files)
//
// Usage:
//   var req dto.SubmissionUpdateRequest
//   if err := utils.ShouldBindFormOrJSON(ginCtx, "submission", &req); err != nil {
//       return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
//   }
func ShouldBindFormOrJSON(ctx *gin.Context, jsonFieldName string, target interface{}) error {
	// Try to parse as multipart form first
	_, formErr := ctx.MultipartForm()
	
	if formErr == nil {
		// Multipart form data - extract JSON from form field
		return BindMultipartForm(ctx, jsonFieldName, target)
	}

	// Fall back to regular JSON binding
	if err := ctx.ShouldBindJSON(target); err != nil {
		return fmt.Errorf("invalid request format: %w", err)
	}

	return nil
}

