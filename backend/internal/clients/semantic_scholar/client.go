package semantic_scholar

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"golang.org/x/time/rate"
)

const (
	baseURL = "https://api.semanticscholar.org/graph/v1"
)

// Client provides access to Semantic Scholar API
type Client struct {
	apiKey     string
	httpClient *http.Client
	limiter    *rate.Limiter
}

// Config holds Semantic Scholar client configuration
type Config struct {
	APIKey string
}

// NewClient creates a new Semantic Scholar client
func NewClient(cfg Config) *Client {
	// Limit to 1 request per second with a burst of 1
	limiter := rate.NewLimiter(rate.Every(1*time.Second), 1)

	return &Client{
		apiKey: cfg.APIKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		limiter: limiter,
	}
}

// Author represents a Semantic Scholar author
type Author struct {
	AuthorID               string                  `json:"authorId"`
	Name                   string                  `json:"name"`
	Affiliations           []string                `json:"affiliations,omitempty"`
	NormalizedAffiliations []NormalizedAffiliation `json:"normalizedAffiliations,omitempty"`
	ExternalIDs            map[string]interface{}  `json:"externalIds,omitempty"`
	Homepage               string                  `json:"homepage,omitempty"`
	PaperCount             int                     `json:"paperCount,omitempty"`
	CitationCount          int                     `json:"citationCount,omitempty"`
	HIndex                 int                     `json:"hIndex,omitempty"`
	URL                    string                  `json:"url,omitempty"`
	// Papers carries the author's papers when the caller includes
	// `papers.*` in the `fields` parameter. Used by SearchAuthors to
	// aggregate FieldsOfStudy below; left empty otherwise.
	Papers []Paper `json:"papers,omitempty"`
	// FieldsOfStudy is a deduplicated, sorted aggregation of each paper's
	// s2FieldsOfStudy / fieldsOfStudy values. Computed server-side (see
	// aggregateAuthorFieldsOfStudy) so the frontend can render topic chips
	// without paying for a second round-trip.
	FieldsOfStudy []string `json:"fieldsOfStudy,omitempty"`
}

type NormalizedAffiliation struct {
	RORID          string `json:"rorId"`
	RORDisplayName string `json:"rorDisplayName"`
}

// S2FieldOfStudy is the tagged topic returned by Semantic Scholar for each
// paper. `Category` is the displayable field name (e.g. "Computer Science"),
// `Source` is either "external" (legacy Microsoft Academic Graph tag) or
// "s2-fos-model" (S2's own classifier).
type S2FieldOfStudy struct {
	Category string `json:"category"`
	Source   string `json:"source,omitempty"`
}

// Paper represents a paper in Semantic Scholar
type Paper struct {
	PaperID         string           `json:"paperId"`
	CorpusID        int64            `json:"corpusId,omitempty"`
	Title           string           `json:"title"`
	Abstract        string           `json:"abstract,omitempty"`
	Year            int              `json:"year,omitempty"`
	CitationCount   int              `json:"citationCount,omitempty"`
	ReferenceCount  int              `json:"referenceCount,omitempty"`
	Venue           string           `json:"venue,omitempty"`
	Authors         []Author         `json:"authors,omitempty"`
	URL             string           `json:"url,omitempty"`
	FieldsOfStudy   []string         `json:"fieldsOfStudy,omitempty"`
	S2FieldsOfStudy []S2FieldOfStudy `json:"s2FieldsOfStudy,omitempty"`
}

// AuthorWithPapers represents an author with their papers
type AuthorWithPapers struct {
	Author
	Papers []Paper `json:"papers,omitempty"`
}

// SearchResponse represents the search results
type SearchResponse struct {
	Total  int      `json:"total"`
	Offset int      `json:"offset"`
	Next   int      `json:"next,omitempty"`
	Data   []Author `json:"data"`
}

// PapersResponse represents the author papers response
type PapersResponse struct {
	Offset int     `json:"offset"`
	Next   int     `json:"next,omitempty"`
	Data   []Paper `json:"data"`
}

// PaperSearchResponse represents the paper search results
type PaperSearchResponse struct {
	Total  int     `json:"total"`
	Offset int     `json:"offset"`
	Next   int     `json:"next,omitempty"`
	Data   []Paper `json:"data"`
}

// doRequest performs an HTTP request with API key authentication
func (c *Client) doRequest(ctx context.Context, method, path string, body interface{}) ([]byte, error) {
	// Wait for rate limiter permission
	if err := c.limiter.Wait(ctx); err != nil {
		return nil, fmt.Errorf("rate limiter error: %w", err)
	}

	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	url := baseURL + path
	req, err := http.NewRequestWithContext(ctx, method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("x-api-key", c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("semantic scholar API error: status %d, body: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

// SearchAuthors searches for authors by name
// Includes additional fields for display: affiliations, paperCount, citationCount, hIndex,
// plus each paper's s2FieldsOfStudy / fieldsOfStudy so the caller can derive
// per-author topic chips without a second round-trip.
func (c *Client) SearchAuthors(ctx context.Context, query string, limit int) (*SearchResponse, error) {
	if limit <= 0 {
		limit = 30
	}

	// Include additional fields so search results have enough info for display
	fields := "authorId,name,affiliations,externalIds,homepage,paperCount,citationCount,hIndex,url," +
		"papers.title,papers.year,papers.venue,papers.fieldsOfStudy,papers.s2FieldsOfStudy"
	path := fmt.Sprintf("/author/search?query=%s&limit=%d&fields=%s",
		url.QueryEscape(query), limit, fields)

	respBody, err := c.doRequest(ctx, "GET", path, nil)
	if err != nil {
		return nil, err
	}

	var result SearchResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Flatten each author's paper-level topic tags into a deduplicated
	// FieldsOfStudy list on the Author itself, so the frontend can render
	// domain chips in the search dropdown without paying for a second API
	// call or re-implementing the same aggregation on the client.
	for i := range result.Data {
		result.Data[i].FieldsOfStudy = aggregateAuthorFieldsOfStudy(result.Data[i].Papers)
	}

	return &result, nil
}

// aggregateAuthorFieldsOfStudy flattens each paper's FieldsOfStudy and
// S2FieldsOfStudy into a deduplicated, alphabetically sorted slice. We use
// both lists because S2 populates `fieldsOfStudy` for older / externally
// tagged papers and `s2FieldsOfStudy` for everything their classifier has
// scored — some papers only have one or the other. Empty / whitespace-only
// categories are dropped. The returned slice is always nil when no topics
// are present (avoids empty `[]` in JSON payloads for authors without any
// paper topics).
func aggregateAuthorFieldsOfStudy(papers []Paper) []string {
	if len(papers) == 0 {
		return nil
	}
	seen := make(map[string]struct{})
	for _, p := range papers {
		for _, f := range p.FieldsOfStudy {
			if t := strings.TrimSpace(f); t != "" {
				seen[t] = struct{}{}
			}
		}
		for _, s := range p.S2FieldsOfStudy {
			if t := strings.TrimSpace(s.Category); t != "" {
				seen[t] = struct{}{}
			}
		}
	}
	if len(seen) == 0 {
		return nil
	}
	out := make([]string, 0, len(seen))
	for k := range seen {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

// SearchPapers searches for papers by keyword query.
// Returns papers with their authors, useful for discovering potential reviewers.
func (c *Client) SearchPapers(ctx context.Context, query string, limit int) (*PaperSearchResponse, error) {
	if limit <= 0 {
		limit = 20
	}

	fields := "paperId,title,year,citationCount,venue,authors,authors.authorId,authors.name,authors.affiliations,authors.hIndex,authors.citationCount,authors.paperCount"
	path := fmt.Sprintf("/paper/search?query=%s&limit=%d&fields=%s",
		url.QueryEscape(query), limit, fields)

	respBody, err := c.doRequest(ctx, "GET", path, nil)
	if err != nil {
		return nil, err
	}

	var result PaperSearchResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &result, nil
}

// GetAuthorDetails retrieves detailed information about an author including papers
func (c *Client) GetAuthorDetails(ctx context.Context, authorID string) (*AuthorWithPapers, error) {
	// Request all fields including papers
	fields := "authorId,name,affiliations,externalIds,homepage,paperCount,citationCount,hIndex,url,papers,papers.paperId,papers.title,papers.year,papers.citationCount,papers.abstract,papers.venue,papers.url,papers.authors"
	path := fmt.Sprintf("/author/%s?fields=%s", authorID, fields)

	respBody, err := c.doRequest(ctx, "GET", path, nil)
	if err != nil {
		return nil, err
	}

	var result AuthorWithPapers
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &result, nil
}

// GetAuthorPapers retrieves paginated papers for an author
func (c *Client) GetAuthorPapers(ctx context.Context, authorID string, offset, limit int) (*PapersResponse, error) {
	if limit <= 0 {
		limit = 100
	}

	fields := "paperId,title,year,citationCount,abstract,venue,url,authors,authors.authorId,authors.name"
	path := fmt.Sprintf("/author/%s/papers?offset=%d&limit=%d&fields=%s", authorID, offset, limit, fields)

	respBody, err := c.doRequest(ctx, "GET", path, nil)
	if err != nil {
		return nil, err
	}

	var result PapersResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &result, nil
}
