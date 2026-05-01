package reviewer_suggestion

import (
	"context"
	"fmt"
	"testing"

	"github.com/dcao/conferencespace/internal/clients/semantic_scholar"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	reviewerStorage "github.com/dcao/conferencespace/internal/storage/reviewer"
	scholarStorage "github.com/dcao/conferencespace/internal/storage/scholar"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
)

// --- Mock S2 client ---

type mockS2Client struct {
	papers map[string]*semantic_scholar.PaperSearchResponse
}

func (m *mockS2Client) SearchPapers(ctx context.Context, query string, limit int) (*semantic_scholar.PaperSearchResponse, error) {
	if resp, ok := m.papers[query]; ok {
		return resp, nil
	}
	return &semantic_scholar.PaperSearchResponse{}, nil
}

// --- Mock Conference Storage ---

type mockConferenceStorage struct {
	conferenceStorage.StorageInterface
	conf *dto.ConferenceResponse
}

func (m *mockConferenceStorage) GetByID(ctx context.Context, id int64) (*dto.ConferenceResponse, error) {
	return m.conf, nil
}

// --- Mock Submission Storage ---

type mockSubmissionStorage struct {
	submissionStorage.StorageInterface
	subs []*dto.Submission
}

func (m *mockSubmissionStorage) List(ctx context.Context, params *submissionStorage.QueryParams) ([]*dto.Submission, int64, error) {
	return m.subs, int64(len(m.subs)), nil
}

// --- Mock User Storage ---

type mockUserStorage struct {
	userStorage.StorageInterface
	users []*dto.UserResponse
}

func (m *mockUserStorage) List(ctx context.Context, params *userStorage.QueryParams) ([]*dto.UserResponse, int64, error) {
	return m.users, int64(len(m.users)), nil
}

// --- Mock Reviewer Storage ---

type mockReviewerStorage struct {
	reviewerStorage.StorageInterface
	reviewers []*dto.Reviewer
}

func (m *mockReviewerStorage) List(ctx context.Context, conferenceID int64, params *reviewerStorage.ListParams) ([]*dto.Reviewer, int64, error) {
	return m.reviewers, int64(len(m.reviewers)), nil
}

// --- Mock Scholar Storage ---

type mockScholarStorage struct {
	scholarStorage.StorageInterface
	profiles map[int64]*model.ScholarProfile
	byS2ID   map[string]*model.ScholarProfile
}

func (m *mockScholarStorage) GetProfileByUserID(ctx context.Context, userID int64) (*model.ScholarProfile, error) {
	if p, ok := m.profiles[userID]; ok {
		return p, nil
	}
	return nil, fmt.Errorf("not found")
}

func (m *mockScholarStorage) GetProfileBySemanticID(ctx context.Context, semanticID string) (*model.ScholarProfile, error) {
	if p, ok := m.byS2ID[semanticID]; ok {
		return p, nil
	}
	return nil, fmt.Errorf("not found")
}

// --- Tests ---

func TestBuildTopicSet(t *testing.T) {
	svc := &Service{
		conferences: &mockConferenceStorage{
			conf: &dto.ConferenceResponse{
				Domain: []string{"AI", "ML", "NLP"},
			},
		},
		submissions: &mockSubmissionStorage{
			subs: []*dto.Submission{
				{
					Domain:      []string{"NLP", "Deep Learning"},
					Information: &dto.SubmissionInformation{Keywords: []string{"transformers"}},
				},
			},
		},
	}

	topics, err := svc.buildTopicSet(context.Background(), 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(topics) != 5 {
		t.Errorf("expected 5 topics, got %d: %v", len(topics), topics)
	}

	if topics[0] != "nlp" {
		t.Errorf("expected 'nlp' as most frequent, got %q", topics[0])
	}
}

func userResp(id int64, email, first, last string, domain []string) *dto.UserResponse {
	return &dto.UserResponse{
		User: &dto.User{ID: id, Email: email, FirstName: first, LastName: last, Domain: domain},
	}
}

func TestSuggestInternal_ExcludesExistingReviewers(t *testing.T) {
	svc := &Service{
		users: &mockUserStorage{
			users: []*dto.UserResponse{
				userResp(1, "alice@test.com", "Alice", "Smith", []string{"AI", "ML"}),
				userResp(2, "bob@test.com", "Bob", "Jones", []string{"NLP"}),
			},
		},
		scholars: &mockScholarStorage{
			profiles: map[int64]*model.ScholarProfile{},
			byS2ID:   map[string]*model.ScholarProfile{},
		},
	}

	excludeUserIDs := map[int64]bool{2: true}
	excludeEmails := map[string]bool{}

	results := svc.suggestInternal(context.Background(), []string{"ai", "ml"}, excludeUserIDs, excludeEmails)

	if len(results) != 1 {
		t.Fatalf("expected 1 suggestion, got %d", len(results))
	}
	if results[0].Name != "Alice Smith" {
		t.Errorf("expected Alice, got %s", results[0].Name)
	}
	if results[0].Score == 0 {
		t.Error("expected non-zero score")
	}
}

func TestSuggestInternal_ScoresCorrectly(t *testing.T) {
	svc := &Service{
		users: &mockUserStorage{
			users: []*dto.UserResponse{
				userResp(1, "a@test.com", "A", "User", []string{"AI", "ML", "NLP"}),
				userResp(2, "b@test.com", "B", "User", []string{"AI", "Robotics"}),
			},
		},
		scholars: &mockScholarStorage{
			profiles: map[int64]*model.ScholarProfile{},
			byS2ID:   map[string]*model.ScholarProfile{},
		},
	}

	results := svc.suggestInternal(context.Background(), []string{"ai", "ml", "nlp"}, map[int64]bool{}, map[string]bool{})

	if len(results) != 2 {
		t.Fatalf("expected 2 suggestions, got %d", len(results))
	}

	// User A: domains {ai,ml,nlp}, topics {ai,ml,nlp} → intersection=3, union=3, score=100
	// User B: domains {ai,robotics}, topics {ai,ml,nlp} → intersection=1, union=4, score=25
	var aScore, bScore int
	for _, r := range results {
		if r.Name == "A User" {
			aScore = r.Score
		} else if r.Name == "B User" {
			bScore = r.Score
		}
	}
	if aScore <= bScore {
		t.Errorf("User A should score higher than User B: A=%d, B=%d", aScore, bScore)
	}
}

func TestSuggestExternal_ScoresByMultiTopicAppearance(t *testing.T) {
	s2Client := &mockS2Client{
		papers: map[string]*semantic_scholar.PaperSearchResponse{
			"ai": {
				Data: []semantic_scholar.Paper{
					{Authors: []semantic_scholar.Author{{AuthorID: "a1", Name: "Multi Topic", PaperCount: 30}}},
				},
			},
			"ml": {
				Data: []semantic_scholar.Paper{
					{Authors: []semantic_scholar.Author{{AuthorID: "a1", Name: "Multi Topic", PaperCount: 30}}},
				},
			},
			"nlp": {
				Data: []semantic_scholar.Paper{
					{Authors: []semantic_scholar.Author{{AuthorID: "a2", Name: "Single Topic", PaperCount: 20}}},
				},
			},
		},
	}

	svc := &Service{
		s2Client: s2Client,
		scholars: &mockScholarStorage{profiles: map[int64]*model.ScholarProfile{}, byS2ID: map[string]*model.ScholarProfile{}},
	}

	results := svc.suggestExternal(context.Background(), []string{"ai", "ml", "nlp"}, map[int64]bool{}, map[int64]bool{}, map[string]bool{})

	if len(results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(results))
	}

	// a1 appeared in 2/3 topics = 67, a2 in 1/3 = 33
	var multiScore, singleScore int
	for _, r := range results {
		if r.Name == "Multi Topic" {
			multiScore = r.Score
		} else {
			singleScore = r.Score
		}
	}
	if multiScore <= singleScore {
		t.Errorf("multi-topic author should score higher: multi=%d, single=%d", multiScore, singleScore)
	}
}

func TestSuggestInternal_ExcludesChairAndCoChairs(t *testing.T) {
	svc := &Service{
		users: &mockUserStorage{
			users: []*dto.UserResponse{
				userResp(1, "chair@test.com", "The", "Chair", []string{"AI"}),
				userResp(2, "cochair@test.com", "Co", "Chair", []string{"AI"}),
				userResp(3, "normal@test.com", "Normal", "User", []string{"AI"}),
			},
		},
		scholars: &mockScholarStorage{profiles: map[int64]*model.ScholarProfile{}, byS2ID: map[string]*model.ScholarProfile{}},
	}

	excludeEmails := map[string]bool{
		"chair@test.com":   true,
		"cochair@test.com": true,
	}

	results := svc.suggestInternal(context.Background(), []string{"ai"}, map[int64]bool{}, excludeEmails)

	if len(results) != 1 {
		t.Fatalf("expected 1 suggestion (chair and co-chair excluded), got %d", len(results))
	}
	if results[0].Email != "normal@test.com" {
		t.Errorf("expected normal@test.com, got %s", results[0].Email)
	}
}

func TestGetSuggestions_EmptyTopics(t *testing.T) {
	svc := &Service{
		conferences: &mockConferenceStorage{
			conf: &dto.ConferenceResponse{Domain: []string{}},
		},
		submissions: &mockSubmissionStorage{subs: []*dto.Submission{}},
	}

	resp, err := svc.GetSuggestions(context.Background(), 1, 20)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(resp.Suggestions) != 0 {
		t.Errorf("expected empty suggestions for empty topics, got %d", len(resp.Suggestions))
	}
}

func TestGetSuggestions_MergeAndSort(t *testing.T) {
	svc := &Service{
		conferences: &mockConferenceStorage{
			conf: &dto.ConferenceResponse{Domain: []string{"AI", "ML"}},
		},
		submissions: &mockSubmissionStorage{subs: []*dto.Submission{}},
		reviewers:   &mockReviewerStorage{reviewers: []*dto.Reviewer{}},
		users: &mockUserStorage{
			users: []*dto.UserResponse{
				userResp(10, "internal@test.com", "Internal", "User", []string{"AI", "ML"}),
			},
		},
		scholars: &mockScholarStorage{profiles: map[int64]*model.ScholarProfile{}, byS2ID: map[string]*model.ScholarProfile{}},
		s2Client: &mockS2Client{
			papers: map[string]*semantic_scholar.PaperSearchResponse{
				"ai": {Data: []semantic_scholar.Paper{{Authors: []semantic_scholar.Author{{AuthorID: "ext1", Name: "External", PaperCount: 50}}}}},
			},
		},
	}

	resp, err := svc.GetSuggestions(context.Background(), 1, 20)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(resp.Suggestions) < 1 {
		t.Fatal("expected at least 1 suggestion")
	}

	// Verify sorted by score descending
	for i := 1; i < len(resp.Suggestions); i++ {
		if resp.Suggestions[i].Score > resp.Suggestions[i-1].Score {
			t.Errorf("suggestions not sorted by score: index %d (%d) > index %d (%d)",
				i, resp.Suggestions[i].Score, i-1, resp.Suggestions[i-1].Score)
		}
	}

	// Verify both internal and external sources present
	hasInternal, hasExternal := false, false
	for _, s := range resp.Suggestions {
		if s.Source == "internal" {
			hasInternal = true
		}
		if s.Source == "external" {
			hasExternal = true
		}
	}
	if !hasInternal {
		t.Error("expected at least one internal suggestion")
	}
	if !hasExternal {
		t.Error("expected at least one external suggestion")
	}
}

func TestGetSuggestions_NilS2Client(t *testing.T) {
	svc := &Service{
		conferences: &mockConferenceStorage{
			conf: &dto.ConferenceResponse{Domain: []string{"AI"}},
		},
		submissions: &mockSubmissionStorage{subs: []*dto.Submission{}},
		reviewers:   &mockReviewerStorage{reviewers: []*dto.Reviewer{}},
		users: &mockUserStorage{
			users: []*dto.UserResponse{
				userResp(1, "a@test.com", "A", "User", []string{"AI"}),
			},
		},
		scholars: &mockScholarStorage{profiles: map[int64]*model.ScholarProfile{}, byS2ID: map[string]*model.ScholarProfile{}},
		s2Client: nil,
	}

	resp, err := svc.GetSuggestions(context.Background(), 1, 20)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(resp.Suggestions) != 1 {
		t.Errorf("expected 1 internal suggestion with nil S2 client, got %d", len(resp.Suggestions))
	}
	if resp.Suggestions[0].Source != "internal" {
		t.Errorf("expected internal source, got %s", resp.Suggestions[0].Source)
	}
}

func TestGetSuggestions_LimitApplied(t *testing.T) {
	users := make([]*dto.UserResponse, 30)
	for i := range users {
		users[i] = userResp(int64(i+1), fmt.Sprintf("user%d@test.com", i),
			fmt.Sprintf("User%d", i), "Test", []string{"AI"})
	}

	svc := &Service{
		conferences: &mockConferenceStorage{
			conf: &dto.ConferenceResponse{Domain: []string{"AI"}},
		},
		submissions: &mockSubmissionStorage{subs: []*dto.Submission{}},
		reviewers:   &mockReviewerStorage{reviewers: []*dto.Reviewer{}},
		users:       &mockUserStorage{users: users},
		scholars:    &mockScholarStorage{profiles: map[int64]*model.ScholarProfile{}, byS2ID: map[string]*model.ScholarProfile{}},
		s2Client:    nil,
	}

	resp, err := svc.GetSuggestions(context.Background(), 1, 5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(resp.Suggestions) != 5 {
		t.Errorf("expected 5 suggestions (limit), got %d", len(resp.Suggestions))
	}
}

func TestSuggestExternal_DeduplicatesWithInternal(t *testing.T) {
	s2Client := &mockS2Client{
		papers: map[string]*semantic_scholar.PaperSearchResponse{
			"ai": {
				Data: []semantic_scholar.Paper{
					{
						Title: "AI Paper",
						Authors: []semantic_scholar.Author{
							{AuthorID: "s2-111", Name: "Already Internal", PaperCount: 10},
						},
					},
					{
						Title: "Another Paper",
						Authors: []semantic_scholar.Author{
							{AuthorID: "s2-222", Name: "External Author", PaperCount: 20, Affiliations: []string{"MIT"}},
						},
					},
				},
			},
		},
	}

	svc := &Service{
		s2Client: s2Client,
		scholars: &mockScholarStorage{
			profiles: map[int64]*model.ScholarProfile{},
			byS2ID:   map[string]*model.ScholarProfile{},
		},
	}

	internalScholarIDs := map[string]bool{"s2-111": true}

	results := svc.suggestExternal(context.Background(), []string{"ai"}, map[int64]bool{}, map[int64]bool{}, internalScholarIDs)

	if len(results) != 1 {
		t.Fatalf("expected 1 external suggestion (s2-111 should be deduped), got %d", len(results))
	}
	if results[0].Name != "External Author" {
		t.Errorf("expected External Author, got %s", results[0].Name)
	}
}
