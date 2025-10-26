package submission

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
	"github.com/dcao/conferencespace/internal/deskrejection/pipeline"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PreCheck godoc
// @Summary      Pre-check paper before submission
// @Description  Validate a paper PDF against conference requirements without creating a submission (pre-check)
// @Tags         submissions
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        file formData file true "PDF file to validate"
// @Success      200 {object} models.ComplianceReport
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/precheck [post]
func (c *Controller) PreCheck(ginCtx *gin.Context) (*models.ComplianceReport, error) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	// Get authenticated user email
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}
	
	// Log user activity (optional, for analytics)
	_ = userEmail

	// Get file from form
	file, err := ginCtx.FormFile("file")
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "file is required")
	}

	// Save uploaded file temporarily
	tempDir := os.TempDir()
	tempFileName := uuid.New().String() + filepath.Ext(file.Filename)
	tempFilePath := filepath.Join(tempDir, tempFileName)

	if err := ginCtx.SaveUploadedFile(file, tempFilePath); err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to save file")
	}
	defer os.Remove(tempFilePath) // Clean up temp file

	// Get conference configuration
	conference, err := c.conferenceStorage.GetByID(ctx, conferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	// Get paper rule configuration
	paperConfig := conference.Configurations.GetPaperRuleConfig()

	// Run desk rejection validation
	report, err := pipeline.Run(ctx, tempFilePath, paperConfig)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "validation failed: "+err.Error())
	}

	// Return report without storing anything
	return &report, nil
}

