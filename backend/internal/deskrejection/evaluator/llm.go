package evaluator

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/dcao/conferencespace/internal/clients/gemini"
	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

// LLMEvaluator evaluates paper content quality using LLM
type LLMEvaluator struct {
	client *gemini.Client
}

// NewLLMEvaluator creates a new LLM evaluator
// Accepts interface{} to allow passing through context
func NewLLMEvaluator(client interface{}) *LLMEvaluator {
	// Type assert to Gemini client
	gc, ok := client.(*gemini.Client)
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
		return nil, fmt.Errorf("LLM evaluation failed: %w", err)
	}

	// Parse the LLM response into multiple check results
	results := parseLLMResponse(response)
	return results, nil
}

// buildContentEvaluationPrompt creates a comprehensive prompt for content quality evaluation
func buildContentEvaluationPrompt(doc models.Document, config models.PaperRuleConfig) string {
	// Extract relevant sections
	title := extractTitle(doc)
	abstract := extractAbstract(doc)
	intro := extractSection(doc, "Introduction")
	method := extractSection(doc, "Method")
	experiments := extractSection(doc, "Experiments")

	return fmt.Sprintf(`You are evaluating an academic research paper for content quality based on CS conference submission standards. Analyze the paper comprehensively and evaluate MULTIPLE aspects in a SINGLE response.

PAPER CONTENT:

TITLE:
%s

ABSTRACT:
%s

INTRODUCTION (first ~1000 characters):
%s

METHOD (first ~1500 characters):
%s

EXPERIMENTS (first ~2000 characters):
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

Be concise but specific. Focus on content quality, not formatting.`, 
		title, abstract, intro, method, experiments)
}

// Helper functions to extract sections
func extractTitle(doc models.Document) string {
	lines := strings.SplitN(doc.FullText, "\n", 2)
	if len(lines) > 0 {
		return strings.TrimSpace(lines[0])
	}
	return ""
}

func extractAbstract(doc models.Document) string {
	// Try to get from sections first
	if abstract, ok := doc.Sections["Abstract"]; ok {
		return truncateText(abstract, 500)
	}
	if abstract, ok := doc.Sections["abstract"]; ok {
		return truncateText(abstract, 500)
	}
	// Fallback: first 10 lines after title
	lines := strings.SplitN(doc.FullText, "\n", 15)
	if len(lines) > 1 {
		return truncateText(strings.Join(lines[1:], "\n"), 500)
	}
	return ""
}

func extractSection(doc models.Document, sectionName string) string {
	if section, ok := doc.Sections[sectionName]; ok {
		return truncateText(section, 2000)
	}
	// Try lowercase
	if section, ok := doc.Sections[strings.ToLower(sectionName)]; ok {
		return truncateText(section, 2000)
	}
	// Try plural
	if section, ok := doc.Sections[sectionName+"s"]; ok {
		return truncateText(section, 2000)
	}
	return ""
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
		// Fallback: try to parse as plain text format
		return parseTextFormatResponse(response)
	}

	// Map to CheckResult with descriptions
	descriptions := map[string]string{
		"1.2": "Title reflects problem and solution with technical keywords",
		"1.4": "Abstract includes key components (problem, method, results, impact)",
		"2.1": "Main problem clearly defined in first two paragraphs",
		"2.4": "Contributions explicitly itemized",
		"4.1": "All symbols defined before use",
		"5.1": "Uses adequate number of datasets (≥3 expected)",
		"5.2": "Compares with adequate baseline methods (≥3 expected)",
		"5.3": "Includes ablation studies",
		"6.1": "All abbreviations defined at first use",
	}

	results := make([]models.CheckResult, 0, len(llmResp.Evaluations))
	for _, eval := range llmResp.Evaluations {
		desc := descriptions[eval.ID]
		if desc == "" {
			desc = "Content quality evaluation"
		}

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

		results = append(results, models.CheckResult{
			ItemID:     eval.ID,
			Category:   eval.Category,
			Description: desc,
			Status:     status,
			Details:    eval.Details,
			Confidence: confidence,
		})
	}

	return results
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
					ItemID:     id,
					Category:   getCategoryForID(id),
					Description: desc,
					Status:     status,
					Details:    strings.TrimSpace(line),
					Confidence: 0.7,
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

