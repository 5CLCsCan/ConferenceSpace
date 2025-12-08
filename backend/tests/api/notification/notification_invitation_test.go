package notification

import (
	"fmt"
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestNotificationOnReviewerInvited tests that reviewers receive notifications when invited to a conference
func TestNotificationOnReviewerInvited(t *testing.T) {
	ctx := testutils.NewTestContext(t)

	// Create clients
	conferenceClient := conference.NewClient(ctx)
	notificationClient := NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	t.Logf("Created chair user: %s", chair.Email)

	// Create reviewer user
	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI", "ML"})
	if err != nil {
		t.Fatalf("Failed to register reviewer user: %v", err)
	}
	t.Logf("Created reviewer user: %s", reviewer.Email)

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference for Invitation Notification",
		Acronym: testutils.UniqueString("TCIN"),
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
	t.Logf("Created conference ID: %d, Title: %s", conferenceID, confData.Data.Title)

	// Get reviewer's initial notification count
	initialCountResp, err := notificationClient.GetUnreadCount(reviewerToken)
	if err != nil {
		t.Fatalf("Failed to get initial unread count: %v", err)
	}
	var initialCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, initialCountResp, &initialCountData)
	initialCount := initialCountData.Data.Count
	t.Logf("Reviewer initial notification count: %d", initialCount)

	// Invite the reviewer to the conference (UserID is required)
	inviteReq := struct {
		Reviewers []dto.Reviewer `json:"reviewers"`
	}{
		Reviewers: []dto.Reviewer{
			{
				UserID: reviewer.ID,
				Email:  reviewer.Email, // Optional, for reference
				Domain: []string{"AI", "ML"},
			},
		},
	}

	invitePath := fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID)
	t.Logf("Inviting reviewer via: POST %s", invitePath)
	inviteResp, err := ctx.MakeRequest("POST", invitePath, inviteReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to invite reviewer: %v", err)
	}

	// Log the invite response
	var inviteData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, inviteResp, &inviteData)
	t.Logf("Invite response - Success count: %d, Failed count: %d", len(inviteData.Data.Success), len(inviteData.Data.Failed))

	if len(inviteData.Data.Success) == 0 {
		t.Fatalf("No reviewers were successfully invited. Failed: %+v", inviteData.Data.Failed)
	}

	// Wait for async notification to be created
	time.Sleep(200 * time.Millisecond)

	// Check if reviewer received a notification
	newCountResp, err := notificationClient.GetUnreadCount(reviewerToken)
	if err != nil {
		t.Fatalf("Failed to get new unread count: %v", err)
	}
	var newCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, newCountResp, &newCountData)
	newCount := newCountData.Data.Count
	t.Logf("Reviewer new notification count: %d", newCount)

	if newCount <= initialCount {
		t.Errorf("Expected reviewer to receive notification. Initial count: %d, New count: %d", initialCount, newCount)
	} else {
		t.Logf("SUCCESS: Reviewer received notification! Count increased from %d to %d", initialCount, newCount)
	}

	// List notifications to verify content
	listResp, err := notificationClient.List(&dto.NotificationListRequest{Limit: 10}, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to list notifications: %v", err)
	}
	var listData struct {
		Data *dto.NotificationListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, listResp, &listData)

	t.Logf("Reviewer has %d notifications:", len(listData.Data.Notifications))
	for i, notif := range listData.Data.Notifications {
		t.Logf("  [%d] Type: %s, Title: %s, Message: %s", i+1, notif.Type, notif.Title, notif.Message)
	}

	// Check if we have an invitation notification
	foundInvitationNotif := false
	for _, notif := range listData.Data.Notifications {
		if notif.Type == "review_assigned" && notif.Title == "Conference Reviewer Invitation" {
			foundInvitationNotif = true
			t.Logf("Found invitation notification: %s", notif.Message)
			break
		}
	}

	if !foundInvitationNotif {
		t.Errorf("Did not find invitation notification with type 'review_assigned' and title 'Conference Reviewer Invitation'")
	}
}

// TestNotificationOnReviewerAccepted tests that chairs receive notifications when reviewers accept invitations
func TestNotificationOnReviewerAccepted(t *testing.T) {
	ctx := testutils.NewTestContext(t)

	// Create clients
	conferenceClient := conference.NewClient(ctx)
	notificationClient := NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	t.Logf("Created chair user: %s", chair.Email)

	// Create reviewer user
	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI", "ML"})
	if err != nil {
		t.Fatalf("Failed to register reviewer user: %v", err)
	}
	t.Logf("Created reviewer user: %s (ID: %d)", reviewer.Email, reviewer.ID)

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference for Reviewer Accept",
		Acronym: testutils.UniqueString("TCRA"),
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
	t.Logf("Created conference ID: %d", conferenceID)

	// Invite the reviewer
	inviteReq := struct {
		Reviewers []dto.Reviewer `json:"reviewers"`
	}{
		Reviewers: []dto.Reviewer{
			{
				UserID: reviewer.ID,
				Domain: []string{"AI", "ML"},
			},
		},
	}
	invitePath := fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID)
	inviteResp, err := ctx.MakeRequest("POST", invitePath, inviteReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to invite reviewer: %v", err)
	}
	var inviteData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, inviteResp, &inviteData)
	if len(inviteData.Data.Success) == 0 {
		t.Fatalf("No reviewers were invited")
	}
	reviewerID := inviteData.Data.Success[0].ID
	t.Logf("Invited reviewer with ID: %d", reviewerID)

	// Get chair's initial notification count
	initialCountResp, err := notificationClient.GetUnreadCount(chairToken)
	if err != nil {
		t.Fatalf("Failed to get initial unread count: %v", err)
	}
	var initialCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, initialCountResp, &initialCountData)
	initialCount := initialCountData.Data.Count
	t.Logf("Chair initial notification count: %d", initialCount)

	// Reviewer accepts the invitation
	acceptPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID)
	acceptReq := struct {
		Status string `json:"status"`
	}{
		Status: "accepted",
	}
	acceptResp, err := ctx.MakeRequest("PUT", acceptPath, acceptReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to accept invitation: %v", err)
	}
	if acceptResp.StatusCode != 200 {
		t.Fatalf("Expected status 200, got %d", acceptResp.StatusCode)
	}
	t.Logf("Reviewer accepted invitation")

	// Wait for async notification
	time.Sleep(200 * time.Millisecond)

	// Check if chair received notification
	newCountResp, err := notificationClient.GetUnreadCount(chairToken)
	if err != nil {
		t.Fatalf("Failed to get new unread count: %v", err)
	}
	var newCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, newCountResp, &newCountData)
	newCount := newCountData.Data.Count
	t.Logf("Chair new notification count: %d", newCount)

	if newCount <= initialCount {
		t.Errorf("Expected chair to receive notification. Initial count: %d, New count: %d", initialCount, newCount)
	} else {
		t.Logf("SUCCESS: Chair received notification about reviewer acceptance!")
	}

	// Verify notification content
	listResp, err := notificationClient.List(&dto.NotificationListRequest{Limit: 10}, chairToken)
	if err != nil {
		t.Fatalf("Failed to list notifications: %v", err)
	}
	var listData struct {
		Data *dto.NotificationListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, listResp, &listData)

	foundAcceptNotif := false
	for _, notif := range listData.Data.Notifications {
		if notif.Title == "Reviewer Accepted Invitation" {
			foundAcceptNotif = true
			t.Logf("Found acceptance notification: %s", notif.Message)
			break
		}
	}
	if !foundAcceptNotif {
		t.Errorf("Did not find 'Reviewer Accepted Invitation' notification")
	}
}

// TestNotificationOnReviewerRejected tests that chairs receive notifications when reviewers reject invitations
func TestNotificationOnReviewerRejected(t *testing.T) {
	ctx := testutils.NewTestContext(t)

	// Create clients
	conferenceClient := conference.NewClient(ctx)
	notificationClient := NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	t.Logf("Created chair user: %s", chair.Email)

	// Create reviewer user
	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI", "ML"})
	if err != nil {
		t.Fatalf("Failed to register reviewer user: %v", err)
	}
	t.Logf("Created reviewer user: %s (ID: %d)", reviewer.Email, reviewer.ID)

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference for Reviewer Reject",
		Acronym: testutils.UniqueString("TCRR"),
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
	t.Logf("Created conference ID: %d", conferenceID)

	// Invite the reviewer
	inviteReq := struct {
		Reviewers []dto.Reviewer `json:"reviewers"`
	}{
		Reviewers: []dto.Reviewer{
			{
				UserID: reviewer.ID,
				Domain: []string{"AI", "ML"},
			},
		},
	}
	invitePath := fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID)
	inviteResp, err := ctx.MakeRequest("POST", invitePath, inviteReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to invite reviewer: %v", err)
	}
	var inviteData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, inviteResp, &inviteData)
	if len(inviteData.Data.Success) == 0 {
		t.Fatalf("No reviewers were invited")
	}
	reviewerID := inviteData.Data.Success[0].ID
	t.Logf("Invited reviewer with ID: %d", reviewerID)

	// Get chair's initial notification count
	initialCountResp, err := notificationClient.GetUnreadCount(chairToken)
	if err != nil {
		t.Fatalf("Failed to get initial unread count: %v", err)
	}
	var initialCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, initialCountResp, &initialCountData)
	initialCount := initialCountData.Data.Count
	t.Logf("Chair initial notification count: %d", initialCount)

	// Reviewer rejects the invitation
	rejectPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID)
	rejectReq := struct {
		Status string `json:"status"`
	}{
		Status: "rejected",
	}
	rejectResp, err := ctx.MakeRequest("PUT", rejectPath, rejectReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to reject invitation: %v", err)
	}
	if rejectResp.StatusCode != 200 {
		t.Fatalf("Expected status 200, got %d", rejectResp.StatusCode)
	}
	t.Logf("Reviewer rejected invitation")

	// Wait for async notification
	time.Sleep(200 * time.Millisecond)

	// Check if chair received notification
	newCountResp, err := notificationClient.GetUnreadCount(chairToken)
	if err != nil {
		t.Fatalf("Failed to get new unread count: %v", err)
	}
	var newCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, newCountResp, &newCountData)
	newCount := newCountData.Data.Count
	t.Logf("Chair new notification count: %d", newCount)

	if newCount <= initialCount {
		t.Errorf("Expected chair to receive notification. Initial count: %d, New count: %d", initialCount, newCount)
	} else {
		t.Logf("SUCCESS: Chair received notification about reviewer rejection!")
	}

	// Verify notification content
	listResp, err := notificationClient.List(&dto.NotificationListRequest{Limit: 10}, chairToken)
	if err != nil {
		t.Fatalf("Failed to list notifications: %v", err)
	}
	var listData struct {
		Data *dto.NotificationListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, listResp, &listData)

	foundRejectNotif := false
	for _, notif := range listData.Data.Notifications {
		if notif.Title == "Reviewer Declined Invitation" {
			foundRejectNotif = true
			t.Logf("Found rejection notification: %s", notif.Message)
			break
		}
	}
	if !foundRejectNotif {
		t.Errorf("Did not find 'Reviewer Declined Invitation' notification")
	}
}

// TestNotificationServiceDirectCall tests the notification service directly
func TestNotificationServiceDirectCall(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	notificationClient := NewClient(ctx)

	// Create a test user
	userToken, user, err := ctx.RegisterUniqueUser("testuser", "password123", "Test", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
	t.Logf("Created user: %s", user.Email)

	// Get initial count
	initialCountResp, err := notificationClient.GetUnreadCount(userToken)
	if err != nil {
		t.Fatalf("Failed to get initial count: %v", err)
	}
	var initialCountData struct {
		Data *dto.UnreadCountResponse `json:"data"`
	}
	testutils.DecodeResponse(t, initialCountResp, &initialCountData)
	t.Logf("Initial notification count: %d", initialCountData.Data.Count)

	// List all notifications
	listResp, err := notificationClient.List(&dto.NotificationListRequest{Limit: 100}, userToken)
	if err != nil {
		t.Fatalf("Failed to list notifications: %v", err)
	}
	var listData struct {
		Data *dto.NotificationListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, listResp, &listData)
	t.Logf("User has %d total notifications", listData.Data.Total)
}

