package extractor

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

func TestBuildDocumentBuildsStatsSectionsAndKeywords(t *testing.T) {
	t.Helper()

	document, err := buildDocument(&extractedText{
		PageTexts: []string{
			"Abstract\nThis paper studies machine learning systems.\nIntroduction\nWe compare Figure 1 and Table 1.\n[1] prior work",
			"Methods\nKeywords: graph neural network, privacy\nConclusions\nDone.",
		},
	}, *models.NewPaperRuleConfig())
	if err != nil {
		t.Fatalf("buildDocument() error = %v", err)
	}

	if document.Stats.PageCount != 2 {
		t.Fatalf("PageCount = %d, want 2", document.Stats.PageCount)
	}
	if document.Stats.FigureCount != 1 {
		t.Fatalf("FigureCount = %d, want 1", document.Stats.FigureCount)
	}
	if document.Stats.TableCount != 1 {
		t.Fatalf("TableCount = %d, want 1", document.Stats.TableCount)
	}
	if document.Stats.ReferenceCount != 1 {
		t.Fatalf("ReferenceCount = %d, want 1", document.Stats.ReferenceCount)
	}
	if got := document.Sections["Abstract"]; !strings.Contains(got, "machine learning") {
		t.Fatalf("Abstract section = %q, want machine learning content", got)
	}
	if len(document.Keywords) == 0 {
		t.Fatal("Keywords should not be empty")
	}
}

func TestGoPDFBackendExtractsMinimalPDF(t *testing.T) {
	t.Helper()

	tempDir := t.TempDir()
	pdfPath := filepath.Join(tempDir, "sample.pdf")
	if err := os.WriteFile(pdfPath, []byte(buildMinimalPDF("Hello Research PDF")), 0o600); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	extracted, err := goPDFBackend{}.Extract(pdfPath)
	if err != nil {
		t.Fatalf("goPDFBackend.Extract() error = %v", err)
	}

	if len(extracted.PageTexts) != 1 {
		t.Fatalf("page count = %d, want 1", len(extracted.PageTexts))
	}
	if !strings.Contains(extracted.PageTexts[0], "Hello") {
		t.Fatalf("page text = %q, want extracted Hello text", extracted.PageTexts[0])
	}
}

func TestSplitPopplerPagesRemovesTrailingDelimiter(t *testing.T) {
	pages := splitPopplerPages("Page one\fPage two\f")
	if len(pages) != 2 {
		t.Fatalf("len(pages) = %d, want 2", len(pages))
	}
	if pages[0] != "Page one" || pages[1] != "Page two" {
		t.Fatalf("pages = %#v, want trimmed page texts", pages)
	}
}

func buildMinimalPDF(text string) string {
	escape := strings.NewReplacer(`\`, `\\`, `(`, `\(`, `)`, `\)`)
	objects := []string{
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
		fmt.Sprintf("<< /Length %d >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(%s) Tj\nET\nendstream", len("BT\n/F1 24 Tf\n100 700 Td\n("+escape.Replace(text)+") Tj\nET\n"), escape.Replace(text)),
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
	}

	var builder strings.Builder
	builder.WriteString("%PDF-1.4\n")

	offsets := make([]int, 0, len(objects))
	for idx, object := range objects {
		offsets = append(offsets, builder.Len())
		builder.WriteString(fmt.Sprintf("%d 0 obj\n%s\nendobj\n", idx+1, object))
	}

	xrefStart := builder.Len()
	builder.WriteString(fmt.Sprintf("xref\n0 %d\n", len(objects)+1))
	builder.WriteString("0000000000 65535 f \n")
	for _, offset := range offsets {
		builder.WriteString(fmt.Sprintf("%010d 00000 n \n", offset))
	}
	builder.WriteString(fmt.Sprintf("trailer\n<< /Size %d /Root 1 0 R >>\n", len(objects)+1))
	builder.WriteString(fmt.Sprintf("startxref\n%d\n%%%%EOF\n", xrefStart))

	return builder.String()
}
