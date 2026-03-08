package semantic_scholar

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/dcao/conferencespace/internal/model"
	"github.com/lib/pq"
)

// SyncAuthorProfile syncs an author's profile and papers from Semantic Scholar to the local database
func (c *Controller) SyncAuthorProfile(ctx context.Context, userID int64, authorID string) error {
	unlock := c.acquireSyncLock(userID)
	defer unlock()

	// 1. Fetch Author Details from API
	author, err := c.client.GetAuthorDetails(ctx, authorID)
	if err != nil {
		return fmt.Errorf("failed to get author details: %w", err)
	}

	// 2. Fetch Author Papers (if not complete in details)
	// getAuthorDetails usually returns author with some top papers.
	// For a full sync, we might want to paginate papers.
	// For now, let's stick to what we get from GetAuthorDetails or the top 100 papers logic.
	// The client's GetAuthorDetails returns AuthorWithPapers.

	// 3. Create/Update Profile
	profile := &model.ScholarProfile{
		UserID:            userID,
		SemanticScholarID: author.AuthorID,
		Name:              author.Name,
		Affiliations:      pq.StringArray(author.Affiliations),
		PaperCount:        author.PaperCount,
		CitationCount:     author.CitationCount,
		HIndex:            author.HIndex,
		URL:               author.URL,
	}

	if err := c.scholar.CreateProfile(ctx, profile); err != nil {
		return fmt.Errorf("failed to save profile: %w", err)
	}

	// 4. Upsert papers
	paperIDs := make([]int64, 0)
	if author.Papers != nil {
		for _, p := range author.Papers {
			// Convert API paper to model paper
			authorsJson, _ := json.Marshal(p.Authors)

			paper := &model.ScholarPaper{
				SemanticScholarID: p.PaperID,
				Title:             p.Title,
				Abstract:          "",      // Abstract might not be in the lightweight paper object, but let's check
				Venue:             p.Venue, // Venue vs Journal vs Venue field?
				Year:              p.Year,
				CitationCount:     p.CitationCount,
				URL:               p.URL,
				Authors:           json.RawMessage(authorsJson),
			}

			// Upsert paper
			paperID, err := c.scholar.UpsertPaper(ctx, paper)
			if err != nil {
				fmt.Printf("Failed to upsert paper %s: %v\n", p.PaperID, err)
				continue
			}
			paperIDs = append(paperIDs, paperID)
		}
	}

	// 5. Replace profile-paper links atomically for idempotent sync behavior.
	if err := c.scholar.ReplaceProfilePapers(ctx, profile.ID, paperIDs); err != nil {
		return fmt.Errorf("failed to update profile-paper links: %w", err)
	}

	return nil
}

func (c *Controller) acquireSyncLock(userID int64) func() {
	c.syncMu.Lock()
	lock, exists := c.syncLocks[userID]
	if !exists {
		lock = &sync.Mutex{}
		c.syncLocks[userID] = lock
	}
	c.syncMu.Unlock()

	lock.Lock()
	return func() {
		lock.Unlock()
	}
}
