package pipeline

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/dcao/conferencespace/internal/deskrejection/models"
)

type fakeTextGenerator struct {
	response string
	err      error
}

func (f fakeTextGenerator) GenerateText(ctx context.Context, prompt string) (string, error) {
	if f.err != nil {
		return "", f.err
	}
	return f.response, nil
}

func TestRun_DegradesGracefullyWhenLLMFails(t *testing.T) {
	t.Helper()

	tempDir := t.TempDir()
	pdfPath := filepath.Join(tempDir, "paper.pdf")
	if err := os.WriteFile(pdfPath, []byte(buildMinimalPDF("Abstract\nThis paper studies machine learning.\nIntroduction\nResults and conclusions.")), 0o600); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	ctx := context.WithValue(context.Background(), "gemini_client", fakeTextGenerator{
		err: errors.New("quota exceeded"),
	})

	report, err := Run(ctx, pdfPath, models.NewPaperRuleConfig())
	if err != nil {
		t.Fatalf("Run() error = %v, want graceful degradation", err)
	}

	if len(report.DetailedResults) == 0 {
		t.Fatal("DetailedResults should not be empty when deterministic checks still run")
	}
	if report.Decision == "" {
		t.Fatal("Decision should still be produced when LLM fails")
	}
}

func buildMinimalPDF(text string) string {
	escape := strings.NewReplacer(`\`, `\\`, `(`, `\(`, `)`, `\)`)
	escapedText := escape.Replace(text)
	stream := fmt.Sprintf("BT\n/F1 24 Tf\n100 700 Td\n(%s) Tj\nET\n", escapedText)

	objects := []string{
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
		fmt.Sprintf("<< /Length %d >>\nstream\n%sendstream", len(stream), stream),
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
