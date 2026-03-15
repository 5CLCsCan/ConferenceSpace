package file

import (
	"bytes"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
)

type submissionFileFormat string

const (
	submissionFileFormatPDF  submissionFileFormat = "pdf"
	submissionFileFormatDOCX submissionFileFormat = "docx"
	submissionFileFormatTEX  submissionFileFormat = "tex"
)

func detectSubmissionFileFormat(header *multipart.FileHeader) (submissionFileFormat, bool) {
	if header == nil {
		return "", false
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	contentType := strings.ToLower(strings.TrimSpace(header.Header.Get("Content-Type")))

	switch ext {
	case ".pdf":
		return submissionFileFormatPDF, contentType == "application/pdf" || contentType == "application/octet-stream"
	case ".docx":
		switch contentType {
		case "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream":
			return submissionFileFormatDOCX, true
		default:
			return "", false
		}
	case ".tex":
		switch contentType {
		case "application/x-tex", "text/x-tex", "text/plain", "application/octet-stream":
			return submissionFileFormatTEX, true
		default:
			return "", false
		}
	default:
		return "", false
	}
}

func isValidSubmissionFileHeader(header *multipart.FileHeader) bool {
	_, ok := detectSubmissionFileFormat(header)
	return ok
}

func validateSubmissionFileBytes(format submissionFileFormat, content []byte) error {
	switch format {
	case submissionFileFormatPDF:
		return validatePDFBytes(content)
	case submissionFileFormatDOCX:
		return validateDOCXBytes(content)
	case submissionFileFormatTEX:
		return validateTEXBytes(content)
	default:
		return fmt.Errorf("unsupported submission file format")
	}
}

func validateDOCXBytes(content []byte) error {
	if len(content) < 4 {
		return fmt.Errorf("file appears to be corrupted")
	}
	if !(bytes.HasPrefix(content, []byte("PK\x03\x04")) || bytes.HasPrefix(content, []byte("PK\x05\x06")) || bytes.HasPrefix(content, []byte("PK\x07\x08"))) {
		return fmt.Errorf("file is not a valid DOCX document")
	}
	return nil
}

func validateTEXBytes(content []byte) error {
	if len(content) == 0 {
		return fmt.Errorf("file appears to be empty")
	}
	if bytes.IndexByte(content, 0) >= 0 {
		return fmt.Errorf("file is not a valid TeX source file")
	}
	return nil
}

func fallbackSubmissionMIME(format submissionFileFormat) string {
	switch format {
	case submissionFileFormatPDF:
		return "application/pdf"
	case submissionFileFormatDOCX:
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case submissionFileFormatTEX:
		return "application/x-tex"
	default:
		return "application/octet-stream"
	}
}
