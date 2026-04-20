package assignment

import (
	"io"
	"strings"

	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

const maxPaperAnnotationFileBytes int64 = 25 * 1024 * 1024

func (c *Controller) GetPaperAnnotation(
	ginCtx *gin.Context,
	req *dto.PaperAnnotationRequest,
) (*aiServiceClient.PaperAnnotationResolveResponse, error) {
	if c.workflowClient == nil {
		return nil, handler.NewErrorResponse(503, "paper annotation service is not configured")
	}

	assignment, submission, requestPayload, _, authHeader, err := c.preparePaperAnnotationRequest(ginCtx, req)
	if err != nil {
		return nil, err
	}
	_ = assignment
	_ = submission

	response, err := c.workflowClient.LookupPaperAnnotation(ginCtx.Request.Context(), authHeader, requestPayload)
	if err != nil {
		return nil, handler.NewErrorResponse(502, "paper annotation workflow failed")
	}
	return response, nil
}

func (c *Controller) GeneratePaperAnnotation(
	ginCtx *gin.Context,
	req *dto.PaperAnnotationRequest,
) (*aiServiceClient.PaperAnnotationResolveResponse, error) {
	if c.workflowClient == nil {
		return nil, handler.NewErrorResponse(503, "paper annotation service is not configured")
	}
	if c.fileStorage == nil {
		return nil, handler.NewErrorResponse(503, "file storage is not configured")
	}

	_, submission, requestPayload, fileMeta, authHeader, err := c.preparePaperAnnotationRequest(ginCtx, req)
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

	fileContent, err := io.ReadAll(io.LimitReader(reader, maxPaperAnnotationFileBytes+1))
	if err != nil {
		return nil, handler.NewErrorResponse(500, "failed to read submission manuscript")
	}
	if int64(len(fileContent)) > maxPaperAnnotationFileBytes {
		return nil, handler.NewErrorResponse(400, "submission manuscript is too large for paper annotation")
	}

	response, err := c.workflowClient.GeneratePaperAnnotation(
		ginCtx.Request.Context(),
		authHeader,
		requestPayload,
		fileMeta.OriginalFilename,
		fileContent,
	)
	if err != nil {
		return nil, handler.NewErrorResponse(502, "paper annotation workflow failed")
	}
	return response, nil
}

func (c *Controller) preparePaperAnnotationRequest(
	ginCtx *gin.Context,
	req *dto.PaperAnnotationRequest,
) (
	*dto.Assignment,
	*dto.Submission,
	*aiServiceClient.PaperAnnotationResolveRequest,
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
		return nil, nil, nil, aiServiceClient.ReviewerBriefingFileMetadataPayload{}, "", handler.NewErrorResponse(403, "you are not authorized to access this paper annotation")
	}

	submission, err := c.submissionStorage.GetByID(ginCtx.Request.Context(), assignment.SubmissionID)
	if err != nil || submission.ConferenceID != req.ConferenceID {
		return nil, nil, nil, aiServiceClient.ReviewerBriefingFileMetadataPayload{}, "", handler.NewErrorResponse(404, "submission not found")
	}

	var domainTags []string
	if submission.Information != nil {
		domainTags = dedupeNormalizedStrings(submission.Information.Keywords)
	}

	fileMeta := buildReviewerBriefingFileMetadataPayload(submission)
	requestPayload := &aiServiceClient.PaperAnnotationResolveRequest{
		Action:                     "lookup",
		ConferenceID:               req.ConferenceID,
		AssignmentID:               req.AssignmentID,
		SubmissionID:               submission.ID,
		Actor:                      aiServiceClient.ActorPayload{UserID: userID, Email: userEmail, Role: "reviewer"},
		SubmissionStateFingerprint: computeReviewerBriefingFingerprint(submission),
		Submission:                 buildReviewerBriefingSubmissionPayload(submission),
		FileMetadata:               fileMeta,
		DomainTags:                 domainTags,
	}

	return assignment, submission, requestPayload, fileMeta, ginCtx.GetHeader("Authorization"), nil
}
