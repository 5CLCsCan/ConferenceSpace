package submission

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	assignmentStorage "github.com/dcao/conferencespace/internal/storage/assignment"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

const decisionCopilotSchemaVersion = "ai-006-v1"

func (c *Controller) GetDecisionCopilot(
	ginCtx *gin.Context,
	req *dto.DecisionCopilotRequest,
) (*aiServiceClient.DecisionCopilotResolveResponse, error) {
	if c.decisionCopilotClient == nil {
		return nil, handler.NewErrorResponse(http.StatusServiceUnavailable, "chair decision copilot service is not configured")
	}

	requestPayload, authHeader, err := c.prepareDecisionCopilotRequest(ginCtx, req, "lookup")
	if err != nil {
		return nil, err
	}

	response, err := c.decisionCopilotClient.LookupDecisionCopilot(
		ginCtx.Request.Context(),
		authHeader,
		requestPayload,
	)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadGateway, "chair decision copilot workflow failed")
	}

	return response, nil
}

func (c *Controller) GenerateDecisionCopilot(
	ginCtx *gin.Context,
	req *dto.DecisionCopilotRequest,
) (*aiServiceClient.DecisionCopilotResolveResponse, error) {
	if c.decisionCopilotClient == nil {
		return nil, handler.NewErrorResponse(http.StatusServiceUnavailable, "chair decision copilot service is not configured")
	}

	requestPayload, authHeader, err := c.prepareDecisionCopilotRequest(ginCtx, req, "generate")
	if err != nil {
		return nil, err
	}

	response, err := c.decisionCopilotClient.GenerateDecisionCopilot(
		ginCtx.Request.Context(),
		authHeader,
		requestPayload,
	)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadGateway, "chair decision copilot workflow failed")
	}

	return response, nil
}

func (c *Controller) RegenerateDecisionCopilot(
	ginCtx *gin.Context,
	req *dto.DecisionCopilotRequest,
) (*aiServiceClient.DecisionCopilotResolveResponse, error) {
	if c.decisionCopilotClient == nil {
		return nil, handler.NewErrorResponse(http.StatusServiceUnavailable, "chair decision copilot service is not configured")
	}

	requestPayload, authHeader, err := c.prepareDecisionCopilotRequest(ginCtx, req, "regenerate")
	if err != nil {
		return nil, err
	}

	response, err := c.decisionCopilotClient.RegenerateDecisionCopilot(
		ginCtx.Request.Context(),
		authHeader,
		requestPayload,
	)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadGateway, "chair decision copilot workflow failed")
	}

	return response, nil
}

func (c *Controller) prepareDecisionCopilotRequest(
	ginCtx *gin.Context,
	req *dto.DecisionCopilotRequest,
	action string,
) (*aiServiceClient.DecisionCopilotResolveRequest, string, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, "", handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}
	userID, _ := utils.GetUserID(ginCtx)

	submission, err := c.submissionStorage.GetByID(ctx, req.SubmissionID)
	if err != nil || submission.ConferenceID != req.ConferenceID {
		return nil, "", handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail) {
		return nil, "", handler.NewErrorResponse(http.StatusForbidden, "only the chair or co-chairs can access this decision copilot")
	}

	evidence, componentFingerprints, evidenceFingerprint, err := c.buildDecisionCopilotEvidence(ctx, submission)
	if err != nil {
		return nil, "", err
	}

	return &aiServiceClient.DecisionCopilotResolveRequest{
		Action:                action,
		ConferenceID:          req.ConferenceID,
		SubmissionID:          req.SubmissionID,
		Actor:                 aiServiceClient.ActorPayload{UserID: userID, Email: userEmail, Role: "chair"},
		EvidenceFingerprint:   evidenceFingerprint,
		ComponentFingerprints: componentFingerprints,
		Evidence:              evidence,
	}, ginCtx.GetHeader("Authorization"), nil
}

func (c *Controller) buildDecisionCopilotEvidence(
	ctx context.Context,
	submission *dto.Submission,
) (
	aiServiceClient.DecisionCopilotEvidencePayload,
	aiServiceClient.DecisionCopilotComponentFingerprintsPayload,
	string,
	error,
) {
	assignments, _, err := c.assignmentStorage.List(ctx, submission.ConferenceID, &assignmentStorage.ListParams{
		SubmissionID: submission.ID,
		Limit:        1000,
	})
	if err != nil {
		return aiServiceClient.DecisionCopilotEvidencePayload{}, aiServiceClient.DecisionCopilotComponentFingerprintsPayload{}, "", handler.NewErrorResponse(http.StatusInternalServerError, "failed to load submission assignments")
	}

	detailedAssignments := make([]*dto.Assignment, 0, len(assignments))
	for _, assignment := range assignments {
		detailed, getErr := c.assignmentStorage.GetByID(ctx, assignment.ID)
		if getErr != nil {
			return aiServiceClient.DecisionCopilotEvidencePayload{}, aiServiceClient.DecisionCopilotComponentFingerprintsPayload{}, "", handler.NewErrorResponse(http.StatusInternalServerError, "failed to load assignment details")
		}
		detailedAssignments = append(detailedAssignments, detailed)
	}
	sort.Slice(detailedAssignments, func(i, j int) bool {
		return detailedAssignments[i].ID < detailedAssignments[j].ID
	})

	reviewAnalytics, err := c.assignmentStorage.GetReviewAnalytics(ctx, submission.ID)
	if err != nil {
		return aiServiceClient.DecisionCopilotEvidencePayload{}, aiServiceClient.DecisionCopilotComponentFingerprintsPayload{}, "", handler.NewErrorResponse(http.StatusInternalServerError, "failed to load review analytics")
	}

	conference, err := c.conferenceStorage.GetByID(ctx, submission.ConferenceID)
	if err != nil {
		return aiServiceClient.DecisionCopilotEvidencePayload{}, aiServiceClient.DecisionCopilotComponentFingerprintsPayload{}, "", handler.NewErrorResponse(http.StatusInternalServerError, "failed to load conference context")
	}

	rebuttalConfig, err := c.conferenceStorage.GetRebuttalSettings(ctx, submission.ConferenceID)
	if err != nil {
		return aiServiceClient.DecisionCopilotEvidencePayload{}, aiServiceClient.DecisionCopilotComponentFingerprintsPayload{}, "", handler.NewErrorResponse(http.StatusInternalServerError, "failed to load rebuttal settings")
	}

	rebuttalPoints := []dto.RebuttalPointDTO{}
	if rebuttalConfig.Enabled {
		rebuttalPoints, err = c.rebuttalStorage.GetBySubmission(ctx, submission.ID)
		if err != nil {
			return aiServiceClient.DecisionCopilotEvidencePayload{}, aiServiceClient.DecisionCopilotComponentFingerprintsPayload{}, "", handler.NewErrorResponse(http.StatusInternalServerError, "failed to load rebuttal points")
		}
	}

	discussionPayload, latestDiscussionTime, err := c.buildDecisionCopilotDiscussion(ctx, submission.ID)
	if err != nil {
		return aiServiceClient.DecisionCopilotEvidencePayload{}, aiServiceClient.DecisionCopilotComponentFingerprintsPayload{}, "", handler.NewErrorResponse(http.StatusInternalServerError, "failed to load discussion evidence")
	}

	reviewPayloads, latestReviewTime := buildDecisionCopilotReviews(detailedAssignments)
	rebuttalPayload, latestRebuttalTime := buildDecisionCopilotRebuttal(submission, rebuttalConfig, rebuttalPoints, detailedAssignments)

	lastEvidenceUpdate := latestTimestamp(submission.UpdatedAt, latestReviewTime, latestDiscussionTime, latestRebuttalTime)
	analyticsPayload := buildDecisionCopilotAnalytics(reviewAnalytics, detailedAssignments, lastEvidenceUpdate)

	evidence := aiServiceClient.DecisionCopilotEvidencePayload{
		SchemaVersion: decisionCopilotSchemaVersion,
		ConferenceCFP: buildDecisionCopilotConferenceCFP(conference),
		Submission: aiServiceClient.DecisionCopilotSubmissionContextPayload{
			Title:         normalizeDecisionCopilotText(submission.Title),
			Track:         normalizeDecisionCopilotText(submission.Track),
			Status:        normalizeDecisionCopilotText(submission.Status),
			Keywords:      normalizeKeywords(submission),
			LastUpdatedAt: formatDecisionCopilotTime(submission.UpdatedAt),
		},
		Reviews:         reviewPayloads,
		ReviewAnalytics: analyticsPayload,
		Discussion:      discussionPayload,
		Rebuttal:        rebuttalPayload,
	}

	componentFingerprints := aiServiceClient.DecisionCopilotComponentFingerprintsPayload{
		Submission: hashDecisionCopilotValue(map[string]any{"conference_cfp": evidence.ConferenceCFP, "submission": evidence.Submission}),
		Reviews:    hashDecisionCopilotValue(map[string]any{"reviews": evidence.Reviews, "analytics": evidence.ReviewAnalytics}),
		Discussion: hashDecisionCopilotValue(evidence.Discussion),
		Rebuttal:   hashDecisionCopilotValue(evidence.Rebuttal),
	}

	evidenceFingerprint := hashDecisionCopilotValue(map[string]any{
		"schema_version":         decisionCopilotSchemaVersion,
		"component_fingerprints": componentFingerprints,
	})

	return evidence, componentFingerprints, evidenceFingerprint, nil
}

func buildDecisionCopilotConferenceCFP(conference *dto.ConferenceResponse) aiServiceClient.DecisionCopilotConferenceCFPPayload {
	if conference == nil {
		return aiServiceClient.DecisionCopilotConferenceCFPPayload{}
	}

	callForPapers := ""
	if conference.Configurations != nil && conference.Configurations.CallForPaperText != nil {
		callForPapers = normalizeDecisionCopilotText(*conference.Configurations.CallForPaperText)
	}

	return aiServiceClient.DecisionCopilotConferenceCFPPayload{
		Name:          normalizeDecisionCopilotText(conference.Title),
		Acronym:       normalizeDecisionCopilotText(conference.Acronym),
		Description:   normalizeDecisionCopilotText(conference.Description),
		Domains:       normalizeDecisionCopilotStrings(conference.Domain),
		Tracks:        normalizeDecisionCopilotStrings(conference.Tracks),
		CallForPapers: callForPapers,
	}
}

func buildDecisionCopilotReviews(assignments []*dto.Assignment) ([]aiServiceClient.DecisionCopilotReviewPayload, time.Time) {
	reviews := make([]aiServiceClient.DecisionCopilotReviewPayload, 0)
	var latest time.Time

	for _, assignment := range assignments {
		if assignment.ReviewStatus == nil || *assignment.ReviewStatus != model.ReviewStatusSubmitted || assignment.ReviewData == nil {
			if assignment.PostRebuttalUpdatedAt != nil && assignment.PostRebuttalUpdatedAt.After(latest) {
				latest = *assignment.PostRebuttalUpdatedAt
			}
			continue
		}

		review := aiServiceClient.DecisionCopilotReviewPayload{
			ReviewerID:     fmt.Sprintf("%d", assignment.ReviewerID),
			Recommendation: normalizeDecisionCopilotText(assignment.ReviewData.Recommendation),
			Confidence:     normalizeDecisionCopilotText(assignment.ReviewData.Confidence),
			Score:          assignment.ReviewScore,
			Summary:        normalizeDecisionCopilotText(assignment.ReviewData.Feedback.Summary),
			Strengths:      normalizeDecisionCopilotText(assignment.ReviewData.Feedback.Strengths),
			Weaknesses:     normalizeDecisionCopilotText(assignment.ReviewData.Feedback.Weaknesses),
			Questions:      normalizeDecisionCopilotText(assignment.ReviewData.Feedback.Questions),
			Criteria: map[string]int{
				"originality":       assignment.ReviewData.Criteria.Originality,
				"technical_quality": assignment.ReviewData.Criteria.TechnicalQuality,
				"clarity":           assignment.ReviewData.Criteria.Clarity,
				"significance":      assignment.ReviewData.Criteria.Significance,
				"methodology":       assignment.ReviewData.Criteria.Methodology,
			},
			PostRebuttalScore: assignment.PostRebuttalScore,
		}
		if assignment.ReviewSubmittedAt != nil {
			review.SubmittedAt = formatDecisionCopilotTime(*assignment.ReviewSubmittedAt)
			if assignment.ReviewSubmittedAt.After(latest) {
				latest = *assignment.ReviewSubmittedAt
			}
		}
		if assignment.PostRebuttalRecommendation != nil {
			review.PostRebuttalRecommendation = normalizeDecisionCopilotText(*assignment.PostRebuttalRecommendation)
		}
		if assignment.PostRebuttalComment != nil {
			review.PostRebuttalComment = normalizeDecisionCopilotText(*assignment.PostRebuttalComment)
		}
		if assignment.PostRebuttalUpdatedAt != nil {
			review.PostRebuttalUpdatedAt = formatDecisionCopilotTime(*assignment.PostRebuttalUpdatedAt)
			if assignment.PostRebuttalUpdatedAt.After(latest) {
				latest = *assignment.PostRebuttalUpdatedAt
			}
		}

		reviews = append(reviews, review)
	}

	return reviews, latest
}

func buildDecisionCopilotAnalytics(
	analytics *dto.ReviewAnalyticsResponse,
	assignments []*dto.Assignment,
	lastEvidenceUpdate time.Time,
) aiServiceClient.DecisionCopilotAnalyticsPayload {
	submittedReviews := 0
	postRebuttalUpdates := 0
	for _, assignment := range assignments {
		if assignment.ReviewStatus != nil && *assignment.ReviewStatus == model.ReviewStatusSubmitted {
			submittedReviews++
		}
		if assignment.PostRebuttalUpdatedAt != nil || assignment.PostRebuttalScore != nil || assignment.PostRebuttalRecommendation != nil {
			postRebuttalUpdates++
		}
	}

	var scoreChangesAfterRebuttal *string
	if postRebuttalUpdates > 0 {
		value := fmt.Sprintf("%d reviewer(s) updated their score or post-rebuttal note.", postRebuttalUpdates)
		scoreChangesAfterRebuttal = &value
	}

	strongest, weakest := rankCriteria(analytics.CriteriaAverages)

	return aiServiceClient.DecisionCopilotAnalyticsPayload{
		ReviewDistribution: []aiServiceClient.DecisionCopilotCountMetric{
			{Label: "strong_accept", Count: analytics.ScoreDistribution.StrongAccept},
			{Label: "accept", Count: analytics.ScoreDistribution.Accept},
			{Label: "weak_accept", Count: analytics.ScoreDistribution.WeakAccept},
			{Label: "borderline", Count: analytics.ScoreDistribution.Borderline},
			{Label: "weak_reject", Count: analytics.ScoreDistribution.WeakReject},
			{Label: "reject", Count: analytics.ScoreDistribution.Reject},
			{Label: "strong_reject", Count: analytics.ScoreDistribution.StrongReject},
		},
		ConfidenceMix: []aiServiceClient.DecisionCopilotCountMetric{
			{Label: "high", Count: analytics.ConfidenceDistribution.High},
			{Label: "medium", Count: analytics.ConfidenceDistribution.Medium},
			{Label: "low", Count: analytics.ConfidenceDistribution.Low},
		},
		StrongestCriteria:          strongest,
		WeakestCriteria:            weakest,
		ReviewCoverageCompleteness: fmt.Sprintf("%d of %d assigned reviews submitted.", submittedReviews, len(assignments)),
		ScoreChangesAfterRebuttal:  scoreChangesAfterRebuttal,
		LastEvidenceUpdate:         formatDecisionCopilotTime(lastEvidenceUpdate),
	}
}

func (c *Controller) buildDecisionCopilotDiscussion(
	ctx context.Context,
	submissionID int64,
) (aiServiceClient.DecisionCopilotDiscussionPayload, time.Time, error) {
	if c.discussionStorage == nil {
		return aiServiceClient.DecisionCopilotDiscussionPayload{}, time.Time{}, nil
	}

	threads, err := c.discussionStorage.GetThreadsBySubmission(ctx, submissionID)
	if err != nil {
		return aiServiceClient.DecisionCopilotDiscussionPayload{}, time.Time{}, err
	}

	sort.Slice(threads, func(i, j int) bool {
		return threads[i].ID < threads[j].ID
	})

	payload := aiServiceClient.DecisionCopilotDiscussionPayload{
		ThreadCount: len(threads),
		Threads:     make([]aiServiceClient.DecisionCopilotDiscussionThreadPayload, 0, len(threads)),
	}
	var latest time.Time

	for _, thread := range threads {
		threadPayload := aiServiceClient.DecisionCopilotDiscussionThreadPayload{
			Title:        normalizeDecisionCopilotText(thread.Title),
			Visibility:   normalizeDecisionCopilotText(thread.Visibility),
			MessageCount: thread.MessageCount,
			Messages:     []aiServiceClient.DecisionCopilotDiscussionMessagePayload{},
		}
		if thread.CreatedAt.After(latest) {
			latest = thread.CreatedAt
		}
		if thread.LastMessageAt != nil {
			threadPayload.LastMessageAt = formatDecisionCopilotTime(*thread.LastMessageAt)
			if thread.LastMessageAt.After(latest) {
				latest = *thread.LastMessageAt
			}
		}

		messages, msgErr := c.discussionStorage.GetMessagesByThread(ctx, thread.ID)
		if msgErr != nil {
			return aiServiceClient.DecisionCopilotDiscussionPayload{}, time.Time{}, msgErr
		}
		payload.MessageCount += len(messages)

		for _, message := range messages {
			threadPayload.Messages = append(threadPayload.Messages, aiServiceClient.DecisionCopilotDiscussionMessagePayload{
				Role:      decisionCopilotDiscussionRole(message, thread),
				Content:   normalizeDecisionCopilotText(message.Content),
				CreatedAt: formatDecisionCopilotTime(message.CreatedAt),
			})
			if message.CreatedAt.After(latest) {
				latest = message.CreatedAt
			}
		}

		payload.Threads = append(payload.Threads, threadPayload)
	}

	if !latest.IsZero() {
		payload.LastActivityAt = formatDecisionCopilotTime(latest)
	}

	return payload, latest, nil
}

func buildDecisionCopilotRebuttal(
	submission *dto.Submission,
	config *dto.ConferenceRebuttalConfig,
	points []dto.RebuttalPointDTO,
	assignments []*dto.Assignment,
) (aiServiceClient.DecisionCopilotRebuttalPayload, time.Time) {
	var latest time.Time
	hasEvidence := false

	payload := aiServiceClient.DecisionCopilotRebuttalPayload{
		Status:      "not_applicable",
		Points:      []aiServiceClient.DecisionCopilotRebuttalPointPayload{},
		Assignments: []aiServiceClient.DecisionCopilotRebuttalAssignmentPayload{},
	}

	if config == nil || !config.Enabled {
		payload.SummaryHint = "Rebuttal was not enabled for this conference."
		return payload, latest
	}

	if submission.RebuttalGeneralResponse != nil && strings.TrimSpace(*submission.RebuttalGeneralResponse) != "" {
		response := normalizeDecisionCopilotText(*submission.RebuttalGeneralResponse)
		payload.GeneralResponse = &response
		hasEvidence = true
		if submission.UpdatedAt.After(latest) {
			latest = submission.UpdatedAt
		}
	}

	for _, point := range points {
		payload.Points = append(payload.Points, aiServiceClient.DecisionCopilotRebuttalPointPayload{
			AssignmentID:         point.AssignmentID,
			Category:             normalizeDecisionCopilotText(point.Category),
			Section:              normalizeDecisionCopilotText(point.Section),
			OriginalComment:      normalizeDecisionCopilotText(point.OriginalComment),
			AuthorResponse:       normalizeDecisionCopilotText(point.AuthorResponse),
			Status:               normalizeDecisionCopilotText(point.Status),
			ReviewerAcknowledged: point.ReviewerAcknowledged,
			ReviewerNote:         normalizeDecisionCopilotText(point.ReviewerNote),
		})
		hasEvidence = true
	}

	for _, assignment := range assignments {
		rebuttalStatus := normalizeDecisionCopilotText(assignment.RebuttalStatus)
		if rebuttalStatus == "" {
			continue
		}
		payload.Assignments = append(payload.Assignments, aiServiceClient.DecisionCopilotRebuttalAssignmentPayload{
			AssignmentID:   assignment.ID,
			RebuttalStatus: rebuttalStatus,
		})
		if rebuttalStatus != "none" {
			hasEvidence = true
		}
		if assignment.RebuttalAcknowledgedAt != nil && assignment.RebuttalAcknowledgedAt.After(latest) {
			latest = *assignment.RebuttalAcknowledgedAt
		}
		if assignment.RebuttalSubmittedAt != nil && assignment.RebuttalSubmittedAt.After(latest) {
			latest = *assignment.RebuttalSubmittedAt
		}
	}

	if hasEvidence {
		payload.Status = "available"
		payload.SummaryHint = "Rebuttal evidence is available and should be synthesized alongside the reviews."
		return payload, latest
	}

	payload.SummaryHint = "Rebuttal is enabled for this conference, but no rebuttal evidence is available yet."
	return payload, latest
}

func rankCriteria(criteria dto.ReviewCriteriaAverages) ([]string, []string) {
	type criterion struct {
		label string
		value float64
	}

	items := []criterion{
		{label: "Originality", value: criteria.Originality},
		{label: "Technical quality", value: criteria.TechnicalQuality},
		{label: "Clarity", value: criteria.Clarity},
		{label: "Significance", value: criteria.Significance},
		{label: "Methodology", value: criteria.Methodology},
	}

	filtered := make([]criterion, 0, len(items))
	for _, item := range items {
		if item.value > 0 {
			filtered = append(filtered, item)
		}
	}
	if len(filtered) == 0 {
		return []string{}, []string{}
	}

	sort.Slice(filtered, func(i, j int) bool {
		if filtered[i].value == filtered[j].value {
			return filtered[i].label < filtered[j].label
		}
		return filtered[i].value > filtered[j].value
	})

	strongest := []string{filtered[0].label}
	weakest := []string{filtered[len(filtered)-1].label}
	return strongest, weakest
}

func hashDecisionCopilotValue(value any) string {
	encoded, _ := json.Marshal(value)
	sum := sha256.Sum256(encoded)
	return "sha256:" + hex.EncodeToString(sum[:])
}

func normalizeDecisionCopilotText(value string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
}

func normalizeDecisionCopilotStrings(values []string) []string {
	seen := map[string]struct{}{}
	normalized := make([]string, 0, len(values))
	for _, value := range values {
		item := normalizeDecisionCopilotText(value)
		if item == "" {
			continue
		}
		key := strings.ToLower(item)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		normalized = append(normalized, item)
	}
	sort.Strings(normalized)
	return normalized
}

func decisionCopilotDiscussionRole(message *model.DiscussionMessage, thread *model.DiscussionThread) string {
	if message == nil || thread == nil {
		return "unknown"
	}
	if message.AuthorEmail != "" && thread.AuthorEmail != "" && strings.EqualFold(message.AuthorEmail, thread.AuthorEmail) {
		return "author"
	}
	if message.AuthorID != 0 && thread.ReviewerID != 0 && message.AuthorID == thread.ReviewerID {
		return "reviewer"
	}
	return "unknown"
}

func normalizeKeywords(submission *dto.Submission) []string {
	if submission == nil || submission.Information == nil {
		return []string{}
	}
	seen := map[string]struct{}{}
	keywords := make([]string, 0, len(submission.Information.Keywords))
	for _, keyword := range submission.Information.Keywords {
		normalized := strings.ToLower(normalizeDecisionCopilotText(keyword))
		if normalized == "" {
			continue
		}
		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}
		keywords = append(keywords, normalized)
	}
	sort.Strings(keywords)
	return keywords
}

func latestTimestamp(base time.Time, values ...time.Time) time.Time {
	latest := base
	for _, value := range values {
		if value.After(latest) {
			latest = value
		}
	}
	return latest
}

func formatDecisionCopilotTime(value time.Time) string {
	if value.IsZero() {
		return ""
	}
	return value.UTC().Format(time.RFC3339)
}
