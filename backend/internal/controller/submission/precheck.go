package submission

import (
	"io"
	"net/http"
	"strconv"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

// PreCheck godoc
// @Summary      Pre-check paper before submission
// @Description  Validate a paper file against conference requirements without creating a submission (pre-check)
// @Tags         submissions
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        file formData file true "Paper file to validate"
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

	if _, exists := utils.GetEmail(ginCtx); !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	fileHeader, err := ginCtx.FormFile("file")
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "file is required")
	}

	fileReader, err := fileHeader.Open()
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to open file")
	}
	defer fileReader.Close()

	fileContent, err := io.ReadAll(fileReader)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to read file")
	}
	if len(fileContent) == 0 {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "file is empty")
	}

	conference, err := c.conferenceStorage.GetByID(ctx, conferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	runResponse, err := c.runSubmissionGating(
		ginCtx,
		conference,
		precheckModeAdvisory,
		precheckSourceAuthorPrecheck,
		nil,
		nil,
		fileContent,
		fileHeader.Filename,
		fileHeader.Header.Get("Content-Type"),
	)
	if err != nil {
		return nil, mapSubmissionGatingClientError(err)
	}

	report := mapGatingRunToComplianceReport(runResponse, nil, fileHeader.Filename)
	return &report, nil
}
