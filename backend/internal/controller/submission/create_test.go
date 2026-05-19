package submission

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/model"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	"github.com/gin-gonic/gin"
)

type createSubmissionStorageMock struct {
	err error
}

func (m *createSubmissionStorageMock) Create(context.Context, *dto.Submission) (*dto.Submission, error) {
	return nil, m.err
}

func (m *createSubmissionStorageMock) GetByID(context.Context, int64) (*dto.Submission, error) {
	panic("unexpected call")
}

func (m *createSubmissionStorageMock) List(context.Context, *submissionStorage.QueryParams) ([]*dto.Submission, int64, error) {
	panic("unexpected call")
}

func (m *createSubmissionStorageMock) Update(context.Context, int64, *dto.Submission) (*dto.Submission, error) {
	panic("unexpected call")
}

func (m *createSubmissionStorageMock) Delete(context.Context, int64) error {
	panic("unexpected call")
}

func (m *createSubmissionStorageMock) BulkUpdateStatus(context.Context, []int64, string) error {
	panic("unexpected call")
}

func (m *createSubmissionStorageMock) GetReviewersBySubmissionID(context.Context, int64) ([]dto.Reviewer, error) {
	panic("unexpected call")
}

func (m *createSubmissionStorageMock) SubmitRebuttal(context.Context, int64, string) error {
	panic("unexpected call")
}

func (m *createSubmissionStorageMock) UpdateCameraReady(context.Context, int64, *dto.SubmissionFileMetadata) (*dto.Submission, error) {
	panic("unexpected call")
}

type createConferenceStorageMock struct{}

func (m *createConferenceStorageMock) Create(context.Context, *dto.Conference) (*dto.ConferenceResponse, error) {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) GetByID(context.Context, int64) (*dto.ConferenceResponse, error) {
	return &dto.ConferenceResponse{ID: 210, Status: model.ConferenceStatusOpen}, nil
}

func (m *createConferenceStorageMock) GetByIDForUser(context.Context, int64, string) (*dto.ConferenceResponse, error) {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) GetByAcronym(context.Context, string) (*dto.ConferenceResponse, error) {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) List(context.Context, *conferenceStorage.QueryParams) ([]*dto.ConferenceResponse, int64, error) {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) Update(context.Context, int64, *dto.Conference) (*dto.ConferenceResponse, error) {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) Delete(context.Context, int64) error {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) TransitionStatus(context.Context, int64, string) (*dto.ConferenceResponse, error) {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) AddBookmark(context.Context, string, int64) error {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) RemoveBookmark(context.Context, string, int64) error {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) IsBookmarked(context.Context, string, int64) (bool, error) {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) GetStats(context.Context, int64) (*dto.ConferenceStatsResponse, error) {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) GetRebuttalSettings(context.Context, int64) (*dto.ConferenceRebuttalConfig, error) {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) SaveRebuttalSettings(context.Context, int64, *dto.SaveRebuttalConfigRequest) (*dto.ConferenceRebuttalConfig, error) {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) OpenRebuttal(context.Context, int64) error {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) FinalizeRebuttal(context.Context, int64) error {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) OpenDiscussion(context.Context, int64) error {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) GetRebuttalOverview(context.Context, int64) (*dto.RebuttalOverviewResponse, error) {
	panic("unexpected call")
}

func (m *createConferenceStorageMock) GetOverdueRebuttalConferences(context.Context) ([]int64, error) {
	panic("unexpected call")
}

type createRoleStorageMock struct{}

func (m *createRoleStorageMock) AddRole(context.Context, int64, string, string) error {
	panic("unexpected call")
}

func (m *createRoleStorageMock) AddRoles(context.Context, []model.RoleAssignment) error {
	panic("unexpected call")
}

func (m *createRoleStorageMock) RemoveRole(context.Context, int64, string) error {
	panic("unexpected call")
}

func (m *createRoleStorageMock) UpdateRoleStatus(context.Context, int64, string, string) error {
	panic("unexpected call")
}

func (m *createRoleStorageMock) GetUserRoles(context.Context, int64, string) ([]string, error) {
	panic("unexpected call")
}

func (m *createRoleStorageMock) GetAllUserRoles(context.Context, string) ([]string, error) {
	panic("unexpected call")
}

func (m *createRoleStorageMock) HasRole(context.Context, int64, string, []string) (bool, error) {
	return false, nil
}

func (m *createRoleStorageMock) GetEmailsByRole(context.Context, int64, string) ([]string, error) {
	panic("unexpected call")
}

var _ submissionStorage.StorageInterface = (*createSubmissionStorageMock)(nil)
var _ conferenceStorage.StorageInterface = (*createConferenceStorageMock)(nil)
var _ conferenceuserrole.StorageInterface = (*createRoleStorageMock)(nil)

func TestCreateReturnsConflictWhenAuthorAlreadySubmitted(t *testing.T) {
	gin.SetMode(gin.TestMode)
	controller := &Controller{
		submissionStorage: &createSubmissionStorageMock{err: submissionStorage.ErrAuthorAlreadySubmitted},
		conferenceStorage: &createConferenceStorageMock{},
		roleStorage:       &createRoleStorageMock{},
	}

	ginCtx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ginCtx.Request = httptest.NewRequest(http.MethodPost, "/api/v1/conferences/210/submissions", nil)
	ginCtx.Params = gin.Params{{Key: "conference_id", Value: "210"}}
	ginCtx.Set("user_email", "author@example.com")

	_, err := controller.Create(ginCtx, &dto.SubmissionCreateRequest{
		Submission: &dto.Submission{Status: dto.StatusDraft},
	})

	errResp, ok := err.(*handler.ErrorResponse)
	if !ok {
		t.Fatalf("expected ErrorResponse, got %T", err)
	}
	if errResp.StatusCode != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", errResp.StatusCode)
	}
	if errResp.Message != "You already have a submission for this conference. Open your existing submission instead of creating a new one." {
		t.Fatalf("unexpected message: %s", errResp.Message)
	}
}
