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

func TestRunSubmissionAutofill(t *testing.T) {
	t.Run("posts multipart request and repeated files", func(t *testing.T) {
		var gotAuth string
		var gotRequestField string
		gotFiles := map[string]string{}

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotAuth = r.Header.Get("Authorization")
			require.Equal(t, http.MethodPost, r.Method)
			require.NoError(t, r.ParseMultipartForm(1<<20))
			gotRequestField = r.FormValue("request")

			for _, fieldName := range []string{"files.file-1", "files.file-2"} {
				files := r.MultipartForm.File[fieldName]
				require.Len(t, files, 1)
				header := files[0]
				file, err := header.Open()
				require.NoError(t, err)
				content, err := io.ReadAll(file)
				require.NoError(t, err)
				require.NoError(t, file.Close())
				gotFiles[header.Filename] = string(content)
			}

			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"run_id":"run-autofill","status":"ready","fields":{"title":{"value":"Title","confidence":"high","evidence":[],"warnings":[]},"abstract":{"value":"Abstract","confidence":"high","evidence":[],"warnings":[]},"keywords":{"value":["ai"],"confidence":"medium","evidence":[],"warnings":[]},"paper_type":{"value":"research","confidence":"medium","evidence":[],"warnings":[]},"additional_notes":{"value":"","confidence":"not_found","evidence":[],"warnings":[]}},"track_rankings":[{"track_name":"AI","confidence":8.5,"rationale":"The submission targets learning systems.","evidence":[],"warnings":[]}],"authors":[],"possible_conflicts":[],"materials":[],"warnings":[]}`))
		}))
		defer server.Close()

		client := NewClient(Config{BaseURL: server.URL, TimeoutSeconds: 5})
		response, err := client.RunSubmissionAutofill(
			context.Background(),
			"token-123",
			&SubmissionAutofillRunRequest{
				ConferenceID:    42,
				Actor:           ActorPayload{UserID: 7, Email: "author@example.com", Role: "author"},
				ExtraDetails:    "Use the revised title.",
				AvailableTracks: []string{"AI"},
				ConferenceContext: SubmissionAutofillConferenceContext{
					Name:        "Conference on AI Systems",
					Acronym:     "CAIS",
					Description: "Research conference for applied AI systems.",
					Domain:      []string{"Artificial Intelligence"},
					CFPText:     "We invite papers on learning systems and evaluation.",
					Tracks:      []string{"AI", "Systems"},
				},
				Files: []SubmissionAutofillFileMetadata{
					{FileID: "file-1", OriginalFilename: "paper.pdf", ContentType: "application/pdf", SizeBytes: 5},
					{FileID: "file-2", OriginalFilename: "appendix.docx", ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", SizeBytes: 8},
				},
			},
			[]SubmissionAutofillFileContent{
				{FileID: "file-1", Filename: "paper.pdf", Content: []byte("paper")},
				{FileID: "file-2", Filename: "appendix.docx", Content: []byte("appendix")},
			},
		)

		require.NoError(t, err)
		require.NotNil(t, response)
		assert.Equal(t, "Bearer token-123", gotAuth)
		assert.Contains(t, gotRequestField, `"conference_id":42`)
		assert.Contains(t, gotRequestField, `"extra_details":"Use the revised title."`)
		assert.Contains(t, gotRequestField, `"conference_context":`)
		assert.Contains(t, gotRequestField, `"acronym":"CAIS"`)
		assert.Contains(t, gotRequestField, `"cfp_text":"We invite papers on learning systems and evaluation."`)
		assert.Contains(t, gotRequestField, `"tracks":["AI","Systems"]`)
		assert.Equal(t, map[string]string{"paper.pdf": "paper", "appendix.docx": "appendix"}, gotFiles)
		assert.Equal(t, "run-autofill", response.RunID)
		assert.Equal(t, "Title", response.Fields.Title.Value)
		require.Len(t, response.TrackRankings, 1)
		assert.Equal(t, "AI", response.TrackRankings[0].TrackName)
		assert.Equal(t, 8.5, response.TrackRankings[0].Confidence)
	})
}

func TestReviewerBriefingClient(t *testing.T) {
	t.Run("lookup posts json payload and decodes response", func(t *testing.T) {
		var gotAuth string
		var gotMethod string
		var gotContentType string
		var gotBody []byte

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotAuth = r.Header.Get("Authorization")
			gotMethod = r.Method
			gotContentType = r.Header.Get("Content-Type")
			var err error
			gotBody, err = io.ReadAll(r.Body)
			require.NoError(t, err)

			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"status":"idle","cache":{"hit":false,"submission_state_fingerprint":"sha256:test"}}`))
		}))
		defer server.Close()

		client := NewClient(Config{BaseURL: server.URL, TimeoutSeconds: 5})
		response, err := client.LookupReviewerBriefing(
			context.Background(),
			"Bearer token-123",
			&ReviewerBriefingResolveRequest{
				Action:                     "lookup",
				ConferenceID:               42,
				AssignmentID:               11,
				SubmissionID:               7,
				Actor:                      ActorPayload{UserID: 7, Email: "reviewer@example.com", Role: "reviewer"},
				SubmissionStateFingerprint: "sha256:test",
				Submission: ReviewerBriefingSubmissionPayload{
					Title:    "Reliable Systems",
					Abstract: "A structured reviewer pre-read workflow.",
					Keywords: []string{"review"},
					Track:    "main",
				},
				FileMetadata: ReviewerBriefingFileMetadataPayload{
					OriginalFilename: "submission.pdf",
					ContentType:      "application/pdf",
					SizeBytes:        4096,
				},
			},
		)
		require.NoError(t, err)
		require.NotNil(t, response)

		assert.Equal(t, http.MethodPost, gotMethod)
		assert.Equal(t, "Bearer token-123", gotAuth)
		assert.Contains(t, gotContentType, "application/json")
		assert.Contains(t, string(gotBody), `"action":"lookup"`)
		assert.Equal(t, "idle", response.Status)
	})

	t.Run("generate posts multipart payload and decodes response", func(t *testing.T) {
		var gotRequestField string
		var gotFileName string
		var gotFileContent []byte

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			require.NoError(t, r.ParseMultipartForm(1<<20))
			gotRequestField = r.FormValue("request_payload")

			file, header, err := r.FormFile("file")
			require.NoError(t, err)
			defer file.Close()

			gotFileName = header.Filename
			gotFileContent, err = io.ReadAll(file)
			require.NoError(t, err)

			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"status":"ready","run_id":"run-1","cache":{"hit":false,"submission_state_fingerprint":"sha256:test"},"artifact":{"submission_snapshot":{"title":"Reliable Systems","abstract_summary":"Summary","manuscript_overview":"Overview","keywords":["review"],"track":"main"},"claimed_contributions":[],"notable_elements":[],"reviewer_attention_points":[],"stated_scope_and_limitations":[],"guardrails":{"no_recommendation":true,"no_score":true,"bias_notice":"assistive only"}}}`))
		}))
		defer server.Close()

		client := NewClient(Config{BaseURL: server.URL, TimeoutSeconds: 5})
		response, err := client.GenerateReviewerBriefing(
			context.Background(),
			"token-123",
			&ReviewerBriefingResolveRequest{
				Action:                     "generate",
				ConferenceID:               42,
				AssignmentID:               11,
				SubmissionID:               7,
				Actor:                      ActorPayload{UserID: 7, Email: "reviewer@example.com", Role: "reviewer"},
				SubmissionStateFingerprint: "sha256:test",
				Submission: ReviewerBriefingSubmissionPayload{
					Title:    "Reliable Systems",
					Abstract: "A structured reviewer pre-read workflow.",
					Keywords: []string{"review"},
					Track:    "main",
				},
				FileMetadata: ReviewerBriefingFileMetadataPayload{
					OriginalFilename: "submission.pdf",
					ContentType:      "application/pdf",
					SizeBytes:        4096,
				},
			},
			"submission.pdf",
			[]byte("%PDF-1.4"),
		)
		require.NoError(t, err)
		require.NotNil(t, response)

		assert.Contains(t, gotRequestField, `"action":"generate"`)
		assert.Equal(t, "submission.pdf", gotFileName)
		assert.Equal(t, []byte("%PDF-1.4"), gotFileContent)
		assert.Equal(t, "ready", response.Status)
		require.NotNil(t, response.Artifact)
		assert.Equal(t, "Reliable Systems", response.Artifact.SubmissionSnapshot.Title)
	})
}

func TestResearchKeywordClient(t *testing.T) {
	t.Run("posts json payload and decodes response", func(t *testing.T) {
		var gotAuth string
		var gotBody []byte

		client := NewClient(Config{BaseURL: "http://example.test", TimeoutSeconds: 5})
		client.httpClient = &http.Client{
			Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
				gotAuth = r.Header.Get("Authorization")
				var err error
				gotBody, err = io.ReadAll(r.Body)
				require.NoError(t, err)

				return &http.Response{
					StatusCode: http.StatusOK,
					Header:     http.Header{"Content-Type": []string{"application/json"}},
					Body: io.NopCloser(strings.NewReader(
						`{"keywords":["Machine Learning","Computer Vision"]}`,
					)),
				}, nil
			}),
		}
		response, err := client.ExtractResearchKeywords(
			context.Background(),
			"Bearer token-123",
			&ResearchKeywordExtractionRequest{
				Papers: []ResearchKeywordPaperSample{
					{Title: "Paper One", Abstract: "Abstract One", Venue: "CVPR", Year: 2025},
				},
			},
		)
		require.NoError(t, err)
		require.NotNil(t, response)

		assert.Equal(t, "Bearer token-123", gotAuth)
		assert.Contains(t, string(gotBody), `"title":"Paper One"`)
		assert.Equal(t, []string{"Machine Learning", "Computer Vision"}, response.Keywords)
	})
}

func TestTrackRecommendationClient(t *testing.T) {
	t.Run("posts json payload and decodes ranked tracks", func(t *testing.T) {
		var gotAuth string
		var gotBody []byte

		client := NewClient(Config{BaseURL: "http://example.test", TimeoutSeconds: 5})
		client.httpClient = &http.Client{
			Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
				gotAuth = r.Header.Get("Authorization")
				var err error
				gotBody, err = io.ReadAll(r.Body)
				require.NoError(t, err)

				return &http.Response{
					StatusCode: http.StatusOK,
					Header:     http.Header{"Content-Type": []string{"application/json"}},
					Body: io.NopCloser(strings.NewReader(
						`{"recommendations":[{"track_name":"AI Systems","confidence":0.92,"reasoning":"Focuses on efficient model serving.","rank":1}]}`,
					)),
				}, nil
			}),
		}
		response, err := client.RecommendTracks(
			context.Background(),
			"token-123",
			&TrackRecommendationRequest{
				Conference: TrackRecommendationConferenceContext{
					Title:       "ConferenceSpace 2026",
					Acronym:     "CS26",
					Description: "Systems and AI conference",
					Domains:     []string{"AI", "Systems"},
					Tracks:      []string{"AI Systems", "Theory"},
				},
				Paper: TrackRecommendationPaperContext{
					Title:    "Serving LLMs Efficiently",
					Abstract: "We optimize online inference stacks for production serving.",
					Keywords: []string{"LLM Serving", "Inference Systems"},
				},
			},
		)
		require.NoError(t, err)
		require.NotNil(t, response)

		assert.Equal(t, "Bearer token-123", gotAuth)
		assert.Contains(t, string(gotBody), `"tracks":["AI Systems","Theory"]`)
		require.Len(t, response.Recommendations, 1)
		assert.Equal(t, "AI Systems", response.Recommendations[0].TrackName)
		assert.Equal(t, 1, response.Recommendations[0].Rank)
	})
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return fn(r)
}
