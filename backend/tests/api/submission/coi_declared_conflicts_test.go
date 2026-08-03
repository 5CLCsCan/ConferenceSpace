package submission

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestCreateSubmissionWithDeclaredConflicts verifies that declared_conflicts
// are properly saved when creating a new submission
func TestCreateSubmissionWithDeclaredConflicts(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
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

	// Test case: Create submission with declared conflicts
	t.Run("create submission with declared_conflicts", func(t *testing.T) {
		// Prepare declared conflicts data (simulating what frontend should send)
		declaredConflicts := []dto.ConflictDeclaration{
			{
				Email:  "jane.doe@university.edu",
				Reason: "User declared conflict - Co-author on previous paper",
			},
			{
				Email:  "john.smith@university.edu",
				Reason: "User declared conflict - PhD advisor",
			},
			{
				Email:  "mit-ai-lab@mit.edu",
				Reason: "Organization conflict - Former workplace",
			},
			{
				Email:  "contact@stanford.edu",
				Reason: "Domain conflict - Close collaboration",
			},
		}

		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper with COI Declarations",
			Abstract:     "This paper has declared conflicts of interest",
			Domain:       []string{"AI", "Machine Learning"},
			Status:       dto.StatusDraft,
			Information: &dto.SubmissionInformation{
				Keywords:          []string{"neural networks", "deep learning"},
				CoAuthors:         []string{"coauthor@example.com"},
				DeclaredConflicts: declaredConflicts,
				PaperType:         "research",
				AdditionalNotes:   "Please note the declared conflicts",
			},
		}

		// Create the submission
		createResp, err := submissionClient.Create(conferenceID, submission, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		testutils.AssertStatusCode(t, createResp, http.StatusCreated)

		var createData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createData)

		// Verify the submission was created
		if createData.Data.ID == 0 {
			t.Fatal("Expected submission ID to be set")
		}

		// Retrieve the submission to verify declared_conflicts were saved
		getResp, err := submissionClient.Get(conferenceID, createData.Data.ID, authorToken)
		if err != nil {
			t.Fatalf("Failed to get submission: %v", err)
		}

		testutils.AssertStatusCode(t, getResp, http.StatusOK)

		var getData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, getResp, &getData)

		// Verify the declared_conflicts were saved correctly
		if getData.Data.Information == nil {
			t.Fatal("Expected Information field to be populated")
		}

		savedConflicts := getData.Data.Information.DeclaredConflicts
		if len(savedConflicts) != len(declaredConflicts) {
			t.Errorf("Expected %d declared conflicts, got %d", len(declaredConflicts), len(savedConflicts))
		}

		// Verify each conflict was saved with correct email and reason
		for i, expected := range declaredConflicts {
			if i >= len(savedConflicts) {
				break
			}
			if savedConflicts[i].Email != expected.Email {
				t.Errorf("Conflict %d: expected email %s, got %s", i, expected.Email, savedConflicts[i].Email)
			}
			if savedConflicts[i].Reason != expected.Reason {
				t.Errorf("Conflict %d: expected reason %s, got %s", i, expected.Reason, savedConflicts[i].Reason)
			}
		}

		t.Logf("✓ Successfully saved and retrieved %d declared conflicts", len(savedConflicts))
	})
}

// TestUpdateSubmissionWithDeclaredConflicts verifies that declared_conflicts
// can be updated in an existing submission
func TestUpdateSubmissionWithDeclaredConflicts(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
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

	t.Run("add declared_conflicts to existing submission", func(t *testing.T) {
		// Create initial submission WITHOUT declared conflicts
		initialSubmission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper Without Initial COI",
			Abstract:     "Initial submission without conflicts",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
			Information: &dto.SubmissionInformation{
				Keywords: []string{"testing"},
			},
		}

		createResp, err := submissionClient.Create(conferenceID, initialSubmission, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		var createData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createData)
		submissionID := createData.Data.ID

		// Update submission to ADD declared conflicts
		newConflicts := []dto.ConflictDeclaration{
			{
				Email:  "new.conflict@university.edu",
				Reason: "User declared conflict - Recently added",
			},
			{
				Email:  "another.conflict@university.edu",
				Reason: "User declared conflict - Collaborator",
			},
		}

		updateSubmission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper With Added COI",
			Abstract:     "Updated submission with conflicts",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
			Information: &dto.SubmissionInformation{
				Keywords:          []string{"testing", "coi"},
				DeclaredConflicts: newConflicts,
			},
		}

		updateResp, err := submissionClient.Update(conferenceID, submissionID, updateSubmission, authorToken)
		if err != nil {
			t.Fatalf("Failed to update submission: %v", err)
		}

		testutils.AssertStatusCode(t, updateResp, http.StatusOK)

		// Retrieve the submission to verify declared_conflicts were updated
		getResp, err := submissionClient.Get(conferenceID, submissionID, authorToken)
		if err != nil {
			t.Fatalf("Failed to get updated submission: %v", err)
		}

		var getData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, getResp, &getData)

		// Verify declared_conflicts were saved
		if getData.Data.Information == nil {
			t.Fatal("Expected Information field to be populated")
		}

		savedConflicts := getData.Data.Information.DeclaredConflicts
		if len(savedConflicts) != len(newConflicts) {
			t.Errorf("Expected %d declared conflicts after update, got %d", len(newConflicts), len(savedConflicts))
		}

		// Verify each conflict
		for i, expected := range newConflicts {
			if i >= len(savedConflicts) {
				break
			}
			if savedConflicts[i].Email != expected.Email {
				t.Errorf("Conflict %d: expected email %s, got %s", i, expected.Email, savedConflicts[i].Email)
			}
			if savedConflicts[i].Reason != expected.Reason {
				t.Errorf("Conflict %d: expected reason %s, got %s", i, expected.Reason, savedConflicts[i].Reason)
			}
		}

		t.Logf("✓ Successfully updated and retrieved %d declared conflicts", len(savedConflicts))
	})

	t.Run("replace existing declared_conflicts", func(t *testing.T) {
		replaceAuthorToken, replaceAuthor, err := ctx.RegisterUniqueUser("author2", "password123", "Author", "Two", []string{"AI"})
		if err != nil {
			t.Fatalf("Failed to register second author user: %v", err)
		}

		// Create submission with initial conflicts
		initialConflicts := []dto.ConflictDeclaration{
			{Email: "old1@example.com", Reason: "Old conflict 1"},
			{Email: "old2@example.com", Reason: "Old conflict 2"},
		}

		initialSubmission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       replaceAuthor.Email,
			Title:        "Paper With Initial COI",
			Abstract:     "Has some initial conflicts",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
			Information: &dto.SubmissionInformation{
				DeclaredConflicts: initialConflicts,
			},
		}

		createResp, err := submissionClient.Create(conferenceID, initialSubmission, replaceAuthorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}
		testutils.AssertStatusCode(t, createResp, http.StatusCreated)

		var createData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createData)
		if createData.Data == nil {
			t.Fatal("Expected submission data in create response")
		}
		submissionID := createData.Data.ID

		// Update with completely different conflicts
		replacementConflicts := []dto.ConflictDeclaration{
			{Email: "new1@example.com", Reason: "New conflict 1"},
			{Email: "new2@example.com", Reason: "New conflict 2"},
			{Email: "new3@example.com", Reason: "New conflict 3"},
		}

		updateSubmission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       replaceAuthor.Email,
			Title:        "Paper With Replaced COI",
			Abstract:     "Has replaced conflicts",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
			Information: &dto.SubmissionInformation{
				DeclaredConflicts: replacementConflicts,
			},
		}

		updateResp, err := submissionClient.Update(conferenceID, submissionID, updateSubmission, replaceAuthorToken)
		if err != nil {
			t.Fatalf("Failed to update submission: %v", err)
		}

		testutils.AssertStatusCode(t, updateResp, http.StatusOK)

		// Retrieve and verify
		getResp, err := submissionClient.Get(conferenceID, submissionID, replaceAuthorToken)
		if err != nil {
			t.Fatalf("Failed to get updated submission: %v", err)
		}

		var getData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, getResp, &getData)

		savedConflicts := getData.Data.Information.DeclaredConflicts
		if len(savedConflicts) != len(replacementConflicts) {
			t.Errorf("Expected %d conflicts after replacement, got %d", len(replacementConflicts), len(savedConflicts))
		}

		// Verify old conflicts are gone and new ones are present
		for _, expected := range replacementConflicts {
			found := false
			for _, saved := range savedConflicts {
				if saved.Email == expected.Email && saved.Reason == expected.Reason {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("Expected to find conflict with email %s, but it was not saved", expected.Email)
			}
		}

		// Verify old conflicts are NOT present
		for _, old := range initialConflicts {
			for _, saved := range savedConflicts {
				if saved.Email == old.Email {
					t.Errorf("Old conflict with email %s should have been replaced, but is still present", old.Email)
				}
			}
		}

		t.Logf("✓ Successfully replaced conflicts: %d old → %d new", len(initialConflicts), len(savedConflicts))
	})
}

// TestEmptyDeclaredConflicts verifies that submissions work correctly
// with empty or nil declared_conflicts arrays
func TestEmptyDeclaredConflicts(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
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

	t.Run("create submission with empty declared_conflicts array", func(t *testing.T) {
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper Without COI",
			Abstract:     "No conflicts declared",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
			Information: &dto.SubmissionInformation{
				Keywords:          []string{"testing"},
				DeclaredConflicts: []dto.ConflictDeclaration{}, // Explicitly empty
			},
		}

		createResp, err := submissionClient.Create(conferenceID, submission, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		testutils.AssertStatusCode(t, createResp, http.StatusCreated)

		var createData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createData)

		// Retrieve and verify
		getResp, err := submissionClient.Get(conferenceID, createData.Data.ID, authorToken)
		if err != nil {
			t.Fatalf("Failed to get submission: %v", err)
		}

		var getData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, getResp, &getData)

		// Empty array should be preserved (not nil)
		if getData.Data.Information != nil && getData.Data.Information.DeclaredConflicts == nil {
			t.Log("Note: Empty array was converted to nil (this is acceptable behavior)")
		}

		if getData.Data.Information != nil && len(getData.Data.Information.DeclaredConflicts) > 0 {
			t.Errorf("Expected 0 declared conflicts, got %d", len(getData.Data.Information.DeclaredConflicts))
		}

		t.Logf("✓ Empty declared_conflicts array handled correctly")
	})

	t.Run("create submission without Information field", func(t *testing.T) {
		minimalAuthorToken, minimalAuthor, err := ctx.RegisterUniqueUser("minimalauthor", "password123", "Minimal", "Author", []string{"AI"})
		if err != nil {
			t.Fatalf("Failed to register minimal author: %v", err)
		}

		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       minimalAuthor.Email,
			Title:        "Minimal Paper",
			Abstract:     "Minimal submission",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
			Information:  nil, // No information at all
		}

		createResp, err := submissionClient.Create(conferenceID, submission, minimalAuthorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		testutils.AssertStatusCode(t, createResp, http.StatusCreated)

		t.Logf("✓ Submission without Information field handled correctly")
	})
}

// TestDeclaredConflictsRoundTrip performs a full roundtrip test simulating
// the exact workflow the frontend should implement
func TestDeclaredConflictsRoundTrip(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
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

	t.Run("frontend workflow simulation", func(t *testing.T) {
		// Step 1: Frontend collects COI data from user in three separate arrays
		coiPeople := []string{"jane.doe@uni.edu", "john.smith@university.edu"}
		coiOrgs := []string{"mit-ai-lab@mit.edu", "deepmind@google.com"}
		coiDomains := []string{"contact@stanford.edu", "contact@cmu.edu"}

		t.Logf("Step 1: Frontend collected COI data:")
		t.Logf("  - People: %v", coiPeople)
		t.Logf("  - Orgs: %v", coiOrgs)
		t.Logf("  - Domains: %v", coiDomains)

		// Step 2: Frontend transforms data to backend format
		var declaredConflicts []dto.ConflictDeclaration
		for _, person := range coiPeople {
			declaredConflicts = append(declaredConflicts, dto.ConflictDeclaration{
				Email:  person,
				Reason: "User declared conflict",
			})
		}
		for _, org := range coiOrgs {
			declaredConflicts = append(declaredConflicts, dto.ConflictDeclaration{
				Email:  org,
				Reason: "Organization conflict",
			})
		}
		for _, domain := range coiDomains {
			declaredConflicts = append(declaredConflicts, dto.ConflictDeclaration{
				Email:  domain,
				Reason: "Domain conflict",
			})
		}

		t.Logf("Step 2: Transformed to %d declared_conflicts entries", len(declaredConflicts))

		// Step 3: Frontend sends submission with declared_conflicts
		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Paper with Complete COI Data",
			Abstract:     "Testing full frontend workflow",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
			Information: &dto.SubmissionInformation{
				Keywords:          []string{"testing", "coi", "workflow"},
				CoAuthors:         []string{"coauthor@example.com"},
				DeclaredConflicts: declaredConflicts,
				PaperType:         "research",
			},
		}

		createResp, err := submissionClient.Create(conferenceID, submission, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		testutils.AssertStatusCode(t, createResp, http.StatusCreated)

		var createData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createData)
		submissionID := createData.Data.ID

		t.Logf("Step 3: Submission created with ID %d", submissionID)

		// Step 4: Frontend retrieves submission (e.g., for editing)
		getResp, err := submissionClient.Get(conferenceID, submissionID, authorToken)
		if err != nil {
			t.Fatalf("Failed to get submission: %v", err)
		}

		var getData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, getResp, &getData)

		t.Logf("Step 4: Retrieved submission for editing")

		// Step 5: Frontend transforms declared_conflicts back to three arrays
		var retrievedPeople []string
		var retrievedOrgs []string
		var retrievedDomains []string

		if getData.Data.Information != nil {
			for _, conflict := range getData.Data.Information.DeclaredConflicts {
				switch conflict.Reason {
				case "User declared conflict":
					retrievedPeople = append(retrievedPeople, conflict.Email)
				case "Organization conflict":
					retrievedOrgs = append(retrievedOrgs, conflict.Email)
				case "Domain conflict":
					retrievedDomains = append(retrievedDomains, conflict.Email)
				}
			}
		}

		t.Logf("Step 5: Transformed back to frontend format:")
		t.Logf("  - People: %v", retrievedPeople)
		t.Logf("  - Orgs: %v", retrievedOrgs)
		t.Logf("  - Domains: %v", retrievedDomains)

		// Step 6: Verify data integrity
		if len(retrievedPeople) != len(coiPeople) {
			t.Errorf("Expected %d people, got %d", len(coiPeople), len(retrievedPeople))
		}
		if len(retrievedOrgs) != len(coiOrgs) {
			t.Errorf("Expected %d orgs, got %d", len(coiOrgs), len(retrievedOrgs))
		}
		if len(retrievedDomains) != len(coiDomains) {
			t.Errorf("Expected %d domains, got %d", len(coiDomains), len(retrievedDomains))
		}

		// Verify actual values
		for i, expected := range coiPeople {
			if i < len(retrievedPeople) && retrievedPeople[i] != expected {
				t.Errorf("People[%d]: expected %s, got %s", i, expected, retrievedPeople[i])
			}
		}
		for i, expected := range coiOrgs {
			if i < len(retrievedOrgs) && retrievedOrgs[i] != expected {
				t.Errorf("Orgs[%d]: expected %s, got %s", i, expected, retrievedOrgs[i])
			}
		}
		for i, expected := range coiDomains {
			if i < len(retrievedDomains) && retrievedDomains[i] != expected {
				t.Errorf("Domains[%d]: expected %s, got %s", i, expected, retrievedDomains[i])
			}
		}

		t.Logf("✓ Complete roundtrip successful - all COI data preserved!")
	})
}

// TestDeclareConflicts_InvalidEmails verifies that a COI declaration containing
// malformed email addresses is rejected with 400.
func TestDeclareConflicts_InvalidEmails(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	conf := &dto.Conference{
		Title:   "COI Invalid Email Test",
		Acronym: testutils.UniqueString("CIET"),
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

	// Create submission including malformed emails in DeclaredConflicts.
	// declared_conflicts lives inside submission.information — mirroring the pattern
	// in the existing TestCreateSubmissionWithDeclaredConflicts test.
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "COI Test Paper",
		Abstract:     "Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
		Information: &dto.SubmissionInformation{
			DeclaredConflicts: []dto.ConflictDeclaration{
				{Email: "not-an-email", Reason: "conflict"},
				{Email: "also bad@@@@", Reason: "conflict"},
			},
		},
	}
	resp, err := submissionClient.Create(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	// If the backend validates email format in DeclaredConflicts, it returns 400.
	// A 201 here documents that email validation is missing and should be added.
	if resp.StatusCode != http.StatusBadRequest {
		t.Logf("NOTE: Backend accepted invalid emails in declared_conflicts (status %d). "+
			"Email format validation is missing.", resp.StatusCode)
		t.Fatalf("Expected 400 for invalid emails, got %d", resp.StatusCode)
	}
}

