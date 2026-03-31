package assignment

import (
	"net/http"
	"slices"
	"strconv"
	"time"

	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

const (
	reviewAuditEventWarningDismissed               = "warning_dismissed"
	reviewAuditEventWarningUndismissed             = "warning_undismissed"
	reviewAuditEventSubmitOverrideAfterAuditFailed = "submit_override_after_audit_failure"
)

func (c *Controller) RunReviewAudit(
	ginCtx *gin.Context,
	req *dto.ReviewAuditRequest,
) (*dto.ReviewAuditResponse, error) {
	if err := assignReviewPathScope(ginCtx, &req.AssignmentID, &req.ConferenceID); err != nil {
		return nil, err
	}
	auditResponse, _, _, _, auditFailed, auditFailureMessage, err := c.executeReviewAudit(
		ginCtx,
		req.AssignmentID,
		req.ConferenceID,
		req.Mode,
		req.ReviewData,
		req.ReviewScore,
	)
	if err != nil {
		return nil, err
	}
	if auditFailed {
		statusCode := http.StatusBadGateway
		if auditFailureMessage == "review audit service is not configured" {
			statusCode = http.StatusServiceUnavailable
		}
		return nil, handler.NewErrorResponse(statusCode, auditFailureMessage)
	}
	return auditResponse, nil
}

func (c *Controller) UpdateReviewAuditDismissal(
	ginCtx *gin.Context,
	req *dto.ReviewAuditDismissalRequest,
) (*dto.ReviewAuditDismissalResponse, error) {
	if err := assignReviewPathScope(ginCtx, &req.AssignmentID, &req.ConferenceID); err != nil {
		return nil, err
	}
	assignment, _, userID, userEmail, _, err := c.loadOwnedReviewScope(ginCtx, req.AssignmentID, req.ConferenceID)
	if err != nil {
		return nil, err
	}
	if req.Finding.Severity != "warning" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "only warning findings can be dismissed")
	}

	dismissal := dto.ReviewAuditDismissal{
		Code:                 req.Finding.Code,
		ConditionFingerprint: req.Finding.ConditionFingerprint,
		DismissedAt:          time.Now().UTC(),
	}
	state, err := c.assignmentStorage.UpdateReviewAuditDismissal(
		ginCtx.Request.Context(),
		req.AssignmentID,
		dismissal,
		req.Action == "dismiss",
	)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to update review audit dismissal")
	}

	eventType := reviewAuditEventWarningUndismissed
	if req.Action == "dismiss" {
		eventType = reviewAuditEventWarningDismissed
	}
	_ = c.assignmentStorage.AppendReviewAuditEvent(ginCtx.Request.Context(), &dto.ReviewAuditEvent{
		AssignmentID: assignment.ID,
		ConferenceID: assignment.ConferenceID,
		ActorID:      userID,
		ActorEmail:   userEmail,
		EventType:    eventType,
		Payload: map[string]interface{}{
			"code":                  req.Finding.Code,
			"field":                 req.Finding.Field,
			"condition_fingerprint": req.Finding.ConditionFingerprint,
		},
	})

	return &dto.ReviewAuditDismissalResponse{State: *state}, nil
}

func (c *Controller) executeReviewAudit(
	ginCtx *gin.Context,
	assignmentID int64,
	conferenceID int64,
	mode dto.ReviewAuditMode,
	reviewData *dto.ReviewData,
	reviewScore *float64,
) (*dto.ReviewAuditResponse, *dto.Assignment, int64, string, bool, string, error) {
	if reviewData == nil {
		return nil, nil, 0, "", false, "", handler.NewErrorResponse(http.StatusBadRequest, "review_data is required")
	}

	assignment, submission, userID, userEmail, authHeader, err := c.loadOwnedReviewScope(ginCtx, assignmentID, conferenceID)
	if err != nil {
		return nil, nil, 0, "", false, "", err
	}

	if c.workflowClient == nil {
		return nil, assignment, userID, userEmail, true, "review audit service is not configured", nil
	}

	requestPayload := &aiServiceClient.ReviewQualityAuditResolveRequest{
		Mode:         string(mode),
		ConferenceID: conferenceID,
		AssignmentID: assignmentID,
		SubmissionID: submission.ID,
		Actor: aiServiceClient.ActorPayload{
			UserID: userID,
			Email:  userEmail,
			Role:   "reviewer",
		},
		Submission:  buildReviewerBriefingSubmissionPayload(submission),
		ReviewScore: reviewScore,
		Review:      buildReviewQualityAuditPayload(reviewData),
	}

	if briefingArtifact := c.lookupOptionalBriefingArtifact(ginCtx, assignmentID, conferenceID, submission, requestPayload.Actor, authHeader); briefingArtifact != nil {
		requestPayload.BriefingArtifact = briefingArtifact
	}

	result, err := c.workflowClient.ResolveReviewQualityAudit(ginCtx.Request.Context(), authHeader, requestPayload)
	if err != nil {
		return nil, assignment, userID, userEmail, true, "review audit workflow failed", nil
	}

	dismissedState, err := c.assignmentStorage.GetReviewAuditState(ginCtx.Request.Context(), assignmentID)
	if err != nil {
		return nil, nil, 0, "", false, "", handler.NewErrorResponse(http.StatusInternalServerError, "failed to load review audit state")
	}

	return mergeReviewAuditResult(result, dismissedState), assignment, userID, userEmail, false, "", nil
}

func (c *Controller) loadOwnedReviewScope(
	ginCtx *gin.Context,
	assignmentID int64,
	conferenceID int64,
) (*dto.Assignment, *dto.Submission, int64, string, string, error) {
	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, nil, 0, "", "", handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}
	userID, _ := utils.GetUserID(ginCtx)

	assignment, err := c.assignmentStorage.GetByID(ginCtx.Request.Context(), assignmentID)
	if err != nil || assignment.ConferenceID != conferenceID {
		return nil, nil, 0, "", "", handler.NewErrorResponse(http.StatusNotFound, "assignment not found")
	}

	reviewer, err := c.reviewerStorage.GetByID(ginCtx.Request.Context(), assignment.ReviewerID)
	if err != nil {
		return nil, nil, 0, "", "", handler.NewErrorResponse(http.StatusInternalServerError, "failed to get reviewer info")
	}
	if reviewer.Email != userEmail {
		return nil, nil, 0, "", "", handler.NewErrorResponse(http.StatusForbidden, "you are not authorized to review this submission")
	}

	submission, err := c.submissionStorage.GetByID(ginCtx.Request.Context(), assignment.SubmissionID)
	if err != nil || submission.ConferenceID != conferenceID {
		return nil, nil, 0, "", "", handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	return assignment, submission, userID, userEmail, ginCtx.GetHeader("Authorization"), nil
}

func (c *Controller) lookupOptionalBriefingArtifact(
	ginCtx *gin.Context,
	assignmentID int64,
	conferenceID int64,
	submission *dto.Submission,
	actor aiServiceClient.ActorPayload,
	authHeader string,
) *aiServiceClient.ReviewerBriefingArtifact {
	if c.workflowClient == nil {
		return nil
	}

	response, err := c.workflowClient.LookupReviewerBriefing(
		ginCtx.Request.Context(),
		authHeader,
		&aiServiceClient.ReviewerBriefingResolveRequest{
			Action:                     "lookup",
			ConferenceID:               conferenceID,
			AssignmentID:               assignmentID,
			SubmissionID:               submission.ID,
			Actor:                      actor,
			SubmissionStateFingerprint: computeReviewerBriefingFingerprint(submission),
			Submission:                 buildReviewerBriefingSubmissionPayload(submission),
			FileMetadata:               buildReviewerBriefingFileMetadataPayload(submission),
		},
	)
	if err != nil || response == nil || response.Status != "ready" || response.Artifact == nil {
		return nil
	}
	return response.Artifact
}

func buildReviewQualityAuditPayload(reviewData *dto.ReviewData) aiServiceClient.ReviewQualityAuditReviewPayload {
	return aiServiceClient.ReviewQualityAuditReviewPayload{
		Criteria: aiServiceClient.ReviewCriteriaPayload{
			Originality:      reviewData.Criteria.Originality,
			TechnicalQuality: reviewData.Criteria.TechnicalQuality,
			Clarity:          reviewData.Criteria.Clarity,
			Significance:     reviewData.Criteria.Significance,
			Methodology:      reviewData.Criteria.Methodology,
		},
		Feedback: aiServiceClient.ReviewFeedbackPayload{
			Summary:    reviewData.Feedback.Summary,
			Strengths:  reviewData.Feedback.Strengths,
			Weaknesses: reviewData.Feedback.Weaknesses,
			Questions:  reviewData.Feedback.Questions,
		},
		Recommendation: reviewData.Recommendation,
		Confidence:     reviewData.Confidence,
	}
}

func mergeReviewAuditResult(
	result *aiServiceClient.ReviewQualityAuditResolveResponse,
	state *dto.ReviewAuditState,
) *dto.ReviewAuditResponse {
	if state == nil {
		state = &dto.ReviewAuditState{}
	}

	dismissedKeys := map[string]struct{}{}
	for _, dismissal := range state.DismissedWarnings {
		dismissedKeys[dismissal.Code+"::"+dismissal.ConditionFingerprint] = struct{}{}
	}

	response := &dto.ReviewAuditResponse{
		Status:            "pass",
		RunID:             result.RunID,
		ActiveFindings:    []dto.ReviewAuditFinding{},
		DismissedFindings: []dto.ReviewAuditFinding{},
	}

	for _, finding := range result.Findings {
		mapped := dto.ReviewAuditFinding{
			Code:                 finding.Code,
			Severity:             finding.Severity,
			Field:                finding.Field,
			Message:              finding.Message,
			Suggestion:           finding.Suggestion,
			ConditionFingerprint: finding.ConditionFingerprint,
		}

		if finding.Severity == "warning" {
			if _, dismissed := dismissedKeys[finding.Code+"::"+finding.ConditionFingerprint]; dismissed {
				response.DismissedFindings = append(response.DismissedFindings, mapped)
				continue
			}
		}

		response.ActiveFindings = append(response.ActiveFindings, mapped)
	}

	if slices.ContainsFunc(response.ActiveFindings, func(f dto.ReviewAuditFinding) bool {
		return f.Severity == "blocking"
	}) {
		response.Status = "block"
		return response
	}
	if len(response.ActiveFindings) > 0 {
		response.Status = "warn"
	}
	return response
}

func assignReviewPathScope(ginCtx *gin.Context, assignmentID *int64, conferenceID *int64) error {
	assignmentParam, err := strconv.ParseInt(ginCtx.Param("assignment_id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid assignment id")
	}
	conferenceParam, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return handler.NewErrorResponse(http.StatusBadRequest, "invalid conference id")
	}
	*assignmentID = assignmentParam
	*conferenceID = conferenceParam
	return nil
}
