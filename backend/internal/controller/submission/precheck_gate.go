package submission

import (
	"net/http"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/gin-gonic/gin"
)

const maxPrecheckFileBytes int64 = 25 * 1024 * 1024

func (c *Controller) ensureSubmissionPrecheckApprovedFromBytes(
	ginCtx *gin.Context,
	conference *dto.ConferenceResponse,
	submission *dto.Submission,
	submissionID *int64,
	fileContent []byte,
	originalName string,
	contentType string,
	source string,
) error {
	runResponse, err := gateSubmissionWithBytes(
		c,
		ginCtx,
		conference,
		submission,
		submissionID,
		source,
		fileContent,
		originalName,
		contentType,
	)
	if err != nil {
		return err
	}

	if runResponse.Verdict != "block" {
		return nil
	}

	return handler.NewDetailedErrorResponse(http.StatusUnprocessableEntity, "submission blocked by precheck", &dto.PrecheckBlockedResponse{
		Code:          "PRECHECK_BLOCKED",
		Decision:      deriveLegacyDecision(runResponse),
		BlockingItems: buildBlockingItemsFromGatingRun(runResponse),
	})
}

func (c *Controller) ensureSubmissionPrecheckApprovedForStoredFile(
	ginCtx *gin.Context,
	conference *dto.ConferenceResponse,
	submission *dto.Submission,
	source string,
) error {
	runResponse, err := gateSubmissionWithStoredFile(c, ginCtx, conference, submission, source)
	if err != nil {
		return err
	}

	if runResponse.Verdict != "block" {
		return nil
	}

	return handler.NewDetailedErrorResponse(http.StatusUnprocessableEntity, "submission blocked by precheck", &dto.PrecheckBlockedResponse{
		Code:          "PRECHECK_BLOCKED",
		Decision:      deriveLegacyDecision(runResponse),
		BlockingItems: buildBlockingItemsFromGatingRun(runResponse),
	})
}
