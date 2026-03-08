package checkers

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

type baseChecker struct {
	id          string
	category    string
	description string
	checkFn     func(models.Document, models.PaperRuleConfig) (string, string, float64)
}

func (b *baseChecker) ID() string          { return b.id }
func (b *baseChecker) Category() string    { return b.category }
func (b *baseChecker) Description() string { return b.description }
func (b *baseChecker) Check(ctx context.Context, doc models.Document, config models.PaperRuleConfig) models.CheckResult {
	status, details, conf := b.checkFn(doc, config)
	return models.CheckResult{
		ItemID:      b.id,
		Category:    b.category,
		Description: b.description,
		Status:      status,
		Details:     details,
		Confidence:  conf,
	}
}

func init() {
	Register("title_abstract", "1.1", &baseChecker{
		id:          "1.1",
		category:    "title_abstract",
		description: "Title ≤ 15 words",
		checkFn: func(doc models.Document, config models.PaperRuleConfig) (string, string, float64) {
			title := extractDocumentTitle(doc.FullText)
			words := len(strings.Fields(title))
			maxWords := config.TitleMaxWords
			if maxWords == 0 {
				maxWords = 15 // Fallback to default
			}
			status := "pass"
			details := fmt.Sprintf("Title has %d words (max %d)", words, maxWords)
			if words > maxWords {
				status = "fail"
			}
			return status, details, 1.0
		},
	})

	Register("pre_submission", "11.4", &baseChecker{
		id:          "11.4",
		category:    "pre_submission",
		description: "Complies with page limit",
		checkFn: func(doc models.Document, config models.PaperRuleConfig) (string, string, float64) {
			status := "pass"
			if doc.Stats.PageCount > config.MaxPages {
				status = "fail"
			}
			details := fmt.Sprintf("Pages: %d (max %d)", doc.Stats.PageCount, config.MaxPages)
			return status, details, 1.0
		},
	})

	Register("writing_quality", "6.2", &baseChecker{
		id:          "6.2",
		category:    "writing_quality",
		description: "No sentence >25 words",
		checkFn: func(doc models.Document, config models.PaperRuleConfig) (string, string, float64) {
			sentences := regexp.MustCompile(`[.!?]`).Split(doc.FullText, -1)
			maxLen := 0
			for _, s := range sentences {
				lenS := len(strings.Fields(s))
				if lenS > maxLen {
					maxLen = lenS
				}
			}
			maxWords := config.MaxSentenceWords
			if maxWords == 0 {
				maxWords = 25 // Fallback to default
			}
			status := "pass"
			if maxLen > maxWords {
				status = "warning"
			}
			details := fmt.Sprintf("Max sentence: %d words (max %d)", maxLen, maxWords)
			return status, details, 0.9
		},
	})

	// Add scope matching checker (for conference scope validation)
	Register("scope_match", "0.1", &baseChecker{
		id:          "0.1",
		category:    "scope_match",
		description: "Paper scope matches conference scope",
		checkFn: func(doc models.Document, config models.PaperRuleConfig) (string, string, float64) {
			if len(config.ConferenceDomains) == 0 {
				return "warning", "Conference scope keywords are not configured", 0.6
			}

			scopeTokens := make(map[string]bool)
			for _, domain := range config.ConferenceDomains {
				for _, token := range tokenizeScope(domain) {
					scopeTokens[token] = true
				}
			}

			if len(scopeTokens) == 0 {
				return "warning", "Conference scope keywords are too generic for matching", 0.6
			}

			docTokens := make(map[string]bool)
			keywordText := strings.Join(doc.Keywords, " ")
			for _, token := range tokenizeScope(keywordText + " " + doc.FullText) {
				docTokens[token] = true
			}

			matches := make([]string, 0)
			for token := range scopeTokens {
				if docTokens[token] {
					matches = append(matches, token)
				}
			}

			if len(matches) == 0 {
				return "fail", "No overlap found between paper content and conference scope", 0.82
			}

			if len(matches) == 1 {
				return "warning", fmt.Sprintf("Limited scope overlap detected (%s)", matches[0]), 0.72
			}

			return "pass", fmt.Sprintf("Scope overlap detected (%d matched keywords)", len(matches)), 0.88
		},
	})
}

func extractDocumentTitle(fullText string) string {
	lines := strings.Split(fullText, "\n")
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		lowered := strings.ToLower(trimmed)
		if strings.Contains(lowered, "abstract") || strings.Contains(lowered, "introduction") {
			continue
		}
		return trimmed
	}
	return "Untitled"
}

func tokenizeScope(input string) []string {
	normalized := strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || unicode.IsSpace(r) {
			return unicode.ToLower(r)
		}
		return ' '
	}, input)

	rawTokens := strings.Fields(normalized)
	tokens := make([]string, 0, len(rawTokens))
	for _, token := range rawTokens {
		if len(token) < 3 {
			continue
		}
		switch token {
		case "the", "and", "for", "with", "from", "into", "using", "based", "this", "that":
			continue
		}
		tokens = append(tokens, token)
	}
	return tokens
}
