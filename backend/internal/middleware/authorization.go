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

		// 2. Chair/co-chair/PC of the conference
		if utils.IsUserChairCoChairOrPC(ctx, roleStorage, conferenceID, userEmail) {
			c.Next()
			return
		}

		// 3. Assigned reviewer for this submission
		userID, _ := utils.GetUserID(c)
		rev, err := reviewerStorage.GetByUserAndConference(ctx, userID, conferenceID)
		if err == nil {
			assignments, _, listErr := assignmentStorage.List(ctx, conferenceID, &assignment.ListParams{
				SubmissionID: submissionID,
				ReviewerID:   rev.ID,
				Limit:        1,
			})
			if listErr == nil && len(assignments) > 0 && canReviewerAccessSubmission(assignments[0].Status) {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "you do not have access to this submission"})
	}
}

func canReviewerAccessSubmission(status string) bool {
	return status == "pending" || status == "accepted" || status == "completed"
}

// RequireThreadParticipant checks that the authenticated user is a participant
// (reviewer, author, chair, co-chair, or PC) of the discussion thread identified by :thread_id.
func RequireThreadParticipant(discussionStorage discussion.StorageInterface, roleStorage conferenceuserrole.StorageInterface) gin.HandlerFunc {
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

		// Chair, co-chair, or PC of the conference
		if utils.IsUserChairCoChairOrPC(ctx, roleStorage, thread.ConferenceID, userEmail) {
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
	ChairRoles     = []string{model.RoleChair, model.RoleCoChair}
	ChairOrPCRoles = []string{model.RoleChair, model.RoleCoChair, model.RolePC}
)
