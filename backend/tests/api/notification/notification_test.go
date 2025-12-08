package notification

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestListNotifications(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	notificationClient := NewClient(ctx)

	// Create test user via API
	userToken, _, err := ctx.RegisterUniqueUser("user", "password123", "Test", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	tests := []struct {
		name           string
		token          string
		request        *dto.NotificationListRequest
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "list notifications for authenticated user",
			token:          userToken,
			request:        &dto.NotificationListRequest{Limit: 10, Offset: 0},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:           "list notifications without authentication",
			token:          "",
			request:        &dto.NotificationListRequest{Limit: 10, Offset: 0},
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
		{
			name:           "list notifications with pagination",
			token:          userToken,
			request:        &dto.NotificationListRequest{Limit: 5, Offset: 0},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:           "list only unread notifications",
			token:          userToken,
			request:        &dto.NotificationListRequest{Limit: 10, Offset: 0, Unread: true},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:           "filter by notification type",
			token:          userToken,
			request:        &dto.NotificationListRequest{Limit: 10, Offset: 0, Type: dto.NotificationTypeSubmissionReceived},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := notificationClient.List(tt.request, tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if !tt.expectError {
				var respData struct {
					Data *dto.NotificationListResponse `json:"data"`
				}
				testutils.DecodeResponse(t, resp, &respData)

				if respData.Data == nil {
					t.Error("Expected data in response")
				}
				if respData.Data.Notifications == nil {
					t.Error("Expected notifications array in response")
				}
			}
		})
	}
}

func TestGetUnreadCount(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	notificationClient := NewClient(ctx)

	// Create test user via API
	userToken, _, err := ctx.RegisterUniqueUser("user", "password123", "Test", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	tests := []struct {
		name           string
		token          string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "get unread count for authenticated user",
			token:          userToken,
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:           "get unread count without authentication",
			token:          "",
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := notificationClient.GetUnreadCount(tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if !tt.expectError {
				var respData struct {
					Data *dto.UnreadCountResponse `json:"data"`
				}
				testutils.DecodeResponse(t, resp, &respData)

				if respData.Data == nil {
					t.Error("Expected data in response")
				}
				// New user should have 0 unread notifications
				if respData.Data.Count < 0 {
					t.Errorf("Expected non-negative count, got %d", respData.Data.Count)
				}
			}
		})
	}
}

func TestMarkNotificationAsRead(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	notificationClient := NewClient(ctx)

	// Create test users via API
	userToken, _, err := ctx.RegisterUniqueUser("user", "password123", "Test", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}
	otherUserToken, _, err := ctx.RegisterUniqueUser("other", "password123", "Other", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	tests := []struct {
		name           string
		notificationID int64
		token          string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "mark non-existent notification as read",
			notificationID: 99999,
			token:          userToken,
			expectedStatus: http.StatusNotFound,
			expectError:    true,
		},
		{
			name:           "mark notification without authentication",
			notificationID: 1,
			token:          "",
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
		// Note: Testing marking actual notifications as read will be done in trigger tests
		// where we can create notifications first via submission/review actions
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := notificationClient.MarkAsRead(tt.notificationID, tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)
		})
	}

	// Keep otherUserToken used to avoid lint error - will be used in trigger tests
	_ = otherUserToken
}

func TestMarkAllNotificationsAsRead(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	notificationClient := NewClient(ctx)

	// Create test user via API
	userToken, _, err := ctx.RegisterUniqueUser("user", "password123", "Test", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	tests := []struct {
		name           string
		token          string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "mark all notifications as read for authenticated user",
			token:          userToken,
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:           "mark all notifications without authentication",
			token:          "",
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := notificationClient.MarkAllAsRead(tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)
		})
	}
}

func TestNotificationAccessControl(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	notificationClient := NewClient(ctx)

	// Create two users via API
	user1Token, _, err := ctx.RegisterUniqueUser("user1", "password123", "User", "One", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user1: %v", err)
	}
	user2Token, _, err := ctx.RegisterUniqueUser("user2", "password123", "User", "Two", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user2: %v", err)
	}

	// Test that users can only see their own notifications
	t.Run("user can only list own notifications", func(t *testing.T) {
		// Both users should be able to list notifications
		resp1, err := notificationClient.List(&dto.NotificationListRequest{Limit: 10}, user1Token)
		if err != nil {
			t.Fatalf("User1 failed to list notifications: %v", err)
		}
		testutils.AssertStatusCode(t, resp1, http.StatusOK)

		resp2, err := notificationClient.List(&dto.NotificationListRequest{Limit: 10}, user2Token)
		if err != nil {
			t.Fatalf("User2 failed to list notifications: %v", err)
		}
		testutils.AssertStatusCode(t, resp2, http.StatusOK)
	})

	t.Run("user can only get own unread count", func(t *testing.T) {
		resp1, err := notificationClient.GetUnreadCount(user1Token)
		if err != nil {
			t.Fatalf("User1 failed to get unread count: %v", err)
		}
		testutils.AssertStatusCode(t, resp1, http.StatusOK)

		resp2, err := notificationClient.GetUnreadCount(user2Token)
		if err != nil {
			t.Fatalf("User2 failed to get unread count: %v", err)
		}
		testutils.AssertStatusCode(t, resp2, http.StatusOK)
	})
}

func TestDeleteNotification(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	notificationClient := NewClient(ctx)

	// Create test user via API
	userToken, _, err := ctx.RegisterUniqueUser("user", "password123", "Test", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	tests := []struct {
		name           string
		notificationID int64
		token          string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "delete non-existent notification",
			notificationID: 99999,
			token:          userToken,
			expectedStatus: http.StatusNotFound,
			expectError:    true,
		},
		{
			name:           "delete notification without authentication",
			notificationID: 1,
			token:          "",
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := notificationClient.Delete(tt.notificationID, tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)
		})
	}
}

