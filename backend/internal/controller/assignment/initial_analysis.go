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

const maxReviewerInitialAnalysisFileBytes int64 = 25 * 1024 * 1024

func (c *Controller) GetReviewerInitialAnalysis(
	ginCtx *gin.Context,
	req *dto.ReviewerBriefingRequest,
) (*aiServiceClient.ReviewerInitialAnalysisResolveResponse, error) {
	if c.workflowClient == nil {
		return nil, handler.NewErrorResponse(503, "reviewer initial analysis service is not configured")
	}

	assignment, submission, requestPayload, _, authHeader, err := c.prepareReviewerInitialAnalysisRequest(ginCtx, req)
	if err != nil {
		return nil, err
	}
	_ = assignment
	_ = submission

	response, err := c.workflowClient.LookupReviewerInitialAnalysis(ginCtx.Request.Context(), authHeader, requestPayload)
	if err != nil {
		return nil, handler.NewErrorResponse(502, "reviewer initial analysis workflow failed")
	}
	return response, nil
}

func (c *Controller) GenerateReviewerInitialAnalysis(
	ginCtx *gin.Context,
	req *dto.ReviewerBriefingRequest,
) (*aiServiceClient.ReviewerInitialAnalysisResolveResponse, error) {
	if c.workflowClient == nil {
		return nil, handler.NewErrorResponse(503, "reviewer initial analysis service is not configured")
	}
	if c.fileStorage == nil {
		return nil, handler.NewErrorResponse(503, "file storage is not configured")
	}

	_, submission, requestPayload, fileMeta, authHeader, err := c.prepareReviewerInitialAnalysisRequest(ginCtx, req)
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

	fileContent, err := io.ReadAll(io.LimitReader(reader, maxReviewerInitialAnalysisFileBytes+1))
	if err != nil {
		return nil, handler.NewErrorResponse(500, "failed to read submission manuscript")
	}
	if int64(len(fileContent)) > maxReviewerInitialAnalysisFileBytes {
		return nil, handler.NewErrorResponse(400, "submission manuscript is too large for reviewer initial analysis")
	}

	response, err := c.workflowClient.GenerateReviewerInitialAnalysis(
		ginCtx.Request.Context(),
		authHeader,
		requestPayload,
		fileMeta.OriginalFilename,
		fileContent,
	)
	if err != nil {
		return nil, handler.NewErrorResponse(502, "reviewer initial analysis workflow failed")
	}
	return response, nil
}

func (c *Controller) prepareReviewerInitialAnalysisRequest(
	ginCtx *gin.Context,
	req *dto.ReviewerBriefingRequest,
) (
	*dto.Assignment,
	*dto.Submission,
	*aiServiceClient.ReviewerInitialAnalysisResolveRequest,
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
	if !canAccessReviewerInitialAnalysis(assignment.Status) {
		return nil, nil, nil, aiServiceClient.ReviewerBriefingFileMetadataPayload{}, "", handler.NewErrorResponse(403, "this assignment is not available for reviewer initial analysis")
	}

	reviewer, err := c.reviewerStorage.GetByID(ginCtx.Request.Context(), assignment.ReviewerID)
	if err != nil {
		return nil, nil, nil, aiServiceClient.ReviewerBriefingFileMetadataPayload{}, "", handler.NewErrorResponse(500, "failed to get reviewer info")
	}
	if reviewer.Email != userEmail {
		return nil, nil, nil, aiServiceClient.ReviewerBriefingFileMetadataPayload{}, "", handler.NewErrorResponse(403, "you are not authorized to access this reviewer initial analysis")
	}

	submission, err := c.submissionStorage.GetByID(ginCtx.Request.Context(), assignment.SubmissionID)
	if err != nil || submission.ConferenceID != req.ConferenceID {
		return nil, nil, nil, aiServiceClient.ReviewerBriefingFileMetadataPayload{}, "", handler.NewErrorResponse(404, "submission not found")
	}

	domainTags := []string{}
	if submission.Information != nil {
		domainTags = dedupeNormalizedStrings(submission.Information.Keywords)
	}

	fileMeta := buildReviewerInitialAnalysisFileMetadataPayload(submission)
	requestPayload := &aiServiceClient.ReviewerInitialAnalysisResolveRequest{
		Action:                     "lookup",
		ConferenceID:               req.ConferenceID,
		AssignmentID:               req.AssignmentID,
		SubmissionID:               submission.ID,
		Actor:                      aiServiceClient.ActorPayload{UserID: userID, Email: userEmail, Role: "reviewer"},
		SubmissionStateFingerprint: computeReviewerInitialAnalysisFingerprint(submission),
		Submission:                 buildReviewerInitialAnalysisSubmissionPayload(submission),
		FileMetadata:               fileMeta,
		DomainTags:                 domainTags,
	}

	return assignment, submission, requestPayload, fileMeta, ginCtx.GetHeader("Authorization"), nil
}

func canAccessReviewerInitialAnalysis(status string) bool {
	return status == "pending" || status == "accepted" || status == "completed"
}

func buildReviewerInitialAnalysisSubmissionPayload(submission *dto.Submission) aiServiceClient.ReviewerBriefingSubmissionPayload {
	if submission == nil {
		return aiServiceClient.ReviewerBriefingSubmissionPayload{}
	}

	keywords := []string{}
	if submission.Information != nil {
		keywords = dedupeNormalizedStrings(submission.Information.Keywords)
	}

	return aiServiceClient.ReviewerBriefingSubmissionPayload{
		Title:    normalizeInitialAnalysisText(submission.Title),
		Abstract: normalizeInitialAnalysisText(submission.Abstract),
		Keywords: keywords,
		Track:    normalizeInitialAnalysisText(submission.Track),
	}
}

func buildReviewerInitialAnalysisFileMetadataPayload(submission *dto.Submission) aiServiceClient.ReviewerBriefingFileMetadataPayload {
	if submission == nil || submission.File == nil {
		return aiServiceClient.ReviewerBriefingFileMetadataPayload{}
	}
	return aiServiceClient.ReviewerBriefingFileMetadataPayload{
		OriginalFilename: strings.TrimSpace(submission.File.OriginalName),
		SizeBytes:        submission.File.Size,
		ContentType:      strings.TrimSpace(submission.File.MimeType),
	}
}

func computeReviewerInitialAnalysisFingerprint(submission *dto.Submission) string {
	payload := map[string]interface{}{
		"submission_id": submission.ID,
		"title":         normalizeInitialAnalysisText(submission.Title),
		"abstract":      normalizeInitialAnalysisText(submission.Abstract),
		"track":         normalizeInitialAnalysisText(submission.Track),
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

func normalizeInitialAnalysisText(value string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
}
