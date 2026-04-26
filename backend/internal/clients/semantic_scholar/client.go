package semantic_scholar

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
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
	AuthorID      string   `json:"authorId"`
	Name          string   `json:"name"`
	Affiliations  []string `json:"affiliations,omitempty"`
	Homepage      string   `json:"homepage,omitempty"`
	PaperCount    int      `json:"paperCount,omitempty"`
	CitationCount int      `json:"citationCount,omitempty"`
	HIndex        int      `json:"hIndex,omitempty"`
	URL           string   `json:"url,omitempty"`
}

// Paper represents a paper in Semantic Scholar
type Paper struct {
	PaperID        string   `json:"paperId"`
	CorpusID       int64    `json:"corpusId,omitempty"`
	Title          string   `json:"title"`
	Abstract       string   `json:"abstract,omitempty"`
	Year           int      `json:"year,omitempty"`
	CitationCount  int      `json:"citationCount,omitempty"`
	ReferenceCount int      `json:"referenceCount,omitempty"`
	Venue          string   `json:"venue,omitempty"`
	Authors        []Author `json:"authors,omitempty"`
	URL            string   `json:"url,omitempty"`
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
// Includes additional fields for display: affiliations, paperCount, citationCount, hIndex
func (c *Client) SearchAuthors(ctx context.Context, query string, limit int) (*SearchResponse, error) {
	if limit <= 0 {
		limit = 30
	}

	// Include additional fields so search results have enough info for display
	fields := "authorId,name,affiliations,paperCount,citationCount,hIndex,url"
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

	return &result, nil
}

// GetAuthorDetails retrieves detailed information about an author including papers
func (c *Client) GetAuthorDetails(ctx context.Context, authorID string) (*AuthorWithPapers, error) {
	// Request all fields including papers
	fields := "authorId,name,affiliations,homepage,paperCount,citationCount,hIndex,url,papers,papers.paperId,papers.title,papers.year,papers.citationCount,papers.abstract,papers.venue,papers.url,papers.authors"
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
