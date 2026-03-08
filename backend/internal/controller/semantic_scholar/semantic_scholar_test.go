package semantic_scholar

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	client "github.com/dcao/conferencespace/internal/clients/semantic_scholar"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type fakeCacheStorage struct{}

func (f *fakeCacheStorage) Get(context.Context, string) ([]byte, bool, error) { return nil, false, nil }
func (f *fakeCacheStorage) Set(context.Context, string, string, []byte) error { return nil }
func (f *fakeCacheStorage) Delete(context.Context, string) error              { return nil }
func (f *fakeCacheStorage) DeleteByType(context.Context, string) (int64, error) {
	return 0, nil
}

type fakeScholarStorage struct {
	profile *model.ScholarProfile
	papers  []*model.ScholarPaper
}

func (f *fakeScholarStorage) CreateProfile(context.Context, *model.ScholarProfile) error {
	panic("unexpected call to CreateProfile")
}

func (f *fakeScholarStorage) GetProfileByUserID(context.Context, int64) (*model.ScholarProfile, error) {
	panic("unexpected call to GetProfileByUserID")
}

func (f *fakeScholarStorage) GetProfileBySemanticID(_ context.Context, semanticID string) (*model.ScholarProfile, error) {
	if f.profile != nil && f.profile.SemanticScholarID == semanticID {
		return f.profile, nil
	}
	return nil, nil
}

func (f *fakeScholarStorage) UpsertPaper(context.Context, *model.ScholarPaper) (int64, error) {
	panic("unexpected call to UpsertPaper")
}

func (f *fakeScholarStorage) LinkPaperToProfile(context.Context, int64, int64) error {
	panic("unexpected call to LinkPaperToProfile")
}

func (f *fakeScholarStorage) ClearProfilePapers(context.Context, int64) error {
	panic("unexpected call to ClearProfilePapers")
}

func (f *fakeScholarStorage) ReplaceProfilePapers(context.Context, int64, []int64) error {
	panic("unexpected call to ReplaceProfilePapers")
}

func (f *fakeScholarStorage) GetPapersByProfileID(context.Context, int64) ([]*model.ScholarPaper, error) {
	return f.papers, nil
}

func (f *fakeScholarStorage) DeleteProfileByUserID(context.Context, int64) error {
	panic("unexpected call to DeleteProfileByUserID")
}

func TestGetAuthorDetailsUsesStoredPaperMetadata(t *testing.T) {
	gin.SetMode(gin.TestMode)

	authors, err := json.Marshal([]client.Author{
		{AuthorID: "a-1", Name: "Grace Hopper"},
		{AuthorID: "a-2", Name: "Alan Turing"},
	})
	require.NoError(t, err)

	controller := &Controller{
		cache: &fakeCacheStorage{},
		scholar: &fakeScholarStorage{
			profile: &model.ScholarProfile{
				ID:                10,
				SemanticScholarID: "author-10",
				Name:              "Grace Hopper",
				Affiliations:      []string{"Yale University"},
				PaperCount:        1,
				CitationCount:     10,
				HIndex:            3,
				URL:               "https://example.com/author-10",
			},
			papers: []*model.ScholarPaper{
				{
					SemanticScholarID: "paper-10",
					Title:             "Compiler Construction",
					Abstract:          "Compiler metadata should stay intact.",
					Venue:             "CACM",
					Year:              1952,
					CitationCount:     22,
					URL:               "https://example.com/paper-10",
					Authors:           authors,
				},
			},
		},
	}

	w := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(w)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/v1/semantic-scholar/authors/author-10", nil)
	ctx.Params = gin.Params{{Key: "authorId", Value: "author-10"}}

	result, err := controller.GetAuthorDetails(ctx)
	require.NoError(t, err)
	require.NotNil(t, result)
	require.Len(t, result.Papers, 1)

	assert.Equal(t, "Compiler metadata should stay intact.", result.Papers[0].Abstract)
	assert.Equal(t, "CACM", result.Papers[0].Venue)
	assert.Equal(t, []client.Author{
		{AuthorID: "a-1", Name: "Grace Hopper"},
		{AuthorID: "a-2", Name: "Alan Turing"},
	}, result.Papers[0].Authors)
}
