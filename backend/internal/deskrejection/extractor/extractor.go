package extractor

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/dcao/conferencespace/internal/deskrejection/drerrors"
	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

type extractedText struct {
	PageTexts []string
}

type backend interface {
	Name() string
	Extract(path string) (*extractedText, error)
}

func Extract(path string, config models.PaperRuleConfig) (models.Document, error) {
	failures := make([]string, 0)

	for _, candidate := range availableBackends() {
		extracted, err := candidate.Extract(path)
		if err != nil {
			failures = append(failures, fmt.Sprintf("%s: %v", candidate.Name(), err))
			continue
		}

		document, err := buildDocument(extracted, config)
		if err != nil {
			failures = append(failures, fmt.Sprintf("%s: %v", candidate.Name(), err))
			continue
		}

		return document, nil
	}

	if len(failures) == 0 {
		failures = append(failures, "no PDF text extractor is available")
	}

	return models.Document{}, drerrors.New(
		drerrors.CategoryExtraction,
		"unable to extract text from PDF",
		errors.New(strings.Join(failures, "; ")),
	)
}

func buildDocument(extracted *extractedText, config models.PaperRuleConfig) (models.Document, error) {
	if extracted == nil || len(extracted.PageTexts) == 0 {
		return models.Document{}, errors.New("extractor returned no pages")
	}

	var builder strings.Builder
	sections := make(map[string]string)
	currentSection := ""
	var sectionBuilder strings.Builder
	stats := models.DocumentStats{PageCount: len(extracted.PageTexts)}

	for _, pageText := range extracted.PageTexts {
		normalized := normalizePageText(pageText)
		if builder.Len() > 0 {
			builder.WriteString("\n")
		}
		builder.WriteString(normalized)

		lines := strings.Split(normalized, "\n")
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if isSectionHeader(trimmed, config.RequiredSections) {
				if currentSection != "" {
					sections[currentSection] = strings.TrimSpace(sectionBuilder.String())
				}
				sectionBuilder.Reset()
				currentSection = normalizeSectionName(trimmed)
			}
			if trimmed != "" {
				sectionBuilder.WriteString(trimmed)
				sectionBuilder.WriteString("\n")
			}
		}

		lowered := strings.ToLower(normalized)
		stats.FigureCount += strings.Count(lowered, "figure")
		stats.TableCount += strings.Count(lowered, "table")
		stats.ReferenceCount += countReferenceMentions(normalized)
	}

	if currentSection != "" {
		sections[currentSection] = strings.TrimSpace(sectionBuilder.String())
	}

	fullText := strings.TrimSpace(builder.String())
	if fullText == "" {
		return models.Document{}, errors.New("extractor returned no text")
	}

	stats.WordCount = len(strings.Fields(fullText))

	return models.Document{
		FullText: fullText,
		Sections: sections,
		Stats:    stats,
		Keywords: extractKeywords(fullText),
	}, nil
}

func normalizePageText(text string) string {
	text = strings.ReplaceAll(text, "\r\n", "\n")
	text = strings.ReplaceAll(text, "\r", "\n")
	text = strings.ReplaceAll(text, "\u0000", "")
	text = strings.ReplaceAll(text, "\f", "\n")
	return strings.TrimSpace(text)
}

func isSectionHeader(line string, required []string) bool {
	line = strings.ToLower(line)
	for _, sec := range required {
		if strings.Contains(line, strings.ToLower(sec)) {
			return true
		}
	}
	return false
}

// normalizeSectionName maps common section name variations to canonical names
func normalizeSectionName(name string) string {
	name = strings.ToLower(name)

	variations := [][2]string{
		{"experimental results", "Results"},
		{"results and discussion", "Results"},
		{"experiments and results", "Results"},
		{"experiments", "Experiments"},
		{"experimental", "Experiments"},
		{"experiment", "Experiments"},
		{"results", "Results"},
		{"result", "Results"},
		{"methodology", "Methods"},
		{"methods", "Methods"},
		{"method", "Methods"},
		{"abstract", "Abstract"},
		{"introduction", "Introduction"},
		{"conclusions", "Conclusions"},
		{"conclusion", "Conclusions"},
	}

	for _, pair := range variations {
		if strings.Contains(name, pair[0]) {
			return pair[1]
		}
	}

	return name
}

func extractKeywords(text string) []string {
	lowered := strings.ToLower(text)

	keywordPatterns := []string{
		"machine learning",
		"deep learning",
		"computer vision",
		"natural language processing",
		"information retrieval",
		"knowledge graph",
		"distributed systems",
		"data mining",
		"software engineering",
		"security",
		"privacy",
		"robotics",
		"graph neural network",
		"reinforcement learning",
	}

	seen := make(map[string]bool)
	keywords := make([]string, 0, len(keywordPatterns))
	for _, pattern := range keywordPatterns {
		if strings.Contains(lowered, pattern) && !seen[pattern] {
			seen[pattern] = true
			keywords = append(keywords, pattern)
		}
	}

	if len(keywords) > 0 {
		return keywords
	}

	re := regexp.MustCompile(`(?i)keywords?\s*[:\-]\s*([^\n]+)`)
	match := re.FindStringSubmatch(text)
	if len(match) < 2 {
		return []string{}
	}

	parts := strings.Split(match[1], ",")
	for _, part := range parts {
		token := strings.TrimSpace(strings.ToLower(part))
		if token != "" && !seen[token] {
			seen[token] = true
			keywords = append(keywords, token)
		}
	}

	return keywords
}

func countReferenceMentions(text string) int {
	count := strings.Count(text, "[")
	if count > 0 {
		return count
	}
	return strings.Count(strings.ToLower(text), "et al.")
}
