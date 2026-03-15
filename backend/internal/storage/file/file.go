package file

import (
	"bytes"
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
	SaveFile(file io.Reader, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error)
	SaveCoverLetter(file io.Reader, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error)
	SaveCameraReady(file io.Reader, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error)
	Open(path string) (io.ReadCloser, error)
	GetFilePath(conferenceID, submissionID int64, filename string) string
	GetCoverLetterPath(conferenceID, submissionID int64, filename string) string
	GetCameraReadyPath(conferenceID, submissionID int64, filename string) string
	DeleteByPath(path string) error
	DeleteFile(conferenceID, submissionID int64, filename string) error
	DeleteCoverLetter(conferenceID, submissionID int64, filename string) error
	DeleteCameraReady(conferenceID, submissionID int64, filename string) error
}

type LocalFileStorage struct {
	basePath string
}

func NewLocalFileStorage(basePath string) *LocalFileStorage {
	return &LocalFileStorage{
		basePath: basePath,
	}
}

func (s *LocalFileStorage) SaveFile(file io.Reader, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error) {
	format, ok := detectSubmissionFileFormat(header)
	if !ok {
		return nil, fmt.Errorf("only PDF, DOCX, and TEX files are allowed")
	}

	// Validate file size (20MB limit)
	const maxSize = 20 * 1024 * 1024 // 20MB
	if header.Size > maxSize {
		return nil, fmt.Errorf("file size must not exceed 20MB")
	}

	content, err := io.ReadAll(io.LimitReader(file, maxSize+1))
	if err != nil {
		return nil, fmt.Errorf("failed to read uploaded file: %w", err)
	}
	if int64(len(content)) > maxSize {
		return nil, fmt.Errorf("file size must not exceed 20MB")
	}
	if err := validateSubmissionFileBytes(format, content); err != nil {
		return nil, err
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
	if _, err := io.Copy(dst, bytes.NewReader(content)); err != nil {
		os.Remove(filePath) // Clean up on error
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	mimeType := header.Header.Get("Content-Type")
	if strings.TrimSpace(mimeType) == "" {
		mimeType = fallbackSubmissionMIME(format)
	}

	metadata := &dto.SubmissionFileMetadata{
		Filename:     filename,
		OriginalName: header.Filename,
		Size:         int64(len(content)),
		MimeType:     mimeType,
		Path:         filePath,
	}

	return metadata, nil
}

func (s *LocalFileStorage) GetFilePath(conferenceID, submissionID int64, filename string) string {
	return filepath.Join(s.basePath, fmt.Sprintf("%d", conferenceID), fmt.Sprintf("%d", submissionID), filename)
}

func (s *LocalFileStorage) DeleteFile(conferenceID, submissionID int64, filename string) error {
	filePath := s.GetFilePath(conferenceID, submissionID, filename)
	return s.DeleteByPath(filePath)
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

// SaveCoverLetter saves a cover letter file (PDF, DOCX, or TXT)
func (s *LocalFileStorage) SaveCoverLetter(file io.Reader, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error) {
	// Validate file type
	if !s.isValidCoverLetterFormat(header) {
		return nil, fmt.Errorf("only PDF, DOCX, and TXT files are allowed for cover letters")
	}

	// Validate file size (20MB limit)
	const maxSize = 20 * 1024 * 1024 // 20MB
	if header.Size > maxSize {
		return nil, fmt.Errorf("file size must not exceed 20MB")
	}

	content, err := io.ReadAll(io.LimitReader(file, maxSize+1))
	if err != nil {
		return nil, fmt.Errorf("failed to read uploaded file: %w", err)
	}
	if int64(len(content)) > maxSize {
		return nil, fmt.Errorf("file size must not exceed 20MB")
	}

	// Create directory structure (same as main paper)
	dirPath := filepath.Join(s.basePath, fmt.Sprintf("%d", conferenceID), fmt.Sprintf("%d", submissionID))
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}

	// Generate unique filename with cover_letter prefix
	timestamp := time.Now().Unix()
	ext := filepath.Ext(header.Filename)
	nameWithoutExt := strings.TrimSuffix(header.Filename, ext)
	filename := fmt.Sprintf("cover_letter_%d_%s%s", timestamp, s.sanitizeFilename(nameWithoutExt), ext)
	filePath := filepath.Join(dirPath, filename)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, bytes.NewReader(content)); err != nil {
		os.Remove(filePath) // Clean up on error
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	// Validate file format if PDF
	if strings.ToLower(ext) == ".pdf" {
		if err := validatePDFBytes(content); err != nil {
			os.Remove(filePath) // Clean up invalid file
			return nil, err
		}
	}

	mimeType := header.Header.Get("Content-Type")
	if strings.TrimSpace(mimeType) == "" {
		mimeType = fallbackCoverLetterMIME(strings.ToLower(ext))
	}

	metadata := &dto.SubmissionFileMetadata{
		Filename:     filename,
		OriginalName: header.Filename,
		Size:         int64(len(content)),
		MimeType:     mimeType,
		Path:         filePath,
	}

	return metadata, nil
}

// GetCoverLetterPath returns the full path to a cover letter file
func (s *LocalFileStorage) GetCoverLetterPath(conferenceID, submissionID int64, filename string) string {
	return filepath.Join(s.basePath, fmt.Sprintf("%d", conferenceID), fmt.Sprintf("%d", submissionID), filename)
}

// DeleteCoverLetter deletes a cover letter file
func (s *LocalFileStorage) DeleteCoverLetter(conferenceID, submissionID int64, filename string) error {
	filePath := s.GetCoverLetterPath(conferenceID, submissionID, filename)
	return s.DeleteByPath(filePath)
}

func (s *LocalFileStorage) Open(path string) (io.ReadCloser, error) {
	return os.Open(path)
}

func (s *LocalFileStorage) DeleteByPath(path string) error {
	if path == "" {
		return nil
	}
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	return nil
}

// SaveCameraReady saves the camera-ready (final) version of a paper (PDF only).
func (s *LocalFileStorage) SaveCameraReady(file io.Reader, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error) {
	format, ok := detectSubmissionFileFormat(header)
	if !ok || format != submissionFileFormatPDF {
		return nil, fmt.Errorf("only PDF files are allowed for camera-ready upload")
	}

	const maxSize = 20 * 1024 * 1024 // 20MB
	if header.Size > maxSize {
		return nil, fmt.Errorf("file size must not exceed 20MB")
	}

	content, err := io.ReadAll(io.LimitReader(file, maxSize+1))
	if err != nil {
		return nil, fmt.Errorf("failed to read uploaded file: %w", err)
	}
	if int64(len(content)) > maxSize {
		return nil, fmt.Errorf("file size must not exceed 20MB")
	}
	if err := validatePDFBytes(content); err != nil {
		return nil, err
	}

	dirPath := filepath.Join(s.basePath, fmt.Sprintf("%d", conferenceID), fmt.Sprintf("%d", submissionID), "camera_ready")
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}

	timestamp := time.Now().Unix()
	ext := filepath.Ext(header.Filename)
	nameWithoutExt := strings.TrimSuffix(header.Filename, ext)
	filename := fmt.Sprintf("camera_ready_%d_%s%s", timestamp, s.sanitizeFilename(nameWithoutExt), ext)
	filePath := filepath.Join(dirPath, filename)

	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	size, err := io.Copy(dst, bytes.NewReader(content))
	if err != nil {
		os.Remove(filePath)
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	return &dto.SubmissionFileMetadata{
		Filename:     filename,
		OriginalName: header.Filename,
		Size:         size,
		MimeType:     "application/pdf",
		Path:         filePath,
	}, nil
}

// GetCameraReadyPath returns the full path to a camera-ready file.
func (s *LocalFileStorage) GetCameraReadyPath(conferenceID, submissionID int64, filename string) string {
	return filepath.Join(s.basePath, fmt.Sprintf("%d", conferenceID), fmt.Sprintf("%d", submissionID), "camera_ready", filename)
}

// DeleteCameraReady deletes a camera-ready file.
func (s *LocalFileStorage) DeleteCameraReady(conferenceID, submissionID int64, filename string) error {
	filePath := s.GetCameraReadyPath(conferenceID, submissionID, filename)
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete camera-ready file: %w", err)
	}
	return nil
}

// isValidCoverLetterFormat checks if the file is a valid cover letter format (PDF, DOCX, or TXT)
func (s *LocalFileStorage) isValidCoverLetterFormat(header *multipart.FileHeader) bool {
	// Check file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	validExtensions := map[string]bool{
		".pdf":  true,
		".docx": true,
		".txt":  true,
	}

	if !validExtensions[ext] {
		return false
	}

	// Check MIME type (be lenient as browsers may report different types)
	contentType := strings.ToLower(header.Header.Get("Content-Type"))
	validMimeTypes := map[string]bool{
		"application/pdf": true,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
		"text/plain":               true,
		"application/octet-stream": true, // Generic type, rely on extension
	}

	return validMimeTypes[contentType]
}
