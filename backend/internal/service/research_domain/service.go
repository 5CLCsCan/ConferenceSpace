package research_domain

import (
	"context"
	"fmt"
	"sort"
	"strings"
)

const (
	maxPapersForInference    = 12
	maxAbstractCharsPerPaper = 1200
	maxKeywords              = 8
)

type JSONGenerator interface {
	GenerateJSON(ctx context.Context, prompt string, schema map[string]any, out any) error
}

type SourcePaper struct {
	Title    string
	Abstract string
	Venue    string
	Year     int
}

type Service struct {
	generator JSONGenerator
}

type keywordResponse struct {
	Keywords []string `json:"keywords"`
}

func New(generator JSONGenerator) *Service {
	return &Service{generator: generator}
}

func (s *Service) ExtractFromPapers(ctx context.Context, papers []SourcePaper) ([]string, error) {
	if s == nil || s.generator == nil {
		return nil, nil
	}

	sources := make([]string, 0, maxPapersForInference)
	for _, paper := range papers {
		abstract := strings.TrimSpace(paper.Abstract)
		if abstract == "" {
			continue
		}

		if len(abstract) > maxAbstractCharsPerPaper {
			abstract = abstract[:maxAbstractCharsPerPaper]
		}

		title := strings.TrimSpace(paper.Title)
		if title == "" {
			title = "Untitled Paper"
		}

		var source strings.Builder
		source.WriteString("- Title: ")
		source.WriteString(title)
		if paper.Year > 0 {
			source.WriteString(fmt.Sprintf(" (%d)", paper.Year))
		}
		if venue := strings.TrimSpace(paper.Venue); venue != "" {
			source.WriteString("\n  Venue: ")
			source.WriteString(venue)
		}
		source.WriteString("\n  Abstract: ")
		source.WriteString(abstract)

		sources = append(sources, source.String())
		if len(sources) >= maxPapersForInference {
			break
		}
	}

	if len(sources) == 0 {
		return nil, nil
	}

	prompt := strings.Join([]string{
		"You are analyzing an academic author's publication abstracts.",
		"Return 5 to 8 concise research-domain keywords that best describe the author's professional and research interests.",
		"Rules:",
		"- Output only broad, recognizable academic keywords or short phrases.",
		"- Prefer established research areas such as Machine Learning, Computer Vision, Human-Computer Interaction, Software Engineering.",
		"- Avoid institutions, paper titles, author names, verbs, or full sentences.",
		"- Deduplicate overlapping phrases.",
		"- Use Title Case English phrases.",
		"",
		"Paper samples:",
		strings.Join(sources, "\n"),
	}, "\n")

	var response keywordResponse
	if err := s.generator.GenerateJSON(ctx, prompt, keywordResponseSchema(), &response); err != nil {
		return nil, err
	}

	return normalizeKeywords(response.Keywords), nil
}

func keywordResponseSchema() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"keywords": map[string]any{
				"type":        "array",
				"description": "A list of 5 to 8 academic research-domain keywords in English.",
				"items": map[string]any{
					"type": "string",
				},
			},
		},
		"required": []string{"keywords"},
	}
}

func normalizeKeywords(keywords []string) []string {
	if len(keywords) == 0 {
		return nil
	}

	seen := make(map[string]struct{}, len(keywords))
	result := make([]string, 0, len(keywords))
	for _, keyword := range keywords {
		normalized := strings.Join(strings.Fields(keyword), " ")
		normalized = strings.Trim(normalized, " \t\r\n,.;")
		if normalized == "" {
			continue
		}

		key := strings.ToLower(normalized)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, normalized)
		if len(result) >= maxKeywords {
			break
		}
	}

	sort.Strings(result)
	if len(result) == 0 {
		return nil
	}

	return result
}
