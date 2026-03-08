package file

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strings"
	"sync"
	"testing"
)

func TestNewSupabaseFileStorage_Validation(t *testing.T) {
	_, err := NewSupabaseFileStorage(SupabaseFileStorageConfig{})
	if err == nil {
		t.Fatalf("expected validation error for empty config")
	}
}

func TestSupabaseFileStorage_SaveOpenDeleteFile(t *testing.T) {
	transport := &fakeSupabaseTransport{
		t:       t,
		objects: map[string][]byte{},
	}

	storage, err := NewSupabaseFileStorage(SupabaseFileStorageConfig{
		URL:            "https://example.supabase.co",
		ServiceRoleKey: "service-role-key",
		Bucket:         "test-bucket",
		HTTPClient: &http.Client{
			Transport: transport,
		},
	})
	if err != nil {
		t.Fatalf("failed to create storage: %v", err)
	}

	pdf := []byte("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n")
	fileHeader := testFileHeader("paper.pdf", int64(len(pdf)), "application/pdf")

	metadata, err := storage.SaveFile(bytes.NewReader(pdf), fileHeader, 10, 20)
	if err != nil {
		t.Fatalf("SaveFile failed: %v", err)
	}
	if !strings.HasPrefix(metadata.Path, "conferences/10/submissions/20/") {
		t.Fatalf("unexpected object path: %s", metadata.Path)
	}

	reader, err := storage.Open(metadata.Path)
	if err != nil {
		t.Fatalf("Open failed: %v", err)
	}
	readBack, err := io.ReadAll(reader)
	_ = reader.Close()
	if err != nil {
		t.Fatalf("failed to read opened file: %v", err)
	}
	if !bytes.Equal(readBack, pdf) {
		t.Fatalf("opened content mismatch")
	}

	if err := storage.DeleteByPath(metadata.Path); err != nil {
		t.Fatalf("DeleteByPath failed: %v", err)
	}

	if _, err := storage.Open(metadata.Path); err == nil {
		t.Fatalf("expected open error after delete")
	}
}

func TestSupabaseFileStorage_RejectsInvalidPDF(t *testing.T) {
	storage, err := NewSupabaseFileStorage(SupabaseFileStorageConfig{
		URL:            "https://example.supabase.co",
		ServiceRoleKey: "service-role-key",
		Bucket:         "test-bucket",
	})
	if err != nil {
		t.Fatalf("failed to create storage: %v", err)
	}

	fileHeader := testFileHeader("paper.pdf", 4, "application/pdf")
	if _, err := storage.SaveFile(bytes.NewReader([]byte("oops")), fileHeader, 1, 1); err == nil {
		t.Fatalf("expected invalid PDF error")
	}
}

func testFileHeader(filename string, size int64, contentType string) *multipart.FileHeader {
	header := textproto.MIMEHeader{}
	header.Set("Content-Type", contentType)
	return &multipart.FileHeader{
		Filename: filename,
		Size:     size,
		Header:   header,
	}
}

type fakeSupabaseTransport struct {
	t       *testing.T
	mu      sync.Mutex
	objects map[string][]byte
}

func (f *fakeSupabaseTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	if req.Header.Get("Authorization") == "" || req.Header.Get("apikey") == "" {
		return newResponse(http.StatusUnauthorized, []byte("missing auth")), nil
	}

	const prefix = "/storage/v1/object/test-bucket/"
	if !strings.HasPrefix(req.URL.Path, prefix) {
		return newResponse(http.StatusNotFound, []byte("not found")), nil
	}
	objectPath := strings.TrimPrefix(req.URL.Path, prefix)

	switch req.Method {
	case http.MethodPost:
		content, err := io.ReadAll(req.Body)
		if err != nil {
			return nil, err
		}
		f.mu.Lock()
		f.objects[objectPath] = content
		f.mu.Unlock()
		return newResponse(http.StatusOK, []byte(`{"ok":true}`)), nil
	case http.MethodGet:
		f.mu.Lock()
		content, ok := f.objects[objectPath]
		f.mu.Unlock()
		if !ok {
			return newResponse(http.StatusNotFound, []byte("not found")), nil
		}
		return newResponse(http.StatusOK, content), nil
	case http.MethodDelete:
		f.mu.Lock()
		delete(f.objects, objectPath)
		f.mu.Unlock()
		return newResponse(http.StatusOK, []byte(`{"deleted":true}`)), nil
	default:
		return newResponse(http.StatusMethodNotAllowed, []byte("unsupported method")), nil
	}
}

func newResponse(status int, body []byte) *http.Response {
	return &http.Response{
		StatusCode: status,
		Status:     fmt.Sprintf("%d %s", status, http.StatusText(status)),
		Body:       io.NopCloser(bytes.NewReader(body)),
		Header:     make(http.Header),
	}
}
