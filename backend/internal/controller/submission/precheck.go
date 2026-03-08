package submission

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/dcao/conferencespace/internal/deskrejection/drerrors"
	"github.com/dcao/conferencespace/internal/deskrejection/models"
	"github.com/dcao/conferencespace/internal/deskrejection/pipeline"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
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
	pattern := "precheck-*"
	if ext := filepath.Ext(file.Filename); ext != "" {
		pattern += ext
	}
	tempFile, err := os.CreateTemp("", pattern)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to prepare temporary file")
	}
	tempFilePath := tempFile.Name()
	_ = tempFile.Close()

	if err := ginCtx.SaveUploadedFile(file, tempFilePath); err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to save file")
	}
	defer os.Remove(tempFilePath) // Clean up temp file

	// Get conference configuration
	conference, err := c.conferenceStorage.GetByID(ctx, conferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	// Convert conference configuration to paper rule configuration
	paperConfig := convertConferenceConfigToPaperRuleConfig(conference)

	// Add Gemini client to context if available
	if c.geminiClient != nil {
		ctx = context.WithValue(ctx, "gemini_client", c.geminiClient)
	}

	// Run desk rejection validation
	report, err := pipeline.Run(ctx, tempFilePath, paperConfig)
	if err != nil {
		return nil, mapPrecheckError(err)
	}

	// Return report without storing anything
	return &report, nil
}

// convertConferenceConfigToPaperRuleConfig converts conference configuration to paper rule configuration
func convertConferenceConfigToPaperRuleConfig(conference *dto.ConferenceResponse) *models.PaperRuleConfig {
	// Start with default configuration
	paperConfig := models.NewPaperRuleConfig()
	if conference == nil {
		return paperConfig
	}

	paperConfig.ConferenceDomains = conference.Domain

	conf := conference.Configurations
	// Apply conference-specific settings if available
	if conf != nil {
		if conf.MaximumPages != nil {
			paperConfig.MaxPages = *conf.MaximumPages
		}

		if conf.DeskRejectionSettings != nil {
			dr := conf.DeskRejectionSettings
			if dr.MinReferences != nil {
				paperConfig.MinReferences = *dr.MinReferences
			}
			if len(dr.RequiredSections) > 0 {
				paperConfig.RequiredSections = dr.RequiredSections
			}
			if dr.TitleMaxWords != nil {
				paperConfig.TitleMaxWords = *dr.TitleMaxWords
			}
			if dr.MaxSentenceWords != nil {
				paperConfig.MaxSentenceWords = *dr.MaxSentenceWords
			}
			if dr.Thresholds != nil {
				if dr.Thresholds.DeskRejectScore != nil {
					paperConfig.Thresholds.DeskRejectScore = *dr.Thresholds.DeskRejectScore
				}
				if dr.Thresholds.AcceptScore != nil {
					paperConfig.Thresholds.AcceptScore = *dr.Thresholds.AcceptScore
				}
			}
			if len(dr.Weights) > 0 {
				paperConfig.Weights = dr.Weights
			}
			if dr.CustomRules != nil {
				if dr.CustomRules.MinDatasets != nil {
					paperConfig.CustomRules.MinDatasets = *dr.CustomRules.MinDatasets
				}
				if dr.CustomRules.MinimumTables != nil {
					paperConfig.CustomRules.MinimumTables = *dr.CustomRules.MinimumTables
				}
				if dr.CustomRules.AuthorAnonymizationRequired != nil {
					paperConfig.CustomRules.AuthorAnonymizationReq = *dr.CustomRules.AuthorAnonymizationRequired
				}
				if len(dr.CustomRules.CriticalKeywordsRequired) > 0 {
					paperConfig.CustomRules.CriticalKeywordsReq = dr.CustomRules.CriticalKeywordsRequired
				}
				if len(dr.CustomRules.BannedPhrases) > 0 {
					paperConfig.CustomRules.BannedPhrases = dr.CustomRules.BannedPhrases
				}
			}
			if len(dr.ScopeKeywords) > 0 {
				paperConfig.ConferenceDomains = dr.ScopeKeywords
			}
			if len(dr.PromptFragments) > 0 {
				paperConfig.PromptFragments = dr.PromptFragments
			}
		}
	}

	return paperConfig
}

func mapPrecheckError(err error) error {
	if typedErr, ok := err.(*drerrors.Error); ok {
		return handler.NewDetailedErrorResponse(http.StatusUnprocessableEntity, "precheck failed", map[string]interface{}{
			"code":     "PRECHECK_FAILED",
			"category": typedErr.Category,
			"message":  typedErr.Message,
		})
	}

	return handler.NewDetailedErrorResponse(http.StatusUnprocessableEntity, "precheck failed", map[string]interface{}{
		"code":     "PRECHECK_FAILED",
		"category": drerrors.CategoryPipeline,
		"message":  err.Error(),
	})
}
