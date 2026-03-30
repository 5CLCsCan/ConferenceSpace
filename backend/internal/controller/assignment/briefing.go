package assignment

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"strings"

	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

const maxReviewerBriefingFileBytes int64 = 25 * 1024 * 1024

func (c *Controller) GetReviewerBriefing(
	ginCtx *gin.Context,
	req *dto.ReviewerBriefingRequest,
) (*aiServiceClient.ReviewerBriefingResolveResponse, error) {
	if c.briefingClient == nil {
		return nil, handler.NewErrorResponse(503, "reviewer briefing service is not configured")
	}

	assignment, submission, requestPayload, _, authHeader, err := c.prepareReviewerBriefingRequest(ginCtx, req)
	if err != nil {
		return nil, err
	}
	_ = assignment
	_ = submission

	response, err := c.briefingClient.LookupReviewerBriefing(ginCtx.Request.Context(), authHeader, requestPayload)
	if err != nil {
		return nil, handler.NewErrorResponse(502, "reviewer briefing workflow failed")
	}
	return response, nil
}

func (c *Controller) GenerateReviewerBriefing(
	ginCtx *gin.Context,
	req *dto.ReviewerBriefingRequest,
) (*aiServiceClient.ReviewerBriefingResolveResponse, error) {
	if c.briefingClient == nil {
		return nil, handler.NewErrorResponse(503, "reviewer briefing service is not configured")
	}
	if c.fileStorage == nil {
		return nil, handler.NewErrorResponse(503, "file storage is not configured")
	}

	_, submission, requestPayload, fileMeta, authHeader, err := c.prepareReviewerBriefingRequest(ginCtx, req)
	if err != nil {
		return nil, err
	}
	requestPayload.Action = "generate"
	if submission.File == nil || strings.TrimSpace(submission.File.Path) == "" {
		return nil, handler.NewErrorResponse(400, "submission manuscript is not available")
	}

	reader, err := c.fileStorage.Open(submission.File.Path)
	if err != nil {
		return nil, handler.NewErrorResponse(404, "submission manuscript is not available")
	}
	defer reader.Close()

	fileContent, err := io.ReadAll(io.LimitReader(reader, maxReviewerBriefingFileBytes+1))
	if err != nil {
		return nil, handler.NewErrorResponse(500, "failed to read submission manuscript")
	}
	if int64(len(fileContent)) > maxReviewerBriefingFileBytes {
		return nil, handler.NewErrorResponse(400, "submission manuscript is too large for reviewer briefing")
	}

	response, err := c.briefingClient.GenerateReviewerBriefing(
		ginCtx.Request.Context(),
		authHeader,
		requestPayload,
		fileMeta.OriginalFilename,
		fileContent,
	)
	if err != nil {
		return nil, handler.NewErrorResponse(502, "reviewer briefing workflow failed")
	}
	return response, nil
}

func (c *Controller) prepareReviewerBriefingRequest(
	ginCtx *gin.Context,
	req *dto.ReviewerBriefingRequest,
) (
	*dto.Assignment,
	*dto.Submission,
	*aiServiceClient.ReviewerBriefingResolveRequest,
	aiServiceClient.ReviewerBriefingFileMetadataPayload,
	string,
	error,
) {
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, nil, nil, aiServiceClient.ReviewerBriefingFileMetadataPayload{}, "", handler.NewErrorResponse(401, "user not authenticated")
	}
	userID, _ := utils.GetUserID(ginCtx)

	assignment, err := c.assignmentStorage.GetByID(ginCtx.Request.Context(), req.AssignmentID)
	if err != nil || assignment.ConferenceID != req.ConferenceID {
		return nil, nil, nil, aiServiceClient.ReviewerBriefingFileMetadataPayload{}, "", handler.NewErrorResponse(404, "assignment not found")
	}

	reviewer, err := c.reviewerStorage.GetByID(ginCtx.Request.Context(), assignment.ReviewerID)
	if err != nil {
		return nil, nil, nil, aiServiceClient.ReviewerBriefingFileMetadataPayload{}, "", handler.NewErrorResponse(500, "failed to get reviewer info")
	}
	if reviewer.Email != userEmail {
		return nil, nil, nil, aiServiceClient.ReviewerBriefingFileMetadataPayload{}, "", handler.NewErrorResponse(403, "you are not authorized to access this reviewer briefing")
	}

	submission, err := c.submissionStorage.GetByID(ginCtx.Request.Context(), assignment.SubmissionID)
	if err != nil || submission.ConferenceID != req.ConferenceID {
		return nil, nil, nil, aiServiceClient.ReviewerBriefingFileMetadataPayload{}, "", handler.NewErrorResponse(404, "submission not found")
	}

	fileMeta := buildReviewerBriefingFileMetadataPayload(submission)
	requestPayload := &aiServiceClient.ReviewerBriefingResolveRequest{
		Action:                     "lookup",
		ConferenceID:               req.ConferenceID,
		AssignmentID:               req.AssignmentID,
		SubmissionID:               submission.ID,
		Actor:                      aiServiceClient.ActorPayload{UserID: userID, Email: userEmail, Role: "reviewer"},
		SubmissionStateFingerprint: computeReviewerBriefingFingerprint(submission),
		Submission:                 buildReviewerBriefingSubmissionPayload(submission),
		FileMetadata:               fileMeta,
	}

	return assignment, submission, requestPayload, fileMeta, ginCtx.GetHeader("Authorization"), nil
}

func buildReviewerBriefingSubmissionPayload(submission *dto.Submission) aiServiceClient.ReviewerBriefingSubmissionPayload {
	if submission == nil {
		return aiServiceClient.ReviewerBriefingSubmissionPayload{}
	}

	keywords := []string{}
	if submission.Information != nil {
		keywords = dedupeNormalizedStrings(submission.Information.Keywords)
	}

	return aiServiceClient.ReviewerBriefingSubmissionPayload{
		Title:    normalizeBriefingText(submission.Title),
		Abstract: normalizeBriefingText(submission.Abstract),
		Keywords: keywords,
		Track:    normalizeBriefingText(submission.Track),
	}
}

func buildReviewerBriefingFileMetadataPayload(submission *dto.Submission) aiServiceClient.ReviewerBriefingFileMetadataPayload {
	if submission == nil || submission.File == nil {
		return aiServiceClient.ReviewerBriefingFileMetadataPayload{}
	}
	return aiServiceClient.ReviewerBriefingFileMetadataPayload{
		OriginalFilename: strings.TrimSpace(submission.File.OriginalName),
		SizeBytes:        submission.File.Size,
		ContentType:      strings.TrimSpace(submission.File.MimeType),
	}
}

func computeReviewerBriefingFingerprint(submission *dto.Submission) string {
	payload := map[string]interface{}{
		"submission_id": submission.ID,
		"title":         normalizeBriefingText(submission.Title),
		"abstract":      normalizeBriefingText(submission.Abstract),
		"track":         normalizeBriefingText(submission.Track),
		"updated_at":    submission.UpdatedAt.UTC().Format("2006-01-02T15:04:05.999999999Z07:00"),
		"keywords":      []string{},
		"file": map[string]interface{}{
			"original_name": "",
			"size":          int64(0),
			"mime_type":     "",
		},
	}
	if submission.Information != nil {
		payload["keywords"] = dedupeNormalizedStrings(submission.Information.Keywords)
	}
	if submission.File != nil {
		payload["file"] = map[string]interface{}{
			"original_name": strings.TrimSpace(submission.File.OriginalName),
			"size":          submission.File.Size,
			"mime_type":     strings.TrimSpace(submission.File.MimeType),
		}
	}

	encoded, _ := json.Marshal(payload)
	hash := sha256.Sum256(encoded)
	return "sha256:" + hex.EncodeToString(hash[:])
}

func normalizeBriefingText(value string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
}

func dedupeNormalizedStrings(values []string) []string {
	seen := map[string]struct{}{}
	output := make([]string, 0, len(values))
	for _, value := range values {
		normalized := strings.ToLower(normalizeBriefingText(value))
		if normalized == "" {
			continue
		}
		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}
		output = append(output, normalized)
	}
	return output
}
