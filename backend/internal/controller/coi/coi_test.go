package coi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type spyCOIService struct {
	autoRefreshCalls int
	checkCalled      bool
	checkReport      *dto.COIReport
}

func (s *spyCOIService) AutoRefreshIfNeeded(context.Context, int64) (bool, error) {
	s.autoRefreshCalls++
	return true, nil
}

func (s *spyCOIService) CheckReviewerAuthorCOI(context.Context, int64, int64, string) (*dto.COIReport, error) {
	s.checkCalled = true
	if s.checkReport != nil {
		return s.checkReport, nil
	}
	return &dto.COIReport{Severity: "none", Recommendation: "assign"}, nil
}

func (s *spyCOIService) GetDashboardStats(context.Context, int64) (*dto.COIDashboardStats, error) {
	panic("unexpected call")
}

func (s *spyCOIService) GetAllRelationships(context.Context, *dto.COIRelationshipListRequest) (*dto.COIRelationshipListResponse, error) {
	panic("unexpected call")
}

func (s *spyCOIService) GetPaperCOISummaries(context.Context, *dto.PaperCOIListRequest) (*dto.PaperCOIListResponse, error) {
	panic("unexpected call")
}

func (s *spyCOIService) BuildAndStoreRelationships(context.Context, int64) (int, error) {
	panic("unexpected call")
}

type allowChairRoleStorage struct{}

func (allowChairRoleStorage) AddRole(context.Context, int64, string, string) error { return nil }
func (allowChairRoleStorage) AddRoles(context.Context, []model.RoleAssignment) error {
	return nil
}
func (allowChairRoleStorage) RemoveRole(context.Context, int64, string) error { return nil }
func (allowChairRoleStorage) UpdateRoleStatus(context.Context, int64, string, string) error {
	return nil
}
func (allowChairRoleStorage) GetUserRoles(context.Context, int64, string) ([]string, error) {
	return nil, nil
}
func (allowChairRoleStorage) GetAllUserRoles(context.Context, string) ([]string, error) {
	return nil, nil
}
func (allowChairRoleStorage) HasRole(context.Context, int64, string, []string) (bool, error) {
	return true, nil
}
func (allowChairRoleStorage) GetEmailsByRole(context.Context, int64, string) ([]string, error) {
	return nil, nil
}

var _ coiAPI = (*spyCOIService)(nil)
var _ conferenceuserrole.StorageInterface = allowChairRoleStorage{}

func TestCheckReviewerAuthorCOI_DoesNotAutoRefresh(t *testing.T) {
	gin.SetMode(gin.TestMode)

	spy := &spyCOIService{}
	ctrl := &Controller{
		coiService:  spy,
		roleStorage: allowChairRoleStorage{},
	}

	w := httptest.NewRecorder()
	ginCtx, _ := gin.CreateTestContext(w)
	ginCtx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/coi/check/reviewer/1/author/author@example.com?conference_id=42", nil)
	ginCtx.Params = gin.Params{
		{Key: "reviewer_id", Value: "1"},
		{Key: "author_email", Value: "author@example.com"},
	}
	ginCtx.Set("is_admin", true)

	_, err := ctrl.CheckReviewerAuthorCOI(ginCtx, &dto.COICheckRequest{
		ReviewerID:  1,
		AuthorEmail: "author@example.com",
	})
	require.NoError(t, err)
	assert.True(t, spy.checkCalled, "pair check should call CheckReviewerAuthorCOI")
	assert.Equal(t, 0, spy.autoRefreshCalls, "pair check must not trigger AutoRefreshIfNeeded")
}
