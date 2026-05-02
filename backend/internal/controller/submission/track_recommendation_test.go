package submission

import (
	"context"
	"errors"
	"net/http/httptest"
	"testing"

	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/dto"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	"github.com/gin-gonic/gin"
)

type trackRecommendationConferenceStore struct {
	conference *dto.ConferenceResponse
	err        error
}

func (s *trackRecommendationConferenceStore) Create(context.Context, *dto.Conference) (*dto.ConferenceResponse, error) {
	panic("unexpected call to Create")
}
func (s *trackRecommendationConferenceStore) GetByID(context.Context, int64) (*dto.ConferenceResponse, error) {
	if s.err != nil {
		return nil, s.err
	}
	return s.conference, nil
}
func (s *trackRecommendationConferenceStore) GetByIDForUser(context.Context, int64, string) (*dto.ConferenceResponse, error) {
	panic("unexpected call to GetByIDForUser")
}
func (s *trackRecommendationConferenceStore) GetByAcronym(context.Context, string) (*dto.ConferenceResponse, error) {
	panic("unexpected call to GetByAcronym")
}
func (s *trackRecommendationConferenceStore) List(context.Context, *conferenceStorage.QueryParams) ([]*dto.ConferenceResponse, int64, error) {
	panic("unexpected call to List")
}
func (s *trackRecommendationConferenceStore) Update(context.Context, int64, *dto.Conference) (*dto.ConferenceResponse, error) {
	panic("unexpected call to Update")
}
func (s *trackRecommendationConferenceStore) Delete(context.Context, int64) error {
	panic("unexpected call to Delete")
}
func (s *trackRecommendationConferenceStore) TransitionStatus(context.Context, int64, string) (*dto.ConferenceResponse, error) {
	panic("unexpected call to TransitionStatus")
}
func (s *trackRecommendationConferenceStore) AddBookmark(context.Context, string, int64) error {
	panic("unexpected call to AddBookmark")
}
func (s *trackRecommendationConferenceStore) RemoveBookmark(context.Context, string, int64) error {
	panic("unexpected call to RemoveBookmark")
}
func (s *trackRecommendationConferenceStore) IsBookmarked(context.Context, string, int64) (bool, error) {
	panic("unexpected call to IsBookmarked")
}
func (s *trackRecommendationConferenceStore) GetStats(context.Context, int64) (*dto.ConferenceStatsResponse, error) {
	panic("unexpected call to GetStats")
}
func (s *trackRecommendationConferenceStore) GetRebuttalSettings(context.Context, int64) (*dto.ConferenceRebuttalConfig, error) {
	panic("unexpected call to GetRebuttalSettings")
}
func (s *trackRecommendationConferenceStore) SaveRebuttalSettings(context.Context, int64, *dto.SaveRebuttalConfigRequest) (*dto.ConferenceRebuttalConfig, error) {
	panic("unexpected call to SaveRebuttalSettings")
}
func (s *trackRecommendationConferenceStore) OpenRebuttal(context.Context, int64) error {
	panic("unexpected call to OpenRebuttal")
}
func (s *trackRecommendationConferenceStore) FinalizeRebuttal(context.Context, int64) error {
	panic("unexpected call to FinalizeRebuttal")
}
func (s *trackRecommendationConferenceStore) OpenDiscussion(context.Context, int64) error {
	panic("unexpected call to OpenDiscussion")
}
func (s *trackRecommendationConferenceStore) GetRebuttalOverview(context.Context, int64) (*dto.RebuttalOverviewResponse, error) {
	panic("unexpected call to GetRebuttalOverview")
}
func (s *trackRecommendationConferenceStore) GetOverdueRebuttalConferences(context.Context) ([]int64, error) {
	panic("unexpected call to GetOverdueRebuttalConferences")
}

type fakeTrackRecommendationClient struct {
	response *aiServiceClient.TrackRecommendationResponse
	err      error
}

func (f *fakeTrackRecommendationClient) RecommendTracks(
	_ context.Context,
	_ string,
	_ *aiServiceClient.TrackRecommendationRequest,
) (*aiServiceClient.TrackRecommendationResponse, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.response, nil
}

func TestRecommendTracksReturnsRankedRecommendations(t *testing.T) {
	ginCtx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ginCtx.Request = httptest.NewRequest("POST", "/api/v1/conferences/42/submissions/track-recommendation", nil).WithContext(context.Background())
	ginCtx.Request.Header.Set("Authorization", "Bearer author-token")

	callForPapers := "Topics include systems and AI."
	controller := &Controller{
		conferenceStorage: &trackRecommendationConferenceStore{
			conference: &dto.ConferenceResponse{
				Title:       "ConferenceSpace",
				Acronym:     "CS",
				Description: "A systems conference",
				Tracks:      []string{"AI Systems", "Theory"},
				Domain:      []string{"AI", "Systems"},
				Configurations: &dto.ConferenceConfiguration{
					CallForPaperText: &callForPapers,
				},
			},
		},
		trackRecommendation: &fakeTrackRecommendationClient{
			response: &aiServiceClient.TrackRecommendationResponse{
				Recommendations: []aiServiceClient.TrackRecommendationItem{
					{TrackName: "AI Systems", Confidence: 0.93, Reasoning: "Strong systems fit.", Rank: 1},
					{TrackName: "Theory", Confidence: 0.12, Reasoning: "Weak theory fit.", Rank: 2},
				},
			},
		},
	}

	response, err := controller.RecommendTracks(ginCtx, &dto.TrackRecommendationRequest{
		ConferenceID: 42,
		Title:        "Serving LLMs Efficiently",
		Abstract:     "This paper studies scalable inference systems for large language models in production deployments with detailed evaluation across latency and throughput trade-offs.",
		Keywords:     []string{"LLM Serving", "Inference Systems"},
	})
	if err != nil {
		t.Fatalf("RecommendTracks() error = %v", err)
	}
	if response == nil || len(response.Recommendations) != 2 {
		t.Fatalf("RecommendTracks() response = %+v", response)
	}
	if response.Recommendations[0].TrackName != "AI Systems" {
		t.Fatalf("top recommendation = %+v", response.Recommendations[0])
	}
}

func TestRecommendTracksValidatesConferenceTracks(t *testing.T) {
	ginCtx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ginCtx.Request = httptest.NewRequest("POST", "/api/v1/conferences/42/submissions/track-recommendation", nil).WithContext(context.Background())

	controller := &Controller{
		conferenceStorage:   &trackRecommendationConferenceStore{conference: &dto.ConferenceResponse{}},
		trackRecommendation: &fakeTrackRecommendationClient{},
	}

	response, err := controller.RecommendTracks(ginCtx, &dto.TrackRecommendationRequest{
		ConferenceID: 42,
		Title:        "Serving LLMs Efficiently",
		Abstract:     "This paper studies scalable inference systems for large language models in production deployments with detailed evaluation across latency and throughput trade-offs.",
	})
	if err == nil {
		t.Fatalf("expected validation error, got response = %+v", response)
	}
}

func TestRecommendTracksValidatesPaperContext(t *testing.T) {
	ginCtx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ginCtx.Request = httptest.NewRequest("POST", "/api/v1/conferences/42/submissions/track-recommendation", nil).WithContext(context.Background())

	controller := &Controller{
		conferenceStorage:   &trackRecommendationConferenceStore{},
		trackRecommendation: &fakeTrackRecommendationClient{err: errors.New("unexpected downstream call")},
	}

	response, err := controller.RecommendTracks(ginCtx, &dto.TrackRecommendationRequest{
		ConferenceID: 42,
		Title:        "Short",
		Abstract:     "Too short",
	})
	if err == nil {
		t.Fatalf("expected validation error, got response = %+v", response)
	}
}
