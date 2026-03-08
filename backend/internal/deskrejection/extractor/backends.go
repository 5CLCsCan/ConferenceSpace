package extractor

import (
	"bytes"
	"fmt"
	"io"
	"os/exec"
	"strings"

	pdf "github.com/ledongthuc/pdf"
)

func availableBackends() []backend {
	backends := make([]backend, 0, 2)
	if poppler := newPopplerBackend(); poppler != nil {
		backends = append(backends, poppler)
	}
	backends = append(backends, goPDFBackend{})
	return backends
}

type popplerBackend struct {
	pdftotextPath string
}

func newPopplerBackend() backend {
	path, err := exec.LookPath("pdftotext")
	if err != nil {
		return nil
	}
	return popplerBackend{pdftotextPath: path}
}

func (b popplerBackend) Name() string {
	return "pdftotext"
}

func (b popplerBackend) Extract(path string) (*extractedText, error) {
	cmd := exec.Command(b.pdftotextPath, "-layout", "-enc", "UTF-8", path, "-")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		message := strings.TrimSpace(stderr.String())
		if message == "" {
			message = err.Error()
		}
		return nil, fmt.Errorf("pdftotext failed: %s", message)
	}

	return &extractedText{
		PageTexts: splitPopplerPages(stdout.String()),
	}, nil
}

func splitPopplerPages(output string) []string {
	output = strings.ReplaceAll(output, "\r\n", "\n")
	output = strings.ReplaceAll(output, "\r", "\n")

	rawPages := strings.Split(output, "\f")
	if len(rawPages) > 0 && strings.TrimSpace(rawPages[len(rawPages)-1]) == "" {
		rawPages = rawPages[:len(rawPages)-1]
	}

	pages := make([]string, 0, len(rawPages))
	for _, page := range rawPages {
		pages = append(pages, strings.TrimSpace(page))
	}
	return pages
}

type goPDFBackend struct{}

func (goPDFBackend) Name() string {
	return "go-pdf"
}

func (goPDFBackend) Extract(path string) (*extractedText, error) {
	file, reader, err := pdf.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	pageCount := reader.NumPage()
	if pageCount == 0 {
		return nil, fmt.Errorf("pdf has no pages")
	}

	pageTexts := make([]string, 0, pageCount)
	for pageNumber := 1; pageNumber <= pageCount; pageNumber++ {
		pageText, err := extractPageText(reader, pageNumber)
		if err != nil {
			return nil, fmt.Errorf("page %d: %w", pageNumber, err)
		}
		pageTexts = append(pageTexts, pageText)
	}

	return &extractedText{PageTexts: pageTexts}, nil
}

func extractPageText(reader *pdf.Reader, pageNumber int) (string, error) {
	page := reader.Page(pageNumber)
	text, err := page.GetPlainText(nil)
	if err == nil && strings.TrimSpace(text) != "" {
		return text, nil
	}

	fullText, fallbackErr := extractPageTextFromRows(page)
	if fallbackErr != nil {
		if err != nil {
			return "", err
		}
		return "", fallbackErr
	}
	return fullText, nil
}

func extractPageTextFromRows(page pdf.Page) (string, error) {
	rows, err := page.GetTextByRow()
	if err != nil {
		return "", err
	}

	var builder strings.Builder
	for _, row := range rows {
		line := reconstructRow(row.Content)
		if line == "" {
			continue
		}
		if builder.Len() > 0 {
			builder.WriteString("\n")
		}
		builder.WriteString(line)
	}

	text := strings.TrimSpace(builder.String())
	if text == "" {
		return "", io.EOF
	}
	return text, nil
}

func reconstructRow(tokens pdf.TextHorizontal) string {
	if len(tokens) == 0 {
		return ""
	}

	var builder strings.Builder
	for idx, token := range tokens {
		current := strings.TrimSpace(token.S)
		if current == "" {
			continue
		}

		if builder.Len() > 0 && shouldInsertSpace(tokens, idx) {
			builder.WriteByte(' ')
		}
		builder.WriteString(current)
	}

	return strings.TrimSpace(builder.String())
}

func shouldInsertSpace(tokens pdf.TextHorizontal, idx int) bool {
	if idx <= 0 {
		return false
	}

	current := strings.TrimSpace(tokens[idx].S)
	if current == "" || startsWithPunctuation(current) {
		return false
	}

	prev := tokens[idx-1]
	prevText := strings.TrimSpace(prev.S)
	if prevText == "" || endsWithConnector(prevText) {
		return false
	}

	gap := tokens[idx].X - (prev.X + prev.W)
	threshold := prev.FontSize * 0.1
	if threshold < 0.75 {
		threshold = 0.75
	}

	return gap > threshold
}

func startsWithPunctuation(token string) bool {
	return strings.ContainsRune(",.;:!?)]}", rune(token[0]))
}

func endsWithConnector(token string) bool {
	last := token[len(token)-1]
	return last == '-' || last == '/' || last == '(' || last == '[' || last == '{'
}
