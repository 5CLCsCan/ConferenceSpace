package file

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

type StorageInterface interface {
	SaveFile(file multipart.File, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error)
	GetFilePath(conferenceID, submissionID int64, filename string) string
	DeleteFile(conferenceID, submissionID int64, filename string) error
}

type LocalFileStorage struct {
	basePath string
}

func NewLocalFileStorage(basePath string) *LocalFileStorage {
	return &LocalFileStorage{
		basePath: basePath,
	}
}

func (s *LocalFileStorage) SaveFile(file multipart.File, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error) {
	// Validate file type
	if !s.isValidPDF(header) {
		return nil, fmt.Errorf("only PDF files are allowed")
	}

	// Validate file size (20MB limit)
	const maxSize = 20 * 1024 * 1024 // 20MB
	if header.Size > maxSize {
		return nil, fmt.Errorf("file size must not exceed 20MB")
	}

	// Create directory structure
	dirPath := filepath.Join(s.basePath, fmt.Sprintf("%d", conferenceID), fmt.Sprintf("%d", submissionID))
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}

	// Generate unique filename
	timestamp := time.Now().Unix()
	ext := filepath.Ext(header.Filename)
	nameWithoutExt := strings.TrimSuffix(header.Filename, ext)
	filename := fmt.Sprintf("%d_%s%s", timestamp, s.sanitizeFilename(nameWithoutExt), ext)
	filePath := filepath.Join(dirPath, filename)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, file); err != nil {
		os.Remove(filePath) // Clean up on error
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	// Basic PDF validation (check if it starts with PDF header)
	if err := s.validatePDFHeader(filePath); err != nil {
		os.Remove(filePath) // Clean up invalid file
		return nil, err
	}

	metadata := &dto.SubmissionFileMetadata{
		Filename:     filename,
		OriginalName: header.Filename,
		Size:         header.Size,
		MimeType:     header.Header.Get("Content-Type"),
		Path:         filePath,
	}

	return metadata, nil
}

func (s *LocalFileStorage) GetFilePath(conferenceID, submissionID int64, filename string) string {
	return filepath.Join(s.basePath, fmt.Sprintf("%d", conferenceID), fmt.Sprintf("%d", submissionID), filename)
}

func (s *LocalFileStorage) DeleteFile(conferenceID, submissionID int64, filename string) error {
	filePath := s.GetFilePath(conferenceID, submissionID, filename)
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	return nil
}

func (s *LocalFileStorage) isValidPDF(header *multipart.FileHeader) bool {
	// Check MIME type
	contentType := header.Header.Get("Content-Type")
	if contentType != "application/pdf" {
		return false
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	return ext == ".pdf"
}

func (s *LocalFileStorage) sanitizeFilename(filename string) string {
	// Remove or replace invalid characters
	invalidChars := []string{"<", ">", ":", "\"", "|", "?", "*", "\x00"}
	result := filename

	for _, char := range invalidChars {
		result = strings.ReplaceAll(result, char, "_")
	}

	// Limit length
	if len(result) > 100 {
		result = result[:100]
	}

	return result
}

func (s *LocalFileStorage) validatePDFHeader(filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file for validation: %w", err)
	}
	defer file.Close()

	// Read first few bytes to check PDF header
	header := make([]byte, 8)
	n, err := file.Read(header)
	if err != nil || n < 8 {
		return fmt.Errorf("file appears to be corrupted")
	}

	// PDF files start with "%PDF-"
	if string(header[:5]) != "%PDF-" {
		return fmt.Errorf("file is not a valid PDF")
	}

	return nil
}
