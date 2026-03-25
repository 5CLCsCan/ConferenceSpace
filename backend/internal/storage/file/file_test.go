package file

import (
	"bytes"
	"mime/multipart"
	"net/textproto"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLocalFileStorageSaveFileAcceptsSupportedSubmissionFormats(t *testing.T) {
	storage := NewLocalFileStorage(t.TempDir())

	testCases := []struct {
		name        string
		filename    string
		contentType string
		content     []byte
	}{
		{
			name:        "pdf",
			filename:    "paper.pdf",
			contentType: "application/pdf",
			content:     []byte("%PDF-1.4\n%%EOF"),
		},
		{
			name:        "docx",
			filename:    "paper.docx",
			contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			content:     []byte("PK\x03\x04word/document.xml"),
		},
		{
			name:        "tex",
			filename:    "paper.tex",
			contentType: "application/x-tex",
			content:     []byte("\\documentclass{article}\n\\begin{document}Hello\\end{document}"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			metadata, err := storage.SaveFile(
				bytes.NewReader(tc.content),
				newMultipartFileHeader(tc.filename, tc.contentType, int64(len(tc.content))),
				1,
				2,
			)
			require.NoError(t, err)
			require.NotNil(t, metadata)
			assert.Equal(t, tc.filename, metadata.OriginalName)
			assert.Equal(t, int64(len(tc.content)), metadata.Size)
			assert.Equal(t, strings.ToLower(filepath.Ext(tc.filename)), strings.ToLower(filepath.Ext(metadata.Filename)))
		})
	}
}

func TestLocalFileStorageSaveFileRejectsUnsupportedFormat(t *testing.T) {
	storage := NewLocalFileStorage(t.TempDir())

	metadata, err := storage.SaveFile(
		bytes.NewReader([]byte("PK\x03\x04pptx")),
		newMultipartFileHeader("slides.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", 8),
		1,
		2,
	)

	require.Error(t, err)
	assert.Nil(t, metadata)
	assert.Contains(t, err.Error(), "only PDF, DOCX, and TEX files are allowed")
}

func newMultipartFileHeader(filename string, contentType string, size int64) *multipart.FileHeader {
	header := make(textproto.MIMEHeader)
	header.Set("Content-Type", contentType)
	return &multipart.FileHeader{
		Filename: filename,
		Size:     size,
		Header:   header,
	}
}
