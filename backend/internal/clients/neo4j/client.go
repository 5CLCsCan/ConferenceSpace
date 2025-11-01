package neo4j

import (
	"context"
	"fmt"
	"time"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// Client wraps the Neo4j driver for graph database operations
type Client struct {
	driver neo4j.DriverWithContext
	config Config
}

// Config holds Neo4j connection configuration
type Config struct {
	URI      string
	Username string
	Password string
}

// NewClient creates a new Neo4j client with connection pooling
func NewClient(cfg Config) (*Client, error) {
	driver, err := neo4j.NewDriverWithContext(
		cfg.URI,
		neo4j.BasicAuth(cfg.Username, cfg.Password, ""),
		func(config *neo4j.Config) {
			// Connection pool settings
			config.MaxConnectionPoolSize = 50
			config.MaxConnectionLifetime = 5 * time.Minute
			config.ConnectionAcquisitionTimeout = 2 * time.Minute
			config.SocketConnectTimeout = 10 * time.Second
			config.SocketKeepalive = true
		},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create Neo4j driver: %w", err)
	}

	client := &Client{
		driver: driver,
		config: cfg,
	}

	// Verify connectivity
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := driver.VerifyConnectivity(ctx); err != nil {
		return nil, fmt.Errorf("failed to verify Neo4j connectivity: %w", err)
	}

	return client, nil
}

// NewSession creates a new Neo4j session
func (c *Client) NewSession(ctx context.Context, config ...neo4j.SessionConfig) neo4j.SessionWithContext {
	if len(config) > 0 {
		return c.driver.NewSession(ctx, config[0])
	}
	return c.driver.NewSession(ctx, neo4j.SessionConfig{
		AccessMode: neo4j.AccessModeWrite,
	})
}

// ExecuteQuery executes a Cypher query and returns the result
func (c *Client) ExecuteQuery(ctx context.Context, query string, params map[string]any) (*neo4j.EagerResult, error) {
	result, err := neo4j.ExecuteQuery(ctx, c.driver, query, params,
		neo4j.EagerResultTransformer,
		neo4j.ExecuteQueryWithDatabase("neo4j"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}
	return result, nil
}

// ExecuteRead executes a read transaction
func (c *Client) ExecuteRead(ctx context.Context, work neo4j.ManagedTransactionWork) (any, error) {
	session := c.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	result, err := session.ExecuteRead(ctx, work)
	if err != nil {
		return nil, fmt.Errorf("failed to execute read transaction: %w", err)
	}
	return result, nil
}

// ExecuteWrite executes a write transaction
func (c *Client) ExecuteWrite(ctx context.Context, work neo4j.ManagedTransactionWork) (any, error) {
	session := c.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	result, err := session.ExecuteWrite(ctx, work)
	if err != nil {
		return nil, fmt.Errorf("failed to execute write transaction: %w", err)
	}
	return result, nil
}

// Close closes the Neo4j driver and releases resources
func (c *Client) Close(ctx context.Context) error {
	if c.driver != nil {
		return c.driver.Close(ctx)
	}
	return nil
}

// VerifyConnectivity checks if the connection to Neo4j is still valid
func (c *Client) VerifyConnectivity(ctx context.Context) error {
	return c.driver.VerifyConnectivity(ctx)
}

// InitializeSchema creates constraints and indexes for optimal performance
func (c *Client) InitializeSchema(ctx context.Context) error {
	constraints := []string{
		// Unique constraint on Author email
		"CREATE CONSTRAINT author_email IF NOT EXISTS FOR (a:Author) REQUIRE a.email IS UNIQUE",
	}

	indexes := []string{
		// Index on Author name for faster lookups
		"CREATE INDEX author_name IF NOT EXISTS FOR (a:Author) ON (a.name)",
		// Index on COAUTHORED relationship date for filtering
		"CREATE INDEX coauthor_date IF NOT EXISTS FOR ()-[r:COAUTHORED]-() ON (r.established_date)",
	}

	session := c.NewSession(ctx)
	defer session.Close(ctx)

	// Create constraints
	for _, constraint := range constraints {
		_, err := session.Run(ctx, constraint, nil)
		if err != nil {
			return fmt.Errorf("failed to create constraint: %w", err)
		}
	}

	// Create indexes
	for _, index := range indexes {
		_, err := session.Run(ctx, index, nil)
		if err != nil {
			return fmt.Errorf("failed to create index: %w", err)
		}
	}

	return nil
}

// ClearAllData removes all nodes and relationships (use with caution!)
func (c *Client) ClearAllData(ctx context.Context) error {
	query := "MATCH (n) DETACH DELETE n"
	_, err := c.ExecuteQuery(ctx, query, nil)
	if err != nil {
		return fmt.Errorf("failed to clear data: %w", err)
	}
	return nil
}

// GetNodeCount returns the count of nodes with a specific label
func (c *Client) GetNodeCount(ctx context.Context, label string) (int64, error) {
	query := fmt.Sprintf("MATCH (n:%s) RETURN count(n) as count", label)
	result, err := c.ExecuteQuery(ctx, query, nil)
	if err != nil {
		return 0, err
	}

	if len(result.Records) == 0 {
		return 0, nil
	}

	count, _ := result.Records[0].Get("count")
	return count.(int64), nil
}

// GetRelationshipCount returns the count of relationships with a specific type
func (c *Client) GetRelationshipCount(ctx context.Context, relType string) (int64, error) {
	query := fmt.Sprintf("MATCH ()-[r:%s]->() RETURN count(r) as count", relType)
	result, err := c.ExecuteQuery(ctx, query, nil)
	if err != nil {
		return 0, err
	}

	if len(result.Records) == 0 {
		return 0, nil
	}

	count, _ := result.Records[0].Get("count")
	return count.(int64), nil
}
