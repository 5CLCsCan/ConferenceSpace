# Authorization Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 10 verified authorization gaps by adding middleware-based access controls to backend endpoints and removing hardcoded frontend role grants.

**Architecture:** New Gin middleware functions in `backend/internal/middleware/authorization.go` enforce role/ownership checks at route-wiring time in `cmd/server/main.go`. Controller-level changes handle cases where middleware alone isn't sufficient (List filtering, UpdateStatus dual-path). Frontend derives roles from backend `/users/me` response instead of hardcoding.

**Tech Stack:** Go 1.24 / Gin framework (backend middleware), Next.js / TypeScript (frontend role access), PostgreSQL (conference_user_roles table)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `backend/internal/middleware/authorization.go` | Create | All authorization middleware functions |
| `backend/internal/storage/conference_user_role/conference_user_role.go` | Modify | Add `GetAllUserRoles` to interface + implementation |
| `backend/cmd/server/main.go` | Modify | Wire middleware to routes |
| `backend/internal/controller/reviewer/reviewer.go` | Modify | Add auth to `UpdateStatus`, `AcknowledgeRebuttal`, `AcknowledgePoint` |
| `backend/internal/controller/submission/submission.go` | Modify | Add role-aware filtering to `List` |
| `backend/internal/controller/conference/conference.go` | Modify | Add visibility filtering to `List` and `Get` |
| `backend/internal/controller/user/user.go` | Modify | Add `roleStorage`, sanitize non-self lookups, populate roles in `GetMe`, restrict `GetAcademicProfileByEmail` |
| `backend/internal/storage/conference/conference.go` | Modify | Add `PublicOnly` field to `QueryParams` + implement filter |
| `backend/internal/dto/user.go` | Modify | Add `Roles` field to `UserResponse` |
| `frontend/lib/role-access.ts` | Modify | Remove `BASE_PLATFORM_ROLES` |
| `frontend/lib/api/user.ts` | Modify | Add `roles` to API `User` interface |

---

### Task 1: Create Authorization Middleware

**Files:**
- Create: `backend/internal/middleware/authorization.go`

- [ ] **Step 1: Create the middleware file with all middleware functions**

```go
package middleware

import (
	"net/http"
	"strconv"

	"github.com/dcao/conferencespace/internal/model"
	"github.com/dcao/conferencespace/internal/storage/assignment"
	conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
	"github.com/dcao/conferencespace/internal/storage/discussion"
	"github.com/dcao/conferencespace/internal/storage/reviewer"
	"github.com/dcao/conferencespace/internal/storage/submission"
	"github.com/dcao/conferencespace/internal/utils"
	"github.com/gin-gonic/gin"
)

// RequireChairOrCoChair checks that the authenticated user is a chair or co-chair
// of the conference identified by the :conference_id path parameter.
func RequireChairOrCoChair(roleStorage conferenceuserrole.StorageInterface) gin.HandlerFunc {
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

		if !utils.IsUserChairOrCoChair(c.Request.Context(), roleStorage, conferenceID, userEmail) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "only chair or co-chair can perform this action"})
			return
		}

		c.Next()
	}
}

// RequireSubmissionAccess checks that the authenticated user is the submission author,
// an assigned reviewer, or a chair/co-chair of the conference.
// Extracts :conference_id and :submission_id from path parameters.
func RequireSubmissionAccess(
	submissionStorage submission.StorageInterface,
	assignmentStorage assignment.StorageInterface,
	roleStorage conferenceuserrole.StorageInterface,
	reviewerStorage reviewer.StorageInterface,
) gin.HandlerFunc {
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

		submissionID, err := strconv.ParseInt(c.Param("submission_id"), 10, 64)
		if err != nil || submissionID <= 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid submission_id"})
			return
		}

		ctx := c.Request.Context()

		sub, err := submissionStorage.GetByID(ctx, submissionID)
		if err != nil || sub.ConferenceID != conferenceID {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "submission not found"})
			return
		}

		// 1. Author owns the submission
		if sub.Author == userEmail {
			c.Next()
			return
		}

		// 2. Chair/co-chair of the conference
		if utils.IsUserChairOrCoChair(ctx, roleStorage, conferenceID, userEmail) {
			c.Next()
			return
		}

		// 3. Assigned reviewer for this submission
		userID, _ := utils.GetUserID(c)
		assignments, _, err := assignmentStorage.List(ctx, conferenceID, &assignment.ListParams{
			SubmissionID: submissionID,
			Limit:        100,
		})
		if err == nil {
			for _, a := range assignments {
				rev, revErr := reviewerStorage.GetByID(ctx, a.ReviewerID)
				if revErr == nil && rev.Email == userEmail && rev.UserID == userID {
					c.Next()
					return
				}
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "you do not have access to this submission"})
	}
}

// RequireThreadParticipant checks that the authenticated user is a participant
// (reviewer, author, or chair) of the discussion thread identified by :thread_id.
func RequireThreadParticipant(discussionStorage discussion.StorageInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		userEmail, exists := utils.GetEmail(c)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			return
		}

		userID, _ := utils.GetUserID(c)

		threadID, err := strconv.ParseInt(c.Param("thread_id"), 10, 64)
		if err != nil || threadID <= 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid thread_id"})
			return
		}

		ctx := c.Request.Context()

		thread, err := discussionStorage.GetThreadByID(ctx, threadID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "thread not found"})
			return
		}

		// Reviewer who owns the thread
		if thread.ReviewerID == userID {
			c.Next()
			return
		}

		// Author of the submission
		if thread.AuthorEmail == userEmail {
			c.Next()
			return
		}

		// Chair of the conference
		isChair, err := discussionStorage.IsUserConferenceChair(ctx, userEmail, thread.ConferenceID)
		if err == nil && isChair {
			c.Next()
			return
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "you do not have access to this thread"})
	}
}

// RequireSelfReviewerEmail checks that the :reviewer_email path parameter matches
// the authenticated user's email.
func RequireSelfReviewerEmail() gin.HandlerFunc {
	return func(c *gin.Context) {
		userEmail, exists := utils.GetEmail(c)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			return
		}

		reviewerEmail := c.Param("reviewer_email")
		if reviewerEmail != userEmail {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "you can only access your own reviewer data"})
			return
		}

		c.Next()
	}
}

// RequireAssignmentOwner checks that the authenticated user is the reviewer
// assigned to the assignment identified by :assignment_id.
func RequireAssignmentOwner(
	assignmentStorage assignment.StorageInterface,
	reviewerStorage reviewer.StorageInterface,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		userEmail, exists := utils.GetEmail(c)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			return
		}

		assignmentID, err := strconv.ParseInt(c.Param("assignment_id"), 10, 64)
		if err != nil || assignmentID <= 0 {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid assignment_id"})
			return
		}

		ctx := c.Request.Context()

		a, err := assignmentStorage.GetByID(ctx, assignmentID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "assignment not found"})
			return
		}

		rev, err := reviewerStorage.GetByID(ctx, a.ReviewerID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve reviewer"})
			return
		}

		if rev.Email != userEmail {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "you are not the assigned reviewer for this assignment"})
			return
		}

		c.Next()
	}
}

// RequireCOICheckAuthorization checks that the caller is a chair/co-chair of the
// conference specified in the query parameter conference_id.
func RequireCOICheckAuthorization(roleStorage conferenceuserrole.StorageInterface) gin.HandlerFunc {
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

		if !utils.IsUserChairOrCoChair(c.Request.Context(), roleStorage, conferenceID, userEmail) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "only chair or co-chair can check COI for this conference"})
			return
		}

		c.Next()
	}
}

// Commonly used role constants for middleware usage
var (
	ChairRoles = []string{model.RoleChair, model.RoleCoChair}
)
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && go build ./internal/middleware/`
Expected: No output (clean compilation)

- [ ] **Step 3: Commit**

```bash
git add backend/internal/middleware/authorization.go
git commit -m "feat: add authorization middleware for role and ownership checks"
```

---

### Task 2: Wire Middleware to Routes

**Files:**
- Modify: `backend/cmd/server/main.go`

- [ ] **Step 1: Add middleware instances after `ctrl` and `hub` declarations**

In `setupRouter()`, after `ctrl := appCtx.Controller` and `hub := appCtx.Hub`, add:

```go
	store := appCtx.Store

	// Authorization middleware instances
	requireChair := middleware.RequireChairOrCoChair(store.ConferenceUserRole)
	requireSubmissionAccess := middleware.RequireSubmissionAccess(store.Submission, store.Assignment, store.ConferenceUserRole, store.Reviewer)
	requireThreadParticipant := middleware.RequireThreadParticipant(store.Discussion)
	requireSelfReviewer := middleware.RequireSelfReviewerEmail()
	requireAssignmentOwner := middleware.RequireAssignmentOwner(store.Assignment, store.Reviewer)
	requireCOICheck := middleware.RequireCOICheckAuthorization(store.ConferenceUserRole)
```

- [ ] **Step 2: Add `requireChair` to reviewer management routes (Issue #3)**

In the `reviewers` route group (~line 352-356), add `requireChair` as the second argument to GET, GET/:id, POST, and DELETE. Leave PUT (UpdateStatus) without middleware — auth will be in the controller.

```go
reviewers.GET("", requireChair, handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.List))
reviewers.GET("/:reviewer_id", requireChair, handler.HandleRequestWithURI(ctrl.Reviewer.Get))
reviewers.POST("", requireChair, handler.HandleRequestWithURIAndJSONWithStatus(http.StatusCreated, ctrl.Reviewer.BatchInvite))
reviewers.PUT("/:reviewer_id/status", handler.HandleRequestWithURIAndJSON(ctrl.Reviewer.UpdateStatus)) // Auth in controller: chair or invited reviewer
reviewers.DELETE("/:reviewer_id", requireChair, handler.HandleNoRequestWithURIMessage("reviewer removed successfully", ctrl.Reviewer.Delete))
```

- [ ] **Step 3: Add `requireSubmissionAccess` to submission read routes (Issue #2)**

For these 5 routes (~lines 364-377), add `requireSubmissionAccess` as the second argument:

```go
submissions.GET("/:submission_id", requireSubmissionAccess, handler.HandleNoRequest(ctrl.Submission.Get))
submissions.GET("/:submission_id/file", requireSubmissionAccess, ctrl.Submission.GetFile)
submissions.GET("/:submission_id/cover_letter", requireSubmissionAccess, ctrl.Submission.GetCoverLetter)
submissions.GET("/:submission_id/rebuttal", requireSubmissionAccess, handler.HandleRequestWithURI(ctrl.Submission.GetRebuttal))
submissions.GET("/:submission_id/camera-ready", requireSubmissionAccess, ctrl.Submission.GetCameraReady)
```

Note: `submissions.GET("")` (List) is NOT changed here — it's handled in Task 5 at the controller level.

- [ ] **Step 4: Add `requireChair` to review/analytics endpoints (Issue #6)**

```go
submissions.GET("/:submission_id/reviews", requireChair, handler.HandleRequestWithURIAndQuery(ctrl.Assignment.ListReviews))
submissions.GET("/:submission_id/reviews/analytics", requireChair, handler.HandleNoRequest(ctrl.Assignment.GetReviewAnalytics))
```

- [ ] **Step 5: Add `requireAssignmentOwner` to rebuttal acknowledgment routes (Issue #5)**

```go
assignments.PUT("/:assignment_id/rebuttal/acknowledge", requireAssignmentOwner, handler.HandleRequestWithURI(ctrl.Reviewer.AcknowledgeRebuttal))
assignments.PUT("/:assignment_id/rebuttal/points/:point_id/acknowledge", requireAssignmentOwner, handler.HandleRequestWithAll(ctrl.Reviewer.AcknowledgePoint))
```

- [ ] **Step 6: Add `requireChair` to suggestion routes and confirmed assignments (Issue #6)**

```go
suggestions.GET("", requireChair, handler.HandleNoRequest(ctrl.Assignment.GetSuggestions))
suggestions.POST("", requireChair, handler.HandleRequestWithStatus(http.StatusCreated, ctrl.Assignment.AddSuggestion))
suggestions.POST("/confirm", requireChair, handler.HandleRequest(ctrl.Assignment.ConfirmSuggestions))
suggestions.DELETE("/:assignment_id", requireChair, handler.HandleNoRequestWithMessage("suggestion deleted successfully", ctrl.Assignment.DeleteSuggestion))
// ...
assignments.GET("/confirmed", requireChair, handler.HandleNoRequest(ctrl.Assignment.GetConfirmedAssignments))
```

- [ ] **Step 7: Add `requireSelfReviewer` to reviewer dashboard routes (Issue #4)**

```go
reviewer.GET("/:reviewer_email/dashboard", requireSelfReviewer, handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.GetDashboard))
reviewer.GET("/:reviewer_email/conferences/:conference_id/papers", requireSelfReviewer, handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.GetConferencePapers))
reviewer.GET("/:reviewer_email/completed-papers", requireSelfReviewer, handler.HandleRequestWithURIAndQuery(ctrl.Reviewer.GetCompletedPapers))
```

- [ ] **Step 8: Add `requireThreadParticipant` to attachment routes (Issue #7)**

```go
threads.POST("/:thread_id/attachments", requireThreadParticipant, ctrl.Discussion.UploadAttachment)
threads.GET("/:thread_id/attachments/:filename", requireThreadParticipant, ctrl.Discussion.DownloadAttachment)
```

- [ ] **Step 9: Add `requireCOICheck` to COI preflight route (Issue #10)**

```go
users.GET("/:email/coi-check", requireCOICheck, handler.HandleRequestWithURIAndQuery(ctrl.User.CheckCOI))
```

- [ ] **Step 10: Verify compilation**

Run: `cd backend && go build ./cmd/server/`
Expected: No output (clean compilation)

- [ ] **Step 11: Commit**

```bash
git add backend/cmd/server/main.go
git commit -m "feat: wire authorization middleware to all affected routes"
```

---

### Task 3: Add Auth to Reviewer UpdateStatus (Issue #3 — dual-path)

**Files:**
- Modify: `backend/internal/controller/reviewer/reviewer.go:218-286`

- [ ] **Step 1: Add authorization check at the start of UpdateStatus**

Replace the beginning of `UpdateStatus` (after the function signature, before the storage call) with:

```go
func (c *Controller) UpdateStatus(ginCtx *gin.Context, req *dto.ReviewerUpdateStatusRequest) (*dto.Reviewer, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	// Verify the reviewer exists and belongs to this conference
	existing, err := c.reviewerStorage.GetByID(ctx, req.ReviewerID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "reviewer not found")
	}

	if existing.ConferenceID != req.ConferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "reviewer not found in this conference")
	}

	// Authorization: caller must be chair/co-chair OR the invited reviewer themselves
	isChair := utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail)
	isSelf := existing.Email == userEmail
	if !isChair && !isSelf {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only the chair or the invited reviewer can update invitation status")
	}

	// Self-service reviewers can only accept or reject
	if isSelf && !isChair {
		if req.Status != model.ReviewerStatusAccepted && req.Status != model.ReviewerStatusRejected {
			return nil, handler.NewErrorResponse(http.StatusForbidden, "reviewers can only accept or reject their own invitation")
		}
	}

	result, err := c.reviewerStorage.UpdateStatus(ctx, req.ReviewerID, req.Status)
	// ... rest of method unchanged
```

The key change: insert the `userEmail` extraction, chair check, self check, and status restriction between the `existing` lookup and `UpdateStatus` call. Everything after `result, err := c.reviewerStorage.UpdateStatus(...)` stays the same.

- [ ] **Step 2: Verify compilation**

Run: `cd backend && go build ./internal/controller/reviewer/`
Expected: No output

- [ ] **Step 3: Commit**

```bash
git add backend/internal/controller/reviewer/reviewer.go
git commit -m "feat: add chair-or-self authorization to reviewer UpdateStatus"
```

---

### Task 4: Add Role-Aware Filtering to Submission List (Issue #2)

**Files:**
- Modify: `backend/internal/controller/submission/submission.go:382-426`

- [ ] **Step 1: Replace the List method with role-aware version**

Replace the entire `List` method body:

```go
func (c *Controller) List(ginCtx *gin.Context, req *dto.SubmissionListRequest) (*dto.SubmissionListResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "invalid conference ID")
	}

	params := &submissionStorage.QueryParams{
		Limit:        req.Limit,
		Offset:       req.Offset,
		ConferenceID: conferenceID,
		Author:       req.Author,
		Status:       req.Status,
		Title:        req.Title,
		Track:        req.Track,
	}

	// Authorization: non-chair callers can only list their own submissions
	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, conferenceID, userEmail) {
		params.Author = userEmail
	}

	submissions, total, err := c.submissionStorage.List(ctx, params)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &dto.SubmissionListResponse{
		Submissions: submissions,
		Total:       total,
	}, nil
}
```

This removes the debug logging and adds the chair check. Non-chair users are forced to `Author = userEmail`.

- [ ] **Step 2: Verify compilation**

Run: `cd backend && go build ./internal/controller/submission/`
Expected: No output

- [ ] **Step 3: Commit**

```bash
git add backend/internal/controller/submission/submission.go
git commit -m "feat: add role-aware filtering to submission List endpoint"
```

---

### Task 5: Add Conference Visibility Filtering (Issue #8)

**Files:**
- Modify: `backend/internal/storage/conference/conference.go:15-26` (QueryParams)
- Modify: `backend/internal/storage/conference/conference.go:313-317` (after status filter)
- Modify: `backend/internal/controller/conference/conference.go:133-172` (List method)
- Modify: `backend/internal/controller/conference/conference.go:187-195` (Get method)

- [ ] **Step 1: Add `PublicOnly` to conference storage QueryParams**

In `backend/internal/storage/conference/conference.go`, add a new field to `QueryParams`:

```go
type QueryParams struct {
	Limit         int
	Offset        int
	Title         string
	Acronym       string
	Chair         string
	Status        string // Filter by status: "active", "upcoming", "archived"
	MyConferences bool
	Role          string
	UserEmail     string // User email - single source of truth
	MyBookmark    bool   // Filter by bookmarked conferences
	PublicOnly    bool   // Only return publicly visible statuses (open, reviewing, completed)
}
```

- [ ] **Step 2: Implement the PublicOnly filter in storage List**

In the same file, after the `if params.Status != ""` block (~line 317), add:

```go
	// PublicOnly: restrict to publicly visible statuses (open, reviewing, completed)
	if params.PublicOnly {
		statusCol := fmt.Sprintf("%s.%s", model.ConferenceTableName, model.ColConferenceStatus)
		publicStatuses := []string{model.ConferenceStatusOpen, model.ConferenceStatusReviewing, model.ConferenceStatusCompleted}
		baseQuery = baseQuery.Where(sq.Eq{statusCol: publicStatuses})
		countQuery = countQuery.Where(sq.Eq{model.ColConferenceStatus: publicStatuses})
	}
```

- [ ] **Step 3: Update conference controller List to set PublicOnly**

In `backend/internal/controller/conference/conference.go`, modify the `List` method. After building `params`, add:

```go
	// For non-myConferences (explorer) requests: restrict to public statuses only
	// unless a specific status filter is already applied
	if !req.MyConferences && req.Status == "" {
		params.PublicOnly = true
	}
```

Also add sanitization in the loop that builds `userConferences`:

```go
	for i, conf := range conferences {
		userConf := &dto.UserConferenceResponse{
			ConferenceResponse: *conf,
			UserRole:           conf.UserRole,
		}

		// Sanitize sensitive fields for non-chair callers
		if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, conf.ID, userEmail) {
			userConf.Configurations = nil
		}

		userConferences[i] = userConf
	}
```

- [ ] **Step 4: Update conference controller Get to enforce visibility**

Replace the `Get` method body:

```go
func (c *Controller) Get(ginCtx *gin.Context, req *dto.ConferenceGetRequest) (*dto.ConferenceResponse, error) {
	ctx := ginCtx.Request.Context()

	conference, err := c.conferenceStorage.GetByID(ctx, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}

	userEmail, _ := utils.GetEmail(ginCtx)
	isChair := utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail)

	// Non-chair callers can only see public conferences (open, reviewing, completed)
	if !isChair {
		if conference.Status == model.ConferenceStatusDraft || conference.Status == model.ConferenceStatusArchived {
			return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
		}
		// Sanitize sensitive fields
		conference.Configurations = nil
	}

	return conference, nil
}
```

- [ ] **Step 5: Verify compilation**

Run: `cd backend && go build ./...`
Expected: No output

- [ ] **Step 6: Commit**

```bash
git add backend/internal/storage/conference/conference.go backend/internal/controller/conference/conference.go
git commit -m "feat: add status-based visibility to conference List and Get"
```

---

### Task 6: Fix User Directory Scoping (Issue #9)

**Files:**
- Modify: `backend/internal/controller/user/user.go:24-42` (add roleStorage)
- Modify: `backend/internal/controller/user/user.go:61-81` (List)
- Modify: `backend/internal/controller/user/user.go:96-109` (Get)
- Modify: `backend/internal/controller/user/user.go:282-313` (Search)
- Modify: `backend/internal/controller/user/user.go:485-499` (GetAcademicProfileByEmail)
- Modify: `backend/internal/dto/user.go:17-21` (UserResponse)

- [ ] **Step 1: Add `Roles` field to UserResponse DTO**

In `backend/internal/dto/user.go`, modify:

```go
type UserResponse struct {
	*User
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Roles     []string  `json:"roles,omitempty"` // Distinct active roles across all conferences (populated for /me)
}
```

- [ ] **Step 2: Add roleStorage to user controller**

In `backend/internal/controller/user/user.go`, add the import and field:

Add import:
```go
conferenceuserrole "github.com/dcao/conferencespace/internal/storage/conference_user_role"
```

Add field to Controller struct:
```go
type Controller struct {
	userStorage         userStorage.StorageInterface
	submissionStorage   submissionStorage.StorageInterface
	conferenceStorage   conferenceStorage.StorageInterface
	roleStorage         conferenceuserrole.StorageInterface
	assignmentService   *assignment.Service
	scholarStorage      scholar.StorageInterface
	semanticScholarCtrl *semantic_scholar.Controller
}
```

Add initialization in `New`:
```go
func New(store *storage.Storage, assignmentService *assignment.Service, semanticScholarCtrl *semantic_scholar.Controller) *Controller {
	return &Controller{
		userStorage:         store.User,
		submissionStorage:   store.Submission,
		conferenceStorage:   store.Conference,
		roleStorage:         store.ConferenceUserRole,
		scholarStorage:      store.Scholar,
		assignmentService:   assignmentService,
		semanticScholarCtrl: semanticScholarCtrl,
	}
}
```

- [ ] **Step 3: Add sanitizeUserResponse helper**

Add this function anywhere in the file (e.g., before `checkCOIWithRelationshipDetector`):

```go
// sanitizeUserResponse strips internal fields from user responses for non-self lookups
func sanitizeUserResponse(u *dto.UserResponse) {
	if u.User != nil {
		u.User.SemanticScholarID = nil
		u.User.ProfileSyncStatus = nil
	}
}
```

- [ ] **Step 4: Add sanitization to List, Get, and Search**

**List** — after `users, total, err := c.userStorage.List(...)`:
```go
	userEmail, _ := utils.GetEmail(ginCtx)

	// ... existing code ...

	// Sanitize non-self user records
	for _, u := range users {
		if u.Email != userEmail {
			sanitizeUserResponse(u)
		}
	}
```

**Get** — after `user, err := c.userStorage.GetByEmail(ctx, email)`:
```go
	userEmail, _ := utils.GetEmail(ginCtx)
	if email != userEmail {
		sanitizeUserResponse(user)
	}
```

**Search** — after `users, total, err := c.userStorage.List(...)`:
```go
	userEmail, _ := utils.GetEmail(ginCtx)

	// Sanitize non-self user records
	for _, u := range users {
		if u.Email != userEmail {
			sanitizeUserResponse(u)
		}
	}
```

- [ ] **Step 5: Restrict GetAcademicProfileByEmail to self-only**

Replace the method:

```go
func (c *Controller) GetAcademicProfileByEmail(ginCtx *gin.Context) (*dto.AcademicProfileResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	email := ginCtx.Param("email")
	if email == "" {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, "email is required")
	}

	// Only allow self-access to academic profiles
	if email != userEmail {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you can only view your own academic profile")
	}

	user, err := c.userStorage.GetByEmail(ctx, email)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}

	return c.getAcademicProfileByUserID(ctx, user.ID)
}
```

- [ ] **Step 6: Verify compilation**

Run: `cd backend && go build ./...`
Expected: No output

- [ ] **Step 7: Commit**

```bash
git add backend/internal/dto/user.go backend/internal/controller/user/user.go
git commit -m "feat: add user directory scoping and restrict academic profile access"
```

---

### Task 7: Extend GetMe with Backend Roles (Issue #1 — backend)

**Files:**
- Modify: `backend/internal/storage/conference_user_role/conference_user_role.go` (add interface method + implementation)
- Modify: `backend/internal/controller/user/user.go:138-154` (GetMe)

- [ ] **Step 1: Add GetAllUserRoles to storage interface**

In `backend/internal/storage/conference_user_role/conference_user_role.go`, add to `StorageInterface`:

```go
type StorageInterface interface {
	AddRole(ctx context.Context, conferenceID int64, userEmail string, role string) error
	AddRoles(ctx context.Context, roles []model.RoleAssignment) error
	RemoveRole(ctx context.Context, conferenceID int64, userEmail string) error
	UpdateRoleStatus(ctx context.Context, conferenceID int64, userEmail string, status string) error
	GetUserRoles(ctx context.Context, conferenceID int64, userEmail string) ([]string, error)
	GetAllUserRoles(ctx context.Context, userEmail string) ([]string, error)
	HasRole(ctx context.Context, conferenceID int64, userEmail string, roles []string) (bool, error)
}
```

- [ ] **Step 2: Implement GetAllUserRoles**

Add the implementation before the `HasRole` method:

```go
// GetAllUserRoles retrieves all distinct active roles for a user across all conferences
func (s *Storage) GetAllUserRoles(ctx context.Context, userEmail string) ([]string, error) {
	query, args, err := s.qb.
		Select(fmt.Sprintf("DISTINCT %s", model.ColRole)).
		From(model.ConferenceUserRoleTableName).
		Where(sq.Eq{
			model.ColUserEmail: userEmail,
			model.ColStatus:    model.RoleStatusActive,
		}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query roles: %w", err)
	}
	defer rows.Close()

	var roles []string
	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}
		roles = append(roles, role)
	}

	return roles, nil
}
```

- [ ] **Step 3: Update GetMe to populate roles**

Replace the `GetMe` method:

```go
func (c *Controller) GetMe(ginCtx *gin.Context) (*dto.UserResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	user, err := c.userStorage.GetByEmail(ctx, userEmail)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "user not found")
	}

	// Populate user's distinct active roles across all conferences
	roles, err := c.roleStorage.GetAllUserRoles(ctx, userEmail)
	if err == nil {
		user.Roles = roles
	}

	// Author is always available as a base role (any user can submit papers)
	hasAuthor := false
	for _, r := range user.Roles {
		if r == "author" {
			hasAuthor = true
			break
		}
	}
	if !hasAuthor {
		user.Roles = append([]string{"author"}, user.Roles...)
	}

	return user, nil
}
```

- [ ] **Step 4: Verify compilation**

Run: `cd backend && go build ./...`
Expected: No output

- [ ] **Step 5: Commit**

```bash
git add backend/internal/storage/conference_user_role/conference_user_role.go backend/internal/controller/user/user.go
git commit -m "feat: extend GetMe to return backend-derived roles"
```

---

### Task 8: Fix Frontend Role Gating (Issue #1 — frontend)

**Files:**
- Modify: `frontend/lib/role-access.ts`
- Modify: `frontend/lib/api/user.ts`

- [ ] **Step 1: Add `roles` to API User interface**

In `frontend/lib/api/user.ts`, add the field:

```typescript
export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  domain: string[]
  semantic_scholar_id?: string
  profile_sync_status?: string
  roles?: string[]
}
```

- [ ] **Step 2: Remove BASE_PLATFORM_ROLES from role-access.ts**

Replace the entire file:

```typescript
import type { User, UserRole } from "./types"

export function getAccessibleRoles(user: User | null): UserRole[] {
  if (!user) {
    return []
  }

  // Roles are now derived from backend data via /users/me response
  // The backend always includes "author" as a base role
  return [...new Set<UserRole>([...(user.roles || [])])]
}

export function canAccessRole(user: User | null, role: UserRole): boolean {
  return getAccessibleRoles(user).includes(role)
}
```

- [ ] **Step 3: Verify frontend builds**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep -v "conference-template-sheet\|chatbot/__tests__" | head -20`
Expected: No new errors (pre-existing errors in conference-template-sheet and chatbot tests are unrelated)

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/role-access.ts frontend/lib/api/user.ts
git commit -m "feat: derive frontend roles from backend instead of hardcoding"
```

---

### Task 9: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Full backend build**

Run: `cd backend && go build ./...`
Expected: No output (clean compilation)

- [ ] **Step 2: Backend vet (check for pre-existing issues only)**

Run: `cd backend && go vet ./... 2>&1`
Expected: The only error should be a pre-existing mock issue in `decision_copilot_test.go` — this is NOT related to our changes.

- [ ] **Step 3: Run backend tests**

Run: `cd backend && make test 2>&1 | tail -20`
Expected: Tests pass (or fail only on pre-existing issues)

- [ ] **Step 4: Frontend type check**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: Same number of pre-existing errors as before our changes (check with `git stash && npx tsc --noEmit 2>&1 | grep -c "error TS"` first if needed)

- [ ] **Step 5: Verify all issues are addressed**

Cross-reference checklist:
1. Frontend BASE_PLATFORM_ROLES removed (Task 8) ✓
2. Submission reads protected by RequireSubmissionAccess (Task 2 Step 3) + List filtered (Task 4) ✓
3. Reviewer management protected by RequireChairOrCoChair (Task 2 Step 2) ✓
4. Reviewer dashboard protected by RequireSelfReviewerEmail (Task 2 Step 7) ✓
5. Rebuttal acknowledgment protected by RequireAssignmentOwner (Task 2 Step 5) ✓
6. Assignment admin protected by RequireChairOrCoChair (Task 2 Steps 4, 6) ✓
7. Discussion attachments protected by RequireThreadParticipant (Task 2 Step 8) ✓
8. Conference visibility enforced (Task 5) ✓
9. User directory scoped (Task 6) ✓
10. COI preflight protected by RequireCOICheckAuthorization (Task 2 Step 9) ✓
