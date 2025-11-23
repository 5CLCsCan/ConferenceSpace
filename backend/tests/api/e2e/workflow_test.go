package e2e

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestCompleteConferenceWorkflow tests the entire conference workflow from creation to review assignment
func TestCompleteConferenceWorkflow(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Initialize clients
	conferenceClient := conference.NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// ========================================
	// Step 1: Chair creates a new conference
	// ========================================
	t.Log("Step 1: Chair creates conference")

	chairToken, chair, err := ctx.RegisterUniqueUser(
		"chair",
		"password123",
		"Conference",
		"Chair",
		[]string{"Computer Science", "AI"},
	)
	if err != nil {
		t.Fatalf("Failed to create chair user: %v", err)
	}

	newConference := &dto.Conference{
		Title:       "International Conference on AI 2025",
		Acronym:     testutils.UniqueString("ICAI2025"),
		Description: "A premier conference on AI research",
		Chair:       chair.Email,
		Domain:      []string{"AI", "Machine Learning", "Deep Learning"},
	}

	confResp, err := conferenceClient.Create(newConference, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID
	t.Logf("✓ Conference created with ID: %d", conferenceID)

	// ========================================
	// Step 2: Authors register and save draft papers
	// ========================================
	t.Log("\nStep 2: Authors save draft papers")

	// Author 1
	author1Token, author1, err := ctx.RegisterUniqueUser(
		"author1",
		"password123",
		"Alice",
		"Smith",
		[]string{"Deep Learning", "Neural Networks"},
	)
	if err != nil {
		t.Fatalf("Failed to register author1: %v", err)
	}

	draftPaper1 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author1.Email,
		Title:        "Advances in Deep Learning Architecture",
		Abstract:     "This paper presents novel techniques in deep learning...",
		Domain:       []string{"Deep Learning", "Neural Networks"},
		Status:       dto.StatusDraft,
		Information: &dto.SubmissionInformation{
			CoAuthors: []string{"coauthor1@example.com"},
			Keywords:  []string{"deep learning", "CNN", "optimization"},
			PaperType: "research",
		},
	}

	resp1, err := submissionClient.Create(conferenceID, draftPaper1, author1Token)
	if err != nil {
		t.Fatalf("Failed to create draft paper 1: %v", err)
	}
	testutils.AssertStatusCode(t, resp1, http.StatusCreated)
	var sub1Data struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, resp1, &sub1Data)
	paper1ID := sub1Data.Data.ID
	t.Logf("✓ Author1 created draft paper (ID: %d): %s", paper1ID, draftPaper1.Title)

	// Author 2
	author2Token, author2, err := ctx.RegisterUniqueUser(
		"author2",
		"password123",
		"Bob",
		"Johnson",
		[]string{"Natural Language Processing"},
	)
	if err != nil {
		t.Fatalf("Failed to register author2: %v", err)
	}

	draftPaper2 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author2.Email,
		Title:        "Transformer Models for NLP",
		Abstract:     "We explore transformer architectures for natural language processing...",
		Domain:       []string{"NLP", "Transformers"},
		Status:       dto.StatusDraft,
		Information: &dto.SubmissionInformation{
			Keywords:  []string{"transformers", "NLP", "attention"},
			PaperType: "research",
		},
	}

	resp2, err := submissionClient.Create(conferenceID, draftPaper2, author2Token)
	if err != nil {
		t.Fatalf("Failed to create draft paper 2: %v", err)
	}
	testutils.AssertStatusCode(t, resp2, http.StatusCreated)
	var sub2Data struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, resp2, &sub2Data)
	paper2ID := sub2Data.Data.ID
	t.Logf("✓ Author2 created draft paper (ID: %d): %s", paper2ID, draftPaper2.Title)

	// ========================================
	// Step 3: Authors submit papers with declared COI
	// ========================================
	t.Log("\nStep 3: Authors submit papers with declared COI")

	// Author 1 submits with COI declaration
	submittedPaper1 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author1.Email,
		Title:        "Advances in Deep Learning Architecture",
		Abstract:     "This paper presents novel techniques in deep learning...",
		Domain:       []string{"Deep Learning", "Neural Networks"},
		Status:       dto.StatusPublished,
		Information: &dto.SubmissionInformation{
			CoAuthors: []string{"coauthor1@example.com"},
			Keywords:  []string{"deep learning", "CNN", "optimization"},
			PaperType: "research",
			DeclaredConflicts: []dto.ConflictDeclaration{
				{
					Email:  "conflicted.reviewer@example.com",
					Reason: "Former advisor",
				},
				{
					Email:  "coauthor1@example.com",
					Reason: "Co-author on this paper",
				},
			},
		},
	}

	updateResp1, err := submissionClient.Update(conferenceID, paper1ID, submittedPaper1, author1Token)
	if err != nil {
		t.Fatalf("Failed to update paper 1 to submitted: %v", err)
	}
	testutils.AssertStatusCode(t, updateResp1, http.StatusOK)
	t.Logf("✓ Author1 submitted paper with %d COI declarations", len(submittedPaper1.Information.DeclaredConflicts))

	// Author 2 submits with COI declaration
	submittedPaper2 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author2.Email,
		Title:        "Transformer Models for NLP",
		Abstract:     "We explore transformer architectures for natural language processing...",
		Domain:       []string{"NLP", "Transformers"},
		Status:       dto.StatusPublished,
		Information: &dto.SubmissionInformation{
			Keywords:  []string{"transformers", "NLP", "attention"},
			PaperType: "research",
			DeclaredConflicts: []dto.ConflictDeclaration{
				{
					Email:  "another.conflicted@example.com",
					Reason: "Same institution",
				},
			},
		},
	}

	updateResp2, err := submissionClient.Update(conferenceID, paper2ID, submittedPaper2, author2Token)
	if err != nil {
		t.Fatalf("Failed to update paper 2 to submitted: %v", err)
	}
	testutils.AssertStatusCode(t, updateResp2, http.StatusOK)
	t.Logf("✓ Author2 submitted paper with %d COI declarations", len(submittedPaper2.Information.DeclaredConflicts))

	// ========================================
	// Step 4: Chair invites reviewers
	// ========================================
	t.Log("\nStep 4: Chair invites reviewers")

	// Register potential reviewers
	_, reviewer1, err := ctx.RegisterUniqueUser(
		"reviewer1",
		"password123",
		"Carol",
		"Williams",
		[]string{"Deep Learning", "Computer Vision"},
	)
	if err != nil {
		t.Fatalf("Failed to register reviewer1: %v", err)
	}

	_, reviewer2, err := ctx.RegisterUniqueUser(
		"reviewer2",
		"password123",
		"David",
		"Brown",
		[]string{"NLP", "Machine Learning"},
	)
	if err != nil {
		t.Fatalf("Failed to register reviewer2: %v", err)
	}

	_, reviewer3, err := ctx.RegisterUniqueUser(
		"reviewer3",
		"password123",
		"Emma",
		"Davis",
		[]string{"AI", "Neural Networks"},
	)
	if err != nil {
		t.Fatalf("Failed to register reviewer3: %v", err)
	}

	// Chair invites reviewers via batch invite endpoint
	inviteReq := &dto.ReviewerBatchInviteRequest{
		ConferenceID: conferenceID,
		Reviewers: []dto.Reviewer{
			{
				UserID: reviewer1.ID,
				Domain: []string{"Deep Learning", "Computer Vision"},
			},
			{
				UserID: reviewer2.ID,
				Domain: []string{"NLP", "Machine Learning"},
			},
			{
				UserID: reviewer3.ID,
				Domain: []string{"AI", "Neural Networks"},
			},
		},
	}

	inviteResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID),
		inviteReq,
		chairToken,
	)
	if err != nil {
		t.Fatalf("Failed to invite reviewers: %v", err)
	}
	testutils.AssertStatusCode(t, inviteResp, http.StatusCreated)

	var inviteData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, inviteResp, &inviteData)
	t.Logf("✓ Invited %d reviewers successfully", len(inviteData.Data.Success))
	if len(inviteData.Data.Failed) > 0 {
		t.Logf("  Failed to invite %d reviewers", len(inviteData.Data.Failed))
	}

	// ========================================
	// Step 5: Reviewers accept invitations
	// ========================================
	t.Log("\nStep 5: Reviewers accept invitations")

	// Get reviewer IDs from the invite response
	reviewerIDs := make([]int64, 0)
	for _, r := range inviteData.Data.Success {
		reviewerIDs = append(reviewerIDs, r.ID)
	}

	// Reviewer 1 accepts
	reviewer1Token, err := ctx.LoginAndGetToken(reviewer1.Email, "password123")
	if err != nil {
		t.Fatalf("Failed to login as reviewer1: %v", err)
	}
	acceptReq1 := &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerIDs[0],
		Status:       "accepted",
	}
	acceptResp1, _ := ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerIDs[0]),
		acceptReq1,
		reviewer1Token,
	)
	testutils.AssertStatusCode(t, acceptResp1, http.StatusOK)
	t.Logf("✓ Reviewer1 (Carol Williams) accepted invitation")

	// Reviewer 2 accepts
	reviewer2Token, err := ctx.LoginAndGetToken(reviewer2.Email, "password123")
	if err != nil {
		t.Fatalf("Failed to login as reviewer2: %v", err)
	}
	acceptReq2 := &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerIDs[1],
		Status:       "accepted",
	}
	acceptResp2, _ := ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerIDs[1]),
		acceptReq2,
		reviewer2Token,
	)
	testutils.AssertStatusCode(t, acceptResp2, http.StatusOK)
	t.Logf("✓ Reviewer2 (David Brown) accepted invitation")

	// Reviewer 3 accepts
	reviewer3Token, err := ctx.LoginAndGetToken(reviewer3.Email, "password123")
	if err != nil {
		t.Fatalf("Failed to login as reviewer3: %v", err)
	}
	acceptReq3 := &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerIDs[2],
		Status:       "accepted",
	}
	acceptResp3, err := ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerIDs[2]),
		acceptReq3,
		reviewer3Token,
	)
	if err != nil {
		t.Fatalf("Failed to accept reviewer3 invitation: %v", err)
	}
	testutils.AssertStatusCode(t, acceptResp3, http.StatusOK)
	t.Logf("✓ Reviewer3 (Emma Davis) accepted invitation")

	// ========================================
	// Step 6: Chair triggers auto-assignment
	// ========================================
	t.Log("\nStep 6: Chair triggers auto-assignment of reviewers to papers")

	autoAssignReq := &dto.AutoAssignRequest{
		MinReviewersPerPaper: 2,
		MaxReviewersPerPaper: 3,
		MinScoreThreshold:    0.3,
		DryRun:               false,
	}

	assignResp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID),
		autoAssignReq,
		chairToken,
	)
	if err != nil {
		t.Fatalf("Failed to trigger auto-assignment: %v", err)
	}
	testutils.AssertStatusCode(t, assignResp, http.StatusOK)

	var assignData struct {
		Data *dto.AutoAssignResponse `json:"data"`
	}
	testutils.DecodeResponse(t, assignResp, &assignData)
	t.Logf("✓ Auto-assignment completed")
	t.Logf("  Total submissions: %d", assignData.Data.TotalSubmissions)
	t.Logf("  Total reviewers: %d", assignData.Data.TotalReviewers)
	t.Logf("  Total assignments: %d", assignData.Data.TotalAssignments)
	t.Logf("  Average score: %.2f", assignData.Data.AverageScore)

	if len(assignData.Data.UnassignedPapers) > 0 {
		t.Logf("  Warning: %d papers could not be assigned", len(assignData.Data.UnassignedPapers))
	}

	// Show reviewer load distribution
	t.Log("  Reviewer load distribution:")
	for reviewerID, count := range assignData.Data.ReviewerLoad {
		t.Logf("    Reviewer %d: %d papers", reviewerID, count)
	}

	// ========================================
	// Step 7: Verify the workflow results
	// ========================================
	t.Log("\nStep 7: Verify workflow results")

	// Verify conference exists and has correct data
	getConfResp, _ := conferenceClient.Get(conferenceID, chairToken)
	testutils.AssertStatusCode(t, getConfResp, http.StatusOK)
	t.Log("✓ Conference retrieved successfully")

	// Verify submissions exist
	listSubResp, _ := submissionClient.List(conferenceID, &dto.SubmissionListRequest{}, chairToken)
	testutils.AssertStatusCode(t, listSubResp, http.StatusOK)
	var listSubData struct {
		Data *dto.SubmissionListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, listSubResp, &listSubData)
	if listSubData.Data.Total < 2 {
		t.Errorf("Expected at least 2 submissions, got %d", listSubData.Data.Total)
	}
	t.Logf("✓ Found %d submissions in conference", listSubData.Data.Total)

	// Verify reviewers exist and are accepted
	listRevResp, _ := ctx.MakeRequest(
		"GET",
		fmt.Sprintf("/api/v1/conferences/%d/reviewers?status=accepted", conferenceID),
		nil,
		chairToken,
	)
	testutils.AssertStatusCode(t, listRevResp, http.StatusOK)
	var listRevData struct {
		Data *dto.ReviewerListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, listRevResp, &listRevData)
	if listRevData.Data.Total < 3 {
		t.Errorf("Expected at least 3 accepted reviewers, got %d", listRevData.Data.Total)
	}
	t.Logf("✓ Found %d accepted reviewers", listRevData.Data.Total)

	t.Log("\n✅ Complete conference workflow test passed!")
}
