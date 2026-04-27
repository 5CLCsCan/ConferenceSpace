package semantic_scholar

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"testing"

	client "github.com/dcao/conferencespace/internal/clients/semantic_scholar"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	researchdomain "github.com/dcao/conferencespace/internal/service/research_domain"
	userstorage "github.com/dcao/conferencespace/internal/storage/user"
)

type fakeSyncSemanticScholarClient struct {
	author *client.AuthorWithPapers
	err    error
}

func (f *fakeSyncSemanticScholarClient) SearchAuthors(context.Context, string, int) (*client.SearchResponse, error) {
	panic("unexpected call to SearchAuthors")
}

func (f *fakeSyncSemanticScholarClient) GetAuthorDetails(context.Context, string) (*client.AuthorWithPapers, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.author, nil
}

func (f *fakeSyncSemanticScholarClient) GetAuthorPapers(context.Context, string, int, int) (*client.PapersResponse, error) {
	panic("unexpected call to GetAuthorPapers")
}

type syncScholarStorage struct {
	profile          *model.ScholarProfile
	upsertedPapers   []*model.ScholarPaper
	replaceProfileID int64
	replacePaperIDs  []int64
}

func (s *syncScholarStorage) CreateProfile(_ context.Context, profile *model.ScholarProfile) error {
	profile.ID = 99
	s.profile = profile
	return nil
}

func (s *syncScholarStorage) GetProfileByUserID(context.Context, int64) (*model.ScholarProfile, error) {
	panic("unexpected call to GetProfileByUserID")
}

func (s *syncScholarStorage) GetProfileBySemanticID(context.Context, string) (*model.ScholarProfile, error) {
	panic("unexpected call to GetProfileBySemanticID")
}

func (s *syncScholarStorage) UpsertPaper(_ context.Context, paper *model.ScholarPaper) (int64, error) {
	s.upsertedPapers = append(s.upsertedPapers, paper)
	return int64(100 + len(s.upsertedPapers)), nil
}

func (s *syncScholarStorage) LinkPaperToProfile(context.Context, int64, int64) error {
	panic("unexpected call to LinkPaperToProfile")
}

func (s *syncScholarStorage) ClearProfilePapers(context.Context, int64) error {
	panic("unexpected call to ClearProfilePapers")
}

func (s *syncScholarStorage) ReplaceProfilePapers(_ context.Context, profileID int64, paperIDs []int64) error {
	s.replaceProfileID = profileID
	s.replacePaperIDs = append([]int64(nil), paperIDs...)
	return nil
}

func (s *syncScholarStorage) GetPapersByProfileID(context.Context, int64) ([]*model.ScholarPaper, error) {
	panic("unexpected call to GetPapersByProfileID")
}

func (s *syncScholarStorage) DeleteProfileByUserID(context.Context, int64) error {
	panic("unexpected call to DeleteProfileByUserID")
}

type syncUserStorage struct {
	lastUserID int64
	lastDomain []string
}

func (s *syncUserStorage) Create(context.Context, *dto.User, string, bool) (*dto.UserResponse, error) {
	panic("unexpected call to Create")
}

func (s *syncUserStorage) GetByID(context.Context, int64) (*dto.UserResponse, error) {
	panic("unexpected call to GetByID")
}

func (s *syncUserStorage) GetByEmail(context.Context, string) (*dto.UserResponse, error) {
	panic("unexpected call to GetByEmail")
}

func (s *syncUserStorage) GetByEmailWithPassword(context.Context, string) (*dto.UserResponse, string, error) {
	panic("unexpected call to GetByEmailWithPassword")
}

func (s *syncUserStorage) List(context.Context, *userstorage.QueryParams) ([]*dto.UserResponse, int64, error) {
	panic("unexpected call to List")
}

func (s *syncUserStorage) Update(context.Context, int64, *dto.User) (*dto.UserResponse, error) {
	panic("unexpected call to Update")
}

func (s *syncUserStorage) UpdateDomain(_ context.Context, id int64, domain []string) (*dto.UserResponse, error) {
	s.lastUserID = id
	s.lastDomain = append([]string(nil), domain...)
	return &dto.UserResponse{User: &dto.User{ID: id, Domain: domain}}, nil
}

func (s *syncUserStorage) UpdateByEmail(context.Context, string, *dto.User) (*dto.UserResponse, error) {
	panic("unexpected call to UpdateByEmail")
}

func (s *syncUserStorage) Delete(context.Context, int64) error {
	panic("unexpected call to Delete")
}

func (s *syncUserStorage) DeleteByEmail(context.Context, string) error {
	panic("unexpected call to DeleteByEmail")
}

func (s *syncUserStorage) UpdatePassword(context.Context, string, string) error {
	panic("unexpected call to UpdatePassword")
}

func (s *syncUserStorage) SetEmailVerified(context.Context, string, bool) error {
	panic("unexpected call to SetEmailVerified")
}

type fakeResearchDomainGenerator struct {
	keywords []string
	err      error
}

func (f fakeResearchDomainGenerator) GenerateJSON(_ context.Context, _ string, _ map[string]any, out any) error {
	if f.err != nil {
		return f.err
	}

	payload, err := json.Marshal(map[string]any{
		"keywords": f.keywords,
	})
	if err != nil {
		return err
	}

	return json.Unmarshal(payload, out)
}

func TestSyncAuthorProfileUpdatesResearchDomains(t *testing.T) {
	scholarStore := &syncScholarStorage{}
	userStore := &syncUserStorage{}
	controller := &Controller{
		client: &fakeSyncSemanticScholarClient{
			author: &client.AuthorWithPapers{
				Author: client.Author{
					AuthorID:      "1741101",
					Name:          "Test Author",
					Affiliations:  []string{"Test University"},
					PaperCount:    2,
					CitationCount: 25,
					HIndex:        4,
					URL:           "https://example.com/author",
				},
				Papers: []client.Paper{
					{PaperID: "p1", Title: "Paper One", Abstract: "Abstract one", Venue: "ACL", Year: 2024},
					{PaperID: "p2", Title: "Paper Two", Abstract: "Abstract two", Venue: "EMNLP", Year: 2023},
				},
			},
		},
		scholar:        scholarStore,
		users:          userStore,
		domainKeywords: researchdomain.New(fakeResearchDomainGenerator{keywords: []string{"Machine Learning", "Natural Language Processing"}}),
		syncLocks:      make(map[int64]*sync.Mutex),
	}

	err := controller.SyncAuthorProfile(context.Background(), 42, "1741101")
	if err != nil {
		t.Fatalf("SyncAuthorProfile() error = %v", err)
	}

	if scholarStore.profile == nil || scholarStore.profile.ID != 99 {
		t.Fatalf("profile was not created correctly: %+v", scholarStore.profile)
	}
	if len(scholarStore.upsertedPapers) != 2 {
		t.Fatalf("upserted %d papers, want 2", len(scholarStore.upsertedPapers))
	}
	if scholarStore.replaceProfileID != 99 {
		t.Fatalf("replaceProfileID = %d, want 99", scholarStore.replaceProfileID)
	}
	if len(scholarStore.replacePaperIDs) != 2 {
		t.Fatalf("replacePaperIDs = %v, want 2 linked papers", scholarStore.replacePaperIDs)
	}
	if userStore.lastUserID != 42 {
		t.Fatalf("lastUserID = %d, want 42", userStore.lastUserID)
	}
	if len(userStore.lastDomain) != 2 || userStore.lastDomain[0] != "Machine Learning" {
		t.Fatalf("lastDomain = %v, want inferred keywords", userStore.lastDomain)
	}
}

func TestSyncAuthorProfileContinuesWhenResearchDomainInferenceFails(t *testing.T) {
	scholarStore := &syncScholarStorage{}
	userStore := &syncUserStorage{}
	controller := &Controller{
		client: &fakeSyncSemanticScholarClient{
			author: &client.AuthorWithPapers{
				Author: client.Author{AuthorID: "1741101", Name: "Test Author"},
				Papers: []client.Paper{
					{PaperID: "p1", Title: "Paper One", Abstract: "Abstract one"},
				},
			},
		},
		scholar:        scholarStore,
		users:          userStore,
		domainKeywords: researchdomain.New(fakeResearchDomainGenerator{err: errors.New("gemini unavailable")}),
		syncLocks:      make(map[int64]*sync.Mutex),
	}

	err := controller.SyncAuthorProfile(context.Background(), 7, "1741101")
	if err != nil {
		t.Fatalf("SyncAuthorProfile() error = %v, want nil", err)
	}
	if userStore.lastUserID != 0 {
		t.Fatalf("expected no domain update when inference fails, got user %d", userStore.lastUserID)
	}
	if len(scholarStore.replacePaperIDs) != 1 {
		t.Fatalf("replacePaperIDs = %v, want synced paper link despite inference failure", scholarStore.replacePaperIDs)
	}
}
