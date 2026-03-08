package smoke

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/tests/api/testutils"
	"github.com/stretchr/testify/require"
)

type routeCase struct {
	name     string
	method   string
	path     string
	body     interface{}
	expected []int
}

func TestAPIRouteRegistrationAndAuthGuards(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	require.NoError(t, ctx.WaitForServer())

	publicRoutes := []routeCase{
		{
			name:     "health",
			method:   http.MethodGet,
			path:     "/health",
			expected: []int{http.StatusOK},
		},
		{
			name:     "register_validation",
			method:   http.MethodPost,
			path:     "/api/v1/auth/register",
			expected: []int{http.StatusBadRequest},
		},
		{
			name:     "login_validation",
			method:   http.MethodPost,
			path:     "/api/v1/auth/login",
			expected: []int{http.StatusBadRequest},
		},
		{
			name:   "test_login_optional",
			method: http.MethodPost,
			path:   "/api/v1/auth/test-login",
			body: map[string]string{
				"email": "route-smoke-test@example.com",
			},
			expected: []int{http.StatusOK, http.StatusNotFound},
		},
		{
			name:     "websocket_requires_token",
			method:   http.MethodGet,
			path:     "/ws/notifications",
			expected: []int{http.StatusUnauthorized},
		},
	}

	for _, tc := range publicRoutes {
		t.Run("public_"+tc.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest(tc.method, tc.path, tc.body, "")
			require.NoError(t, err)
			assertStatusIn(t, resp.StatusCode, tc.expected, tc.path)
		})
	}

	protectedRoutes := []routeCase{
		{name: "users_me", method: http.MethodGet, path: "/api/v1/users/me", expected: []int{http.StatusUnauthorized}},
		{name: "users_profile_sync_status", method: http.MethodGet, path: "/api/v1/users/me/profile-sync-status", expected: []int{http.StatusUnauthorized}},
		{name: "users_academic_profile", method: http.MethodGet, path: "/api/v1/users/me/academic-profile", expected: []int{http.StatusUnauthorized}},
		{name: "users_link_profile", method: http.MethodPost, path: "/api/v1/users/link-academic-profile", expected: []int{http.StatusUnauthorized}},
		{name: "users_unlink_profile", method: http.MethodPost, path: "/api/v1/users/unlink-academic-profile", expected: []int{http.StatusUnauthorized}},
		{name: "users_search", method: http.MethodGet, path: "/api/v1/users/search?q=test", expected: []int{http.StatusUnauthorized}},
		{name: "users_list", method: http.MethodGet, path: "/api/v1/users", expected: []int{http.StatusUnauthorized}},
		{name: "users_get", method: http.MethodGet, path: "/api/v1/users/test@example.com", expected: []int{http.StatusUnauthorized}},
		{name: "users_coi_check", method: http.MethodGet, path: "/api/v1/users/test@example.com/coi-check?conference_id=1", expected: []int{http.StatusUnauthorized}},
		{name: "users_update", method: http.MethodPut, path: "/api/v1/users/test@example.com", expected: []int{http.StatusUnauthorized}},
		{name: "users_delete", method: http.MethodDelete, path: "/api/v1/users/test@example.com", expected: []int{http.StatusUnauthorized}},

		{name: "conferences_list", method: http.MethodGet, path: "/api/v1/conferences", expected: []int{http.StatusUnauthorized}},
		{name: "conferences_get", method: http.MethodGet, path: "/api/v1/conferences/1", expected: []int{http.StatusUnauthorized}},
		{name: "conferences_create", method: http.MethodPost, path: "/api/v1/conferences", expected: []int{http.StatusUnauthorized}},
		{name: "conferences_update", method: http.MethodPut, path: "/api/v1/conferences/1", expected: []int{http.StatusUnauthorized}},
		{name: "conferences_delete", method: http.MethodDelete, path: "/api/v1/conferences/1", expected: []int{http.StatusUnauthorized}},
		{name: "conferences_bookmark", method: http.MethodPut, path: "/api/v1/conferences/1/bookmark", expected: []int{http.StatusUnauthorized}},
		{name: "conferences_status", method: http.MethodPut, path: "/api/v1/conferences/1/status", expected: []int{http.StatusUnauthorized}},

		{name: "reviewers_list", method: http.MethodGet, path: "/api/v1/conferences/1/reviewers", expected: []int{http.StatusUnauthorized}},
		{name: "reviewers_get", method: http.MethodGet, path: "/api/v1/conferences/1/reviewers/1", expected: []int{http.StatusUnauthorized}},
		{name: "reviewers_batch_invite", method: http.MethodPost, path: "/api/v1/conferences/1/reviewers", expected: []int{http.StatusUnauthorized}},
		{name: "reviewers_update_status", method: http.MethodPut, path: "/api/v1/conferences/1/reviewers/1/status", expected: []int{http.StatusUnauthorized}},
		{name: "reviewers_delete", method: http.MethodDelete, path: "/api/v1/conferences/1/reviewers/1", expected: []int{http.StatusUnauthorized}},

		{name: "submissions_precheck", method: http.MethodPost, path: "/api/v1/conferences/1/submissions/precheck", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_list", method: http.MethodGet, path: "/api/v1/conferences/1/submissions", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_get", method: http.MethodGet, path: "/api/v1/conferences/1/submissions/1", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_file", method: http.MethodGet, path: "/api/v1/conferences/1/submissions/1/file", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_cover_letter", method: http.MethodGet, path: "/api/v1/conferences/1/submissions/1/cover_letter", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_create", method: http.MethodPost, path: "/api/v1/conferences/1/submissions", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_update", method: http.MethodPut, path: "/api/v1/conferences/1/submissions/1", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_publish", method: http.MethodPost, path: "/api/v1/conferences/1/submissions/1/publish", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_update_status", method: http.MethodPut, path: "/api/v1/conferences/1/submissions/1/status", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_delete", method: http.MethodDelete, path: "/api/v1/conferences/1/submissions/1", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_auto_assign", method: http.MethodPost, path: "/api/v1/conferences/1/submissions/auto-assign", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_reviews", method: http.MethodGet, path: "/api/v1/conferences/1/submissions/1/reviews", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_reviews_analytics", method: http.MethodGet, path: "/api/v1/conferences/1/submissions/1/reviews/analytics", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_threads_create", method: http.MethodPost, path: "/api/v1/conferences/1/submissions/1/threads", expected: []int{http.StatusUnauthorized}},
		{name: "submissions_threads_list", method: http.MethodGet, path: "/api/v1/conferences/1/submissions/1/threads", expected: []int{http.StatusUnauthorized}},

		{name: "reviewer_dashboard", method: http.MethodGet, path: "/api/v1/reviewer/reviewer@example.com/dashboard", expected: []int{http.StatusUnauthorized}},
		{name: "reviewer_conference_papers", method: http.MethodGet, path: "/api/v1/reviewer/reviewer@example.com/conferences/1/papers", expected: []int{http.StatusUnauthorized}},
		{name: "reviewer_completed_papers", method: http.MethodGet, path: "/api/v1/reviewer/reviewer@example.com/completed-papers", expected: []int{http.StatusUnauthorized}},

		{name: "assignment_save_review", method: http.MethodPut, path: "/api/v1/conferences/1/assignments/1/review", expected: []int{http.StatusUnauthorized}},
		{name: "assignment_get_review", method: http.MethodGet, path: "/api/v1/conferences/1/assignments/1/review", expected: []int{http.StatusUnauthorized}},
		{name: "assignment_get_suggestions", method: http.MethodGet, path: "/api/v1/conferences/1/assignments/suggestions", expected: []int{http.StatusUnauthorized}},
		{name: "assignment_add_suggestion", method: http.MethodPost, path: "/api/v1/conferences/1/assignments/suggestions", expected: []int{http.StatusUnauthorized}},
		{name: "assignment_confirm_suggestions", method: http.MethodPost, path: "/api/v1/conferences/1/assignments/suggestions/confirm", expected: []int{http.StatusUnauthorized}},
		{name: "assignment_delete_suggestion", method: http.MethodDelete, path: "/api/v1/conferences/1/assignments/suggestions/1", expected: []int{http.StatusUnauthorized}},
		{name: "assignment_confirmed", method: http.MethodGet, path: "/api/v1/conferences/1/assignments/confirmed", expected: []int{http.StatusUnauthorized}},

		{name: "coi_dashboard_stats", method: http.MethodGet, path: "/api/v1/coi/dashboard/stats/1", expected: []int{http.StatusUnauthorized}},
		{name: "coi_relationships", method: http.MethodGet, path: "/api/v1/coi/relationships?conference_id=1", expected: []int{http.StatusUnauthorized}},
		{name: "coi_check_pair", method: http.MethodGet, path: "/api/v1/coi/check/reviewer/1/author/test@example.com", expected: []int{http.StatusUnauthorized}},
		{name: "coi_papers", method: http.MethodGet, path: "/api/v1/coi/papers?conference_id=1", expected: []int{http.StatusUnauthorized}},
		{name: "coi_rebuild", method: http.MethodPost, path: "/api/v1/coi/conferences/1/rebuild", expected: []int{http.StatusUnauthorized}},

		{name: "notifications_list", method: http.MethodGet, path: "/api/v1/notifications", expected: []int{http.StatusUnauthorized}},
		{name: "notifications_preferences_get", method: http.MethodGet, path: "/api/v1/notifications/preferences", expected: []int{http.StatusUnauthorized}},
		{name: "notifications_preferences_update", method: http.MethodPut, path: "/api/v1/notifications/preferences", expected: []int{http.StatusUnauthorized}},
		{name: "notifications_unread_count", method: http.MethodGet, path: "/api/v1/notifications/unread-count", expected: []int{http.StatusUnauthorized}},
		{name: "notifications_get", method: http.MethodGet, path: "/api/v1/notifications/1", expected: []int{http.StatusUnauthorized}},
		{name: "notifications_mark_read", method: http.MethodPatch, path: "/api/v1/notifications/1/read", expected: []int{http.StatusUnauthorized}},
		{name: "notifications_mark_all_read", method: http.MethodPatch, path: "/api/v1/notifications/read-all", expected: []int{http.StatusUnauthorized}},
		{name: "notifications_delete", method: http.MethodDelete, path: "/api/v1/notifications/1", expected: []int{http.StatusUnauthorized}},

		{name: "threads_get", method: http.MethodGet, path: "/api/v1/threads/1", expected: []int{http.StatusUnauthorized}},
		{name: "threads_create_message", method: http.MethodPost, path: "/api/v1/threads/1/messages", expected: []int{http.StatusUnauthorized}},
		{name: "threads_list_messages", method: http.MethodGet, path: "/api/v1/threads/1/messages", expected: []int{http.StatusUnauthorized}},
	}

	for _, tc := range protectedRoutes {
		t.Run("protected_"+tc.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest(tc.method, tc.path, tc.body, "")
			require.NoError(t, err)
			assertStatusIn(t, resp.StatusCode, tc.expected, tc.path)
		})
	}

	optionalProtectedRoutes := []routeCase{
		{
			name:     "semantic_scholar_search_optional",
			method:   http.MethodGet,
			path:     "/api/v1/semantic-scholar/authors/search?q=test",
			expected: []int{http.StatusUnauthorized, http.StatusNotFound},
		},
		{
			name:     "semantic_scholar_author_details_optional",
			method:   http.MethodGet,
			path:     "/api/v1/semantic-scholar/authors/test-author",
			expected: []int{http.StatusUnauthorized, http.StatusNotFound},
		},
		{
			name:     "semantic_scholar_author_papers_optional",
			method:   http.MethodGet,
			path:     "/api/v1/semantic-scholar/authors/test-author/papers",
			expected: []int{http.StatusUnauthorized, http.StatusNotFound},
		},
	}

	for _, tc := range optionalProtectedRoutes {
		t.Run("optional_"+tc.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest(tc.method, tc.path, tc.body, "")
			require.NoError(t, err)
			assertStatusIn(t, resp.StatusCode, tc.expected, tc.path)
		})
	}
}

func assertStatusIn(t *testing.T, got int, expected []int, path string) {
	t.Helper()

	for _, allowed := range expected {
		if got == allowed {
			return
		}
	}

	t.Fatalf("unexpected status %d for path %s (allowed: %v)", got, path, expected)
}
