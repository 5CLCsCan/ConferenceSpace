package submission

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	assignmentStorage "github.com/dcao/conferencespace/internal/storage/assignment"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	"github.com/gin-gonic/gin"
)

func stringPtr(value string) *string {
	return &value
}

type decisionCopilotClientMock struct {
	lookupCalls     int
	generateCalls   int
	regenerateCalls int
	lastRequest     *aiServiceClient.DecisionCopilotResolveRequest
	response        *aiServiceClient.DecisionCopilotResolveResponse
	err             error
}

func (m *decisionCopilotClientMock) LookupDecisionCopilot(
	_ context.Context,
	_ string,
	requestPayload *aiServiceClient.DecisionCopilotResolveRequest,
) (*aiServiceClient.DecisionCopilotResolveResponse, error) {
	m.lookupCalls++
	m.lastRequest = requestPayload
	return m.response, m.err
}

func (m *decisionCopilotClientMock) GenerateDecisionCopilot(
	_ context.Context,
	_ string,
	requestPayload *aiServiceClient.DecisionCopilotResolveRequest,
) (*aiServiceClient.DecisionCopilotResolveResponse, error) {
	m.generateCalls++
	m.lastRequest = requestPayload
	return m.response, m.err
}

func (m *decisionCopilotClientMock) RegenerateDecisionCopilot(
	_ context.Context,
	_ string,
	requestPayload *aiServiceClient.DecisionCopilotResolveRequest,
) (*aiServiceClient.DecisionCopilotResolveResponse, error) {
	m.regenerateCalls++
	m.lastRequest = requestPayload
	return m.response, m.err
}

type decisionCopilotSubmissionStorageMock struct {
	submission *dto.Submission
	err        error
}

func (m *decisionCopilotSubmissionStorageMock) Create(context.Context, *dto.Submission) (*dto.Submission, error) {
	panic("unexpected call")
}

func (m *decisionCopilotSubmissionStorageMock) GetByID(context.Context, int64) (*dto.Submission, error) {
	return m.submission, m.err
}

func (m *decisionCopilotSubmissionStorageMock) List(context.Context, *submissionStorage.QueryParams) ([]*dto.Submission, int64, error) {
	panic("unexpected call")
}

func (m *decisionCopilotSubmissionStorageMock) Update(context.Context, int64, *dto.Submission) (*dto.Submission, error) {
	panic("unexpected call")
}

func (m *decisionCopilotSubmissionStorageMock) Delete(context.Context, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotSubmissionStorageMock) BulkUpdateStatus(context.Context, []int64, string) error {
	panic("unexpected call")
}

func (m *decisionCopilotSubmissionStorageMock) GetReviewersBySubmissionID(context.Context, int64) ([]dto.Reviewer, error) {
	panic("unexpected call")
}

func (m *decisionCopilotSubmissionStorageMock) SubmitRebuttal(context.Context, int64, string) error {
	panic("unexpected call")
}

func (m *decisionCopilotSubmissionStorageMock) UpdateCameraReady(context.Context, int64, *dto.SubmissionFileMetadata) (*dto.Submission, error) {
	panic("unexpected call")
}

type decisionCopilotRoleStorageMock struct {
	hasRole bool
	err     error
}

func (m *decisionCopilotRoleStorageMock) AddRole(context.Context, int64, string, string) error {
	panic("unexpected call")
}

func (m *decisionCopilotRoleStorageMock) AddRoles(context.Context, []model.RoleAssignment) error {
	panic("unexpected call")
}

func (m *decisionCopilotRoleStorageMock) RemoveRole(context.Context, int64, string) error {
	panic("unexpected call")
}

func (m *decisionCopilotRoleStorageMock) UpdateRoleStatus(context.Context, int64, string, string) error {
	panic("unexpected call")
}

func (m *decisionCopilotRoleStorageMock) GetUserRoles(context.Context, int64, string) ([]string, error) {
	panic("unexpected call")
}

func (m *decisionCopilotRoleStorageMock) HasRole(context.Context, int64, string, []string) (bool, error) {
	return m.hasRole, m.err
}

func (m *decisionCopilotRoleStorageMock) GetAllUserRoles(context.Context, string) ([]string, error) {
	panic("unexpected call")
}

func (m *decisionCopilotRoleStorageMock) GetEmailsByRole(context.Context, int64, string) ([]string, error) {
	panic("unexpected call")
}

type decisionCopilotAssignmentStorageMock struct {
	assignments []*dto.Assignment
	analytics   *dto.ReviewAnalyticsResponse
}

func (m *decisionCopilotAssignmentStorageMock) Create(context.Context, int64, *dto.Assignment) (*dto.Assignment, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) BatchCreate(context.Context, int64, []dto.Assignment) ([]*dto.Assignment, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) GetByID(_ context.Context, id int64) (*dto.Assignment, error) {
	for _, assignment := range m.assignments {
		if assignment.ID == id {
			return assignment, nil
		}
	}
	return nil, nil
}

func (m *decisionCopilotAssignmentStorageMock) List(_ context.Context, _ int64, _ *assignmentStorage.ListParams) ([]*dto.Assignment, int64, error) {
	return m.assignments, int64(len(m.assignments)), nil
}

func (m *decisionCopilotAssignmentStorageMock) UpdateStatus(context.Context, int64, string) (*dto.Assignment, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) Delete(context.Context, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) DeleteBySubmission(context.Context, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) DeleteByReviewer(context.Context, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) SaveReview(context.Context, int64, *float64, *dto.ReviewData, string) (*dto.Assignment, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) GetReview(context.Context, int64) (*dto.Assignment, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) GetReviewsBySubmission(context.Context, int64, int, int) ([]*dto.Assignment, int64, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) GetReviewAnalytics(context.Context, int64) (*dto.ReviewAnalyticsResponse, error) {
	return m.analytics, nil
}

func (m *decisionCopilotAssignmentStorageMock) GetSuggestionsByConference(context.Context, int64) ([]*dto.SuggestionGroup, int64, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) GetConfirmedAssignmentsByConference(context.Context, int64) ([]*dto.ConfirmedAssignmentGroup, int64, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) ConfirmSuggestions(context.Context, int64, []int64) (int64, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) DeleteSuggestion(context.Context, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) DeleteSuggestionsByConference(context.Context, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) AcknowledgeRebuttal(context.Context, int64) (*dto.Assignment, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) UpdatePostRebuttalScore(context.Context, int64, *dto.PostRebuttalScoreRequest) error {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) AppendReviewAuditEvent(_ context.Context, _ *dto.ReviewAuditEvent) error {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) GetReviewAuditState(_ context.Context, _ int64) (*dto.ReviewAuditState, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) UpdateReviewAuditDismissal(_ context.Context, _ int64, _ dto.ReviewAuditDismissal, _ bool) (*dto.ReviewAuditState, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) GetInvitationData(_ context.Context, _ int64) (*dto.InvitationResponse, error) {
	panic("unexpected call")
}

func (m *decisionCopilotAssignmentStorageMock) RespondToAssignment(_ context.Context, _ int64, _ string, _ *string, _ *string) error {
	panic("unexpected call")
}

type decisionCopilotConferenceStorageMock struct {
	conference     *dto.ConferenceResponse
	rebuttalConfig *dto.ConferenceRebuttalConfig
}

func (m *decisionCopilotConferenceStorageMock) Create(context.Context, *dto.Conference) (*dto.ConferenceResponse, error) {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) GetByID(context.Context, int64) (*dto.ConferenceResponse, error) {
	return m.conference, nil
}

func (m *decisionCopilotConferenceStorageMock) GetByAcronym(context.Context, string) (*dto.ConferenceResponse, error) {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) List(context.Context, *conferenceStorage.QueryParams) ([]*dto.ConferenceResponse, int64, error) {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) Update(context.Context, int64, *dto.Conference) (*dto.ConferenceResponse, error) {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) Delete(context.Context, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) TransitionStatus(context.Context, int64, string, *dto.ConferenceConfiguration) (*dto.ConferenceResponse, error) {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) AddBookmark(context.Context, string, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) RemoveBookmark(context.Context, string, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) IsBookmarked(context.Context, string, int64) (bool, error) {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) GetStats(context.Context, int64) (*dto.ConferenceStatsResponse, error) {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) GetRebuttalSettings(context.Context, int64) (*dto.ConferenceRebuttalConfig, error) {
	return m.rebuttalConfig, nil
}

func (m *decisionCopilotConferenceStorageMock) SaveRebuttalSettings(context.Context, int64, *dto.SaveRebuttalConfigRequest) (*dto.ConferenceRebuttalConfig, error) {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) OpenRebuttal(context.Context, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) FinalizeRebuttal(context.Context, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) OpenDiscussion(context.Context, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) GetRebuttalOverview(context.Context, int64) (*dto.RebuttalOverviewResponse, error) {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) GetOverdueRebuttalConferences(context.Context) ([]int64, error) {
	panic("unexpected call")
}

func (m *decisionCopilotConferenceStorageMock) GetByIDForUser(context.Context, int64, string) (*dto.ConferenceResponse, error) {
	panic("unexpected call")
}

type decisionCopilotRebuttalStorageMock struct {
	points []dto.RebuttalPointDTO
}

func (m *decisionCopilotRebuttalStorageMock) UpsertPoints(context.Context, []model.RebuttalPoint) error {
	panic("unexpected call")
}

func (m *decisionCopilotRebuttalStorageMock) GetBySubmission(context.Context, int64) ([]dto.RebuttalPointDTO, error) {
	return m.points, nil
}

func (m *decisionCopilotRebuttalStorageMock) AcknowledgePoint(context.Context, int64, string, string, string) error {
	panic("unexpected call")
}

type decisionCopilotDiscussionStorageMock struct {
	threads          []*model.DiscussionThread
	messagesByThread map[int64][]*model.DiscussionMessage
}

func (m *decisionCopilotDiscussionStorageMock) CreateThread(context.Context, *model.DiscussionThread) (*model.DiscussionThread, error) {
	panic("unexpected call")
}

func (m *decisionCopilotDiscussionStorageMock) GetThreadByID(context.Context, int64) (*model.DiscussionThread, error) {
	panic("unexpected call")
}

func (m *decisionCopilotDiscussionStorageMock) GetThreadsBySubmission(context.Context, int64) ([]*model.DiscussionThread, error) {
	return m.threads, nil
}

func (m *decisionCopilotDiscussionStorageMock) GetThreadsByReviewer(context.Context, int64, int64) ([]*model.DiscussionThread, error) {
	panic("unexpected call")
}

func (m *decisionCopilotDiscussionStorageMock) GetThreadsForAuthor(context.Context, string, int64) ([]*model.DiscussionThread, error) {
	panic("unexpected call")
}

func (m *decisionCopilotDiscussionStorageMock) GetThreadsByConference(context.Context, int64) ([]*model.DiscussionThread, error) {
	panic("unexpected call")
}

func (m *decisionCopilotDiscussionStorageMock) CreateMessage(context.Context, *model.DiscussionMessage) (*model.DiscussionMessage, error) {
	panic("unexpected call")
}

func (m *decisionCopilotDiscussionStorageMock) GetMessagesByThread(_ context.Context, threadID int64) ([]*model.DiscussionMessage, error) {
	return m.messagesByThread[threadID], nil
}

func (m *decisionCopilotDiscussionStorageMock) DeleteMessage(context.Context, int64, int64) error {
	panic("unexpected call")
}

func (m *decisionCopilotDiscussionStorageMock) GetSubmissionAuthorEmail(context.Context, int64) (string, error) {
	panic("unexpected call")
}

func (m *decisionCopilotDiscussionStorageMock) GetSubmissionConferenceID(context.Context, int64) (int64, error) {
	panic("unexpected call")
}

func (m *decisionCopilotDiscussionStorageMock) IsUserAssignedReviewer(context.Context, int64, int64) (bool, error) {
	panic("unexpected call")
}

func (m *decisionCopilotDiscussionStorageMock) GetConferenceStatus(context.Context, int64) (string, error) {
	panic("unexpected call")
}

func (m *decisionCopilotDiscussionStorageMock) IsUserConferenceChair(context.Context, string, int64) (bool, error) {
	panic("unexpected call")
}

func TestDecisionCopilotHandlers(t *testing.T) {
	gin.SetMode(gin.TestMode)

	buildResponse := func(status string) *aiServiceClient.DecisionCopilotResolveResponse {
		return &aiServiceClient.DecisionCopilotResolveResponse{
			Status: status,
			RunID:  "run-1",
			Cache: aiServiceClient.DecisionCopilotCachePayload{
				Hit:                 status == "ready",
				EvidenceFingerprint: "sha256:evidence",
				IsStale:             status == "stale",
				StaleReasons:        []string{},
			},
			Artifact: &aiServiceClient.DecisionCopilotArtifact{
				EvidenceSummary: aiServiceClient.DecisionCopilotEvidenceSummary{
					Overview:      "Current evidence summary.",
					EvidenceBasis: []string{"3 submitted reviews"},
				},
				GeneratedAt:         "2026-03-31T12:00:00Z",
				EvidenceFingerprint: "sha256:evidence",
			},
		}
	}

	buildController := func(client *decisionCopilotClientMock, hasRole bool) *Controller {
		reviewStatus := model.ReviewStatusSubmitted
		reviewScore := 8.0
		submittedAt := time.Date(2026, 3, 30, 10, 0, 0, 0, time.UTC)
		threadCreatedAt := time.Date(2026, 3, 31, 10, 30, 0, 0, time.UTC)
		messageCreatedAt := time.Date(2026, 3, 31, 11, 0, 0, 0, time.UTC)

		return &Controller{
			submissionStorage: &decisionCopilotSubmissionStorageMock{
				submission: &dto.Submission{
					ID:           42,
					ConferenceID: 9,
					Title:        "Evidence Aware Systems",
					Status:       dto.StatusReviewing,
					UpdatedAt:    time.Date(2026, 3, 31, 12, 0, 0, 0, time.UTC),
				},
			},
			assignmentStorage: &decisionCopilotAssignmentStorageMock{
				assignments: []*dto.Assignment{
					{
						ID:                501,
						ConferenceID:      9,
						SubmissionID:      42,
						ReviewerID:        91,
						ReviewStatus:      &reviewStatus,
						ReviewScore:       &reviewScore,
						ReviewSubmittedAt: &submittedAt,
						ReviewData: &dto.ReviewData{
							Recommendation: "accept",
							Confidence:     "high",
							Criteria: dto.ReviewCriteria{
								Originality:      8,
								TechnicalQuality: 6,
								Clarity:          7,
								Significance:     8,
								Methodology:      6,
							},
							Feedback: dto.ReviewFeedback{
								Summary:    "Promising paper.",
								Strengths:  "Novel direction.",
								Weaknesses: "Evaluation breadth.",
								Questions:  "How robust is the benchmark set?",
							},
						},
					},
				},
				analytics: &dto.ReviewAnalyticsResponse{
					TotalReviews: 1,
					AverageScore: 8,
					ScoreDistribution: dto.ReviewScoreDistribution{
						Accept: 1,
					},
					ConfidenceDistribution: dto.ReviewConfidenceDistribution{
						High: 1,
					},
					CriteriaAverages: dto.ReviewCriteriaAverages{
						Originality:      8,
						TechnicalQuality: 6,
						Clarity:          7,
						Significance:     8,
						Methodology:      6,
					},
				},
			},
			rebuttalStorage: &decisionCopilotRebuttalStorageMock{
				points: []dto.RebuttalPointDTO{},
			},
			conferenceStorage: &decisionCopilotConferenceStorageMock{
				conference: &dto.ConferenceResponse{
					ID:          9,
					Title:       "Conference on Evidence Systems",
					Acronym:     "CES",
					Description: "A conference about reliable evidence systems.",
					Domain:      []string{"systems", "ai"},
					Tracks:      []string{"main", "systems"},
					Configurations: &dto.ConferenceConfiguration{
						CallForPaperText: stringPtr("We invite papers on evidence-aware systems."),
					},
				},
				rebuttalConfig: &dto.ConferenceRebuttalConfig{
					Enabled: false,
				},
			},
			discussionStorage: &decisionCopilotDiscussionStorageMock{
				threads: []*model.DiscussionThread{
					{
						ID:            701,
						SubmissionID:  42,
						ConferenceID:  9,
						ReviewerID:    91,
						AuthorEmail:   "author@example.com",
						Title:         "Evaluation concerns",
						Visibility:    "chair_author_reviewer",
						MessageCount:  1,
						CreatedAt:     threadCreatedAt,
						LastMessageAt: &messageCreatedAt,
					},
				},
				messagesByThread: map[int64][]*model.DiscussionMessage{
					701: {
						{
							ID:          801,
							ThreadID:    701,
							AuthorID:    91,
							AuthorEmail: "reviewer1@example.com",
							Content:     "The evaluation needs stronger baselines.",
							CreatedAt:   messageCreatedAt,
						},
					},
				},
			},
			roleStorage:           &decisionCopilotRoleStorageMock{hasRole: hasRole},
			decisionCopilotClient: client,
		}
	}

	newContext := func() *gin.Context {
		recorder := httptest.NewRecorder()
		ctx, _ := gin.CreateTestContext(recorder)
		ctx.Request = httptest.NewRequest(http.MethodGet, "/decision-copilot", nil)
		ctx.Params = gin.Params{
			{Key: "conference_id", Value: "9"},
			{Key: "submission_id", Value: "42"},
		}
		ctx.Set("user_email", "chair@example.com")
		ctx.Set("user_id", int64(7))
		return ctx
	}

	t.Run("authorized chair can lookup generate and regenerate", func(t *testing.T) {
		client := &decisionCopilotClientMock{response: buildResponse("ready")}
		controller := buildController(client, true)
		request := &dto.DecisionCopilotRequest{ConferenceID: 9, SubmissionID: 42}

		getResponse, err := controller.GetDecisionCopilot(newContext(), request)
		if err != nil {
			t.Fatalf("expected lookup to succeed, got %v", err)
		}
		if getResponse.Status != "ready" {
			t.Fatalf("expected ready lookup response, got %s", getResponse.Status)
		}

		generateResponse, err := controller.GenerateDecisionCopilot(newContext(), request)
		if err != nil {
			t.Fatalf("expected generate to succeed, got %v", err)
		}
		if generateResponse.Status != "ready" {
			t.Fatalf("expected ready generate response, got %s", generateResponse.Status)
		}

		regenerateResponse, err := controller.RegenerateDecisionCopilot(newContext(), request)
		if err != nil {
			t.Fatalf("expected regenerate to succeed, got %v", err)
		}
		if regenerateResponse.Status != "ready" {
			t.Fatalf("expected ready regenerate response, got %s", regenerateResponse.Status)
		}

		if client.lookupCalls != 1 || client.generateCalls != 1 || client.regenerateCalls != 1 {
			t.Fatalf("expected one call per action, got lookup=%d generate=%d regenerate=%d", client.lookupCalls, client.generateCalls, client.regenerateCalls)
		}
		if client.lastRequest.Evidence.ConferenceCFP.Name != "Conference on Evidence Systems" {
			t.Fatalf("expected conference CFP name to be included, got %q", client.lastRequest.Evidence.ConferenceCFP.Name)
		}
		if client.lastRequest.Evidence.ConferenceCFP.CallForPapers != "We invite papers on evidence-aware systems." {
			t.Fatalf("expected conference CFP text to be included, got %q", client.lastRequest.Evidence.ConferenceCFP.CallForPapers)
		}
	})

	t.Run("get never generates", func(t *testing.T) {
		client := &decisionCopilotClientMock{response: buildResponse("idle")}
		controller := buildController(client, true)

		_, err := controller.GetDecisionCopilot(
			newContext(),
			&dto.DecisionCopilotRequest{ConferenceID: 9, SubmissionID: 42},
		)
		if err != nil {
			t.Fatalf("expected lookup to succeed, got %v", err)
		}

		if client.lookupCalls != 1 {
			t.Fatalf("expected lookup to call lookup once, got %d", client.lookupCalls)
		}
		if client.generateCalls != 0 || client.regenerateCalls != 0 {
			t.Fatalf("expected no generate calls during lookup, got generate=%d regenerate=%d", client.generateCalls, client.regenerateCalls)
		}
	})

	t.Run("unauthorized actor is denied", func(t *testing.T) {
		client := &decisionCopilotClientMock{response: buildResponse("ready")}
		controller := buildController(client, false)

		_, err := controller.GenerateDecisionCopilot(
			newContext(),
			&dto.DecisionCopilotRequest{ConferenceID: 9, SubmissionID: 42},
		)
		if err == nil {
			t.Fatalf("expected unauthorized generate request to fail")
		}
		if client.generateCalls != 0 {
			t.Fatalf("expected unauthorized generate request to stop before client call")
		}
	})

	t.Run("failed rerun preserves current artifact", func(t *testing.T) {
		client := &decisionCopilotClientMock{
			response: &aiServiceClient.DecisionCopilotResolveResponse{
				Status: "failed",
				RunID:  "run-2",
				Cache: aiServiceClient.DecisionCopilotCachePayload{
					Hit:                 false,
					EvidenceFingerprint: "sha256:evidence",
					IsStale:             false,
					StaleReasons:        []string{},
				},
				Artifact: buildResponse("ready").Artifact,
				Error: &aiServiceClient.DecisionCopilotErrorPayload{
					Code:    "workflow_failed",
					Message: "The copilot could not synthesize this submission right now.",
				},
			},
		}
		controller := buildController(client, true)

		response, err := controller.RegenerateDecisionCopilot(
			newContext(),
			&dto.DecisionCopilotRequest{ConferenceID: 9, SubmissionID: 42},
		)
		if err != nil {
			t.Fatalf("expected regenerate to return failed payload without handler error, got %v", err)
		}
		if response.Status != "failed" {
			t.Fatalf("expected failed status, got %s", response.Status)
		}
		if response.Artifact == nil {
			t.Fatalf("expected failed rerun to preserve last artifact")
		}
	})
}
