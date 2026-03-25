package clients

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/clients/gemini"
	"github.com/dcao/conferencespace/internal/clients/neo4j"
	"github.com/dcao/conferencespace/internal/clients/semantic_scholar"
	"github.com/dcao/conferencespace/internal/config"
)

// Clients holds all external service clients
type Clients struct {
	Neo4j           *neo4j.Client
	Gemini          *gemini.Client
	AIService       *ai_service.Client
	SemanticScholar *semantic_scholar.Client
}

// NewClients creates and initializes all external service clients
func NewClients(cfg *config.Config) (*Clients, error) {
	clients := &Clients{}

	// Initialize Neo4j client if enabled
	if cfg.Neo4j.Enabled {
		neo4jClient, err := neo4j.NewClient(neo4j.Config{
			URI:      cfg.Neo4j.URI,
			Username: cfg.Neo4j.Username,
			Password: cfg.Neo4j.Password,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create Neo4j client: %w", err)
		}

		clients.Neo4j = neo4jClient
	}

	// Initialize Gemini client if enabled
	if cfg.Gemini.Enabled && cfg.Gemini.APIKey != "" {
		clients.Gemini = gemini.NewClient(gemini.Config{
			APIKey: cfg.Gemini.APIKey,
			Model:  cfg.Gemini.Model,
		})
	}

	clients.AIService = ai_service.NewClient(ai_service.Config{
		BaseURL:        cfg.AIService.BaseURL,
		TimeoutSeconds: cfg.AIService.TimeoutSeconds,
	})

	// Initialize Semantic Scholar client if enabled
	if cfg.SemanticScholar.Enabled {
		clients.SemanticScholar = semantic_scholar.NewClient(semantic_scholar.Config{
			APIKey: cfg.SemanticScholar.APIKey,
		})
	}

	return clients, nil
}

// Close closes all client connections
func (c *Clients) Close(ctx context.Context) error {
	if c.Neo4j != nil {
		if err := c.Neo4j.Close(ctx); err != nil {
			return fmt.Errorf("failed to close Neo4j client: %w", err)
		}
	}
	// Gemini client doesn't require explicit closing (HTTP client)
	return nil
}
