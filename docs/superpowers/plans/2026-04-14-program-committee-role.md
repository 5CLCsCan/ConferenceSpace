# Program Committee (PC) Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only "Program Committee" (PC) role that sees everything the chair sees but cannot perform any write actions.

**Architecture:** Add `RolePC = "pc"` constant, create a new `RequireChairCoChairOrPC` middleware for GET routes, keep existing `RequireChairOrCoChair` for write routes. Frontend reuses chair UI with action buttons hidden when `currentRole === "pc"`.

**Tech Stack:** Go/Gin (backend), Next.js/React/TypeScript (frontend), PostgreSQL (existing `conference_user_roles` table), Vitest (frontend tests)

---

### Task 1: Backend — Add PC Role Constant

**Files:**
- Modify: `backend/internal/model/conference.go:29-35`

- [ ] **Step 1: Add the RolePC constant**

In `backend/internal/model/conference.go`, add `RolePC` to the role constants block:

```go
// User roles in conference context
const (
	RoleChair    = "chair"
	RoleCoChair  = "co_chair"
	RoleAuthor   = "author"
	RoleReviewer = "reviewer"
	RolePC       = "pc"
)
```

- [ ] **Step 2: Verify build**

Run: `cd backend && go build ./...`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/internal/model/conference.go
git commit -m "feat: add RolePC constant for program committee role"
```

---

### Task 2: Backend — Add New Utility Function and Middleware

**Files:**
- Modify: `backend/internal/utils/role_check.go`
- Modify: `backend/internal/middleware/authorization.go`

- [ ] **Step 1: Write unit test for IsUserChairCoChairOrPC**

Create `backend/internal/utils/role_check_test.go`:

```go
package utils

import (
	"context"
	"testing"

	"github.com/dcao/conferencespace/internal/model"
)

// mockRoleStorage implements conferenceuserrole.StorageInterface for testing
type mockRoleStorage struct {
	roles map[string][]string // key: "conferenceID:email" -> roles
}

func (m *mockRoleStorage) AddRole(_ context.Context, _ int64, _ string, _ string) error {
	return nil
}
func (m *mockRoleStorage) AddRoles(_ context.Context, _ []model.RoleAssignment) error {
	return nil
}
func (m *mockRoleStorage) RemoveRole(_ context.Context, _ int64, _ string) error {
	return nil
}
func (m *mockRoleStorage) UpdateRoleStatus(_ context.Context, _ int64, _ string, _ string) error {
	return nil
}
func (m *mockRoleStorage) GetUserRoles(_ context.Context, _ int64, _ string) ([]string, error) {
	return nil, nil
}
func (m *mockRoleStorage) GetAllUserRoles(_ context.Context, _ string) ([]string, error) {
	return nil, nil
}
func (m *mockRoleStorage) HasRole(_ context.Context, conferenceID int64, userEmail string, roles []string) (bool, error) {
	key := fmt.Sprintf("%d:%s", conferenceID, userEmail)
	userRoles, exists := m.roles[key]
	if !exists {
		return false, nil
	}
	for _, ur := range userRoles {
		for _, r := range roles {
			if ur == r {
				return true, nil
			}
		}
	}
	return false, nil
}

func TestIsUserChairOrCoChair(t *testing.T) {
	store := &mockRoleStorage{
		roles: map[string][]string{
			"1:chair@test.com":    {model.RoleChair},
			"1:cochair@test.com":  {model.RoleCoChair},
			"1:pc@test.com":      {model.RolePC},
			"1:reviewer@test.com": {model.RoleReviewer},
		},
	}

	tests := []struct {
		name     string
		email    string
		expected bool
	}{
		{"chair returns true", "chair@test.com", true},
		{"co-chair returns true", "cochair@test.com", true},
		{"pc returns false", "pc@test.com", false},
		{"reviewer returns false", "reviewer@test.com", false},
		{"unknown returns false", "nobody@test.com", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsUserChairOrCoChair(context.Background(), store, 1, tt.email)
			if result != tt.expected {
				t.Errorf("IsUserChairOrCoChair(%s) = %v, want %v", tt.email, result, tt.expected)
			}
		})
	}
}

func TestIsUserChairCoChairOrPC(t *testing.T) {
	store := &mockRoleStorage{
		roles: map[string][]string{
			"1:chair@test.com":    {model.RoleChair},
			"1:cochair@test.com":  {model.RoleCoChair},
			"1:pc@test.com":      {model.RolePC},
			"1:reviewer@test.com": {model.RoleReviewer},
		},
	}

	tests := []struct {
		name     string
		email    string
		expected bool
	}{
		{"chair returns true", "chair@test.com", true},
		{"co-chair returns true", "cochair@test.com", true},
		{"pc returns true", "pc@test.com", true},
		{"reviewer returns false", "reviewer@test.com", false},
		{"unknown returns false", "nobody@test.com", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsUserChairCoChairOrPC(context.Background(), store, 1, tt.email)
			if result != tt.expected {
				t.Errorf("IsUserChairCoChairOrPC(%s) = %v, want %v", tt.email, result, tt.expected)
			}
		})
	}
}
```

Note: You'll need to add `"fmt"` to the imports.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && go test ./internal/utils/ -v -run TestIsUserChairCoChairOrPC`
Expected: FAIL — `IsUserChairCoChairOrPC` is not defined.

- [ ] **Step 3: Add IsUserChairCoChairOrPC utility function**

In `backend/internal/utils/role_check.go`, add after the existing function:

```go
// IsUserChairCoChairOrPC checks if a user has chair, co-chair, or PC permissions in a conference
func IsUserChairCoChairOrPC(ctx context.Context, roleStorage conferenceuserrole.StorageInterface, conferenceID int64, userEmail string) bool {
	hasRole, err := roleStorage.HasRole(ctx, conferenceID, userEmail, []string{model.RoleChair, model.RoleCoChair, model.RolePC})
	if err != nil {
		return false
	}

	return hasRole
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && go test ./internal/utils/ -v`
Expected: All tests PASS.

- [ ] **Step 5: Add RequireChairCoChairOrPC middleware**

In `backend/internal/middleware/authorization.go`, add after `RequireChairOrCoChair`:

```go
// RequireChairCoChairOrPC checks that the authenticated user is a chair, co-chair,
// or program committee member of the conference identified by the :conference_id path parameter.
func RequireChairCoChairOrPC(roleStorage conferenceuserrole.StorageInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		userEmail, exists := utils.GetEmail(c)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			return
		}

		conferenceID, err := strconv.ParseInt(c.Param("conference_id"), 10, 64)
		if err != nil || conferenceID <= 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid conference_id"})
			return
		}

		if !utils.IsUserChairCoChairOrPC(c.Request.Context(), roleStorage, conferenceID, userEmail) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "only chair, co-chair, or program committee can perform this action"})
			return
		}

		c.Next()
	}
}
```

Also update the `ChairRoles` var at the bottom of the file:

```go
// Commonly used role constants for middleware usage
var (
	ChairRoles       = []string{model.RoleChair, model.RoleCoChair}
	ChairOrPCRoles   = []string{model.RoleChair, model.RoleCoChair, model.RolePC}
)
```

- [ ] **Step 6: Add RequireCOICheckAuthorizationOrPC middleware**

In `backend/internal/middleware/authorization.go`, add after `RequireCOICheckAuthorization`:

```go
// RequireCOICheckAuthorizationOrPC checks that the caller is a chair/co-chair/PC member of the
// conference specified in the query parameter conference_id.
func RequireCOICheckAuthorizationOrPC(roleStorage conferenceuserrole.StorageInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		userEmail, exists := utils.GetEmail(c)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			return
		}

		conferenceIDStr := c.Query("conference_id")
		conferenceID, err := strconv.ParseInt(conferenceIDStr, 10, 64)
		if err != nil || conferenceID <= 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "valid conference_id query parameter is required"})
			return
		}

		if !utils.IsUserChairCoChairOrPC(c.Request.Context(), roleStorage, conferenceID, userEmail) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "only chair, co-chair, or program committee can check COI for this conference"})
			return
		}

		c.Next()
	}
}
```

- [ ] **Step 7: Update RequireSubmissionAccess to also allow PC**

In `backend/internal/middleware/authorization.go`, in the `RequireSubmissionAccess` function, change line 85 from:

```go
if utils.IsUserChairOrCoChair(ctx, roleStorage, conferenceID, userEmail) {
```

to:

```go
if utils.IsUserChairCoChairOrPC(ctx, roleStorage, conferenceID, userEmail) {
```

- [ ] **Step 8: Update RequireThreadParticipant to also allow PC**

In `backend/internal/middleware/authorization.go`, in `RequireThreadParticipant`, after the chair check (line 148-152), the check uses `discussionStorage.IsUserConferenceChair`. We need to also check if the user is a PC member. Add after line 152:

```go
// PC member of the conference
isPCMember, pcErr := discussionStorage.IsUserConferencePCMember(ctx, userEmail, thread.ConferenceID)
if pcErr == nil && isPCMember {
	c.Next()
	return
}
```

**Note:** This requires adding `IsUserConferencePCMember` to the discussion storage interface. If the discussion storage doesn't support this, alternatively inject `roleStorage` into `RequireThreadParticipant` and use `utils.IsUserChairCoChairOrPC`. Check which approach is cleaner — if `RequireThreadParticipant` already has access to `discussionStorage` but not `roleStorage`, the simplest approach is to update the function signature to also accept `roleStorage`:

Update the function signature to:
```go
func RequireThreadParticipant(discussionStorage discussion.StorageInterface, roleStorage conferenceuserrole.StorageInterface) gin.HandlerFunc {
```

Then replace the chair check block (lines 147-152) with:
```go
// Chair, co-chair, or PC member of the conference
if utils.IsUserChairCoChairOrPC(ctx, roleStorage, conferenceID, thread.ConferenceID, userEmail) {
	// Note: thread.ConferenceID is the conferenceID here
	c.Next()
	return
}
```

Wait — let me correct. The function currently uses `discussionStorage.IsUserConferenceChair`. Replace lines 147-152:

```go
// Chair, co-chair, or PC of the conference
if utils.IsUserChairCoChairOrPC(ctx, roleStorage, thread.ConferenceID, userEmail) {
	c.Next()
	return
}
```

And update the call site in `main.go` (line 219) from:
```go
requireThreadParticipant := middleware.RequireThreadParticipant(store.Discussion)
```
to:
```go
requireThreadParticipant := middleware.RequireThreadParticipant(store.Discussion, store.ConferenceUserRole)
```

- [ ] **Step 9: Verify build**

Run: `cd backend && go build ./...`
Expected: Build succeeds.

- [ ] **Step 10: Run all util tests**

Run: `cd backend && go test ./internal/utils/ -v`
Expected: All PASS.

- [ ] **Step 11: Commit**

```bash
git add backend/internal/utils/ backend/internal/middleware/authorization.go
git commit -m "feat: add RequireChairCoChairOrPC middleware and IsUserChairCoChairOrPC utility"
```

---

### Task 3: Backend — Update Routes to Use New Middleware

**Files:**
- Modify: `backend/cmd/server/main.go`

- [ ] **Step 1: Add requireChairOrPC middleware instance**

In `backend/cmd/server/main.go`, after line 217 (`requireChair := ...`), add:

```go
requireChairOrPC := middleware.RequireChairCoChairOrPC(store.ConferenceUserRole)
requireCOICheckOrPC := middleware.RequireCOICheckAuthorizationOrPC(store.ConferenceUserRole)
```

- [ ] **Step 2: Update GET routes that use requireChair to use requireChairOrPC**

Replace `requireChair` with `requireChairOrPC` on these GET routes only:

Line 352: `reviewers.GET("", requireChairOrPC, ...)` — List reviewers
Line 353: `reviewers.GET("/:reviewer_id", requireChairOrPC, ...)` — Get reviewer detail
Line 384: `submissions.GET("/:submission_id/reviews", requireChairOrPC, ...)` — List reviews
Line 385: `submissions.GET("/:submission_id/reviews/analytics", requireChairOrPC, ...)` — Review analytics
Line 436: `suggestions.GET("", requireChairOrPC, ...)` — Get suggestions
Line 446: `assignments.GET("/confirmed", requireChairOrPC, ...)` — Get confirmed assignments

**Keep `requireChair` (unchanged) on all write routes:**
- Line 354: `reviewers.POST(...)` — Batch invite (chair only)
- Line 356: `reviewers.DELETE(...)` — Delete reviewer (chair only)
- Line 437: `suggestions.POST(...)` — Add suggestion (chair only)
- Line 438: `suggestions.POST("/confirm", ...)` — Confirm suggestions (chair only)
- Line 439: `suggestions.DELETE(...)` — Delete suggestion (chair only)

- [ ] **Step 3: Update COI GET routes**

Replace `requireCOICheck` with `requireCOICheckOrPC` on the COI GET routes. Looking at the COI routes (lines 449-467):

The COI GET routes currently have no explicit `requireCOICheck` middleware on the GET endpoints (only auth). The COI rebuild POST (line 466) should keep chair-only. For the GET endpoints, add `requireCOICheckOrPC` if they need protection, or leave as-is since they already use auth-only.

Actually, reviewing the routes: the COI GET endpoints don't use `requireCOICheck` — they just have auth middleware at the group level. The `requireCOICheck` is not applied to them. So no changes needed for COI GET routes.

The `coi.POST("/conferences/:conference_id/rebuild", ...)` should remain chair-only — this is a write operation.

- [ ] **Step 4: Update rebuttal GET route**

The rebuttal routes (lines 394-401) don't use middleware-level `requireChair` — they use controller-level `assertChairOrCoChair`. We need to update the controller-level check for the GET endpoint. This is handled in Task 4.

- [ ] **Step 5: Update RequireThreadParticipant call site**

In `main.go`, update line 219 from:
```go
requireThreadParticipant := middleware.RequireThreadParticipant(store.Discussion)
```
to:
```go
requireThreadParticipant := middleware.RequireThreadParticipant(store.Discussion, store.ConferenceUserRole)
```

- [ ] **Step 6: Verify build**

Run: `cd backend && go build ./...`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add backend/cmd/server/main.go
git commit -m "feat: use requireChairOrPC middleware on GET routes for PC read access"
```

---

### Task 4: Backend — Update Controller-Level Auth Checks for Rebuttal

**Files:**
- Modify: `backend/internal/controller/conference/rebuttal.go`

- [ ] **Step 1: Add assertChairCoChairOrPC method**

In `backend/internal/controller/conference/rebuttal.go`, add after the existing `assertChairOrCoChair` (line 153):

```go
func (c *Controller) assertChairCoChairOrPC(ginCtx *gin.Context, conferenceID int64) error {
	email, exists := utils.GetEmail(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "not authenticated")
	}
	conf, err := c.conferenceStorage.GetByID(ginCtx.Request.Context(), conferenceID)
	if err != nil {
		return handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}
	if conf.Chair == email {
		return nil
	}
	for _, cc := range conf.CoChairs {
		if cc == email {
			return nil
		}
	}
	// Check if user has PC role
	hasPC, pcErr := c.roleStorage.HasRole(ginCtx.Request.Context(), conferenceID, email, []string{"pc"})
	if pcErr == nil && hasPC {
		return nil
	}
	return handler.NewErrorResponse(http.StatusForbidden, "only chair, co-chair, or program committee can perform this action")
}
```

**Note:** Check that `c.roleStorage` exists on the Controller struct. If the conference controller doesn't have access to roleStorage, you'll need to add it. Check the controller struct definition first and add `roleStorage conferenceuserrole.StorageInterface` if needed, wiring it in `main.go`.

- [ ] **Step 2: Update GetRebuttalSettings to use new assertion**

In `backend/internal/controller/conference/rebuttal.go`, in `GetRebuttalSettings` (line 22), change:
```go
if err := c.assertChairOrCoChair(ginCtx, req.ConferenceID); err != nil {
```
to:
```go
if err := c.assertChairCoChairOrPC(ginCtx, req.ConferenceID); err != nil {
```

**Only update the GET endpoint.** Keep `assertChairOrCoChair` on all write endpoints (SaveRebuttalSettings, OpenRebuttal, FinalizeRebuttal, OpenDiscussion).

- [ ] **Step 3: Verify build**

Run: `cd backend && go build ./...`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/controller/conference/rebuttal.go
git commit -m "feat: allow PC role to read rebuttal settings"
```

---

### Task 5: Backend — API Integration Tests for PC Role

**Files:**
- Create: `backend/tests/api/conference/pc_role_test.go`

- [ ] **Step 1: Write comprehensive PC role API tests**

Create `backend/tests/api/conference/pc_role_test.go`:

```go
package conference

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestPCRoleReadAccess tests that PC members can access all chair GET endpoints
func TestPCRoleReadAccess(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceClient := NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// Setup: Create chair and PC users
	chairToken, chair, err := ctx.RegisterUniqueUser("pc-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	pcToken, _, err := ctx.RegisterUniqueUser("pc-member", "password123", "PC", "Member", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register PC member: %v", err)
	}

	// Create a conference
	conf := &dto.Conference{
		Title:   "PC Test Conference",
		Acronym: testutils.UniqueString("PCTEST"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	resp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusCreated)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &confData)
	confID := confData.Data.ID

	// Assign PC role to user
	_, err = ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/roles", confID), map[string]interface{}{
		"email": "pc-member",
		"role":  "pc",
	}, chairToken)
	// If the above endpoint doesn't exist, the PC role needs to be assigned directly.
	// Use the admin token or direct DB insertion via the existing role assignment mechanism.
	// The chair assigns PC via the same mechanism as co-chairs — check how co-chairs are assigned.

	// Alternative: Assign PC role via the existing AddRole mechanism
	// This depends on how co-chairs are assigned in the system.
	// If there's no dedicated endpoint, we may need to use the admin API or add a new endpoint.

	// For now, let's test using the conference update endpoint to add PC role
	// by checking how co-chairs are managed.

	// Create a submission for testing review endpoints
	authorToken, author, err := ctx.RegisterUniqueUser("pc-author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	sub := &dto.Submission{
		ConferenceID: confID,
		Author:       author.Email,
		Title:        "Test Paper for PC",
		Abstract:     "Abstract for testing PC access",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	subResp, err := submissionClient.Create(confID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)
	var subData struct {
		Data *dto.SubmissionResponse `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	subID := subData.Data.ID

	// ========================================
	// Test: PC can access GET chair endpoints
	// ========================================

	readTests := []struct {
		name   string
		method string
		url    string
		status int
	}{
		{
			name:   "PC can list reviewers",
			method: "GET",
			url:    fmt.Sprintf("/api/v1/conferences/%d/reviewers", confID),
			status: http.StatusOK,
		},
		{
			name:   "PC can list reviews for submission",
			method: "GET",
			url:    fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/reviews", confID, subID),
			status: http.StatusOK,
		},
		{
			name:   "PC can get review analytics",
			method: "GET",
			url:    fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/reviews/analytics", confID, subID),
			status: http.StatusOK,
		},
		{
			name:   "PC can get assignment suggestions",
			method: "GET",
			url:    fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", confID),
			status: http.StatusOK,
		},
		{
			name:   "PC can get confirmed assignments",
			method: "GET",
			url:    fmt.Sprintf("/api/v1/conferences/%d/assignments/confirmed", confID),
			status: http.StatusOK,
		},
	}

	for _, tt := range readTests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest(tt.method, tt.url, nil, pcToken)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			testutils.AssertStatusCode(t, resp, tt.status)
		})
	}

	// ========================================
	// Test: PC CANNOT access write endpoints
	// ========================================

	writeTests := []struct {
		name   string
		method string
		url    string
		body   interface{}
		status int
	}{
		{
			name:   "PC cannot invite reviewers",
			method: "POST",
			url:    fmt.Sprintf("/api/v1/conferences/%d/reviewers", confID),
			body:   map[string]interface{}{"reviewers": []interface{}{}},
			status: http.StatusForbidden,
		},
		{
			name:   "PC cannot add assignment suggestions",
			method: "POST",
			url:    fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", confID),
			body:   map[string]interface{}{},
			status: http.StatusForbidden,
		},
		{
			name:   "PC cannot confirm suggestions",
			method: "POST",
			url:    fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", confID),
			body:   map[string]interface{}{},
			status: http.StatusForbidden,
		},
	}

	for _, tt := range writeTests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest(tt.method, tt.url, tt.body, pcToken)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			testutils.AssertStatusCode(t, resp, tt.status)
		})
	}
}

// TestPCRoleConferenceListFiltering tests that PC role shows in myConferences filtering
func TestPCRoleConferenceListFiltering(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceClient := NewClient(ctx)

	// Setup
	chairToken, chair, err := ctx.RegisterUniqueUser("pcfilter-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	pcToken, _, err := ctx.RegisterUniqueUser("pcfilter-pc", "password123", "PC", "Member", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register PC member: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "PC Filter Test Conference",
		Acronym: testutils.UniqueString("PCFILT"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	resp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusCreated)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &confData)
	confID := confData.Data.ID

	// Assign PC role (mechanism depends on how roles are assigned — see Task 3 notes)
	// TODO: Use the actual role assignment endpoint/mechanism once determined

	// Test: PC member sees conference with myConferences=true&role=pc
	t.Run("PC member sees conference with role filter", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences?myConferences=true&role=pc"), nil, pcToken)
		if err != nil {
			t.Fatalf("Failed to list conferences: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var listData struct {
			Data *dto.UserConferenceListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &listData)

		found := false
		for _, c := range listData.Data.Conferences {
			if c.ID == confID {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("PC member should see conference %d in myConferences with role=pc filter", confID)
		}
	})

	_ = pcToken
}

// TestPCRoleExclusivity tests that PC role cannot coexist with other roles in the same conference
func TestPCRoleExclusivity(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceClient := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("pcexcl-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	_, _, err = ctx.RegisterUniqueUser("pcexcl-user", "password123", "Test", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register test user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "PC Exclusivity Test",
		Acronym: testutils.UniqueString("PCEXCL"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	resp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusCreated)

	// Test: Assigning PC to a user who already has reviewer role should fail
	// Test: Assigning reviewer to a user who already has PC role should fail
	// Implementation depends on how role assignment works in the system
	// These tests will validate the exclusivity constraint once the endpoint is implemented

	t.Log("PC role exclusivity tests placeholder — update once role assignment endpoint is confirmed")
}
```

**Important note:** The exact way to assign a PC role to a user depends on how the system currently assigns co-chairs and reviewers. The test will need to use the same mechanism. Investigate how `co_chair` roles are assigned — likely via the conference update endpoint (co-chairs field) or via a direct role assignment API. For PC, you may need to create a new endpoint or extend the existing role assignment flow.

- [ ] **Step 2: Run the tests**

Run: `cd backend && make test-api` or `cd backend && go test ./tests/api/conference/ -v -run TestPCRole`
Expected: Tests pass (after PC role assignment mechanism is determined and implemented).

- [ ] **Step 3: Commit**

```bash
git add backend/tests/api/conference/pc_role_test.go
git commit -m "test: add API integration tests for PC role read/write access"
```

---

### Task 6: Frontend — Add PC to Types, Routes, and Navigation

**Files:**
- Modify: `frontend/lib/types.ts:1`
- Modify: `frontend/lib/routes.ts:49-54`
- Modify: `frontend/lib/navigation.ts:11,116-117`
- Modify: `frontend/lib/auth-context.tsx:36`

- [ ] **Step 1: Add "pc" to UserRole type**

In `frontend/lib/types.ts`, line 1, change:
```typescript
export type UserRole = "author" | "reviewer" | "chair" | "admin"
```
to:
```typescript
export type UserRole = "author" | "reviewer" | "chair" | "pc" | "admin"
```

- [ ] **Step 2: Add PC to ROLE_ROUTE_MAP**

In `frontend/lib/routes.ts`, update the `ROLE_ROUTE_MAP` (lines 49-54):

```typescript
const ROLE_ROUTE_MAP: Record<UserRole, string> = {
  author: BASE_ROUTES.AUTHOR.DASHBOARD,
  reviewer: BASE_ROUTES.REVIEWER.DASHBOARD,
  chair: BASE_ROUTES.CHAIR.DASHBOARD,
  pc: BASE_ROUTES.CHAIR.DASHBOARD,
  admin: BASE_ROUTES.ROLE_SELECT,
}
```

- [ ] **Step 3: Add PC to sidebar navigation**

In `frontend/lib/navigation.ts`, update the `SidebarRole` type (line 11):

```typescript
type SidebarRole = Extract<UserRole, "author" | "reviewer" | "chair" | "pc">
```

Add PC nav template (same as chair) to `SIDEBAR_NAV_TEMPLATES` after the `chair` entry:

```typescript
pc: [
  {
    labelKey: "dashboard.sidebar.nav.chair.dashboard",
    href: ROUTES.CHAIR.DASHBOARD,
    icon: "dashboard",
  },
  {
    labelKey: "dashboard.sidebar.nav.chair.conferences",
    href: ROUTES.CHAIR.CONFERENCES,
    icon: "folder_open",
  },
  {
    labelKey: "dashboard.sidebar.nav.chair.schedules",
    href: ROUTES.CHAIR.SCHEDULES,
    icon: "calendar_month",
  },
  {
    labelKey: "dashboard.sidebar.nav.common.notifications",
    href: ROUTES.NOTIFICATIONS,
    icon: "notifications",
    withUnreadBadge: true,
  },
],
```

Update `isSidebarRole` (line 116-117):
```typescript
const isSidebarRole = (role: UserRole | null | undefined): role is SidebarRole =>
  role === "author" || role === "reviewer" || role === "chair" || role === "pc"
```

- [ ] **Step 4: Add "pc" to VALID_USER_ROLES**

In `frontend/lib/auth-context.tsx`, line 36:
```typescript
const VALID_USER_ROLES: UserRole[] = ["author", "reviewer", "chair", "pc", "admin"]
```

- [ ] **Step 5: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds. (There may be TypeScript errors from exhaustiveness checks that need fixing — address any that arise.)

- [ ] **Step 6: Commit**

```bash
git add frontend/lib/types.ts frontend/lib/routes.ts frontend/lib/navigation.ts frontend/lib/auth-context.tsx
git commit -m "feat: add PC role to frontend types, routes, and navigation"
```

---

### Task 7: Frontend — Update Chair Route Guard and Role Selection Page

**Files:**
- Modify: `frontend/app/role/chair/layout.tsx`
- Modify: `frontend/lib/use-role-route-guard.ts`
- Modify: `frontend/app/role/page.tsx`

- [ ] **Step 1: Update chair layout to accept PC role**

In `frontend/app/role/chair/layout.tsx`, update to accept both "chair" and "pc":

```typescript
"use client"

import type { ReactNode } from "react"
import { useRoleRouteGuard } from "@/lib/use-role-route-guard"
import { useAuth } from "@/lib/auth-context"

export default function ChairRoleLayout({ children }: { children: ReactNode }) {
  const { currentRole } = useAuth()
  const guardRole = currentRole === "pc" ? "pc" : "chair"
  const { canRender } = useRoleRouteGuard(guardRole)

  if (!canRender) {
    return null
  }

  return <div className="chair-ui">{children}</div>
}
```

- [ ] **Step 2: Add PC role card to role selection page**

In `frontend/app/role/page.tsx`, add a `pc` entry to `ROLE_CONFIG` (inside the `useMemo`, after the `chair` entry):

```typescript
pc: {
  icon: "groups",
  label: t("runtime.app.role.page.prop_label_oversight"),
  title: t("runtime.app.role.page.prop_title_pc"),
  description: t(
    "runtime.app.role.page.prop_description_read_only_access_to_conference",
  ),
  gradient: "from-amber-500 via-orange-600 to-orange-700",
  accentColor: "#d97706",
  shadowColor: "rgba(217,119,6,0.25)",
  borderGlow: "rgba(217,119,6,0.4)",
  btnClass:
    "bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-50 dark:bg-transparent dark:text-amber-400 dark:border-amber-500 dark:hover:bg-amber-900/20",
},
```

Update the roles filter array (line 227):
```typescript
const roles = (["author", "reviewer", "chair", "pc"] as const).filter((r) => canAccessRole(user, r))
```

Add a mesh CSS class for PC. In the `customStyles` string, add:
```css
.mesh-pc {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.6) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(217,119,6,0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 60% 80%, rgba(234,88,12,0.5) 0%, transparent 50%),
    linear-gradient(135deg, #f59e0b, #d97706, #ea580c);
}
```

Update the `meshClass` selection in the map callback to also handle `"pc"`:
```typescript
const meshClass =
  roleKey === "author"
    ? "mesh-author"
    : roleKey === "reviewer"
      ? "mesh-reviewer"
      : roleKey === "pc"
        ? "mesh-pc"
        : "mesh-chair"
```

Add PC-specific decorative shapes in the card header (after the `chair` shapes block):
```typescript
{roleKey === "pc" && (
  <>
    {/* Overlapping rectangles - oversight */}
    <div className="absolute -right-4 top-4 w-24 h-16 rounded-lg border border-white/10" style={{ transform: "rotate(10deg)" }} />
    <div className="absolute right-8 -top-2 w-20 h-14 rounded-lg border border-white/[0.07]" style={{ transform: "rotate(-5deg)" }} />
    <div className="absolute -left-4 -bottom-4 w-28 h-28 rounded-full bg-white/[0.04]" />
    <div className="absolute top-8 left-[50%] w-1.5 h-1.5 rounded-full bg-white/25" />
  </>
)}
```

Also add `card-enter-4` CSS animation delay:
```css
.card-enter-4 { animation-delay: 0.32s; }
```

- [ ] **Step 3: Add translation keys**

Add the following translation keys to the English locale file (find the i18n locale file and add):

- `runtime.app.role.page.prop_label_oversight`: `"Oversight"`
- `runtime.app.role.page.prop_title_pc`: `"Program Committee"`
- `runtime.app.role.page.prop_description_read_only_access_to_conference`: `"Read-only access to all conference data, reviews, and analytics."`

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/role/chair/layout.tsx frontend/app/role/page.tsx frontend/lib/use-role-route-guard.ts
git commit -m "feat: add PC role card to role selection page and update chair layout guard"
```

---

### Task 8: Frontend — Add isReadOnlyRole Helper and Hide Write Actions

**Files:**
- Create: `frontend/lib/role-helpers.ts`
- Modify: Multiple chair components (see list below)

- [ ] **Step 1: Create the isReadOnlyRole helper**

Create `frontend/lib/role-helpers.ts`:

```typescript
import type { UserRole } from "./types"

/**
 * Returns true if the given role should have read-only access
 * (can view but not modify data). Currently only the "pc" role.
 */
export function isReadOnlyRole(role: UserRole | null | undefined): boolean {
  return role === "pc"
}
```

- [ ] **Step 2: Update chair components to hide write actions**

For each chair component that has action buttons, import `isReadOnlyRole` and wrap write actions:

```typescript
import { isReadOnlyRole } from "@/lib/role-helpers"
import { useAuth } from "@/lib/auth-context"

// Inside the component:
const { currentRole } = useAuth()
const readOnly = isReadOnlyRole(currentRole)
```

Then wrap action buttons/sections with `{!readOnly && (...)}`.

**Key components to update (hide action buttons when readOnly):**

1. **`frontend/components/chair/conference-detail/chair-actions-panel.tsx`** — Hide all action buttons (the entire panel may need to be hidden or shown without actions)

2. **`frontend/components/chair/conference-detail/conference-submissions.tsx`** — Hide accept/reject buttons, status change controls

3. **`frontend/components/chair/conference-detail/submission-detail-content.tsx`** — Hide decision buttons

4. **`frontend/components/chair/conference-detail/submission-detail/chair-decision-copilot-panel.tsx`** — Hide generate/regenerate buttons (keep read view)

5. **`frontend/components/chair/conference-detail/conference-rebuttal-management.tsx`** — Hide open/finalize rebuttal buttons

6. **`frontend/components/chair/conference-detail/conference-rebuttal-settings.tsx`** — Hide save settings button

7. **`frontend/components/chair/conference-detail/conference-detail-header.tsx`** — Hide edit conference button

8. **`frontend/components/chair/conference-detail/conference-committee.tsx`** — Hide invite/remove reviewer buttons

9. **`frontend/components/chair/conference-detail/conference-assignments.tsx`** — Hide add/confirm/delete suggestion buttons

10. **`frontend/components/chair/conference-more-menu.tsx`** — Hide delete/edit options

11. **`frontend/components/chair/chair-conferences.tsx`** — Hide "New Conference" button

12. **`frontend/components/chair/conference-form-page.tsx`** — This is the create/edit form — PC shouldn't reach this page, but add a guard just in case

13. **`frontend/components/chair/template-sheet/home-view.tsx`** — Hide create/edit/delete template buttons
14. **`frontend/components/chair/template-sheet/save-view.tsx`** — Hide save button

**Pattern for each component:**

```typescript
// At top of component
import { isReadOnlyRole } from "@/lib/role-helpers"
import { useAuth } from "@/lib/auth-context"

// Inside component body
const { currentRole } = useAuth()
const readOnly = isReadOnlyRole(currentRole)

// Wrap action buttons
{!readOnly && (
  <Button onClick={handleDelete}>Delete</Button>
)}
```

Read each file before modifying to find the exact buttons/actions to wrap. The exact JSX will vary per component.

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/role-helpers.ts frontend/components/chair/
git commit -m "feat: hide write actions in chair UI for PC read-only role"
```

---

### Task 9: Frontend — Unit Tests

**Files:**
- Create: `frontend/lib/__tests__/role-helpers.test.ts`
- Modify: `frontend/components/chair/conference-detail/__tests__/chair-actions-panel.test.tsx`

- [ ] **Step 1: Write unit tests for isReadOnlyRole**

Create `frontend/lib/__tests__/role-helpers.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { isReadOnlyRole } from "../role-helpers"

describe("isReadOnlyRole", () => {
  it("returns true for pc role", () => {
    expect(isReadOnlyRole("pc")).toBe(true)
  })

  it("returns false for chair role", () => {
    expect(isReadOnlyRole("chair")).toBe(false)
  })

  it("returns false for author role", () => {
    expect(isReadOnlyRole("author")).toBe(false)
  })

  it("returns false for reviewer role", () => {
    expect(isReadOnlyRole("reviewer")).toBe(false)
  })

  it("returns false for admin role", () => {
    expect(isReadOnlyRole("admin")).toBe(false)
  })

  it("returns false for null", () => {
    expect(isReadOnlyRole(null)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isReadOnlyRole(undefined)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test**

Run: `cd frontend && npm run test:run -- --reporter=verbose role-helpers`
Expected: All PASS.

- [ ] **Step 3: Add PC role test to ChairActionsPanel tests**

In `frontend/components/chair/conference-detail/__tests__/chair-actions-panel.test.tsx`, add a test:

```typescript
it("should hide action buttons when role is pc", () => {
  vi.mocked(authContext.useAuth).mockReturnValue({ currentRole: "pc" } as any)

  render(
    <ChairActionsPanel
      conferenceId="123"
      onNavigateToAssignments={mockOnNavigateToAssignments}
    />,
  )

  // Action buttons should not be present for PC role
  // Check for specific buttons that should be hidden
  // The exact assertions depend on what buttons exist in the component
  // Example:
  // expect(screen.queryByText("Invite Reviewers")).not.toBeInTheDocument()
})
```

- [ ] **Step 4: Write tests for role selection page with PC role**

Create `frontend/app/role/__tests__/role-page.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Test that PC role card appears when user has PC role
// This verifies the role selection page correctly includes "pc" in the filter
describe("RoleSelectionPage", () => {
  it("should include pc in the roles filter when user has pc role", () => {
    // Mock user with PC role
    // Render the page
    // Assert PC card is visible
    // The exact implementation depends on the mocking setup
  })
})
```

- [ ] **Step 5: Run all frontend tests**

Run: `cd frontend && npm run test:run`
Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/lib/__tests__/role-helpers.test.ts frontend/components/chair/conference-detail/__tests__/
git commit -m "test: add frontend unit tests for PC role helper and component behavior"
```

---

### Task 10: Verification and Cleanup

- [ ] **Step 1: Run full backend test suite**

Run: `cd backend && make test`
Expected: All tests pass.

- [ ] **Step 2: Run full backend API tests**

Run: `cd backend && make test-api`
Expected: All tests pass.

- [ ] **Step 3: Run full frontend test suite**

Run: `cd frontend && npm run test:run`
Expected: All tests pass.

- [ ] **Step 4: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Run backend lint**

Run: `cd backend && make lint`
Expected: No lint errors.

- [ ] **Step 6: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: No lint errors.

- [ ] **Step 7: Final commit if any cleanup needed**

```bash
git commit -m "chore: cleanup and verification for PC role feature"
```
