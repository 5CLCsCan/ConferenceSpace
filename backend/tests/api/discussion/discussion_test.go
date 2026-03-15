package discussion

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
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

	// Confirm all suggestions (auto-assign creates suggestions, not confirmed assignments)
	confirmResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), map[string]interface{}{}, chairToken)
	if err != nil {
		t.Fatalf("Failed to confirm suggestions: %v", err)
	}
	testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

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

// TestCreateThread_NonReviewerForbidden_Standalone is a standalone top-level test
// that verifies an author cannot create a discussion thread.
// Note: the existing TestCreateThread sub-test already covers this case; this
// function ensures it's also visible as a named top-level test.
func TestCreateThread_NonReviewerForbidden_Standalone(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceID, submissionID, _, _, authorToken, _, _, _ := setupReviewingConference(t, ctx)

	resp, err := ctx.MakeRequest("POST",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/threads", conferenceID, submissionID),
		map[string]interface{}{"title": "My Thread", "content": "Hello"},
		authorToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d", resp.StatusCode)
	}
}

// TestAddMessage_LargeAttachment verifies that posting a message with an
// attachment exceeding the server's size limit is rejected.
// The server enforces a 20 MB limit. If the limit is not enforced at the HTTP
// layer this test logs the actual status code for documentation purposes.
func TestAddMessage_LargeAttachment(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceID, submissionID, _, reviewerToken, _, _, reviewerEmail, _ := setupReviewingConference(t, ctx)

	// First, create a thread as the reviewer.
	createResp, err := ctx.MakeRequest("POST",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/threads", conferenceID, submissionID),
		map[string]interface{}{"title": "Large Attach Thread", "content": "Thread body"},
		reviewerToken,
	)
	if err != nil {
		t.Fatalf("Create thread failed: %v", err)
	}
	if createResp.StatusCode != http.StatusCreated && createResp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200/201 creating thread, got %d", createResp.StatusCode)
	}
	var threadData struct {
		Data struct {
			ID int64 `json:"id"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &threadData)
	threadID := threadData.Data.ID

	_ = reviewerEmail

	// Build a >20 MB multipart body.
	largeContent := make([]byte, 21*1024*1024) // 21 MB
	for i := range largeContent {
		largeContent[i] = 'A'
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	_ = writer.WriteField("content", "Message with large attachment")
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", `form-data; name="attachment"; filename="large.pdf"`)
	h.Set("Content-Type", "application/pdf")
	part, _ := writer.CreatePart(h)
	_, _ = io.Copy(part, bytes.NewReader(largeContent))
	writer.Close()

	req, _ := http.NewRequest("POST",
		ctx.BaseURL+fmt.Sprintf("/api/v1/threads/%d/messages", threadID),
		&body,
	)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+reviewerToken)

	resp, err := ctx.Client.Do(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	// Document observed behavior. Expect 400 if server enforces the 20 MB limit.
	t.Logf("Large attachment response status: %d", resp.StatusCode)
	if resp.StatusCode != http.StatusBadRequest && resp.StatusCode != http.StatusRequestEntityTooLarge {
		t.Errorf("Expected 400 or 413 for >20 MB attachment, got %d", resp.StatusCode)
	}
}
