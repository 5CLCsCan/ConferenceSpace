package reviewer

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

// setupPostRebuttalScenario creates a full scenario: conference, submission, reviewer assignment,
// review saved, rebuttal open, author rebuttal submitted. Returns all tokens and IDs.
func setupPostRebuttalScenario(t *testing.T, ctx *testutils.TestContext) (
	chairToken, authorToken, reviewerToken string,
	conferenceID, submissionID, assignmentID int64,
	reviewerEmail string,
) {
	t.Helper()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	reviewerToken, reviewer, _ := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	reviewerEmail = reviewer.Email

	// Create conference
	confClient := conferenceTestClient.NewClient(ctx)
	conf, err := confClient.CreateSuccess(&dto.Conference{
		Title:   "PostRebuttal Test Conference",
		Acronym: testutils.UniqueString("PRT"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}, chairToken)
	if err != nil {
		t.Fatalf("create conference: %v", err)
	}
	conferenceID = conf.ID

	// Add reviewer
	addResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer.ID, "domain": []string{"AI"}},
		},
	}, chairToken)
	if err != nil {
		t.Fatalf("add reviewer: %v", err)
	}
	var revData struct {
		Data struct {
			Success []dto.Reviewer `json:"success"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, addResp, &revData)
	reviewerRecordID := revData.Data.Success[0].ID

	// Accept reviewer invitation
	_, err = ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerRecordID), map[string]interface{}{
		"status": "accepted",
	}, chairToken)
	if err != nil {
		t.Fatalf("accept reviewer: %v", err)
	}

	// Create submission
	subClient := submissionTestClient.NewClient(ctx)
	sub, err := subClient.CreateSuccess(conferenceID, &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "PostRebuttal Test Paper",
		Abstract:     "Abstract for post-rebuttal test paper about artificial intelligence",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
		Information:  &dto.SubmissionInformation{Keywords: []string{"AI"}},
	}, authorToken)
	if err != nil {
		t.Fatalf("create submission: %v", err)
	}
	submissionID = sub.ID

	// Transition to reviewing
	transResp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
		dto.ConferenceTransitionStatusRequest{ConferenceID: conferenceID, NewStatus: model.ConferenceStatusReviewing},
		chairToken)
	if err != nil {
		t.Fatalf("transition conference: %v", err)
	}
	testutils.AssertStatusCode(t, transResp, http.StatusOK)

	// Confirm suggestions
	_, err = ctx.MakeRequest("POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID),
		map[string]interface{}{}, chairToken)
	if err != nil {
		t.Fatalf("confirm suggestions: %v", err)
	}

	// Get assignment ID
	papersResp, err := ctx.MakeRequest("GET",
		fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewer.Email, conferenceID),
		nil, reviewerToken)
	if err != nil {
		t.Fatalf("get reviewer papers: %v", err)
	}
	testutils.AssertStatusCode(t, papersResp, http.StatusOK)

	var papersData struct {
		Data struct {
			Papers []*dto.AssignedPaperResponse `json:"papers"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, papersResp, &papersData)
	if len(papersData.Data.Papers) == 0 {
		t.Fatalf("no assignments found for reviewer")
	}
	assignmentID = papersData.Data.Papers[0].AssignmentID

	// Open rebuttal
	openResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open", conferenceID), nil, chairToken)
	testutils.AssertStatusCode(t, openResp, http.StatusOK)

	// Author submits rebuttal
	rebuttalBody := map[string]interface{}{
		"general_response": "We thank the reviewers.",
		"per_reviewer": map[string]interface{}{
			fmt.Sprintf("%d", assignmentID): map[string]interface{}{
				"points": []map[string]interface{}{
					{"point_id": "p1", "author_response": "Addressed in section 3."},
				},
			},
		},
	}
	rebuttalResp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		rebuttalBody, authorToken)
	if err != nil {
		t.Fatalf("submit rebuttal: %v", err)
	}
	testutils.AssertStatusCode(t, rebuttalResp, http.StatusOK)

	return
}

func TestPostRebuttalScore_ReviewerCanUpdate(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, _, reviewerToken, conferenceID, _, assignmentID, _ := setupPostRebuttalScenario(t, ctx)

	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/post-rebuttal-score", conferenceID, assignmentID),
		map[string]interface{}{
			"score":          8,
			"recommendation": "accept",
			"comment":        "The rebuttal addressed my concerns.",
		}, reviewerToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)
}

func TestPostRebuttalScore_NonOwnerForbidden(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, _, _, conferenceID, _, assignmentID, _ := setupPostRebuttalScenario(t, ctx)

	// Register a different user
	otherToken, _, _ := ctx.RegisterUniqueUser("other", "password123", "Other", "User", []string{"AI"})

	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/post-rebuttal-score", conferenceID, assignmentID),
		map[string]interface{}{
			"score":          5,
			"recommendation": "reject",
			"comment":        "Unauthorized attempt.",
		}, otherToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusForbidden)
}
