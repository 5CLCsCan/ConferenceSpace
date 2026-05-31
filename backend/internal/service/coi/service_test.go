package coi

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	coiStorage "github.com/dcao/conferencespace/internal/storage/coi"
	reviewerStorage "github.com/dcao/conferencespace/internal/storage/reviewer"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
)

type countingDetector struct {
	detectCalls atomic.Int32
	delay       time.Duration
}

func (d *countingDetector) DetectConflicts(context.Context, []commons.Submission, []commons.Reviewer) (commons.ConflictMap, error) {
	return commons.ConflictMap{}, nil
}

func (d *countingDetector) DetectConflictsWithDetails(ctx context.Context, submissions []commons.Submission, reviewers []commons.Reviewer) ([]commons.ConflictDetail, error) {
	d.detectCalls.Add(1)
	if d.delay > 0 {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(d.delay):
		}
	}
	return nil, nil
}

func (d *countingDetector) HasConflict(context.Context, int64, int64) (bool, error) {
	return false, nil
}

func (d *countingDetector) Name() string { return "counting" }

type coiStorageMock struct {
	lastRebuild map[int64]*time.Time
	relationships []*model.COIRelationship
}

func newCOIStorageMock() *coiStorageMock {
	return &coiStorageMock{lastRebuild: make(map[int64]*time.Time)}
}

func (m *coiStorageMock) Create(context.Context, *model.COIRelationship) error { return nil }
func (m *coiStorageMock) BatchCreate(_ context.Context, relationships []*model.COIRelationship) error {
	m.relationships = append(m.relationships[:0], relationships...)
	return nil
}
func (m *coiStorageMock) GetByConference(context.Context, int64, *coiStorage.QueryFilters) ([]*model.COIRelationship, int64, error) {
	return nil, 0, nil
}
func (m *coiStorageMock) GetByReviewerAndAuthor(context.Context, int64, int64, string) ([]*model.COIRelationship, error) {
	return nil, nil
}
func (m *coiStorageMock) GetBySubmission(context.Context, int64, int64) ([]*model.COIRelationship, error) {
	return nil, nil
}
func (m *coiStorageMock) GetDashboardStats(context.Context, int64) (*dto.COIDashboardStats, error) {
	return &dto.COIDashboardStats{}, nil
}
func (m *coiStorageMock) DeleteByConference(context.Context, int64) error { return nil }
func (m *coiStorageMock) DeleteByConferenceAndSubmission(context.Context, int64, int64) error {
	return nil
}
func (m *coiStorageMock) DeleteByConferenceAndReviewer(context.Context, int64, int64) error {
	return nil
}
func (m *coiStorageMock) GetPaperSummaries(context.Context, int64, *coiStorage.PaperQueryFilters) ([]*coiStorage.PaperSummaryData, int64, error) {
	return nil, 0, nil
}
func (m *coiStorageMock) GetLastRebuildAt(_ context.Context, conferenceID int64) (*time.Time, error) {
	t := m.lastRebuild[conferenceID]
	return t, nil
}
func (m *coiStorageMock) SetLastRebuildAt(_ context.Context, conferenceID int64, rebuiltAt time.Time) error {
	t := rebuiltAt
	m.lastRebuild[conferenceID] = &t
	return nil
}
func (m *coiStorageMock) UpsertDirtyConference(context.Context, int64, string) error { return nil }
func (m *coiStorageMock) UpsertDirtySubmission(context.Context, int64, int64, string) error {
	return nil
}
func (m *coiStorageMock) UpsertDirtyReviewer(context.Context, int64, int64, string) error { return nil }
func (m *coiStorageMock) ListDirtyScopes(context.Context, int64, int) ([]*coiStorage.DirtyScope, error) {
	return nil, nil
}
func (m *coiStorageMock) DeleteDirtyScope(context.Context, int64, string, string) error { return nil }
func (m *coiStorageMock) ClearDirtyScopes(context.Context, int64) error { return nil }

type submissionListMock struct {
	submissionStorage.StorageInterface
	subs []*dto.Submission
}

func (m *submissionListMock) List(context.Context, *submissionStorage.QueryParams) ([]*dto.Submission, int64, error) {
	return m.subs, int64(len(m.subs)), nil
}

type reviewerListMock struct {
	reviewerStorage.StorageInterface
	reviewers []*dto.Reviewer
}

func (m *reviewerListMock) List(context.Context, int64, *reviewerStorage.ListParams) ([]*dto.Reviewer, int64, error) {
	return m.reviewers, int64(len(m.reviewers)), nil
}

func TestBuildAndStoreRelationships_SingleflightConcurrentRebuild(t *testing.T) {
	detector := &countingDetector{delay: 50 * time.Millisecond}
	store := newCOIStorageMock()

	svc := New(
		detector,
		store,
		&submissionListMock{subs: []*dto.Submission{{ID: 1, Author: "a@example.com"}}},
		&reviewerListMock{reviewers: []*dto.Reviewer{{ID: 2, Email: "r@example.com"}}},
		nil,
	)

	const workers = 8
	var wg sync.WaitGroup
	wg.Add(workers)
	errCh := make(chan error, workers)

	for i := 0; i < workers; i++ {
		go func() {
			defer wg.Done()
			if _, err := svc.BuildAndStoreRelationships(context.Background(), 99); err != nil {
				errCh <- err
			}
		}()
	}
	wg.Wait()
	close(errCh)

	for err := range errCh {
		t.Fatalf("BuildAndStoreRelationships() error = %v", err)
	}

	if got := detector.detectCalls.Load(); got != 1 {
		t.Fatalf("detectCalls = %d, want 1 (singleflight should coalesce concurrent rebuilds)", got)
	}
}

func TestAutoRefreshIfNeeded_ConcurrentStaleRebuildSingleflight(t *testing.T) {
	detector := &countingDetector{delay: 50 * time.Millisecond}
	store := newCOIStorageMock()

	svc := New(
		detector,
		store,
		&submissionListMock{subs: []*dto.Submission{{ID: 1, Author: "a@example.com"}}},
		&reviewerListMock{reviewers: []*dto.Reviewer{{ID: 2, Email: "r@example.com"}}},
		nil,
	)

	const workers = 8
	var wg sync.WaitGroup
	wg.Add(workers)
	errCh := make(chan error, workers)

	for i := 0; i < workers; i++ {
		go func() {
			defer wg.Done()
			if _, err := svc.AutoRefreshIfNeeded(context.Background(), 99); err != nil {
				errCh <- err
			}
		}()
	}
	wg.Wait()
	close(errCh)

	for err := range errCh {
		t.Fatalf("AutoRefreshIfNeeded() error = %v", err)
	}

	if got := detector.detectCalls.Load(); got != 1 {
		t.Fatalf("detectCalls = %d, want 1 (concurrent auto-refresh should coalesce rebuild)", got)
	}
}

// Stubs for unused storage interface methods in pair-check tests.
type pairCheckUserStorage struct {
	userStorage.StorageInterface
	user *dto.UserResponse
}

func (m *pairCheckUserStorage) GetByID(context.Context, int64) (*dto.UserResponse, error) {
	if m.user != nil {
		return m.user, nil
	}
	return nil, fmt.Errorf("not found")
}

func (m *pairCheckUserStorage) GetByEmail(context.Context, string) (*dto.UserResponse, error) {
	if m.user != nil {
		return m.user, nil
	}
	return nil, fmt.Errorf("not found")
}

type pairCheckReviewerStorage struct {
	reviewerStorage.StorageInterface
	reviewer *dto.Reviewer
}

func (m *pairCheckReviewerStorage) GetByID(context.Context, int64) (*dto.Reviewer, error) {
	if m.reviewer != nil {
		return m.reviewer, nil
	}
	return nil, fmt.Errorf("not found")
}

func TestCheckReviewerAuthorCOI_DoesNotInvokeDetector(t *testing.T) {
	detector := &countingDetector{}
	store := newCOIStorageMock()

	svc := New(
		detector,
		store,
		nil,
		&pairCheckReviewerStorage{reviewer: &dto.Reviewer{ID: 2, Email: "r@example.com", UserID: 10}},
		&pairCheckUserStorage{user: &dto.UserResponse{User: &dto.User{ID: 10, Email: "a@example.com", FirstName: "A", LastName: "Author"}}},
	)

	_, err := svc.CheckReviewerAuthorCOI(context.Background(), 1, 2, "a@example.com")
	if err != nil {
		t.Fatalf("CheckReviewerAuthorCOI() error = %v", err)
	}
	if got := detector.detectCalls.Load(); got != 0 {
		t.Fatalf("detectCalls = %d, want 0 (pair check must not run conflict detection)", got)
	}
}

var _ detectors.ConflictDetector = (*countingDetector)(nil)
var _ coiStorage.StorageInterface = (*coiStorageMock)(nil)
