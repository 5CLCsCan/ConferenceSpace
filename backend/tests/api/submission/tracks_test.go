package submission

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestSubmissionTracks(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair_tracks", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author_tracks", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference with tracks
	conf := &dto.Conference{
		Title:   "Conference with Tracks",
		Acronym: testutils.UniqueString("CWT2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI", "ML"},
		Tracks:  []string{"Machine Learning", "Computer Vision", "Natural Language Processing"},
	}
	confResp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Verify conference has tracks
	if len(confData.Data.Tracks) != 3 {
		t.Errorf("Expected 3 tracks in conference, got %d", len(confData.Data.Tracks))
	}

	t.Run("create submission with track", func(t *testing.T) {
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "ML Paper",
			Abstract:     "A paper about machine learning",
			Domain:       []string{"AI"},
			Track:        "Machine Learning",
			Status:       dto.StatusDraft,
		}

		resp, err := submissionClient.Create(conferenceID, submission, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusCreated)

		var submissionData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &submissionData)

		if submissionData.Data.Track != "Machine Learning" {
			t.Errorf("Expected track 'Machine Learning', got '%s'", submissionData.Data.Track)
		}
	})

	// Create multiple submissions with different tracks for filtering test
	submissions := []struct {
		title string
		track string
	}{
		{"CV Paper 1", "Computer Vision"},
		{"CV Paper 2", "Computer Vision"},
		{"NLP Paper 1", "Natural Language Processing"},
		{"ML Paper 2", "Machine Learning"},
	}

	for i, sub := range submissions {
		trackAuthorToken, trackAuthor, err := ctx.RegisterUniqueUser(
			testutils.UniqueString("track-author"),
			"password123",
			"Track",
			"Author",
			[]string{"AI"},
		)
		if err != nil {
			t.Fatalf("Failed to register author for %s: %v", sub.title, err)
		}
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       trackAuthor.Email,
			Title:        sub.title,
			Abstract:     "Test abstract",
			Domain:       []string{"AI"},
			Track:        sub.track,
			Status:       dto.StatusDraft,
		}
		_, err = submissionClient.Create(conferenceID, submission, trackAuthorToken)
		if err != nil {
			t.Fatalf("Failed to create submission %s: %v", sub.title, err)
		}
		_ = i
	}

	t.Run("filter submissions by track - Computer Vision", func(t *testing.T) {
		// Filter by Computer Vision track
		resp, err := submissionClient.List(conferenceID, &dto.SubmissionListRequest{
			Track: "Computer Vision",
		}, chairToken)
		if err != nil {
			t.Fatalf("Failed to list submissions: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var listData struct {
			Data struct {
				Submissions []*dto.Submission `json:"submissions"`
				Total       int64             `json:"total"`
			} `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &listData)

		// Should have exactly 2 Computer Vision submissions
		if listData.Data.Total != 2 {
			t.Errorf("Expected 2 Computer Vision submissions, got %d", listData.Data.Total)
		}

		// Verify all returned submissions have the correct track
		for _, sub := range listData.Data.Submissions {
			if sub.Track != "Computer Vision" {
				t.Errorf("Expected track 'Computer Vision', got '%s' for submission '%s'", sub.Track, sub.Title)
			}
		}
	})

	t.Run("filter submissions by track - NLP", func(t *testing.T) {
		resp, err := submissionClient.List(conferenceID, &dto.SubmissionListRequest{
			Track: "Natural Language Processing",
		}, chairToken)
		if err != nil {
			t.Fatalf("Failed to list submissions: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var listData struct {
			Data struct {
				Submissions []*dto.Submission `json:"submissions"`
				Total       int64             `json:"total"`
			} `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &listData)

		// Should have exactly 1 NLP submission
		if listData.Data.Total != 1 {
			t.Errorf("Expected 1 NLP submission, got %d", listData.Data.Total)
		}

		if len(listData.Data.Submissions) > 0 && listData.Data.Submissions[0].Track != "Natural Language Processing" {
			t.Errorf("Expected track 'Natural Language Processing', got '%s'", listData.Data.Submissions[0].Track)
		}
	})

	t.Run("list all submissions without track filter", func(t *testing.T) {
		resp, err := submissionClient.List(conferenceID, &dto.SubmissionListRequest{}, chairToken)
		if err != nil {
			t.Fatalf("Failed to list submissions: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var listData struct {
			Data struct {
				Submissions []*dto.Submission `json:"submissions"`
				Total       int64             `json:"total"`
			} `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &listData)

		// Should have 5 submissions total (1 from first test + 4 from loop)
		if listData.Data.Total != 5 {
			t.Errorf("Expected 5 total submissions, got %d", listData.Data.Total)
		}
	})
}
