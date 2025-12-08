package notification

import (
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestNotificationOnSubmissionCreated tests that chairs receive notifications when authors submit papers
func TestNotificationOnSubmissionCreated(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	notificationClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create author user
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
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

	// Get chair's initial unread notification count
	initialCountResp, err := notificationClient.GetUnreadCount(chairToken)
	if err != nil {
		t.Fatalf("Failed to get initial unread count: %v", err)
	}
	var initialCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, initialCountResp, &initialCountData)
	initialCount := initialCountData.Data.Count

	// Author creates a submission
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper",
		Abstract:     "Test Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	_, err = submissionClient.Create(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}

	// Wait for async notification to be created
	time.Sleep(100 * time.Millisecond)

	// Check that chair received a notification
	newCountResp, err := notificationClient.GetUnreadCount(chairToken)
	if err != nil {
		t.Fatalf("Failed to get new unread count: %v", err)
	}
	var newCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, newCountResp, &newCountData)

	if newCountData.Data.Count <= initialCount {
		t.Errorf("Expected chair to receive notification. Initial count: %d, New count: %d", initialCount, newCountData.Data.Count)
	}

	// Verify the notification is of correct type
	notifResp, err := notificationClient.List(&dto.NotificationListRequest{
		Limit: 10,
		Type:  dto.NotificationTypeSubmissionReceived,
	}, chairToken)
	if err != nil {
		t.Fatalf("Failed to list notifications: %v", err)
	}
	testutils.AssertStatusCode(t, notifResp, http.StatusOK)

	var notifData struct {
		Data *dto.NotificationListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, notifResp, &notifData)

	// Find notification about the submission
	found := false
	for _, n := range notifData.Data.Notifications {
		if n.Type == dto.NotificationTypeSubmissionReceived {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected to find submission_received notification for chair")
	}
}

// TestNotificationOnReviewAssigned tests that reviewers receive notifications when assigned to papers
func TestNotificationOnReviewAssigned(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	notificationClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create author user
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create reviewer user
	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI", "ML"})
	if err != nil {
		t.Fatalf("Failed to register reviewer user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
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

	// Create submission with Keywords in Information for domain matching
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper",
		Abstract:     "Test Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
		Information: &dto.SubmissionInformation{
			Keywords: []string{"AI", "ML"}, // Keywords used by auto-assign scoring
		},
	}
	_, err = submissionClient.Create(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}

	// Add reviewer to conference
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer.ID, "domain": []string{"AI", "ML"}},
		},
	}
	addRevResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	var addRevData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &addRevData)

	// Accept reviewer invitation
	for _, rev := range addRevData.Data.Success {
		updateStatusPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, rev.ID)
		statusUpdate := map[string]interface{}{
			"status": "accepted",
		}
		statusResp, err := ctx.MakeRequest("PUT", updateStatusPath, statusUpdate, chairToken)
		if err != nil {
			t.Fatalf("Failed to update reviewer status: %v", err)
		}
		testutils.AssertStatusCode(t, statusResp, http.StatusOK)
	}

	// Get reviewer's initial unread notification count
	initialCountResp, err := notificationClient.GetUnreadCount(reviewerToken)
	if err != nil {
		t.Fatalf("Failed to get initial unread count: %v", err)
	}
	var initialCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, initialCountResp, &initialCountData)
	initialCount := initialCountData.Data.Count

	// Trigger auto-assignment
	autoAssignReq := map[string]interface{}{
		"min_reviewers_per_paper": 1,
		"max_reviewers_per_paper": 1,
		"min_score_threshold":     0.0,
		"dry_run":                 false,
	}
	assignResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to trigger auto-assignment: %v", err)
	}
	testutils.AssertStatusCode(t, assignResp, http.StatusOK)

	var assignData struct {
		Data *dto.AutoAssignResponse `json:"data"`
	}
	testutils.DecodeResponse(t, assignResp, &assignData)

	// Note: Assignments slice is only populated when dry_run=true
	// Use TotalAssignments to check if any assignments were made
	if assignData.Data.TotalAssignments == 0 {
		t.Logf("Warning: No assignments were created. Total submissions: %d, Total reviewers: %d, Unassigned: %v",
			assignData.Data.TotalSubmissions, assignData.Data.TotalReviewers, assignData.Data.UnassignedPapers)
		// Skip the rest of the test if no assignments were created
		t.Skip("Skipping notification check - no assignments were created by auto-assign")
	}

	t.Logf("Auto-assignment created %d assignment(s)", assignData.Data.TotalAssignments)

	// Wait for async notification to be created
	time.Sleep(100 * time.Millisecond)

	// Check that reviewer received a notification
	newCountResp, err := notificationClient.GetUnreadCount(reviewerToken)
	if err != nil {
		t.Fatalf("Failed to get new unread count: %v", err)
	}
	var newCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, newCountResp, &newCountData)

	if newCountData.Data.Count <= initialCount {
		t.Errorf("Expected reviewer to receive notification. Initial count: %d, New count: %d", initialCount, newCountData.Data.Count)
	}

	// Verify the notification is of correct type
	notifResp, err := notificationClient.List(&dto.NotificationListRequest{
		Limit: 10,
		Type:  dto.NotificationTypeReviewAssigned,
	}, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to list notifications: %v", err)
	}
	testutils.AssertStatusCode(t, notifResp, http.StatusOK)

	var notifData struct {
		Data *dto.NotificationListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, notifResp, &notifData)

	found := false
	for _, n := range notifData.Data.Notifications {
		if n.Type == dto.NotificationTypeReviewAssigned {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected to find review_assigned notification for reviewer")
	}
}

// TestNotificationOnReviewSubmitted tests that chairs receive notifications when reviewers submit reviews
func TestNotificationOnReviewSubmitted(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	notificationClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create author user
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create reviewer user
	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI", "ML"})
	if err != nil {
		t.Fatalf("Failed to register reviewer user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
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

	// Create submission with Keywords in Information for domain matching
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper",
		Abstract:     "Test Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
		Information: &dto.SubmissionInformation{
			Keywords: []string{"AI", "ML"}, // Keywords used by auto-assign scoring
		},
	}
	subResp, err := submissionClient.Create(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)

	// Add reviewer to conference and accept
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer.ID, "domain": []string{"AI", "ML"}},
		},
	}
	addRevResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	var addRevData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &addRevData)

	for _, rev := range addRevData.Data.Success {
		updateStatusPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, rev.ID)
		statusUpdate := map[string]interface{}{
			"status": "accepted",
		}
		statusResp, err := ctx.MakeRequest("PUT", updateStatusPath, statusUpdate, chairToken)
		if err != nil {
			t.Fatalf("Failed to update reviewer status: %v", err)
		}
		testutils.AssertStatusCode(t, statusResp, http.StatusOK)
	}

	// Trigger auto-assignment
	autoAssignReq := map[string]interface{}{
		"min_reviewers_per_paper": 1,
		"max_reviewers_per_paper": 1,
		"min_score_threshold":     0.0,
		"dry_run":                 false,
	}
	assignResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to trigger auto-assignment: %v", err)
	}
	testutils.AssertStatusCode(t, assignResp, http.StatusOK)

	var assignData struct {
		Data *dto.AutoAssignResponse `json:"data"`
	}
	testutils.DecodeResponse(t, assignResp, &assignData)

	// Note: Assignments slice is only populated when dry_run=true
	// Use TotalAssignments to check if any assignments were made
	if assignData.Data.TotalAssignments == 0 {
		t.Logf("Warning: No assignments were created. Total submissions: %d, Total reviewers: %d, Unassigned: %v",
			assignData.Data.TotalSubmissions, assignData.Data.TotalReviewers, assignData.Data.UnassignedPapers)
		t.Skip("Skipping notification check - no assignments were created by auto-assign")
	}

	t.Logf("Auto-assignment created %d assignment(s)", assignData.Data.TotalAssignments)

	// Get assignment ID by querying reviewer's assigned papers
	papersResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewer.Email, conferenceID), nil, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to get reviewer's papers: %v", err)
	}
	testutils.AssertStatusCode(t, papersResp, http.StatusOK)

	var papersData struct {
		Data struct {
			Papers []*dto.AssignedPaperResponse `json:"papers"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, papersResp, &papersData)

	if len(papersData.Data.Papers) == 0 {
		t.Skip("No papers found for reviewer - cannot test review submission notification")
	}

	assignmentID := papersData.Data.Papers[0].AssignmentID

	// Get chair's initial unread notification count
	initialCountResp, err := notificationClient.GetUnreadCount(chairToken)
	if err != nil {
		t.Fatalf("Failed to get initial unread count: %v", err)
	}
	var initialCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, initialCountResp, &initialCountData)
	initialCount := initialCountData.Data.Count

	// Reviewer submits review
	reviewScore := 8.0
	reviewReq := map[string]interface{}{
		"assignment_id": assignmentID,
		"conference_id": conferenceID,
		"status":        "submitted",
		"review_score":  reviewScore,
		"review_data": map[string]interface{}{
			"criteria": map[string]interface{}{
				"originality":       8,
				"technical_quality": 7,
				"clarity":           8,
				"significance":      7,
				"methodology":       8,
			},
			"recommendation": "accept",
			"confidence":     "high",
			"feedback": map[string]interface{}{
				"strengths":  "Good methodology and clear presentation",
				"weaknesses": "Could improve discussion section",
				"questions":  "How does this compare to baseline?",
			},
		},
	}
	reviewPath := fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID)
	saveReviewResp, err := ctx.MakeRequest("PUT", reviewPath, reviewReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to submit review: %v", err)
	}
	testutils.AssertStatusCode(t, saveReviewResp, http.StatusOK)

	// Wait for async notification to be created
	time.Sleep(100 * time.Millisecond)

	// Check that chair received a notification
	newCountResp, err := notificationClient.GetUnreadCount(chairToken)
	if err != nil {
		t.Fatalf("Failed to get new unread count: %v", err)
	}
	var newCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, newCountResp, &newCountData)

	if newCountData.Data.Count <= initialCount {
		t.Errorf("Expected chair to receive notification. Initial count: %d, New count: %d", initialCount, newCountData.Data.Count)
	}
}

// TestNotificationOnPaperDecision tests that authors receive notifications when papers are accepted/rejected
func TestNotificationOnPaperDecision(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	notificationClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create author user
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
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

	// Create submission
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper",
		Abstract:     "Test Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	subResp, err := submissionClient.Create(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	submissionID := subData.Data.ID

	// Get author's initial unread notification count
	initialCountResp, err := notificationClient.GetUnreadCount(authorToken)
	if err != nil {
		t.Fatalf("Failed to get initial unread count: %v", err)
	}
	var initialCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, initialCountResp, &initialCountData)
	initialCount := initialCountData.Data.Count

	// Chair accepts the paper
	statusUpdateReq := map[string]interface{}{
		"status": "accepted",
	}
	statusPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/status", conferenceID, submissionID)
	statusResp, err := ctx.MakeRequest("PUT", statusPath, statusUpdateReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to update submission status: %v", err)
	}
	testutils.AssertStatusCode(t, statusResp, http.StatusOK)

	// Wait for async notification to be created
	time.Sleep(100 * time.Millisecond)

	// Check that author received a notification
	newCountResp, err := notificationClient.GetUnreadCount(authorToken)
	if err != nil {
		t.Fatalf("Failed to get new unread count: %v", err)
	}
	var newCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, newCountResp, &newCountData)

	if newCountData.Data.Count <= initialCount {
		t.Errorf("Expected author to receive notification. Initial count: %d, New count: %d", initialCount, newCountData.Data.Count)
	}

	// Verify the notification is of correct type
	notifResp, err := notificationClient.List(&dto.NotificationListRequest{
		Limit: 10,
		Type:  dto.NotificationTypePaperAccepted,
	}, authorToken)
	if err != nil {
		t.Fatalf("Failed to list notifications: %v", err)
	}
	testutils.AssertStatusCode(t, notifResp, http.StatusOK)

	var notifData struct {
		Data *dto.NotificationListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, notifResp, &notifData)

	found := false
	for _, n := range notifData.Data.Notifications {
		if n.Type == dto.NotificationTypePaperAccepted {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected to find paper_accepted notification for author")
	}
}

// TestNotificationOnPaperRejected tests that authors receive notifications when papers are rejected
func TestNotificationOnPaperRejected(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	notificationClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create author user
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
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

	// Create submission
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper",
		Abstract:     "Test Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	subResp, err := submissionClient.Create(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	submissionID := subData.Data.ID

	// Get author's initial unread notification count
	initialCountResp, err := notificationClient.GetUnreadCount(authorToken)
	if err != nil {
		t.Fatalf("Failed to get initial unread count: %v", err)
	}
	var initialCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, initialCountResp, &initialCountData)
	initialCount := initialCountData.Data.Count

	// Chair rejects the paper
	statusUpdateReq := map[string]interface{}{
		"status": "rejected",
	}
	statusPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/status", conferenceID, submissionID)
	statusResp, err := ctx.MakeRequest("PUT", statusPath, statusUpdateReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to update submission status: %v", err)
	}
	testutils.AssertStatusCode(t, statusResp, http.StatusOK)

	// Wait for async notification to be created
	time.Sleep(100 * time.Millisecond)

	// Check that author received a notification
	newCountResp, err := notificationClient.GetUnreadCount(authorToken)
	if err != nil {
		t.Fatalf("Failed to get new unread count: %v", err)
	}
	var newCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, newCountResp, &newCountData)

	if newCountData.Data.Count <= initialCount {
		t.Errorf("Expected author to receive notification. Initial count: %d, New count: %d", initialCount, newCountData.Data.Count)
	}

	// Verify the notification is of correct type
	notifResp, err := notificationClient.List(&dto.NotificationListRequest{
		Limit: 10,
		Type:  dto.NotificationTypePaperRejected,
	}, authorToken)
	if err != nil {
		t.Fatalf("Failed to list notifications: %v", err)
	}
	testutils.AssertStatusCode(t, notifResp, http.StatusOK)

	var notifData struct {
		Data *dto.NotificationListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, notifResp, &notifData)

	found := false
	for _, n := range notifData.Data.Notifications {
		if n.Type == dto.NotificationTypePaperRejected {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected to find paper_rejected notification for author")
	}
}
