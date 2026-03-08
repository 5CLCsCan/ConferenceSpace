package conference

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	submissionTestClient "github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestGetConferenceStats_AsChair verifies a chair can get conference stats.
func TestGetConferenceStats_AsChair(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})

	conferenceClient := NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Stats Test Conference",
		Acronym: testutils.UniqueString("STC"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}

	resp, err := conferenceClient.GetStats(createdConf.ID, chairToken)
	if err != nil {
		t.Fatalf("Failed to get stats: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200, got %d", resp.StatusCode)
	}

	var result struct {
		Data *dto.ConferenceStatsResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &result)

	if result.Data == nil {
		t.Fatal("Expected stats data, got nil")
	}
	if result.Data.Tracks == nil {
		t.Error("Expected tracks to be non-nil (even if empty)")
	}
	t.Logf("Stats: submissions=%d, assigned=%d, tracks=%d",
		result.Data.Submissions.Total,
		result.Data.Reviews.TotalAssigned,
		len(result.Data.Tracks),
	)
}

// TestGetConferenceStats_NonChairForbidden verifies a non-chair cannot access stats.
func TestGetConferenceStats_NonChairForbidden(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	otherToken, _, _ := ctx.RegisterUniqueUser("other", "password123", "Other", "User", []string{"AI"})

	conferenceClient := NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Stats Forbidden Test",
		Acronym: testutils.UniqueString("SFT"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}

	resp, err := conferenceClient.GetStats(createdConf.ID, otherToken)
	if err != nil {
		t.Fatalf("Failed to call stats endpoint: %v", err)
	}

	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d", resp.StatusCode)
	}
}

// TestGetConferenceStats_WithSubmissions verifies stats shape is correct and counts are non-negative.
func TestGetConferenceStats_WithSubmissions(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})

	conferenceClient := NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Stats Submissions Test Conference",
		Acronym: testutils.UniqueString("SSTC"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}

	// Create 3 submissions using different authors
	subClient := submissionTestClient.NewClient(ctx)
	for i := 0; i < 3; i++ {
		authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
		_, err = subClient.CreateSuccess(createdConf.ID, &dto.Submission{
			ConferenceID: createdConf.ID,
			Author:       author.Email,
			Title:        fmt.Sprintf("Stats Test Paper %d", i+1),
			Abstract:     "Abstract",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
			Information:  &dto.SubmissionInformation{Keywords: []string{"AI"}},
		}, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission %d: %v", i+1, err)
		}
	}

	resp, err := conferenceClient.GetStats(createdConf.ID, chairToken)
	if err != nil {
		t.Fatalf("Failed to get stats: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200, got %d", resp.StatusCode)
	}

	var result struct {
		Data *dto.ConferenceStatsResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &result)

	if result.Data == nil {
		t.Fatal("Expected stats data, got nil")
	}

	// Verify shape: all counts are non-negative
	s := result.Data.Submissions
	if s.Total < 0 {
		t.Errorf("submissions.total must be non-negative, got %d", s.Total)
	}
	if s.Draft < 0 {
		t.Errorf("submissions.draft must be non-negative, got %d", s.Draft)
	}
	if s.Submitted < 0 {
		t.Errorf("submissions.submitted must be non-negative, got %d", s.Submitted)
	}
	if s.Accepted < 0 {
		t.Errorf("submissions.accepted must be non-negative, got %d", s.Accepted)
	}
	if s.Rejected < 0 {
		t.Errorf("submissions.rejected must be non-negative, got %d", s.Rejected)
	}

	// total == draft + submitted + accepted + rejected
	expectedTotal := s.Draft + s.Submitted + s.Accepted + s.Rejected
	if s.Total != expectedTotal {
		t.Errorf("submissions.total=%d does not equal draft+submitted+accepted+rejected=%d",
			s.Total, expectedTotal)
	}

	// Review stats non-negative
	r := result.Data.Reviews
	if r.TotalAssigned < 0 {
		t.Errorf("reviews.total_assigned must be non-negative, got %d", r.TotalAssigned)
	}
	if r.Completed < 0 {
		t.Errorf("reviews.completed must be non-negative, got %d", r.Completed)
	}
	if r.Pending < 0 {
		t.Errorf("reviews.pending must be non-negative, got %d", r.Pending)
	}

	// Tracks must be non-nil
	if result.Data.Tracks == nil {
		t.Error("Expected tracks to be non-nil (even if empty)")
	}

	// We created 3 submissions so total must be >= 3
	if s.Total < 3 {
		t.Errorf("Expected at least 3 submissions, got %d", s.Total)
	}

	t.Logf("Stats: submissions=%+v, reviews=%+v, tracks=%d", s, r, len(result.Data.Tracks))
}

// TestGetConferenceStats_Unauthenticated verifies unauthenticated requests are rejected.
func TestGetConferenceStats_Unauthenticated(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})

	conferenceClient := NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Stats Auth Test",
		Acronym: testutils.UniqueString("SAT"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}

	resp, err := conferenceClient.GetStats(createdConf.ID, "")
	if err != nil {
		t.Fatalf("Failed to call stats endpoint: %v", err)
	}

	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("Expected 401, got %d", resp.StatusCode)
	}
}
