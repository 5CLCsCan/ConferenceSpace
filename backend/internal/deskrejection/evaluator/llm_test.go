package evaluator

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

func TestParseLLMResponse_ValidJSONMergesDefaults(t *testing.T) {
	raw := mustReadFixture(t, "valid_response.json")
	results := parseLLMResponse(raw)

	if got, want := len(results), len(expectedChecks()); got != want {
		t.Fatalf("parseLLMResponse length = %d, want %d", got, want)
	}

	resultByID := mapByID(results)
	if resultByID["1.2"].Status != "pass" {
		t.Fatalf("1.2 status = %s, want pass", resultByID["1.2"].Status)
	}
	if resultByID["5.1"].Status != "fail" {
		t.Fatalf("5.1 status = %s, want fail", resultByID["5.1"].Status)
	}
	if resultByID["2.4"].Status != "warning" {
		t.Fatalf("2.4 status = %s, want warning for omitted checks", resultByID["2.4"].Status)
	}
}

func TestParseLLMResponse_MalformedUsesDeterministicFallback(t *testing.T) {
	raw := mustReadFixture(t, "malformed_response.txt")
	results := parseLLMResponse(raw)
	resultByID := mapByID(results)

	if resultByID["1.2"].Status != "pass" {
		t.Fatalf("1.2 status = %s, want pass", resultByID["1.2"].Status)
	}
	if resultByID["2.1"].Status != "fail" {
		t.Fatalf("2.1 status = %s, want fail", resultByID["2.1"].Status)
	}
	if resultByID["1.4"].Status != "warning" {
		t.Fatalf("1.4 status = %s, want warning for missing check", resultByID["1.4"].Status)
	}
	if !strings.Contains(resultByID["1.4"].Details, "LLM response was not valid JSON") {
		t.Fatalf("1.4 details missing fallback reason: %s", resultByID["1.4"].Details)
	}
}

func TestParseLLMResponse_NormalizesInvalidFields(t *testing.T) {
	raw := `{"evaluations":[{"id":"1.2","category":"title_abstract","status":"ok","details":"","confidence":9.4}]}`
	results := parseLLMResponse(raw)
	resultByID := mapByID(results)

	if resultByID["1.2"].Status != "warning" {
		t.Fatalf("1.2 status = %s, want warning for invalid status token", resultByID["1.2"].Status)
	}
	if resultByID["1.2"].Confidence != 0.7 {
		t.Fatalf("1.2 confidence = %f, want 0.7 fallback", resultByID["1.2"].Confidence)
	}
	if resultByID["1.2"].Details == "" {
		t.Fatalf("1.2 details should not be empty after normalization")
	}
}

func TestBuildContentEvaluationPrompt_IncludesPromptFragments(t *testing.T) {
	config := models.NewPaperRuleConfig()
	config.PromptFragments = []string{
		"Prioritize reproducibility.",
		"Treat weak novelty as warning.",
	}

	prompt := buildContentEvaluationPrompt(models.Document{
		FullText: "A concise paper body",
	}, *config)

	if !strings.Contains(prompt, "Prioritize reproducibility.") {
		t.Fatalf("prompt fragment missing from generated prompt")
	}
	if !strings.Contains(prompt, "Treat weak novelty as warning.") {
		t.Fatalf("second prompt fragment missing from generated prompt")
	}
}

func mapByID(results []models.CheckResult) map[string]models.CheckResult {
	byID := make(map[string]models.CheckResult, len(results))
	for _, result := range results {
		byID[result.ItemID] = result
	}
	return byID
}

func mustReadFixture(t *testing.T, name string) string {
	t.Helper()
	path := filepath.Join("testdata", name)
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read fixture %s: %v", name, err)
	}
	return string(content)
}
