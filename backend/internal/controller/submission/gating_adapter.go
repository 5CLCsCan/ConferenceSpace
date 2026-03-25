package submission

import (
	"fmt"
	"io"
	"log"
	"mime"
	"path/filepath"
	"strings"

	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/deskrejection/models"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

const (
	precheckModeAdvisory            = "advisory"
	precheckModeGate                = "gate"
	precheckSourceAuthorPrecheck    = "author_precheck"
	precheckSourceSubmissionCreate  = "submission_create"
	precheckSourceSubmissionPublish = "submission_publish"
)

func (c *Controller) runSubmissionGating(
	ginCtx *gin.Context,
	conference *dto.ConferenceResponse,
	mode string,
	source string,
	submission *dto.Submission,
	submissionID *int64,
	fileContent []byte,
	originalName string,
	contentType string,
) (*aiServiceClient.GatingRunResponse, error) {
	if c.gatingClient == nil {
		log.Printf("[submission-gating] client_missing conference_id=%d source=%s mode=%s", conferenceIDOrZero(conference), source, mode)
		return nil, handler.NewErrorResponse(503, "submission gating service is not configured")
	}
	if conference == nil {
		return nil, handler.NewErrorResponse(404, "conference not found")
	}
	if len(fileContent) == 0 {
		return nil, handler.NewErrorResponse(400, "paper file is required to run precheck")
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(401, "user not authenticated")
	}
	userID, _ := utils.GetUserID(ginCtx)

	requestPayload := &aiServiceClient.GatingRunRequest{
		Mode:         mode,
		Source:       source,
		ConferenceID: conference.ID,
		SubmissionID: submissionID,
		Actor: aiServiceClient.ActorPayload{
			UserID: userID,
			Email:  userEmail,
			Role:   "author",
		},
		Submission:   buildSubmissionPayload(submission),
		Policy:       buildPolicyPayload(conference),
		FileMetadata: buildFileMetadataPayload(originalName, contentType, int64(len(fileContent))),
	}

	authHeader := ginCtx.GetHeader("Authorization")
	response, err := c.gatingClient.RunSubmissionMaterialGating(
		ginCtx.Request.Context(),
		authHeader,
		requestPayload,
		originalName,
		fileContent,
	)
	if err != nil {
		log.Printf(
			"[submission-gating] workflow_failed conference_id=%d source=%s mode=%s file=%q error=%v",
			conference.ID,
			source,
			mode,
			originalName,
			err,
		)
		return nil, handler.NewErrorResponse(502, "submission gating workflow failed")
	}

	if response.Verdict == "error" {
		log.Printf(
			"[submission-gating] workflow_returned_error conference_id=%d source=%s mode=%s run_id=%s",
			conference.ID,
			source,
			mode,
			response.RunID,
		)
		return nil, handler.NewErrorResponse(502, "submission gating workflow returned an error verdict")
	}

	return response, nil
}

func buildSubmissionPayload(submission *dto.Submission) aiServiceClient.SubmissionPayload {
	payload := aiServiceClient.SubmissionPayload{}
	if submission == nil {
		return payload
	}

	payload.Title = submission.Title
	payload.Abstract = submission.Abstract
	payload.Track = submission.Track
	payload.Status = submission.Status

	if submission.Information != nil {
		information := aiServiceClient.SubmissionInformationPayload{
			Keywords:        cloneStringSlice(submission.Information.Keywords),
			CoAuthors:       cloneStringSlice(submission.Information.CoAuthors),
			PaperType:       submission.Information.PaperType,
			TrackName:       submission.Information.TrackName,
			AdditionalNotes: submission.Information.AdditionalNotes,
			Metadata:        cloneMap(submission.Information.Metadata),
		}
		if len(submission.Information.DeclaredConflicts) > 0 {
			information.DeclaredConflicts = make([]aiServiceClient.ConflictDeclarationPayload, 0, len(submission.Information.DeclaredConflicts))
			for _, conflict := range submission.Information.DeclaredConflicts {
				information.DeclaredConflicts = append(information.DeclaredConflicts, aiServiceClient.ConflictDeclarationPayload{
					Email:  strings.TrimSpace(conflict.Email),
					Reason: strings.TrimSpace(conflict.Reason),
				})
			}
		}
		payload.Information = information
	}

	return payload
}

func buildPolicyPayload(conference *dto.ConferenceResponse) aiServiceClient.PolicyPayload {
	payload := aiServiceClient.PolicyPayload{
		SubmissionFormat: []string{"PDF"},
		DeskRejectionSettings: aiServiceClient.DeskRejectionSettingsPayload{
			Enabled:          false,
			RequiredSections: []string{},
			Thresholds:       map[string]float64{},
			Weights:          map[string]float64{},
			PromptFragments:  []string{},
		},
		WorkflowSettings: aiServiceClient.WorkflowSettingsPayload{},
	}
	if conference == nil || conference.Configurations == nil {
		return payload
	}

	config := conference.Configurations
	payload.MaximumPages = config.MaximumPages
	payload.ReviewType = valueOrEmpty(config.ReviewType)
	payload.SubmissionFormat = parseSubmissionFormats(config.SubmissionFormat)
	payload.WorkflowSettings.StrictDeadlines = boolValue(config.WorkflowSettings != nil && config.WorkflowSettings.StrictDeadlines != nil && *config.WorkflowSettings.StrictDeadlines)

	desk := config.DeskRejectionSettings
	if desk == nil {
		return payload
	}

	payload.DeskRejectionSettings.Enabled = boolValue(desk.Enabled != nil && *desk.Enabled)
	payload.DeskRejectionSettings.MinReferences = desk.MinReferences
	payload.DeskRejectionSettings.RequiredSections = cloneStringSlice(desk.RequiredSections)
	payload.DeskRejectionSettings.PromptFragments = compactStrings(desk.PromptFragments)

	if desk.Thresholds != nil {
		payload.DeskRejectionSettings.Thresholds = map[string]float64{}
		if desk.Thresholds.DeskRejectScore != nil {
			payload.DeskRejectionSettings.Thresholds["desk_reject_score"] = *desk.Thresholds.DeskRejectScore
		}
		if desk.Thresholds.AcceptScore != nil {
			payload.DeskRejectionSettings.Thresholds["accept_score"] = *desk.Thresholds.AcceptScore
		}
	}

	payload.DeskRejectionSettings.Weights = cloneFloatMap(desk.Weights)
	if desk.CustomRules != nil {
		payload.DeskRejectionSettings.CustomRules = aiServiceClient.DeskRejectionCustomRulesPayload{
			MinDatasets:                 desk.CustomRules.MinDatasets,
			MinimumTables:               desk.CustomRules.MinimumTables,
			AuthorAnonymizationRequired: desk.CustomRules.AuthorAnonymizationRequired,
			CriticalKeywordsRequired:    cloneStringSlice(desk.CustomRules.CriticalKeywordsRequired),
			BannedPhrases:               cloneStringSlice(desk.CustomRules.BannedPhrases),
		}
	}

	return payload
}

func buildFileMetadataPayload(originalName string, contentType string, sizeBytes int64) aiServiceClient.FileMetadataPayload {
	return aiServiceClient.FileMetadataPayload{
		OriginalFilename: originalName,
		SizeBytes:        sizeBytes,
		ContentType:      resolveContentType(originalName, contentType),
	}
}

func mapGatingRunToComplianceReport(
	response *aiServiceClient.GatingRunResponse,
	submission *dto.Submission,
	originalName string,
) models.ComplianceReport {
	results := buildLegacyCheckResults(response)
	categoryScores := buildCategoryScores(results)
	passedCount, failedCount := summarizeLegacyResults(results)
	totalItems := len(results)
	passRate := 1.0
	if totalItems > 0 {
		passRate = float64(passedCount) / float64(totalItems)
	}

	score := deriveOverallScore(response, categoryScores)

	return models.ComplianceReport{
		PaperTitle:      resolvePaperTitle(submission, originalName),
		OverallScore:    score,
		Decision:        deriveLegacyDecision(response),
		Summary:         models.Summary{TotalItems: totalItems, Passed: passedCount, Failed: failedCount, PassRate: passRate},
		CategoryScores:  categoryScores,
		DetailedResults: results,
	}
}

func buildBlockingItemsFromGatingRun(response *aiServiceClient.GatingRunResponse) []dto.PrecheckBlockingItem {
	if response == nil {
		return []dto.PrecheckBlockingItem{}
	}

	items := make([]dto.PrecheckBlockingItem, 0)
	for _, finding := range response.Findings {
		if finding.Severity != "block" {
			continue
		}
		items = append(items, dto.PrecheckBlockingItem{
			ItemID:      fallbackString(finding.RuleID, "submission_gating"),
			Category:    legacyCategoryForFinding(finding),
			Description: finding.Message,
			Status:      "fail",
			Details:     composeLegacyDetails(finding.Message, remediationForFinding(response, finding)),
		})
	}

	if len(items) > 0 {
		return items
	}

	for _, result := range buildLegacyCheckResults(response) {
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

func buildLegacyCheckResults(response *aiServiceClient.GatingRunResponse) []models.CheckResult {
	if response == nil {
		return []models.CheckResult{}
	}

	results := make([]models.CheckResult, 0, len(response.Findings))
	for _, finding := range response.Findings {
		remediation := remediationForFinding(response, finding)
		results = append(results, models.CheckResult{
			ItemID:      fallbackString(finding.RuleID, "submission_gating"),
			Category:    legacyCategoryForFinding(finding),
			Description: finding.Message,
			Status:      legacyStatusForSeverity(finding.Severity),
			Details:     composeLegacyDetails(finding.Message, remediation),
			Confidence:  confidenceForFinding(finding),
		})
	}

	if len(results) > 0 {
		return results
	}

	return []models.CheckResult{
		{
			ItemID:      "submission_gating_summary",
			Category:    "submission_gating",
			Description: fallbackPassMessage(response),
			Status:      legacyStatusForSeverity(response.Verdict),
			Details:     fallbackPassRemediation(response),
			Confidence:  1.0,
		},
	}
}

func buildCategoryScores(results []models.CheckResult) map[string]models.CategoryScore {
	if len(results) == 0 {
		return map[string]models.CategoryScore{}
	}

	type categoryAccumulator struct {
		totalWeight float64
		passed      int
		failed      int
		count       int
	}

	accumulators := map[string]*categoryAccumulator{}
	for _, result := range results {
		acc, ok := accumulators[result.Category]
		if !ok {
			acc = &categoryAccumulator{}
			accumulators[result.Category] = acc
		}
		acc.count++
		acc.totalWeight += scoreWeightForStatus(result.Status)
		switch result.Status {
		case "pass":
			acc.passed++
		case "fail":
			acc.failed++
		}
	}

	scores := make(map[string]models.CategoryScore, len(accumulators))
	for category, acc := range accumulators {
		score := 100.0
		if acc.count > 0 {
			score = (acc.totalWeight / float64(acc.count)) * 100.0
		}
		scores[category] = models.CategoryScore{
			Score:  score,
			Passed: acc.passed,
			Failed: acc.failed,
			Weight: 1.0,
		}
	}

	return scores
}

func summarizeLegacyResults(results []models.CheckResult) (int, int) {
	passed := 0
	failed := 0
	for _, result := range results {
		switch result.Status {
		case "pass":
			passed++
		case "fail":
			failed++
		}
	}
	return passed, failed
}

func remediationForFinding(response *aiServiceClient.GatingRunResponse, finding aiServiceClient.FindingPayload) string {
	for _, guidance := range response.Guidance {
		if guidance.RuleID == finding.RuleID && guidance.Source == finding.Source {
			return strings.TrimSpace(guidance.Remediation)
		}
	}
	if strings.TrimSpace(finding.Remediation) != "" {
		return strings.TrimSpace(finding.Remediation)
	}
	return ""
}

func confidenceForFinding(finding aiServiceClient.FindingPayload) float64 {
	if finding.Source == "llm_content_evaluation" {
		return 0.65
	}
	return 1.0
}

func legacyCategoryForFinding(finding aiServiceClient.FindingPayload) string {
	switch {
	case strings.TrimSpace(finding.Source) != "":
		return strings.TrimSpace(finding.Source)
	case strings.TrimSpace(finding.RuleID) != "":
		return strings.TrimSpace(finding.RuleID)
	default:
		return "submission_gating"
	}
}

func legacyStatusForSeverity(severity string) string {
	switch severity {
	case "block":
		return "fail"
	case "warn":
		return "warning"
	default:
		return "pass"
	}
}

func deriveLegacyDecision(response *aiServiceClient.GatingRunResponse) string {
	if response == nil {
		return "manual_review"
	}
	if strings.TrimSpace(response.Decision) != "" {
		return response.Decision
	}
	switch response.Verdict {
	case "block":
		return "desk_reject"
	case "warn":
		return "manual_review"
	default:
		return "accept_for_review"
	}
}

func deriveOverallScore(response *aiServiceClient.GatingRunResponse, categoryScores map[string]models.CategoryScore) float64 {
	if response != nil && response.Score != nil {
		return *response.Score * 100.0
	}
	if len(categoryScores) == 0 {
		return 100.0
	}
	total := 0.0
	for _, score := range categoryScores {
		total += score.Score
	}
	return total / float64(len(categoryScores))
}

func resolvePaperTitle(submission *dto.Submission, originalName string) string {
	if submission != nil && strings.TrimSpace(submission.Title) != "" {
		return strings.TrimSpace(submission.Title)
	}
	base := filepath.Base(strings.TrimSpace(originalName))
	if base == "" {
		return "Uploaded submission"
	}
	return strings.TrimSuffix(base, filepath.Ext(base))
}

func resolveContentType(originalName string, provided string) string {
	if strings.TrimSpace(provided) != "" {
		return strings.TrimSpace(provided)
	}
	if guessed := mime.TypeByExtension(strings.ToLower(filepath.Ext(originalName))); guessed != "" {
		return guessed
	}
	return "application/octet-stream"
}

func parseSubmissionFormats(format *string) []string {
	if format == nil || strings.TrimSpace(*format) == "" {
		return []string{"PDF"}
	}

	rawItems := strings.Split(*format, ",")
	formats := make([]string, 0, len(rawItems))
	for _, item := range rawItems {
		value := strings.TrimSpace(item)
		if value == "" {
			continue
		}
		switch strings.ToUpper(value) {
		case "WORD":
			formats = append(formats, "DOCX")
		default:
			formats = append(formats, value)
		}
	}
	if len(formats) == 0 {
		return []string{"PDF"}
	}
	return formats
}

func composeLegacyDetails(message string, remediation string) string {
	if remediation == "" {
		return message
	}
	return fmt.Sprintf("%s Remediation: %s", message, remediation)
}

func fallbackPassMessage(response *aiServiceClient.GatingRunResponse) string {
	if response != nil && response.Verdict == "warn" {
		return "Submission passed deterministic checks with advisory warnings."
	}
	if response != nil && response.Verdict == "block" {
		return "Submission failed submission gating checks."
	}
	return "No submission gating issues detected."
}

func fallbackPassRemediation(response *aiServiceClient.GatingRunResponse) string {
	if response != nil && response.Verdict == "warn" {
		return "Review the advisory guidance before final submission."
	}
	if response != nil && response.Verdict == "block" {
		return "Review the blocking findings and resubmit after addressing them."
	}
	return "No remediation is required."
}

func scoreWeightForStatus(status string) float64 {
	switch status {
	case "fail":
		return 0.0
	case "warning":
		return 0.5
	default:
		return 1.0
	}
}

func cloneStringSlice(values []string) []string {
	if len(values) == 0 {
		return []string{}
	}
	cloned := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			cloned = append(cloned, trimmed)
		}
	}
	return cloned
}

func cloneMap(values map[string]interface{}) map[string]interface{} {
	if len(values) == 0 {
		return map[string]interface{}{}
	}
	cloned := make(map[string]interface{}, len(values))
	for key, value := range values {
		cloned[key] = value
	}
	return cloned
}

func cloneFloatMap(values map[string]float64) map[string]float64 {
	if len(values) == 0 {
		return map[string]float64{}
	}
	cloned := make(map[string]float64, len(values))
	for key, value := range values {
		cloned[key] = value
	}
	return cloned
}

func compactStrings(values []string) []string {
	if len(values) == 0 {
		return []string{}
	}
	trimmed := make([]string, 0, len(values))
	for _, value := range values {
		candidate := strings.TrimSpace(value)
		if candidate != "" {
			trimmed = append(trimmed, candidate)
		}
	}
	return trimmed
}

func fallbackString(value string, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return strings.TrimSpace(value)
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func boolValue(value bool) bool {
	return value
}

func conferenceIDOrZero(conference *dto.ConferenceResponse) int64 {
	if conference == nil {
		return 0
	}
	return conference.ID
}

func mapSubmissionGatingClientError(err error) error {
	if err == nil {
		return nil
	}
	if _, ok := err.(*handler.ErrorResponse); ok {
		return err
	}
	if _, ok := err.(*handler.DetailedErrorResponse); ok {
		return err
	}
	log.Printf("[submission-gating] unexpected_error error=%v", err)
	return handler.NewErrorResponse(502, "submission gating workflow failed")
}

func gateSubmissionWithBytes(
	c *Controller,
	ginCtx *gin.Context,
	conference *dto.ConferenceResponse,
	submission *dto.Submission,
	submissionID *int64,
	source string,
	fileContent []byte,
	originalName string,
	contentType string,
) (*aiServiceClient.GatingRunResponse, error) {
	response, err := c.runSubmissionGating(
		ginCtx,
		conference,
		precheckModeGate,
		source,
		submission,
		submissionID,
		fileContent,
		originalName,
		contentType,
	)
	if err != nil {
		return nil, mapSubmissionGatingClientError(err)
	}
	return response, nil
}

func gateSubmissionWithStoredFile(
	c *Controller,
	ginCtx *gin.Context,
	conference *dto.ConferenceResponse,
	submission *dto.Submission,
	source string,
) (*aiServiceClient.GatingRunResponse, error) {
	if submission == nil || submission.File == nil || submission.File.Path == "" {
		return nil, handler.NewErrorResponse(400, "paper file is required to run precheck")
	}

	reader, err := c.fileStorage.Open(submission.File.Path)
	if err != nil {
		return nil, handler.NewErrorResponse(404, "paper file is not available")
	}
	defer reader.Close()

	content, err := io.ReadAll(io.LimitReader(reader, maxPrecheckFileBytes+1))
	if err != nil {
		return nil, handler.NewErrorResponse(500, "failed to read paper file for precheck")
	}
	if int64(len(content)) > maxPrecheckFileBytes {
		return nil, handler.NewErrorResponse(400, "paper file is too large to precheck")
	}

	originalName := submission.File.OriginalName
	if originalName == "" {
		originalName = submission.File.Filename
	}

	submissionID := submission.ID
	return gateSubmissionWithBytes(
		c,
		ginCtx,
		conference,
		submission,
		&submissionID,
		source,
		content,
		originalName,
		submission.File.MimeType,
	)
}
