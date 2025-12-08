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

