package ai_service

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRunSubmissionMaterialGating(t *testing.T) {
	t.Run("posts multipart payload and decodes response", func(t *testing.T) {
		var gotAuth string
		var gotMethod string
		var gotRequestField string
		var gotFileName string
		var gotFileContent []byte

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotAuth = r.Header.Get("Authorization")
			gotMethod = r.Method

			require.NoError(t, r.ParseMultipartForm(1<<20))
			gotRequestField = r.FormValue("request")

			file, header, err := r.FormFile("file")
			require.NoError(t, err)
			defer file.Close()

			gotFileName = header.Filename
			gotFileContent, err = io.ReadAll(file)
			require.NoError(t, err)

			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"run_id":"run-1","verdict":"warn","decision":"manual_review","findings":[{"rule_id":"min_references","source":"deterministic","severity":"block","message":"Too few references","remediation":"Add more references"}]}`))
		}))
		defer server.Close()

		client := NewClient(Config{BaseURL: server.URL, TimeoutSeconds: 5})
		response, err := client.RunSubmissionMaterialGating(
			context.Background(),
			"Bearer token-123",
			&GatingRunRequest{
				Mode:         "advisory",
				Source:       "author_precheck",
				ConferenceID: 42,
				Actor:        ActorPayload{UserID: 7, Email: "author@example.com", Role: "author"},
				FileMetadata: FileMetadataPayload{OriginalFilename: "paper.pdf", ContentType: "application/pdf", SizeBytes: 9},
			},
			"paper.pdf",
			[]byte("%PDF-1.4"),
		)
		require.NoError(t, err)
		require.NotNil(t, response)

		assert.Equal(t, http.MethodPost, gotMethod)
		assert.Equal(t, "Bearer token-123", gotAuth)
		assert.Contains(t, gotRequestField, `"conference_id":42`)
		assert.Equal(t, "paper.pdf", gotFileName)
		assert.Equal(t, []byte("%PDF-1.4"), gotFileContent)
		assert.Equal(t, "run-1", response.RunID)
		assert.Equal(t, "warn", response.Verdict)
		assert.Equal(t, "manual_review", response.Decision)
		require.Len(t, response.Findings, 1)
		assert.Equal(t, "min_references", response.Findings[0].RuleID)
	})

	t.Run("returns response error detail for non-2xx", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusUnprocessableEntity)
			_, _ = w.Write([]byte(`{"detail":"invalid payload"}`))
		}))
		defer server.Close()

		client := NewClient(Config{BaseURL: server.URL, TimeoutSeconds: 5})
		response, err := client.RunSubmissionMaterialGating(
			context.Background(),
			"token-123",
			&GatingRunRequest{
				Mode:         "advisory",
				Source:       "author_precheck",
				ConferenceID: 42,
				Actor:        ActorPayload{UserID: 7},
				FileMetadata: FileMetadataPayload{OriginalFilename: "paper.pdf"},
			},
			"paper.pdf",
			[]byte("%PDF-1.4"),
		)

		require.Error(t, err)
		assert.Nil(t, response)
		assert.Contains(t, err.Error(), "status=422")
		assert.Contains(t, err.Error(), "invalid payload")
	})

	t.Run("retries once on dial error and succeeds", func(t *testing.T) {
		attempts := 0
		client := NewClient(Config{BaseURL: "http://example.test", TimeoutSeconds: 5})
		client.httpClient = &http.Client{
			Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
				attempts++
				if attempts == 1 {
					return nil, &url.Error{
						Op:  r.Method,
						URL: r.URL.String(),
						Err: fmt.Errorf("dial tcp 127.0.0.1:8090: connect: connection refused"),
					}
				}

				return &http.Response{
					StatusCode: http.StatusOK,
					Header:     http.Header{"Content-Type": []string{"application/json"}},
					Body: io.NopCloser(strings.NewReader(
						`{"run_id":"run-retry","input_fingerprint":"fp","policy_hash":"ph","verdict":"pass","decision":"accept_for_review","summary":{"pass_count":1,"warn_count":0,"block_count":0}}`,
					)),
				}, nil
			}),
		}

		response, err := client.RunSubmissionMaterialGating(
			context.Background(),
			"token-123",
			&GatingRunRequest{
				Mode:         "advisory",
				Source:       "author_precheck",
				ConferenceID: 42,
				Actor:        ActorPayload{UserID: 7},
				FileMetadata: FileMetadataPayload{OriginalFilename: "paper.pdf"},
			},
			"paper.pdf",
			[]byte("%PDF-1.4"),
		)

		require.NoError(t, err)
		require.NotNil(t, response)
		assert.Equal(t, 2, attempts)
		assert.Equal(t, "run-retry", response.RunID)
	})
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return fn(r)
}
