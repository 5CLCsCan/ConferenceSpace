package extractor

import (
	"os"
	"strings"

	"github.com/unidoc/unipdf/v3/extractor"
	"github.com/unidoc/unipdf/v3/model"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

func Extract(path string, config models.PaperRuleConfig) (models.Document, error) {
	doc, err := loadPDF(path)
	if err != nil {
		return models.Document{}, err
	}

	var builder strings.Builder
	sections := make(map[string]string)
	currentSection := ""
	var sectionBuilder strings.Builder

	numPages, _ := doc.GetNumPages()
	stats := models.DocumentStats{PageCount: numPages}

	for pageNum := 1; pageNum <= numPages; pageNum++ {
		page, _ := doc.GetPage(pageNum)
		ext, _ := extractor.New(page)
		text, _ := ext.ExtractText()
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
	}

	if currentSection != "" {
		sections[currentSection] = sectionBuilder.String()
	}

	fullText := builder.String()
	stats.WordCount = len(strings.Fields(fullText))

	return models.Document{FullText: fullText, Sections: sections, Stats: stats}, nil
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
