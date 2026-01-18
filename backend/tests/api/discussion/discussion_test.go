package discussion

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	conferenceTestClient "github.com/dcao/conferencespace/tests/api/conference"
	submissionTestClient "github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// setupReviewingConference creates a conference in reviewing phase with a reviewer and submission
func setupReviewingConference(t *testing.T, ctx *testutils.TestContext) (conferenceID, submissionID int64, chairToken, reviewerToken, authorToken string, chairEmail, reviewerEmail, authorEmail string) {
	// Register users
	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	reviewerToken, reviewer, _ := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	chairEmail = chair.Email
	reviewerEmail = reviewer.Email
	authorEmail = author.Email

	// Create conference
	conferenceClient := conferenceTestClient.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID = createdConf.ID

	// Add reviewer
	addReviewerResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer.ID, "domain": []string{"AI"}},
		},
	}, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}

	var reviewerData struct {
		Data struct {
			Success []dto.Reviewer `json:"success"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, addReviewerResp, &reviewerData)
	reviewerRecordID := reviewerData.Data.Success[0].ID

	// Accept reviewer invitation
	_, err = ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerRecordID), map[string]interface{}{
		"status": "accepted",
	}, chairToken)
	if err != nil {
		t.Fatalf("Failed to accept reviewer: %v", err)
	}

	// Create submission
	submissionClient := submissionTestClient.NewClient(ctx)
	submission := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper",
		Abstract:     "Abstract for test paper about artificial intelligence",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
		Information: &dto.SubmissionInformation{
			Keywords: []string{"AI"},
		},
	}
	createdSubmission, err := submissionClient.CreateSuccess(conferenceID, submission, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	submissionID = createdSubmission.ID

	// Transition conference to reviewing status (triggers auto-assign)
	transitionReq := dto.ConferenceTransitionStatusRequest{
		ConferenceID: conferenceID,
		NewStatus:    model.ConferenceStatusReviewing,
	}
	transitionResp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID), transitionReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to transition status: %v", err)
	}
	testutils.AssertStatusCode(t, transitionResp, http.StatusOK)

	return
}

func TestCreateThread(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceID, submissionID, chairToken, reviewerToken, authorToken, _, _, _ := setupReviewingConference(t, ctx)

	discussionClient := NewClient(ctx)

	t.Run("reviewer can create thread", func(t *testing.T) {
		req := &dto.CreateThreadRequest{
			Title:   "Question about methodology",
			Content: "Can you clarify your approach in section 3?",
		}

		resp, err := discussionClient.CreateThreadSuccess(conferenceID, submissionID, req, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to create thread: %v", err)
		}

		if resp.Thread == nil {
			t.Error("Expected thread in response")
		}
		if resp.Thread.Title != req.Title {
			t.Errorf("Expected title '%s', got '%s'", req.Title, resp.Thread.Title)
		}
		if resp.Message == nil {
			t.Error("Expected message in response")
		}
		if resp.Message.Content != req.Content {
			t.Errorf("Expected content '%s', got '%s'", req.Content, resp.Message.Content)
		}
	})

	t.Run("author cannot create thread", func(t *testing.T) {
		req := &dto.CreateThreadRequest{
			Title:   "Author question",
			Content: "This should fail",
		}

		resp, err := discussionClient.CreateThread(conferenceID, submissionID, req, authorToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusForbidden)
	})

	t.Run("chair cannot create thread", func(t *testing.T) {
		req := &dto.CreateThreadRequest{
			Title:   "Chair question",
			Content: "This should fail",
		}

		resp, err := discussionClient.CreateThread(conferenceID, submissionID, req, chairToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusForbidden)
	})

	t.Run("unauthenticated request fails", func(t *testing.T) {
		req := &dto.CreateThreadRequest{
			Title:   "Test",
			Content: "Test",
		}

		resp, err := discussionClient.CreateThread(conferenceID, submissionID, req, "")
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusUnauthorized)
	})

	t.Run("missing title fails", func(t *testing.T) {
		req := &dto.CreateThreadRequest{
			Title:   "",
			Content: "Content without title",
		}

		resp, err := discussionClient.CreateThread(conferenceID, submissionID, req, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
	})
}

func TestGetThreads(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceID, submissionID, chairToken, reviewerToken, authorToken, _, _, _ := setupReviewingConference(t, ctx)

	discussionClient := NewClient(ctx)

	// Create a thread first
	threadReq := &dto.CreateThreadRequest{
		Title:   "Test thread",
		Content: "Initial message",
	}
	createdThread, err := discussionClient.CreateThreadSuccess(conferenceID, submissionID, threadReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to create thread: %v", err)
	}

	t.Run("reviewer sees own threads", func(t *testing.T) {
		resp, err := discussionClient.GetThreadsSuccess(conferenceID, submissionID, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get threads: %v", err)
		}

		if len(resp.Threads) != 1 {
			t.Errorf("Expected 1 thread, got %d", len(resp.Threads))
		}
		if resp.Threads[0].ID != createdThread.Thread.ID {
			t.Errorf("Expected thread ID %d, got %d", createdThread.Thread.ID, resp.Threads[0].ID)
		}
	})

	t.Run("author sees threads for their paper", func(t *testing.T) {
		resp, err := discussionClient.GetThreadsSuccess(conferenceID, submissionID, authorToken)
		if err != nil {
			t.Fatalf("Failed to get threads: %v", err)
		}

		if len(resp.Threads) != 1 {
			t.Errorf("Expected 1 thread, got %d", len(resp.Threads))
		}
	})

	t.Run("chair sees all threads", func(t *testing.T) {
		resp, err := discussionClient.GetThreadsSuccess(conferenceID, submissionID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get threads: %v", err)
		}

		if len(resp.Threads) != 1 {
			t.Errorf("Expected 1 thread, got %d", len(resp.Threads))
		}
	})

	t.Run("unrelated user cannot see threads", func(t *testing.T) {
		// Register unrelated user
		unrelatedToken, _, _ := ctx.RegisterUniqueUser("unrelated", "password123", "Unrelated", "User", []string{"AI"})

		resp, err := discussionClient.GetThreads(conferenceID, submissionID, unrelatedToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusForbidden)
	})
}

func TestAddMessage(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceID, submissionID, chairToken, reviewerToken, authorToken, _, _, _ := setupReviewingConference(t, ctx)

	discussionClient := NewClient(ctx)

	// Create a thread first
	threadReq := &dto.CreateThreadRequest{
		Title:   "Discussion thread",
		Content: "Reviewer's initial question",
	}
	createdThread, err := discussionClient.CreateThreadSuccess(conferenceID, submissionID, threadReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to create thread: %v", err)
	}
	threadID := createdThread.Thread.ID

	t.Run("author can reply to thread", func(t *testing.T) {
		req := &dto.CreateMessageRequest{
			Content: "Author's response to the question",
		}

		resp, err := discussionClient.CreateMessageSuccess(threadID, req, authorToken)
		if err != nil {
			t.Fatalf("Failed to add message: %v", err)
		}

		if resp.Content != req.Content {
			t.Errorf("Expected content '%s', got '%s'", req.Content, resp.Content)
		}
	})

	t.Run("reviewer can reply to thread", func(t *testing.T) {
		req := &dto.CreateMessageRequest{
			Content: "Reviewer's follow-up question",
		}

		resp, err := discussionClient.CreateMessageSuccess(threadID, req, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to add message: %v", err)
		}

		if resp.Content != req.Content {
			t.Errorf("Expected content '%s', got '%s'", req.Content, resp.Content)
		}
	})

	t.Run("chair cannot add message", func(t *testing.T) {
		req := &dto.CreateMessageRequest{
			Content: "Chair should not be able to post",
		}

		resp, err := discussionClient.CreateMessage(threadID, req, chairToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusForbidden)
	})

	t.Run("unrelated user cannot add message", func(t *testing.T) {
		unrelatedToken, _, _ := ctx.RegisterUniqueUser("unrelated2", "password123", "Unrelated", "User", []string{"AI"})

		req := &dto.CreateMessageRequest{
			Content: "This should fail",
		}

		resp, err := discussionClient.CreateMessage(threadID, req, unrelatedToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusForbidden)
	})
}

func TestGetMessages(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceID, submissionID, chairToken, reviewerToken, authorToken, _, _, _ := setupReviewingConference(t, ctx)

	discussionClient := NewClient(ctx)

	// Create a thread with messages
	threadReq := &dto.CreateThreadRequest{
		Title:   "Discussion thread",
		Content: "First message",
	}
	createdThread, err := discussionClient.CreateThreadSuccess(conferenceID, submissionID, threadReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to create thread: %v", err)
	}
	threadID := createdThread.Thread.ID

	// Add more messages
	_, _ = discussionClient.CreateMessageSuccess(threadID, &dto.CreateMessageRequest{Content: "Second message"}, authorToken)
	_, _ = discussionClient.CreateMessageSuccess(threadID, &dto.CreateMessageRequest{Content: "Third message"}, reviewerToken)

	t.Run("reviewer can get messages", func(t *testing.T) {
		resp, err := discussionClient.GetMessagesSuccess(threadID, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get messages: %v", err)
		}

		if len(resp.Messages) != 3 {
			t.Errorf("Expected 3 messages, got %d", len(resp.Messages))
		}
	})

	t.Run("author can get messages", func(t *testing.T) {
		resp, err := discussionClient.GetMessagesSuccess(threadID, authorToken)
		if err != nil {
			t.Fatalf("Failed to get messages: %v", err)
		}

		if len(resp.Messages) != 3 {
			t.Errorf("Expected 3 messages, got %d", len(resp.Messages))
		}
	})

	t.Run("chair can get messages", func(t *testing.T) {
		resp, err := discussionClient.GetMessagesSuccess(threadID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get messages: %v", err)
		}

		if len(resp.Messages) != 3 {
			t.Errorf("Expected 3 messages, got %d", len(resp.Messages))
		}
	})

	t.Run("unrelated user cannot get messages", func(t *testing.T) {
		unrelatedToken, _, _ := ctx.RegisterUniqueUser("unrelated3", "password123", "Unrelated", "User", []string{"AI"})

		resp, err := discussionClient.GetMessages(threadID, unrelatedToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusForbidden)
	})
}

func TestDiscussionPhaseRestriction(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Register users
	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	reviewerToken, reviewer, _ := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	// Create conference (starts in "open" status)
	conferenceClient := conferenceTestClient.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := createdConf.ID

	// Add reviewer
	addReviewerResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer.ID, "domain": []string{"AI"}},
		},
	}, chairToken)
	var reviewerData struct {
		Data struct {
			Success []dto.Reviewer `json:"success"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, addReviewerResp, &reviewerData)
	reviewerRecordID := reviewerData.Data.Success[0].ID
	ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerRecordID), map[string]interface{}{
		"status": "accepted",
	}, chairToken)

	// Create submission
	submissionClient := submissionTestClient.NewClient(ctx)
	submission := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper",
		Abstract:     "Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	createdSubmission, _ := submissionClient.CreateSuccess(conferenceID, submission, authorToken)
	submissionID := createdSubmission.ID

	discussionClient := NewClient(ctx)

	t.Run("cannot create thread when conference not in reviewing phase", func(t *testing.T) {
		req := &dto.CreateThreadRequest{
			Title:   "Test",
			Content: "Test",
		}

		resp, err := discussionClient.CreateThread(conferenceID, submissionID, req, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusForbidden)
	})

	// Keep variables used to avoid lint errors
	_ = authorToken
}
