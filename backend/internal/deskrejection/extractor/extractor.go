package extractor

import (
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/dcao/conferencespace/internal/deskrejection/drerrors"
	"github.com/unidoc/unipdf/v3/extractor"
	"github.com/unidoc/unipdf/v3/model"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

func Extract(path string, config models.PaperRuleConfig) (models.Document, error) {
	doc, err := loadPDF(path)
	if err != nil {
		return models.Document{}, drerrors.New(drerrors.CategoryExtraction, "unable to load PDF", err)
	}

	var builder strings.Builder
	sections := make(map[string]string)
	currentSection := ""
	var sectionBuilder strings.Builder

	numPages, err := doc.GetNumPages()
	if err != nil {
		return models.Document{}, drerrors.New(drerrors.CategoryExtraction, "unable to read page count", err)
	}
	stats := models.DocumentStats{PageCount: numPages}

	for pageNum := 1; pageNum <= numPages; pageNum++ {
		page, err := doc.GetPage(pageNum)
		if err != nil {
			return models.Document{}, drerrors.New(
				drerrors.CategoryExtraction,
				fmt.Sprintf("unable to load page %d", pageNum),
				err,
			)
		}

		ext, err := extractor.New(page)
		if err != nil {
			return models.Document{}, drerrors.New(
				drerrors.CategoryExtraction,
				fmt.Sprintf("unable to build text extractor for page %d", pageNum),
				err,
			)
		}

		text, err := ext.ExtractText()
		if err != nil {
			return models.Document{}, drerrors.New(
				drerrors.CategoryExtraction,
				fmt.Sprintf("unable to extract text from page %d", pageNum),
				err,
			)
		}
		builder.WriteString(text + "\n")

		lines := strings.Split(text, "\n")
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if isSectionHeader(trimmed, config.RequiredSections) {
				// Save previous section if exists
				if currentSection != "" {
					sections[currentSection] = sectionBuilder.String()
				}
				// Reset and start new section
				sectionBuilder.Reset()
				currentSection = normalizeSectionName(trimmed)
			}
			sectionBuilder.WriteString(line + "\n")
		}

		stats.FigureCount += strings.Count(text, "Figure")
		stats.TableCount += strings.Count(text, "Table")
		stats.ReferenceCount += countReferenceMentions(text)
	}

	if currentSection != "" {
		sections[currentSection] = sectionBuilder.String()
	}

	fullText := builder.String()
	stats.WordCount = len(strings.Fields(fullText))
	keywords := extractKeywords(fullText)

	return models.Document{
		FullText: fullText,
		Sections: sections,
		Stats:    stats,
		Keywords: keywords,
	}, nil
}

func loadPDF(path string) (*model.PdfReader, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return model.NewPdfReader(f)
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

	// Common variations for each section (ordered by specificity - longest first)
	variations := [][2]string{
		// Results/Experiments check before individual words to avoid conflicts
		{"experimental results", "Results"},
		{"results and discussion", "Results"},
		{"experiments and results", "Results"},
		{"experiments", "Experiments"},
		{"experimental", "Experiments"},
		{"experiment", "Experiments"},
		{"results", "Results"},
		{"result", "Results"},

		// Methods variations
		{"methodology", "Methods"},
		{"methods", "Methods"},
		{"method", "Methods"},

		// Other sections
		{"abstract", "Abstract"},
		{"introduction", "Introduction"},
		{"conclusions", "Conclusions"},
		{"conclusion", "Conclusions"},
	}

	// Check if name matches any variation
	for _, pair := range variations {
		if strings.Contains(name, pair[0]) {
			return pair[1]
		}
	}

	// Return original if no match found
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

	// Fallback: extract tokens that appear after "keywords"
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
