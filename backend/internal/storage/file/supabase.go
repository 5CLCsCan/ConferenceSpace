package file

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"path/filepath"
	"strings"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

const maxUploadSize int64 = 20 * 1024 * 1024 // 20MB

type SupabaseFileStorageConfig struct {
	URL            string
	ServiceRoleKey string
	Bucket         string
	HTTPClient     *http.Client
}

type SupabaseFileStorage struct {
	baseURL        string
	serviceRoleKey string
	bucket         string
	httpClient     *http.Client
}

func NewSupabaseFileStorage(cfg SupabaseFileStorageConfig) (*SupabaseFileStorage, error) {
	baseURL := strings.TrimSpace(strings.TrimRight(cfg.URL, "/"))
	bucket := strings.TrimSpace(cfg.Bucket)
	serviceRoleKey := strings.TrimSpace(cfg.ServiceRoleKey)

	if baseURL == "" {
		return nil, fmt.Errorf("supabase URL is required")
	}
	if serviceRoleKey == "" {
		return nil, fmt.Errorf("supabase service role key is required")
	}
	if bucket == "" {
		return nil, fmt.Errorf("supabase storage bucket is required")
	}

	client := cfg.HTTPClient
	if client == nil {
		client = &http.Client{Timeout: 60 * time.Second}
	}

	return &SupabaseFileStorage{
		baseURL:        baseURL,
		serviceRoleKey: serviceRoleKey,
		bucket:         bucket,
		httpClient:     client,
	}, nil
}

func (s *SupabaseFileStorage) SaveFile(file io.Reader, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error) {
	if !isValidPDFHeader(header) {
		return nil, fmt.Errorf("only PDF files are allowed")
	}
	if header.Size > maxUploadSize {
		return nil, fmt.Errorf("file size must not exceed 20MB")
	}

	content, err := readContentWithLimit(file, maxUploadSize)
	if err != nil {
		return nil, err
	}
	if err := validatePDFBytes(content); err != nil {
		return nil, err
	}

	ext := filepath.Ext(header.Filename)
	nameWithoutExt := strings.TrimSuffix(header.Filename, ext)
	filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), sanitizeFilename(nameWithoutExt), ext)
	objectPath := s.GetFilePath(conferenceID, submissionID, filename)

	mimeType := header.Header.Get("Content-Type")
	if strings.TrimSpace(mimeType) == "" {
		mimeType = "application/pdf"
	}
	if err := s.uploadObject(objectPath, mimeType, content); err != nil {
		return nil, err
	}

	return &dto.SubmissionFileMetadata{
		Filename:     filename,
		OriginalName: header.Filename,
		Size:         int64(len(content)),
		MimeType:     mimeType,
		Path:         objectPath,
	}, nil
}

func (s *SupabaseFileStorage) SaveCoverLetter(file io.Reader, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error) {
	if !isValidCoverLetterHeader(header) {
		return nil, fmt.Errorf("only PDF, DOCX, and TXT files are allowed for cover letters")
	}
	if header.Size > maxUploadSize {
		return nil, fmt.Errorf("file size must not exceed 20MB")
	}

	content, err := readContentWithLimit(file, maxUploadSize)
	if err != nil {
		return nil, err
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == ".pdf" {
		if err := validatePDFBytes(content); err != nil {
			return nil, err
		}
	}

	nameWithoutExt := strings.TrimSuffix(header.Filename, filepath.Ext(header.Filename))
	filename := fmt.Sprintf("cover_letter_%d_%s%s", time.Now().Unix(), sanitizeFilename(nameWithoutExt), filepath.Ext(header.Filename))
	objectPath := s.GetCoverLetterPath(conferenceID, submissionID, filename)

	mimeType := header.Header.Get("Content-Type")
	if strings.TrimSpace(mimeType) == "" {
		mimeType = fallbackCoverLetterMIME(ext)
	}
	if err := s.uploadObject(objectPath, mimeType, content); err != nil {
		return nil, err
	}

	return &dto.SubmissionFileMetadata{
		Filename:     filename,
		OriginalName: header.Filename,
		Size:         int64(len(content)),
		MimeType:     mimeType,
		Path:         objectPath,
	}, nil
}

func (s *SupabaseFileStorage) Open(path string) (io.ReadCloser, error) {
	if strings.TrimSpace(path) == "" {
		return nil, fmt.Errorf("file path is required")
	}

	req, err := http.NewRequest(http.MethodGet, s.objectURL(path), nil)
	if err != nil {
		return nil, err
	}
	s.applyAuthHeaders(req.Header)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch object from supabase: %w", err)
	}

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		_ = resp.Body.Close()
		return nil, fmt.Errorf("failed to fetch object from supabase: status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	return resp.Body, nil
}

func (s *SupabaseFileStorage) GetFilePath(conferenceID, submissionID int64, filename string) string {
	return fmt.Sprintf("conferences/%d/submissions/%d/%s", conferenceID, submissionID, filename)
}

func (s *SupabaseFileStorage) GetCoverLetterPath(conferenceID, submissionID int64, filename string) string {
	return fmt.Sprintf("conferences/%d/submissions/%d/%s", conferenceID, submissionID, filename)
}

func (s *SupabaseFileStorage) DeleteByPath(path string) error {
	if strings.TrimSpace(path) == "" {
		return nil
	}

	req, err := http.NewRequest(http.MethodDelete, s.objectURL(path), nil)
	if err != nil {
		return err
	}
	s.applyAuthHeaders(req.Header)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete object from supabase: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("failed to delete object from supabase: status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	return nil
}

func (s *SupabaseFileStorage) DeleteFile(conferenceID, submissionID int64, filename string) error {
	return s.DeleteByPath(s.GetFilePath(conferenceID, submissionID, filename))
}

func (s *SupabaseFileStorage) DeleteCoverLetter(conferenceID, submissionID int64, filename string) error {
	return s.DeleteByPath(s.GetCoverLetterPath(conferenceID, submissionID, filename))
}

func (s *SupabaseFileStorage) uploadObject(path, mimeType string, content []byte) error {
	req, err := http.NewRequest(http.MethodPost, s.objectURL(path), bytes.NewReader(content))
	if err != nil {
		return err
	}
	s.applyAuthHeaders(req.Header)
	req.Header.Set("x-upsert", "true")
	req.Header.Set("Content-Type", mimeType)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to upload object to supabase: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("failed to upload object to supabase: status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	return nil
}

func (s *SupabaseFileStorage) objectURL(objectPath string) string {
	escapedBucket := url.PathEscape(s.bucket)
	escapedObject := escapePath(objectPath)
	return fmt.Sprintf("%s/storage/v1/object/%s/%s", s.baseURL, escapedBucket, escapedObject)
}

func (s *SupabaseFileStorage) applyAuthHeaders(header http.Header) {
	header.Set("Authorization", "Bearer "+s.serviceRoleKey)
	header.Set("apikey", s.serviceRoleKey)
}

func escapePath(objectPath string) string {
	parts := strings.Split(objectPath, "/")
	for i := range parts {
		parts[i] = url.PathEscape(parts[i])
	}
	return strings.Join(parts, "/")
}

func readContentWithLimit(r io.Reader, maxBytes int64) ([]byte, error) {
	limited := io.LimitReader(r, maxBytes+1)
	content, err := io.ReadAll(limited)
	if err != nil {
		return nil, fmt.Errorf("failed to read uploaded file: %w", err)
	}
	if int64(len(content)) > maxBytes {
		return nil, fmt.Errorf("file size must not exceed 20MB")
	}
	if len(content) == 0 {
		return nil, fmt.Errorf("file appears to be empty")
	}
	return content, nil
}

func validatePDFBytes(content []byte) error {
	if len(content) < 8 {
		return fmt.Errorf("file appears to be corrupted")
	}
	if string(content[:5]) != "%PDF-" {
		return fmt.Errorf("file is not a valid PDF")
	}
	return nil
}

func isValidPDFHeader(header *multipart.FileHeader) bool {
	contentType := header.Header.Get("Content-Type")
	if contentType != "application/pdf" {
		return false
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	return ext == ".pdf"
}

func isValidCoverLetterHeader(header *multipart.FileHeader) bool {
	ext := strings.ToLower(filepath.Ext(header.Filename))
	validExtensions := map[string]bool{
		".pdf":  true,
		".docx": true,
		".txt":  true,
	}
	if !validExtensions[ext] {
		return false
	}

	contentType := strings.ToLower(header.Header.Get("Content-Type"))
	validMimeTypes := map[string]bool{
		"application/pdf": true,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
		"text/plain":               true,
		"application/octet-stream": true,
	}
	return validMimeTypes[contentType]
}

func sanitizeFilename(filename string) string {
	invalidChars := []string{"<", ">", ":", "\"", "|", "?", "*", "\x00"}
	result := filename
	for _, char := range invalidChars {
		result = strings.ReplaceAll(result, char, "_")
	}
	if len(result) > 100 {
		result = result[:100]
	}
	return result
}

func fallbackCoverLetterMIME(ext string) string {
	switch ext {
	case ".pdf":
		return "application/pdf"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	default:
		return "text/plain"
	}
}
