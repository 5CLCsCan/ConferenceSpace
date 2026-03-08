package evaluator

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/dcao/conferencespace/internal/deskrejection/drerrors"
	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

type textGenerator interface {
	GenerateText(ctx context.Context, prompt string) (string, error)
}

// LLMEvaluator evaluates paper content quality using LLM
type LLMEvaluator struct {
	client textGenerator
}

// NewLLMEvaluator creates a new LLM evaluator
// Accepts interface{} to allow passing through context
func NewLLMEvaluator(client interface{}) *LLMEvaluator {
	// Type assert to Gemini client-compatible interface
	gc, ok := client.(textGenerator)
	if !ok || gc == nil {
		return &LLMEvaluator{client: nil}
	}
	return &LLMEvaluator{client: gc}
}

// EvaluateContent performs a comprehensive content quality evaluation in a single LLM call
// Returns multiple check results for different content aspects
func (e *LLMEvaluator) EvaluateContent(ctx context.Context, doc models.Document, config models.PaperRuleConfig) ([]models.CheckResult, error) {
	if e.client == nil {
		return nil, nil // No LLM evaluation if client not available
	}

	prompt := buildContentEvaluationPrompt(doc, config)

	response, err := e.client.GenerateText(ctx, prompt)
	if err != nil {
		return nil, drerrors.New(drerrors.CategoryLLM, "LLM text generation failed", err)
	}

	// Parse the LLM response into multiple check results
	results := parseLLMResponse(response)
	if len(results) == 0 {
		return nil, drerrors.New(drerrors.CategoryLLM, "LLM returned no usable checks", nil)
	}
	return results, nil
}

// buildContentEvaluationPrompt creates a comprehensive prompt for content quality evaluation
func buildContentEvaluationPrompt(doc models.Document, config models.PaperRuleConfig) string {
	// Truncate full text to reasonable length for LLM (e.g., first 20,000 characters)
	fullText := truncateText(doc.FullText, 100000)
	injectedFragments := ""
	if len(config.PromptFragments) > 0 {
		injectedFragments = strings.Join(config.PromptFragments, "\n")
	}

	return fmt.Sprintf(`You are evaluating an academic research paper for content quality based on CS conference submission standards. Analyze the paper comprehensively and evaluate MULTIPLE aspects in a SINGLE response.

Conference-specific guidance (must be applied):
%s

The paper content is provided below. Note that the paper may be in any language, and section headers may vary.

PAPER CONTENT:
%s

---

Evaluate the following content-relevant aspects (NOT formatting like margins, font size, etc.):

1. TITLE QUALITY (ID: 1.2, Category: title_abstract)
   - Does the title clearly reflect BOTH the problem AND the solution?
   - Does it include at least one technical keyword relevant to the field?
   - Rate: pass/warning/fail

2. ABSTRACT COMPLETENESS (ID: 1.4, Category: title_abstract)
   - Does the abstract include all FOUR components:
     a) Problem/task definition
     b) Proposed method or idea
     c) Main results
     d) Broader impact or significance
   - Rate: pass/warning/fail

3. PROBLEM DEFINITION (ID: 2.1, Category: introduction)
   - Is the main problem or task clearly defined in the first two paragraphs of introduction?
   - Is it explicit, not implied?
   - Rate: pass/warning/fail

4. CONTRIBUTIONS (ID: 2.4, Category: introduction)
   - Are contributions explicitly itemized (e.g., numbered or listed)?
   - Are they specific and verifiable (not vague like "we provide insights")?
   - Rate: pass/warning/fail

5. SYMBOL DEFINITIONS (ID: 4.1, Category: method)
   - Are mathematical symbols defined before or at their first use?
   - Look for patterns like "Let x be..." or "where x denotes..."
   - Rate: pass/warning/fail

6. DATASETS (ID: 5.1, Category: experiments)
   - How many distinct datasets are mentioned or used?
   - At least 3 datasets expected (unless paper introduces new dataset)
   - Rate: pass/warning/fail

7. BASELINES (ID: 5.2, Category: experiments)
   - How many distinct baseline methods are mentioned or compared?
   - At least 3 baseline methods expected
   - Rate: pass/warning/fail

8. ABLATION STUDIES (ID: 5.3, Category: experiments)
   - Are ablation studies mentioned or included?
   - Rate: pass/warning/fail

9. ABBREVIATIONS (ID: 6.1, Category: writing_quality)
   - Are abbreviations (like ML, AI, LLM, NLP) defined at first use?
   - Check first ~2000 characters for abbreviation definitions
   - Rate: pass/warning/fail

---

Respond in EXACT JSON format (no markdown, no code blocks):

{
  "evaluations": [
    {
      "id": "1.2",
      "category": "title_abstract",
      "status": "pass|warning|fail",
      "details": "Specific feedback for this aspect",
      "confidence": 0.0-1.0
    },
    {
      "id": "1.4",
      "category": "title_abstract",
      "status": "pass|warning|fail",
      "details": "Specific feedback",
      "confidence": 0.0-1.0
    }
    // ... continue for all 9 aspects
  ]
}

Be concise but specific. Focus on content quality, not formatting.`, injectedFragments, fullText)
}

func truncateText(text string, maxChars int) string {
	if len(text) <= maxChars {
		return text
	}
	return text[:maxChars] + "..."
}

// LLMResponse represents the structured response from LLM
type LLMResponse struct {
	Evaluations []EvaluationResult `json:"evaluations"`
}

// EvaluationResult represents a single evaluation result
type EvaluationResult struct {
	ID         string  `json:"id"`
	Category   string  `json:"category"`
	Status     string  `json:"status"`
	Details    string  `json:"details"`
	Confidence float64 `json:"confidence"`
}

// parseLLMResponse parses the LLM JSON response into CheckResult items
func parseLLMResponse(response string) []models.CheckResult {
	// Clean response - remove markdown code blocks if present
	cleaned := strings.TrimSpace(response)
	cleaned = strings.TrimPrefix(cleaned, "```json")
	cleaned = strings.TrimPrefix(cleaned, "```")
	cleaned = strings.TrimSuffix(cleaned, "```")
	cleaned = strings.TrimSpace(cleaned)

	var llmResp LLMResponse
	if err := json.Unmarshal([]byte(cleaned), &llmResp); err != nil {
		// Deterministic fallback path for malformed output
		return mergeWithDefaults(parseTextFormatResponse(response), "LLM response was not valid JSON")
	}

	if len(llmResp.Evaluations) == 0 {
		return mergeWithDefaults(nil, "LLM response contained no evaluations")
	}

	expected := expectedChecks()

	results := make([]models.CheckResult, 0, len(llmResp.Evaluations))
	seen := make(map[string]bool)
	for _, eval := range llmResp.Evaluations {
		definition, ok := expected[eval.ID]
		if !ok {
			continue
		}
		seen[eval.ID] = true

		// Normalize status
		status := strings.ToLower(eval.Status)
		if status != "pass" && status != "fail" && status != "warning" {
			status = "warning"
		}

		// Normalize confidence
		confidence := eval.Confidence
		if confidence < 0 || confidence > 1 {
			confidence = 0.7
		}

		details := strings.TrimSpace(eval.Details)
		if details == "" {
			details = "No specific details provided by model"
		}

		results = append(results, models.CheckResult{
			ItemID:      eval.ID,
			Category:    fallbackCategory(eval.Category, definition.Category),
			Description: definition.Description,
			Status:      status,
			Details:     details,
			Confidence:  confidence,
		})
	}

	for id, definition := range expected {
		if seen[id] {
			continue
		}
		results = append(results, models.CheckResult{
			ItemID:      id,
			Category:    definition.Category,
			Description: definition.Description,
			Status:      "warning",
			Details:     "Model omitted this check; manual review recommended",
			Confidence:  0.5,
		})
	}

	return sortByItemID(results)
}

// parseTextFormatResponse is a fallback parser if JSON parsing fails
func parseTextFormatResponse(response string) []models.CheckResult {
	// Simple fallback - look for patterns
	results := make([]models.CheckResult, 0)
	lines := strings.Split(response, "\n")

	descriptions := map[string]string{
		"1.2": "Title reflects problem and solution with technical keywords",
		"1.4": "Abstract includes key components",
		"2.1": "Main problem clearly defined",
		"2.4": "Contributions explicitly itemized",
		"4.1": "All symbols defined before use",
		"5.1": "Uses adequate number of datasets",
		"5.2": "Compares with adequate baseline methods",
		"5.3": "Includes ablation studies",
		"6.1": "All abbreviations defined at first use",
	}

	for _, line := range lines {
		for id, desc := range descriptions {
			if strings.Contains(line, id) || strings.Contains(line, strings.ReplaceAll(id, ".", "")) {
				// Try to extract status and details
				status := "warning"
				if strings.Contains(strings.ToLower(line), "pass") {
					status = "pass"
				} else if strings.Contains(strings.ToLower(line), "fail") {
					status = "fail"
				}

				results = append(results, models.CheckResult{
					ItemID:      id,
					Category:    getCategoryForID(id),
					Description: desc,
					Status:      status,
					Details:     strings.TrimSpace(line),
					Confidence:  0.7,
				})
				break
			}
		}
	}

	return results
}

func getCategoryForID(id string) string {
	categories := map[string]string{
		"1.2": "title_abstract",
		"1.4": "title_abstract",
		"2.1": "introduction",
		"2.4": "introduction",
		"4.1": "method",
		"5.1": "experiments",
		"5.2": "experiments",
		"5.3": "experiments",
		"6.1": "writing_quality",
	}
	if cat, ok := categories[id]; ok {
		return cat
	}
	return "content_quality"
}

type expectedCheck struct {
	Category    string
	Description string
}

func expectedChecks() map[string]expectedCheck {
	return map[string]expectedCheck{
		"1.2": {Category: "title_abstract", Description: "Title reflects problem and solution with technical keywords"},
		"1.4": {Category: "title_abstract", Description: "Abstract includes key components (problem, method, results, impact)"},
		"2.1": {Category: "introduction", Description: "Main problem clearly defined in first two paragraphs"},
		"2.4": {Category: "introduction", Description: "Contributions explicitly itemized"},
		"4.1": {Category: "method", Description: "All symbols defined before use"},
		"5.1": {Category: "experiments", Description: "Uses adequate number of datasets (≥3 expected)"},
		"5.2": {Category: "experiments", Description: "Compares with adequate baseline methods (≥3 expected)"},
		"5.3": {Category: "experiments", Description: "Includes ablation studies"},
		"6.1": {Category: "writing_quality", Description: "All abbreviations defined at first use"},
	}
}

func fallbackCategory(candidate, fallback string) string {
	normalized := strings.TrimSpace(strings.ToLower(candidate))
	if normalized == "" {
		return fallback
	}
	return normalized
}

func mergeWithDefaults(results []models.CheckResult, reason string) []models.CheckResult {
	normalized := make(map[string]models.CheckResult)
	for _, result := range results {
		normalized[result.ItemID] = result
	}

	expected := expectedChecks()
	for id, definition := range expected {
		if _, ok := normalized[id]; ok {
			continue
		}
		normalized[id] = models.CheckResult{
			ItemID:      id,
			Category:    definition.Category,
			Description: definition.Description,
			Status:      "warning",
			Details:     reason,
			Confidence:  0.5,
		}
	}

	merged := make([]models.CheckResult, 0, len(normalized))
	for _, result := range normalized {
		merged = append(merged, result)
	}
	return sortByItemID(merged)
}

func sortByItemID(results []models.CheckResult) []models.CheckResult {
	sort.Slice(results, func(i, j int) bool {
		return results[i].ItemID < results[j].ItemID
	})
	return results
}
