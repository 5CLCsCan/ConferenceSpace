package agentquery

import (
	"strings"
	"testing"
)

func TestDescribeListsPhaseOneResourcesOnly(t *testing.T) {
	t.Parallel()

	engine := NewEngine(nil)

	response, err := engine.Describe("")
	if err != nil {
		t.Fatalf("Describe returned error: %v", err)
	}

	if len(response.Resources) == 0 {
		t.Fatalf("expected at least one resource")
	}

	names := map[string]bool{}
	for _, resource := range response.Resources {
		names[resource.Name] = true
	}

	for _, expected := range []string{"conferences", "public_conferences", "submissions", "assignments", "conference_stats", "notifications"} {
		if !names[expected] {
			t.Fatalf("expected resource %q to be described", expected)
		}
	}

	if names["discussion_threads"] || names["discussion_messages"] {
		t.Fatalf("discussion resources should not be exposed in phase 1 describe output")
	}
}

func TestPlanQueryScopesPublicConferencesToNonDraftRowsOnly(t *testing.T) {
	t.Parallel()

	engine := NewEngine(nil)

	plan, err := engine.planQuery(Actor{UserID: 41, UserEmail: "user@example.com"}, &Request{
		Op:       "query",
		Resource: "public_conferences",
		Select: []SelectField{
			{Field: "id"},
			{Field: "title"},
			{Field: "chair"},
			{Field: "co_chairs"},
			{Field: "cfp_text"},
			{Field: "full_paper_submission_deadline"},
		},
		Filter: &FilterNode{
			Field: "full_paper_submission_deadline",
			Op:    "gte",
			Value: "2026-04-01T00:00:00Z",
		},
		Sort:  []SortSpec{{Field: "full_paper_submission_deadline", Dir: "asc"}},
		Limit: intPtr(20),
	})
	if err != nil {
		t.Fatalf("planQuery returned error: %v", err)
	}

	if !strings.Contains(plan.SQL, "conferences c") {
		t.Fatalf("expected conferences base table in SQL, got %s", plan.SQL)
	}
	if !strings.Contains(plan.SQL, "c.status <> $") {
		t.Fatalf("expected draft exclusion in SQL, got %s", plan.SQL)
	}
	if strings.Contains(plan.SQL, "conference_user_roles") || strings.Contains(plan.SQL, "s.author = $") {
		t.Fatalf("public conferences should not be actor-scoped, got %s", plan.SQL)
	}
	if !strings.Contains(plan.SQL, "configurations") {
		t.Fatalf("expected JSON configuration access for public fields, got %s", plan.SQL)
	}
	if !strings.Contains(plan.SQL, "::timestamptz") {
		t.Fatalf("expected public deadline fields to be cast as timestamps, got %s", plan.SQL)
	}
}

func TestPlanQueryRejectsPrivateConferenceFieldsOnPublicResource(t *testing.T) {
	t.Parallel()

	engine := NewEngine(nil)

	_, err := engine.planQuery(Actor{UserID: 41, UserEmail: "user@example.com"}, &Request{
		Op:       "query",
		Resource: "public_conferences",
		Select: []SelectField{
			{Field: "rebuttal_phase"},
		},
	})
	if err == nil {
		t.Fatalf("expected private field selection to fail")
	}
	if !strings.Contains(err.Error(), "rebuttal_phase") {
		t.Fatalf("expected error to mention rejected field, got %v", err)
	}
}

func TestPlanQueryRejectsUnknownFields(t *testing.T) {
	t.Parallel()

	engine := NewEngine(nil)

	_, err := engine.planQuery(Actor{UserID: 7, UserEmail: "author@example.com"}, &Request{
		Op:       "query",
		Resource: "submissions",
		Select: []SelectField{
			{Field: "author"},
		},
	})
	if err == nil {
		t.Fatalf("expected unknown field selection to fail")
	}
	if !strings.Contains(err.Error(), "author") {
		t.Fatalf("expected error to mention rejected field, got %v", err)
	}
}

func TestPlanQueryScopesSubmissionQueriesToCurrentActor(t *testing.T) {
	t.Parallel()

	engine := NewEngine(nil)

	plan, err := engine.planQuery(Actor{UserID: 7, UserEmail: "author@example.com"}, &Request{
		Op:       "query",
		Resource: "submissions",
		Select: []SelectField{
			{Field: "id"},
			{Field: "title"},
			{Field: "conference.acronym", As: "conference_acronym"},
		},
		Filter: &FilterNode{
			Field: "conference.acronym",
			Op:    "eq",
			Value: "ICML2026",
		},
		Sort:  []SortSpec{{Field: "updated_at", Dir: "desc"}},
		Limit: intPtr(10),
	})
	if err != nil {
		t.Fatalf("planQuery returned error: %v", err)
	}

	if !strings.Contains(plan.SQL, "conference_submissions s") {
		t.Fatalf("expected submissions base table in SQL, got %s", plan.SQL)
	}
	if !strings.Contains(plan.SQL, "s.author = $") {
		t.Fatalf("expected author scope in SQL, got %s", plan.SQL)
	}
	if !strings.Contains(plan.SQL, "paper_assignments a_actor") {
		t.Fatalf("expected reviewer assignment scope in SQL, got %s", plan.SQL)
	}
	if !strings.Contains(plan.SQL, "conference_user_roles cur") {
		t.Fatalf("expected chair/co-chair role scope in SQL, got %s", plan.SQL)
	}
	if got := len(plan.Args); got < 4 {
		t.Fatalf("expected actor scoping/filter args, got %d", got)
	}
}

func TestPlanQuerySupportsGroupedAggregates(t *testing.T) {
	t.Parallel()

	engine := NewEngine(nil)

	plan, err := engine.planQuery(Actor{UserID: 11, UserEmail: "chair@example.com"}, &Request{
		Op:       "query",
		Resource: "submissions",
		GroupBy: []GroupField{
			{Field: "status"},
		},
		Aggregates: []AggregateSpec{
			{Fn: "count", Field: "id", As: "submission_count"},
		},
		Sort:  []SortSpec{{Field: "submission_count", Dir: "desc"}},
		Limit: intPtr(20),
	})
	if err != nil {
		t.Fatalf("planQuery returned error: %v", err)
	}

	if !strings.Contains(plan.SQL, "COUNT(") {
		t.Fatalf("expected aggregate in SQL, got %s", plan.SQL)
	}
	if !strings.Contains(plan.SQL, "GROUP BY") {
		t.Fatalf("expected group by in SQL, got %s", plan.SQL)
	}
	if !strings.Contains(plan.SQL, "submission_count") {
		t.Fatalf("expected aggregate alias in SQL, got %s", plan.SQL)
	}
}

func TestPlanQueryRedactsReviewerIdentityOutsideChairScope(t *testing.T) {
	t.Parallel()

	engine := NewEngine(nil)

	plan, err := engine.planQuery(Actor{UserID: 23, UserEmail: "reviewer@example.com"}, &Request{
		Op:       "query",
		Resource: "assignments",
		Select: []SelectField{
			{Field: "id"},
			{Field: "reviewer.email", As: "reviewer_email"},
		},
	})
	if err != nil {
		t.Fatalf("planQuery returned error: %v", err)
	}

	if !strings.Contains(plan.SQL, "CASE WHEN EXISTS") {
		t.Fatalf("expected conditional redaction in SQL, got %s", plan.SQL)
	}
	if !strings.Contains(plan.SQL, "THEN a.reviewer_email ELSE NULL END") {
		t.Fatalf("expected reviewer identity masking expression, got %s", plan.SQL)
	}
}

func TestNormalizeValueParsesJSONArrayBytes(t *testing.T) {
	t.Parallel()

	value := normalizeValue([]byte(`["alice@example.com","bob@example.com"]`))

	items, ok := value.([]interface{})
	if !ok {
		t.Fatalf("expected []interface{}, got %T", value)
	}
	if len(items) != 2 {
		t.Fatalf("expected 2 items, got %d", len(items))
	}
	if items[0] != "alice@example.com" || items[1] != "bob@example.com" {
		t.Fatalf("unexpected items: %#v", items)
	}
}

func TestNormalizeValueLeavesPlainBytesAsString(t *testing.T) {
	t.Parallel()

	value := normalizeValue([]byte("NeurIPS 2026"))

	text, ok := value.(string)
	if !ok {
		t.Fatalf("expected string, got %T", value)
	}
	if text != "NeurIPS 2026" {
		t.Fatalf("unexpected text value %q", text)
	}
}

func intPtr(v int) *int {
	return &v
}
