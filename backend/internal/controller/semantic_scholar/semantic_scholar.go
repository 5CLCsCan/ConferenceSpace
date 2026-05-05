package semantic_scholar

import (
	"context"
	"encoding/json"
	"fmt"
	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/clients/semantic_scholar"
	"github.com/dcao/conferencespace/internal/storage/cache"
	"github.com/dcao/conferencespace/internal/storage/scholar"
	"github.com/dcao/conferencespace/internal/storage/user"
	"github.com/gin-gonic/gin"
	"sync"
)

// Controller handles Semantic Scholar API requests
type Controller struct {
	client    semanticScholarClient
	cache     cache.StorageInterface
	scholar   scholar.StorageInterface
	users     user.StorageInterface
	aiService researchKeywordClient
	syncMu    sync.Mutex
	syncLocks map[int64]*sync.Mutex
}

type semanticScholarClient interface {
	SearchAuthors(ctx context.Context, query string, limit int) (*semantic_scholar.SearchResponse, error)
	GetAuthorDetails(ctx context.Context, authorID string) (*semantic_scholar.AuthorWithPapers, error)
	GetAuthorPapers(ctx context.Context, authorID string, offset, limit int) (*semantic_scholar.PapersResponse, error)
}

type researchKeywordClient interface {
	ExtractResearchKeywords(
		ctx context.Context,
		token string,
		requestPayload *aiServiceClient.ResearchKeywordExtractionRequest,
	) (*aiServiceClient.ResearchKeywordExtractionResponse, error)
}

// New creates a new Semantic Scholar controller
func New(
	client *semantic_scholar.Client,
	cacheStorage cache.StorageInterface,
	scholarStorage scholar.StorageInterface,
	userStorage user.StorageInterface,
	aiService *aiServiceClient.Client,
) *Controller {
	return &Controller{
		client:    client,
		cache:     cacheStorage,
		scholar:   scholarStorage,
		users:     userStorage,
		aiService: aiService,
		syncLocks: make(map[int64]*sync.Mutex),
	}
}

// SearchAuthors handles author search requests
// @Summary      Search authors by name
// @Description  Search for authors in Semantic Scholar database
// @Tags         semantic-scholar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        q query string true "Search query"
// @Param        limit query int false "Result limit (default 30)"
// @Success      200 {object} semantic_scholar.SearchResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Router       /semantic-scholar/authors/search [get]
func (c *Controller) SearchAuthors(ginCtx *gin.Context) (*semantic_scholar.SearchResponse, error) {
	ctx := context.Background()
	query := ginCtx.Query("q")
	if query == "" {
		return nil, fmt.Errorf("query parameter 'q' is required")
	}

	limit := 30
	if l := ginCtx.Query("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}

	// Check cache first
	cacheKey := cache.GenerateSearchKey(query, limit)
	cachedData, found, err := c.cache.Get(ctx, cacheKey)
	if err == nil && found {
		var result semantic_scholar.SearchResponse
		if err := json.Unmarshal(cachedData, &result); err == nil {
			c.filterLinkedAuthors(ctx, &result)
			return &result, nil
		}
	}

	// Fetch from API
	result, err := c.client.SearchAuthors(ctx, query, limit)
	if err != nil {
		fmt.Printf("Error searching authors: %v\n", err)
		return nil, fmt.Errorf("failed to search authors: %w", err)
	}

	// Cache the result
	if data, err := json.Marshal(result); err == nil {
		_ = c.cache.Set(ctx, cacheKey, cache.CacheTypeAuthorSearch, data)
	}

	c.filterLinkedAuthors(ctx, result)

	return result, nil
}

// filterLinkedAuthors removes authors whose Semantic Scholar ID is already
// linked to an internal platform user, so they only appear as internal results.
func (c *Controller) filterLinkedAuthors(ctx context.Context, result *semantic_scholar.SearchResponse) {
	if result == nil || len(result.Data) == 0 {
		return
	}

	var authorIDs []string
	for _, a := range result.Data {
		if a.AuthorID != "" {
			authorIDs = append(authorIDs, a.AuthorID)
		}
	}

	linked, err := c.users.GetLinkedSemanticScholarIDs(ctx, authorIDs)
	if err != nil || len(linked) == 0 {
		return
	}

	filtered := make([]semantic_scholar.Author, 0, len(result.Data))
	for _, a := range result.Data {
		if !linked[a.AuthorID] {
			filtered = append(filtered, a)
		}
	}
	result.Data = filtered
	result.Total = len(filtered)
}

// GetAuthorDetails handles author details requests
// @Summary      Get author details
// @Description  Get detailed information about an author including papers
// @Tags         semantic-scholar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        authorId path string true "Author ID"
// @Success      200 {object} semantic_scholar.AuthorWithPapers
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Router       /semantic-scholar/authors/{authorId} [get]
func (c *Controller) GetAuthorDetails(ginCtx *gin.Context) (*semantic_scholar.AuthorWithPapers, error) {
	ctx := context.Background()
	authorID := ginCtx.Param("authorId")
	if authorID == "" {
		return nil, fmt.Errorf("author ID is required")
	}

	// 1. Check Relational Storage (Scholar tables)
	// This is the preferred source if we have synced data
	if c.scholar != nil {
		profile, err := c.scholar.GetProfileBySemanticID(ctx, authorID)
		if err == nil && profile != nil {
			// Map to AuthorWithPapers
			result := &semantic_scholar.AuthorWithPapers{
				Author: semantic_scholar.Author{
					AuthorID:      profile.SemanticScholarID,
					Name:          profile.Name,
					Affiliations:  profile.Affiliations,
					PaperCount:    profile.PaperCount,
					CitationCount: profile.CitationCount,
					HIndex:        profile.HIndex,
					URL:           profile.URL,
				},
				Papers: []semantic_scholar.Paper{},
			}

			// Fetch papers from relational storage
			papers, err := c.scholar.GetPapersByProfileID(ctx, profile.ID)
			if err == nil && len(papers) > 0 {
				mappedPapers := make([]semantic_scholar.Paper, len(papers))
				for i, p := range papers {
					var authors []semantic_scholar.Author
					if p.Authors != nil {
						_ = json.Unmarshal(p.Authors, &authors)
					}

					mappedPapers[i] = semantic_scholar.Paper{
						PaperID:       p.SemanticScholarID,
						Title:         p.Title,
						Abstract:      p.Abstract,
						Venue:         p.Venue,
						Year:          p.Year,
						CitationCount: p.CitationCount,
						URL:           p.URL,
						Authors:       authors,
					}
				}
				result.Papers = mappedPapers
			}

			return result, nil
		}
	}

	// 2. Check JSON Cache (Legacy/Fallback)
	cacheKey := cache.GenerateAuthorKey(authorID)
	cachedData, found, err := c.cache.Get(ctx, cacheKey)
	if err == nil && found {
		var result semantic_scholar.AuthorWithPapers
		if err := json.Unmarshal(cachedData, &result); err == nil {
			return &result, nil
		}
	}

	// 3. Fetch from API
	result, err := c.client.GetAuthorDetails(ctx, authorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get author details: %w", err)
	}

	// Cache the result (we still cache JSON for quick access if sync hasn't happened)
	if data, err := json.Marshal(result); err == nil {
		_ = c.cache.Set(ctx, cacheKey, cache.CacheTypeAuthorDetails, data)
	}

	return result, nil
}

// GetAuthorPapers handles author papers requests
// @Summary      Get author papers
// @Description  Get paginated list of papers for an author
// @Tags         semantic-scholar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        authorId path string true "Author ID"
// @Param        offset query int false "Pagination offset"
// @Param        limit query int false "Result limit (default 100)"
// @Success      200 {object} semantic_scholar.PapersResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Router       /semantic-scholar/authors/{authorId}/papers [get]
func (c *Controller) GetAuthorPapers(ginCtx *gin.Context) (*semantic_scholar.PapersResponse, error) {
	ctx := context.Background()
	authorID := ginCtx.Param("authorId")
	if authorID == "" {
		return nil, fmt.Errorf("author ID is required")
	}

	offset, limit := 0, 100
	if o := ginCtx.Query("offset"); o != "" {
		fmt.Sscanf(o, "%d", &offset)
	}
	if l := ginCtx.Query("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}

	// Check cache first
	cacheKey := cache.GeneratePapersKey(authorID, offset, limit)
	cachedData, found, err := c.cache.Get(ctx, cacheKey)
	if err == nil && found {
		var result semantic_scholar.PapersResponse
		if err := json.Unmarshal(cachedData, &result); err == nil {
			return &result, nil
		}
	}

	// Fetch from API
	result, err := c.client.GetAuthorPapers(ctx, authorID, offset, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get author papers: %w", err)
	}

	// Cache the result
	if data, err := json.Marshal(result); err == nil {
		_ = c.cache.Set(ctx, cacheKey, cache.CacheTypeAuthorPapers, data)
	}

	return result, nil
}
