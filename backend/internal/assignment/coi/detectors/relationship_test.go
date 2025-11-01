package detectors

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/clients/neo4j"
)

// TestRelationshipDetector_Constants tests the hardcoded constants
func TestRelationshipDetector_Constants(t *testing.T) {
	if DefaultCOIPathThreshold != 3 {
		t.Errorf("Expected DefaultCOIPathThreshold to be 3, got %d", DefaultCOIPathThreshold)
	}

	if DefaultCOIWindowYears != 4 {
		t.Errorf("Expected DefaultCOIWindowYears to be 4, got %d", DefaultCOIWindowYears)
	}
}

// TestRelationshipDetector_Name tests the detector name
func TestRelationshipDetector_Name(t *testing.T) {
	uri := getTestNeo4jURI()
	if uri == "" {
		t.Skip("Skipping: NEO4J_URI not set")
	}

	client, err := neo4j.NewClient(neo4j.Config{
		URI:      uri,
		Username: getTestNeo4jUsername(),
		Password: getTestNeo4jPassword(),
	})
	if err != nil {
		t.Skipf("Skipping: Cannot connect to Neo4j: %v", err)
	}
	defer client.Close(context.Background())

	detector := NewRelationshipDetector(client, 4)

	if detector.Name() != "relationship" {
		t.Errorf("Expected detector name 'relationship', got '%s'", detector.Name())
	}
}

// TestRelationshipDetector_NewDetector tests detector creation
func TestRelationshipDetector_NewDetector(t *testing.T) {
	// This test requires Neo4j to be running
	// Skip if NEO4J_URI is not set
	uri := getTestNeo4jURI()
	if uri == "" {
		t.Skip("Skipping: NEO4J_URI not set")
	}

	client, err := neo4j.NewClient(neo4j.Config{
		URI:      uri,
		Username: getTestNeo4jUsername(),
		Password: getTestNeo4jPassword(),
	})
	if err != nil {
		t.Skipf("Skipping: Cannot connect to Neo4j: %v", err)
	}
	defer client.Close(context.Background())

	tests := []struct {
		name        string
		windowYears int
		expected    int
	}{
		{
			name:        "Valid window years",
			windowYears: 5,
			expected:    5,
		},
		{
			name:        "Zero window years (should use default)",
			windowYears: 0,
			expected:    DefaultCOIWindowYears,
		},
		{
			name:        "Negative window years (should use default)",
			windowYears: -1,
			expected:    DefaultCOIWindowYears,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			detector := NewRelationshipDetector(client, tt.windowYears).(*RelationshipDetector)

			if detector.GetWindowYears() != tt.expected {
				t.Errorf("Expected window years %d, got %d", tt.expected, detector.GetWindowYears())
			}
		})
	}
}

// TestRelationshipDetector_SetWindowYears tests window years configuration
func TestRelationshipDetector_SetWindowYears(t *testing.T) {
	uri := getTestNeo4jURI()
	if uri == "" {
		t.Skip("Skipping: NEO4J_URI not set")
	}

	client, err := neo4j.NewClient(neo4j.Config{
		URI:      uri,
		Username: getTestNeo4jUsername(),
		Password: getTestNeo4jPassword(),
	})
	if err != nil {
		t.Skipf("Skipping: Cannot connect to Neo4j: %v", err)
	}
	defer client.Close(context.Background())

	detector := NewRelationshipDetector(client, 4).(*RelationshipDetector)

	tests := []struct {
		name     string
		setValue int
		expected int
	}{
		{
			name:     "Set to 3",
			setValue: 3,
			expected: 3,
		},
		{
			name:     "Set to 5",
			setValue: 5,
			expected: 5,
		},
		{
			name:     "Set to 0 (should not change)",
			setValue: 0,
			expected: 5, // keeps previous value
		},
		{
			name:     "Set to negative (should not change)",
			setValue: -1,
			expected: 5, // keeps previous value
		},
		{
			name:     "Set to 10",
			setValue: 10,
			expected: 10,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			detector.SetWindowYears(tt.setValue)

			if detector.GetWindowYears() != tt.expected {
				t.Errorf("Expected window years %d, got %d", tt.expected, detector.GetWindowYears())
			}
		})
	}
}

// TestRelationshipDetector_DetectorName tests the detector name
func TestRelationshipDetector_DetectorName(t *testing.T) {
	uri := getTestNeo4jURI()
	if uri == "" {
		t.Skip("Skipping: NEO4J_URI not set")
	}

	client, err := neo4j.NewClient(neo4j.Config{
		URI:      uri,
		Username: getTestNeo4jUsername(),
		Password: getTestNeo4jPassword(),
	})
	if err != nil {
		t.Skipf("Skipping: Cannot connect to Neo4j: %v", err)
	}
	defer client.Close(context.Background())

	detector := NewRelationshipDetector(client, 4)

	if detector.Name() != "relationship" {
		t.Errorf("Expected detector name 'relationship', got '%s'", detector.Name())
	}
}

// TestRelationshipDetector_DetectConflicts tests the full COI detection
func TestRelationshipDetector_DetectConflicts(t *testing.T) {
	uri := getTestNeo4jURI()
	if uri == "" {
		t.Skip("Skipping: NEO4J_URI not set")
	}

	client, err := neo4j.NewClient(neo4j.Config{
		URI:      uri,
		Username: getTestNeo4jUsername(),
		Password: getTestNeo4jPassword(),
	})
	if err != nil {
		t.Skipf("Skipping: Cannot connect to Neo4j: %v", err)
	}
	defer client.Close(context.Background())

	ctx := context.Background()
	authorSvc := neo4j.NewAuthorService(client)

	// Clear test data
	clearTestData(t, client)

	// Create test data
	currentYear := time.Now().Year()

	// Create authors
	authors := []string{
		"alice@test.com",
		"bob@test.com",
		"charlie@test.com",
		"david@test.com",
		"eve@test.com",
	}

	for _, email := range authors {
		authorSvc.CreateAuthor(ctx, neo4j.Author{Email: email, Name: email})
	}

	// Create collaborations
	// alice <-> bob (recent: current year)
	authorSvc.CreateCoauthorship(ctx, "alice@test.com", "bob@test.com", neo4j.CoauthorRelationship{
		EstablishedDate: currentYear,
		PaperLink:       "test-paper-1",
	})

	// bob <-> charlie (recent: current year - 1)
	authorSvc.CreateCoauthorship(ctx, "bob@test.com", "charlie@test.com", neo4j.CoauthorRelationship{
		EstablishedDate: currentYear - 1,
		PaperLink:       "test-paper-2",
	})

	// charlie <-> david (old: 6 years ago)
	authorSvc.CreateCoauthorship(ctx, "charlie@test.com", "david@test.com", neo4j.CoauthorRelationship{
		EstablishedDate: currentYear - 6,
		PaperLink:       "test-paper-3",
	})

	// alice <-> eve (no relationship)

	// Create detector with 4-year window
	detector := NewRelationshipDetector(client, 4)

	// Create test submissions and reviewers
	submissions := []commons.Submission{
		{
			ID:          1,
			AuthorEmail: "alice@test.com",
			CoAuthors:   []string{},
		},
		{
			ID:          2,
			AuthorEmail: "charlie@test.com",
			CoAuthors:   []string{},
		},
	}

	reviewers := []commons.Reviewer{
		{ID: 101, UserEmail: "bob@test.com"},
		{ID: 102, UserEmail: "david@test.com"},
		{ID: 103, UserEmail: "eve@test.com"},
	}

	// Run detection
	conflicts, err := detector.DetectConflicts(ctx, submissions, reviewers)
	if err != nil {
		t.Fatalf("DetectConflicts failed: %v", err)
	}

	// Test expectations
	tests := []struct {
		submissionID   int64
		reviewerID     int64
		shouldConflict bool
		reason         string
	}{
		{1, 101, true, "alice-bob: direct collaboration (current year)"},
		{1, 102, false, "alice-david: no path within 4 years (path goes through old edge)"},
		{1, 103, false, "alice-eve: no relationship"},
		{2, 101, true, "charlie-bob: direct collaboration (recent)"},
		{2, 102, false, "charlie-david: collaboration older than 4 years"},
		{2, 103, false, "charlie-eve: no relationship"},
	}

	for _, tt := range tests {
		hasConflict := conflicts.HasConflict(tt.submissionID, tt.reviewerID)
		if hasConflict != tt.shouldConflict {
			t.Errorf("%s: expected conflict=%v, got %v", tt.reason, tt.shouldConflict, hasConflict)
		}
	}
}

// TestRelationshipDetector_IndirectCollaboration tests N-hop detection
func TestRelationshipDetector_IndirectCollaboration(t *testing.T) {
	uri := getTestNeo4jURI()
	if uri == "" {
		t.Skip("Skipping: NEO4J_URI not set")
	}

	client, err := neo4j.NewClient(neo4j.Config{
		URI:      uri,
		Username: getTestNeo4jUsername(),
		Password: getTestNeo4jPassword(),
	})
	if err != nil {
		t.Skipf("Skipping: Cannot connect to Neo4j: %v", err)
	}
	defer client.Close(context.Background())

	ctx := context.Background()
	authorSvc := neo4j.NewAuthorService(client)

	// Clear test data
	clearTestData(t, client)

	currentYear := time.Now().Year()

	// Create chain: alice -> bob -> charlie -> david (all recent)
	authors := []string{"alice2@test.com", "bob2@test.com", "charlie2@test.com", "david2@test.com"}
	for _, email := range authors {
		authorSvc.CreateAuthor(ctx, neo4j.Author{Email: email})
	}

	authorSvc.CreateCoauthorship(ctx, "alice2@test.com", "bob2@test.com", neo4j.CoauthorRelationship{
		EstablishedDate: currentYear,
	})
	authorSvc.CreateCoauthorship(ctx, "bob2@test.com", "charlie2@test.com", neo4j.CoauthorRelationship{
		EstablishedDate: currentYear,
	})
	authorSvc.CreateCoauthorship(ctx, "charlie2@test.com", "david2@test.com", neo4j.CoauthorRelationship{
		EstablishedDate: currentYear,
	})

	detector := NewRelationshipDetector(client, 4).(*RelationshipDetector)

	// Test 1-hop (direct)
	hasConflict, err := detector.CheckAuthorReviewerConflict(ctx, "alice2@test.com", "bob2@test.com")
	if err != nil {
		t.Fatalf("CheckAuthorReviewerConflict failed: %v", err)
	}
	if !hasConflict {
		t.Error("Expected conflict for 1-hop collaboration")
	}

	// Test 2-hop (indirect through bob)
	hasConflict, err = detector.CheckAuthorReviewerConflict(ctx, "alice2@test.com", "charlie2@test.com")
	if err != nil {
		t.Fatalf("CheckAuthorReviewerConflict failed: %v", err)
	}
	if !hasConflict {
		t.Error("Expected conflict for 2-hop collaboration")
	}

	// Test 3-hop (indirect through bob and charlie)
	hasConflict, err = detector.CheckAuthorReviewerConflict(ctx, "alice2@test.com", "david2@test.com")
	if err != nil {
		t.Fatalf("CheckAuthorReviewerConflict failed: %v", err)
	}
	if !hasConflict {
		t.Error("Expected conflict for 3-hop collaboration")
	}
}

// Helper functions

func getTestNeo4jURI() string {
	uri := os.Getenv("NEO4J_URI")
	if uri == "" {
		uri = "bolt://localhost:7687"
	}
	return uri
}

func getTestNeo4jUsername() string {
	username := os.Getenv("NEO4J_USERNAME")
	if username == "" {
		username = "neo4j"
	}
	return username
}

func getTestNeo4jPassword() string {
	password := os.Getenv("NEO4J_PASSWORD")
	if password == "" {
		password = "conferencespace"
	}
	return password
}

func clearTestData(t *testing.T, client *neo4j.Client) {
	ctx := context.Background()

	// Delete test authors
	session := client.NewSession(ctx)
	defer session.Close(ctx)

	query := `
		MATCH (n:Author) 
		WHERE n.email ENDS WITH '@test.com'
		DETACH DELETE n
	`
	_, err := session.Run(ctx, query, nil)
	if err != nil {
		t.Logf("Warning: Failed to clear test data: %v", err)
	}
}
