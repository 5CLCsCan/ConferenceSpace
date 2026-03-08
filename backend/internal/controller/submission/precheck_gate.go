package submission

import (
	"context"
	"io"
	"os"
	"path/filepath"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
	"github.com/dcao/conferencespace/internal/deskrejection/pipeline"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
)

const acceptForReviewDecision = "accept_for_review"
const maxPrecheckFileBytes int64 = 25 * 1024 * 1024

func (c *Controller) ensureSubmissionPrecheckApprovedFromBytes(
	ctx context.Context,
	conference *dto.ConferenceResponse,
	fileContent []byte,
	originalName string,
) error {
	tempFilePath, err := writeTemporaryFile(fileContent, filepath.Ext(originalName))
	if err != nil {
		return handler.NewErrorResponse(500, "failed to prepare temporary file for precheck")
	}
	defer os.Remove(tempFilePath)

	return c.ensureSubmissionPrecheckApprovedFromPath(ctx, conference, tempFilePath)
}

func (c *Controller) ensureSubmissionPrecheckApprovedFromPath(
	ctx context.Context,
	conference *dto.ConferenceResponse,
	filePath string,
) error {
	if conference == nil {
		return handler.NewErrorResponse(404, "conference not found")
	}

	paperConfig := convertConferenceConfigToPaperRuleConfig(conference)
	if c.geminiClient != nil {
		ctx = context.WithValue(ctx, "gemini_client", c.geminiClient)
	}

	report, err := pipeline.Run(ctx, filePath, paperConfig)
	if err != nil {
		return mapPrecheckError(err)
	}

	if report.Decision == acceptForReviewDecision {
		return nil
	}

	blockingItems := buildBlockingItems(report)
	return handler.NewDetailedErrorResponse(422, "submission blocked by precheck", &dto.PrecheckBlockedResponse{
		Code:          "PRECHECK_BLOCKED",
		Decision:      report.Decision,
		BlockingItems: blockingItems,
	})
}

func (c *Controller) ensureSubmissionPrecheckApprovedForStoredFile(
	ctx context.Context,
	conference *dto.ConferenceResponse,
	file *dto.SubmissionFileMetadata,
) error {
	if file == nil || file.Path == "" {
		return handler.NewErrorResponse(400, "paper file is required to run precheck")
	}

	reader, err := c.fileStorage.Open(file.Path)
	if err != nil {
		return handler.NewErrorResponse(404, "paper file is not available")
	}
	defer reader.Close()

	content, err := io.ReadAll(io.LimitReader(reader, maxPrecheckFileBytes+1))
	if err != nil {
		return handler.NewErrorResponse(500, "failed to read paper file for precheck")
	}
	if int64(len(content)) > maxPrecheckFileBytes {
		return handler.NewErrorResponse(400, "paper file is too large to precheck")
	}

	originalName := file.OriginalName
	if originalName == "" {
		originalName = file.Filename
	}

	return c.ensureSubmissionPrecheckApprovedFromBytes(ctx, conference, content, originalName)
}

func buildBlockingItems(report models.ComplianceReport) []dto.PrecheckBlockingItem {
	items := make([]dto.PrecheckBlockingItem, 0)
	for _, result := range report.DetailedResults {
		if result.Status == "pass" {
			continue
		}
		items = append(items, dto.PrecheckBlockingItem{
			ItemID:      result.ItemID,
			Category:    result.Category,
			Description: result.Description,
			Status:      result.Status,
			Details:     result.Details,
		})
	}
	return items
}

func writeTemporaryFile(content []byte, ext string) (string, error) {
	if ext == "" {
		ext = ".pdf"
	}

	tempFile, err := os.CreateTemp("", "submission-precheck-*"+ext)
	if err != nil {
		return "", err
	}
	tempFilePath := tempFile.Name()
	defer tempFile.Close()

	if _, err := tempFile.Write(content); err != nil {
		return "", err
	}
	return tempFilePath, nil
}
