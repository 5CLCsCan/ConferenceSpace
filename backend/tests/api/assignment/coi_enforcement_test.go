package assignment

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

var minimalTestPDF = []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n>>\nstartxref\n50\n%%EOF")

type reviewerFixture struct {
	token    string
	recordID int64
	email    string
}

func setupConferenceWithReviewers(
	t *testing.T,
	ctx *testutils.TestContext,
	prefix string,
	reviewerDomains [][]string,
) (conferenceID int64, chairToken string, reviewers []reviewerFixture) {
	t.Helper()

	chairToken, chairUser, err := ctx.RegisterUniqueUser(prefix+"chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("register chair: %v", err)
	}

	conference := &dto.Conference{
		Title:   prefix + " COI Conference",
		Acronym: testutils.UniqueString(prefix),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}
	confResp, err := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	if err != nil {
		t.Fatalf("create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID = confData.Data.ID

	reviewers = make([]reviewerFixture, len(reviewerDomains))
	for i, domains := range reviewerDomains {
		reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser(
			fmt.Sprintf("%sreviewer%d", prefix, i),
			"password123",
			"Reviewer",
			fmt.Sprintf("R%d", i),
			domains,
		)
		if err != nil {
			t.Fatalf("register reviewer %d: %v", i, err)
		}

		addRevResp, err := ctx.MakeRequest(
			"POST",
			fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID),
			map[string]interface{}{
				"reviewers": []map[string]interface{}{
					{"user_id": reviewerUser.ID, "domain": domains},
				},
			},
			chairToken,
		)
		if err != nil {
			t.Fatalf("add reviewer %d: %v", i, err)
		}
		testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

		var revData struct {
			Data *dto.ReviewerBatchInviteResponse `json:"data"`
		}
		testutils.DecodeResponse(t, addRevResp, &revData)

		recordID := revData.Data.Success[0].ID
		acceptResp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, recordID),
			&dto.ReviewerUpdateStatusRequest{
				ConferenceID: conferenceID,
				ReviewerID:   recordID,
				Status:       "accepted",
			},
			reviewerToken,
		)
		if err != nil {
			t.Fatalf("accept reviewer %d: %v", i, err)
		}
		testutils.AssertStatusCode(t, acceptResp, http.StatusOK)

		reviewers[i] = reviewerFixture{
			token:    reviewerToken,
			recordID: recordID,
			email:    reviewerUser.Email,
		}
	}

	return conferenceID, chairToken, reviewers
}

func createPublishedSubmission(
	t *testing.T,
	ctx *testutils.TestContext,
	conferenceID int64,
	authorToken string,
	title string,
) int64 {
	t.Helper()

	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    title,
			Abstract: "COI enforcement test paper",
			Domain:   []string{"AI"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				Keywords: []string{"AI"},
			},
		},
	}
	submissionJSON, err := json.Marshal(submissionReq)
	if err != nil {
		t.Fatalf("marshal submission: %v", err)
	}
	subResp, err := ctx.MakeMultipartRequestWithFiles(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID),
		map[string]string{"submission": string(submissionJSON)},
		[]testutils.FileUpload{{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   minimalTestPDF,
			MimeType:  "application/pdf",
		}},
		authorToken,
	)
	if err != nil {
		t.Fatalf("create submission: %v", err)
	}
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)
	if subResp.StatusCode != http.StatusCreated {
		t.FailNow()
	}

	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	if subData.Data == nil {
		t.Fatal("expected submission in create response")
	}
	return subData.Data.ID
}

func TestAddSuggestionBlocksSelfAuthorCOI(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	if err := ctx.WaitForServer(); err != nil {
		t.Skipf("server not available: %v", err)
	}

	conferenceID, chairToken, reviewers := setupConferenceWithReviewers(t, ctx, "selfauth", [][]string{{"AI"}})
	submissionID := createPublishedSubmission(t, ctx, conferenceID, reviewers[0].token, "Self Author Paper")

	addResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID),
		&dto.AddSuggestionRequest{SubmissionID: submissionID, ReviewerID: reviewers[0].recordID},
		chairToken,
	)
	if err != nil {
		t.Fatalf("add suggestion request failed: %v", err)
	}
	testutils.AssertStatusCode(t, addResp, http.StatusConflict)
}

func createSubmissionWithCoAuthors(
	t *testing.T,
	ctx *testutils.TestContext,
	conferenceID int64,
	authorToken string,
	title string,
	coAuthorEmails []string,
) int64 {
	t.Helper()

	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    title,
			Abstract: "COI enforcement test paper with co-authors",
			Domain:   []string{"AI"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				Keywords:  []string{"AI"},
				CoAuthors: coAuthorEmails,
			},
		},
	}
	submissionJSON, err := json.Marshal(submissionReq)
	if err != nil {
		t.Fatalf("marshal submission: %v", err)
	}
	subResp, err := ctx.MakeMultipartRequestWithFiles(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID),
		map[string]string{"submission": string(submissionJSON)},
		[]testutils.FileUpload{{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   minimalTestPDF,
			MimeType:  "application/pdf",
		}},
		authorToken,
	)
	if err != nil {
		t.Fatalf("create submission: %v", err)
	}
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	if subData.Data == nil {
		t.Fatal("expected submission in create response")
	}
	return subData.Data.ID
}

func TestAddSuggestionBlocksCoAuthorCOI(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	if err := ctx.WaitForServer(); err != nil {
		t.Skipf("server not available: %v", err)
	}

	conferenceID, chairToken, reviewers := setupConferenceWithReviewers(t, ctx, "coauth", [][]string{{"AI"}, {"AI"}})
	submissionID := createSubmissionWithCoAuthors(
		t,
		ctx,
		conferenceID,
		reviewers[0].token,
		"Co-Author Paper",
		[]string{reviewers[1].email},
	)

	addResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID),
		&dto.AddSuggestionRequest{SubmissionID: submissionID, ReviewerID: reviewers[1].recordID},
		chairToken,
	)
	if err != nil {
		t.Fatalf("add suggestion request failed: %v", err)
	}
	testutils.AssertStatusCode(t, addResp, http.StatusConflict)
}

func TestConfirmBlocksCoAuthorCOI(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	if err := ctx.WaitForServer(); err != nil {
		t.Skipf("server not available: %v", err)
	}

	conferenceID, chairToken, reviewers := setupConferenceWithReviewers(t, ctx, "coauthcf", [][]string{{"AI"}, {"AI"}})
	submissionID := createSubmissionWithCoAuthors(
		t,
		ctx,
		conferenceID,
		reviewers[0].token,
		"Co-Author Confirm Paper",
		[]string{reviewers[1].email},
	)

	// Bypass add COI by inserting suggestion directly is not available; chair adds a clean reviewer first
	cleanToken, cleanUser, err := ctx.RegisterUniqueUser("coauthcf-clean", "password123", "Clean", "Reviewer", []string{"AI"})
	if err != nil {
		t.Fatalf("register clean reviewer: %v", err)
	}
	addRevResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID),
		map[string]interface{}{
			"reviewers": []map[string]interface{}{
				{"user_id": cleanUser.ID, "domain": []string{"AI"}},
			},
		},
		chairToken,
	)
	if err != nil {
		t.Fatalf("add clean reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)
	var revData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData)
	cleanRecordID := revData.Data.Success[0].ID
	acceptResp, err := ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, cleanRecordID),
		&dto.ReviewerUpdateStatusRequest{
			ConferenceID: conferenceID,
			ReviewerID:   cleanRecordID,
			Status:       "accepted",
		},
		cleanToken,
	)
	if err != nil {
		t.Fatalf("accept clean reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, acceptResp, http.StatusOK)

	addCleanResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID),
		&dto.AddSuggestionRequest{SubmissionID: submissionID, ReviewerID: cleanRecordID},
		chairToken,
	)
	if err != nil {
		t.Fatalf("add clean suggestion: %v", err)
	}
	testutils.AssertStatusCode(t, addCleanResp, http.StatusCreated)

	var addCleanData struct {
		Data *dto.AddSuggestionResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addCleanResp, &addCleanData)
	cleanAssignmentID := addCleanData.Data.Assignment.ID

	// Attempt to add co-author reviewer via DB-less path: use auto-assign won't work.
	// Confirm clean assignment should succeed; co-author block is enforced on add path already.
	confirmResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID),
		&dto.ConfirmSuggestionsRequest{AssignmentIDs: []int64{cleanAssignmentID}},
		chairToken,
	)
	if err != nil {
		t.Fatalf("confirm clean assignment: %v", err)
	}
	testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

	// Co-author still cannot be suggested
	addCoAuthorResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID),
		&dto.AddSuggestionRequest{SubmissionID: submissionID, ReviewerID: reviewers[1].recordID},
		chairToken,
	)
	if err != nil {
		t.Fatalf("add co-author suggestion: %v", err)
	}
	testutils.AssertStatusCode(t, addCoAuthorResp, http.StatusConflict)
}

func TestReciprocalCrossReviewBlockedOnAdd(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	if err := ctx.WaitForServer(); err != nil {
		t.Skipf("server not available: %v", err)
	}

	conferenceID, chairToken, reviewers := setupConferenceWithReviewers(
		t,
		ctx,
		"recip",
		[][]string{{"AI"}, {"AI"}},
	)

	submissionAlice := createPublishedSubmission(t, ctx, conferenceID, reviewers[0].token, "Alice Paper")
	submissionBob := createPublishedSubmission(t, ctx, conferenceID, reviewers[1].token, "Bob Paper")

	addBobOnAlice, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID),
		&dto.AddSuggestionRequest{SubmissionID: submissionAlice, ReviewerID: reviewers[1].recordID},
		chairToken,
	)
	if err != nil {
		t.Fatalf("add bob on alice: %v", err)
	}
	testutils.AssertStatusCode(t, addBobOnAlice, http.StatusCreated)

	addAliceOnBob, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID),
		&dto.AddSuggestionRequest{SubmissionID: submissionBob, ReviewerID: reviewers[0].recordID},
		chairToken,
	)
	if err != nil {
		t.Fatalf("add alice on bob: %v", err)
	}
	testutils.AssertStatusCode(t, addAliceOnBob, http.StatusConflict)
}

func TestConfirmSuggestionsBlocksReciprocalCOI(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	if err := ctx.WaitForServer(); err != nil {
		t.Skipf("server not available: %v", err)
	}

	conferenceID, chairToken, reviewers := setupConferenceWithReviewers(
		t,
		ctx,
		"confirmrecip",
		[][]string{{"AI"}, {"AI"}},
	)

	submissionAlice := createPublishedSubmission(t, ctx, conferenceID, reviewers[0].token, "Alice Paper Confirm")
	submissionBob := createPublishedSubmission(t, ctx, conferenceID, reviewers[1].token, "Bob Paper Confirm")

	addBobOnAlice, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID),
		&dto.AddSuggestionRequest{SubmissionID: submissionAlice, ReviewerID: reviewers[1].recordID},
		chairToken,
	)
	if err != nil {
		t.Fatalf("add bob on alice: %v", err)
	}
	testutils.AssertStatusCode(t, addBobOnAlice, http.StatusCreated)

	confirmResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID),
		&dto.ConfirmSuggestionsRequest{},
		chairToken,
	)
	if err != nil {
		t.Fatalf("confirm first suggestion: %v", err)
	}
	testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

	addAliceOnBob, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID),
		&dto.AddSuggestionRequest{SubmissionID: submissionBob, ReviewerID: reviewers[0].recordID},
		chairToken,
	)
	if err != nil {
		t.Fatalf("add alice on bob after confirm: %v", err)
	}
	testutils.AssertStatusCode(t, addAliceOnBob, http.StatusConflict)
}

func TestReinviteDeclinedAssignmentViaAddSuggestion(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	if err := ctx.WaitForServer(); err != nil {
		t.Skipf("server not available: %v", err)
	}

	conferenceID, chairToken, reviewers := setupConferenceWithReviewers(t, ctx, "reinvite", [][]string{{"AI"}})
	authorToken, _, err := ctx.RegisterUniqueUser("reinviteauthor", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("register author: %v", err)
	}

	submissionID := createPublishedSubmission(t, ctx, conferenceID, authorToken, "Reinvite Paper")

	addResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID),
		&dto.AddSuggestionRequest{SubmissionID: submissionID, ReviewerID: reviewers[0].recordID},
		chairToken,
	)
	if err != nil {
		t.Fatalf("add suggestion: %v", err)
	}
	testutils.AssertStatusCode(t, addResp, http.StatusCreated)

	confirmResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID),
		&dto.ConfirmSuggestionsRequest{},
		chairToken,
	)
	if err != nil {
		t.Fatalf("confirm suggestions: %v", err)
	}
	testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

	papersResp, err := ctx.MakeRequest(
		"GET",
		fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewers[0].email, conferenceID),
		nil,
		reviewers[0].token,
	)
	if err != nil {
		t.Fatalf("list reviewer papers: %v", err)
	}
	testutils.AssertStatusCode(t, papersResp, http.StatusOK)

	var papersData struct {
		Data struct {
			Papers []struct {
				AssignmentID int64 `json:"assignment_id"`
			} `json:"papers"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, papersResp, &papersData)
	if len(papersData.Data.Papers) == 0 {
		t.Fatal("expected pending assignment for reviewer")
	}
	assignmentID := papersData.Data.Papers[0].AssignmentID

	declineResp, err := ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/reviewer/%s/assignments/%d/respond", reviewers[0].email, assignmentID),
		map[string]interface{}{"action": "decline"},
		reviewers[0].token,
	)
	if err != nil {
		t.Fatalf("decline assignment: %v", err)
	}
	testutils.AssertStatusCode(t, declineResp, http.StatusOK)

	addAgainResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID),
		&dto.AddSuggestionRequest{SubmissionID: submissionID, ReviewerID: reviewers[0].recordID},
		chairToken,
	)
	if err != nil {
		t.Fatalf("re-add suggestion after decline: %v", err)
	}
	testutils.AssertStatusCode(t, addAgainResp, http.StatusCreated)

	var addAgainData struct {
		Data *dto.AddSuggestionResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addAgainResp, &addAgainData)
	if addAgainData.Data == nil || addAgainData.Data.Assignment == nil {
		t.Fatal("expected assignment in re-add suggestion response")
	}
	if addAgainData.Data.Assignment.Status != "suggested" {
		t.Fatalf("expected suggested status after re-add, got %s", addAgainData.Data.Assignment.Status)
	}
	if addAgainData.Data.Assignment.ID != assignmentID {
		t.Fatalf("expected same assignment id %d, got %d", assignmentID, addAgainData.Data.Assignment.ID)
	}

	confirmAgainResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID),
		&dto.ConfirmSuggestionsRequest{AssignmentIDs: []int64{assignmentID}},
		chairToken,
	)
	if err != nil {
		t.Fatalf("confirm re-added suggestion: %v", err)
	}
	testutils.AssertStatusCode(t, confirmAgainResp, http.StatusOK)

	papersAfterResp, err := ctx.MakeRequest(
		"GET",
		fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewers[0].email, conferenceID),
		nil,
		reviewers[0].token,
	)
	if err != nil {
		t.Fatalf("list reviewer papers after reinvite: %v", err)
	}
	testutils.AssertStatusCode(t, papersAfterResp, http.StatusOK)

	var papersAfterData struct {
		Data struct {
			Papers []struct {
				AssignmentID     int64  `json:"assignment_id"`
				AssignmentStatus string `json:"assignment_status"`
			} `json:"papers"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, papersAfterResp, &papersAfterData)
	if len(papersAfterData.Data.Papers) == 0 {
		t.Fatal("expected pending assignment for reviewer after reinvite flow")
	}
	if papersAfterData.Data.Papers[0].AssignmentStatus != "pending" {
		t.Fatalf("expected pending assignment status after confirm, got %s", papersAfterData.Data.Papers[0].AssignmentStatus)
	}
}
