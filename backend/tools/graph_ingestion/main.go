package main

import (
	"context"
	"encoding/csv"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// Config holds Neo4j connection configuration
type Config struct {
	URI      string
	Username string
	Password string
}

// CoauthorRecord represents a row in the CSV
type CoauthorRecord struct {
	Author1  string
	Author2  string
	Date     int
	Metadata string
}

func main() {
	// Command line flags
	csvFile := flag.String("file", "", "Path to CSV file (required)")
	neo4jURI := flag.String("uri", "bolt://localhost:7687", "Neo4j URI")
	neo4jUser := flag.String("user", "neo4j", "Neo4j username")
	neo4jPass := flag.String("pass", "conferencespace", "Neo4j password")
	batchSize := flag.Int("batch", 1000, "Batch size for imports")
	clearFirst := flag.Bool("clear", false, "Clear existing data before import")
	skipHeader := flag.Bool("skip-header", true, "Skip first row (header)")

	flag.Parse()

	if *csvFile == "" {
		fmt.Println("Error: CSV file is required")
		flag.Usage()
		os.Exit(1)
	}

	// Create Neo4j client
	cfg := Config{
		URI:      *neo4jURI,
		Username: *neo4jUser,
		Password: *neo4jPass,
	}

	client, err := NewNeo4jClient(cfg)
	if err != nil {
		log.Fatalf("Failed to create Neo4j client: %v", err)
	}
	defer client.Close(context.Background())

	log.Println("✅ Connected to Neo4j")

	// Clear data if requested
	if *clearFirst {
		log.Println("⚠️  Clearing existing data...")
		if err := client.ClearAllData(context.Background()); err != nil {
			log.Fatalf("Failed to clear data: %v", err)
		}
		log.Println("✅ Data cleared")
	}

	// Initialize schema
	log.Println("📋 Initializing schema (constraints & indexes)...")
	if err := client.InitializeSchema(context.Background()); err != nil {
		log.Fatalf("Failed to initialize schema: %v", err)
	}
	log.Println("✅ Schema initialized")

	// Read and import CSV
	log.Printf("📖 Reading CSV file: %s\n", *csvFile)
	records, err := readCSV(*csvFile, *skipHeader)
	if err != nil {
		log.Fatalf("Failed to read CSV: %v", err)
	}
	log.Printf("✅ Found %d records\n", len(records))

	// Import data in batches
	log.Println("📥 Importing data...")
	start := time.Now()

	if err := client.ImportBatch(context.Background(), records, *batchSize); err != nil {
		log.Fatalf("Failed to import data: %v", err)
	}

	elapsed := time.Since(start)
	log.Printf("✅ Import completed in %s\n", elapsed)

	// Show statistics
	authorCount, _ := client.GetNodeCount(context.Background(), "Author")
	relCount, _ := client.GetRelationshipCount(context.Background(), "COAUTHORED")

	log.Println("\n📊 Statistics:")
	log.Printf("   Authors: %d\n", authorCount)
	log.Printf("   Collaborations: %d\n", relCount)
	log.Printf("   Records/sec: %.2f\n", float64(len(records))/elapsed.Seconds())
}

// readCSV reads the CSV file and returns records
func readCSV(filename string, skipHeader bool) ([]CoauthorRecord, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	var records []CoauthorRecord
	lineNum := 0

	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("error reading CSV at line %d: %w", lineNum, err)
		}

		lineNum++

		// Skip header if requested
		if skipHeader && lineNum == 1 {
			continue
		}

		// Validate row
		if len(row) < 3 {
			log.Printf("⚠️  Skipping line %d: insufficient columns", lineNum)
			continue
		}

		// Parse date
		date, err := strconv.Atoi(row[2])
		if err != nil {
			log.Printf("⚠️  Skipping line %d: invalid date '%s'", lineNum, row[2])
			continue
		}

		// Get metadata (optional)
		metadata := ""
		if len(row) > 3 {
			metadata = row[3]
		}

		records = append(records, CoauthorRecord{
			Author1:  row[0],
			Author2:  row[1],
			Date:     date,
			Metadata: metadata,
		})
	}

	return records, nil
}

// Neo4jClient wraps the Neo4j driver
type Neo4jClient struct {
	driver neo4j.DriverWithContext
}

// NewNeo4jClient creates a new Neo4j client
func NewNeo4jClient(cfg Config) (*Neo4jClient, error) {
	driver, err := neo4j.NewDriverWithContext(
		cfg.URI,
		neo4j.BasicAuth(cfg.Username, cfg.Password, ""),
	)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := driver.VerifyConnectivity(ctx); err != nil {
		return nil, err
	}

	return &Neo4jClient{driver: driver}, nil
}

// Close closes the Neo4j connection
func (c *Neo4jClient) Close(ctx context.Context) error {
	return c.driver.Close(ctx)
}

// InitializeSchema creates constraints and indexes
func (c *Neo4jClient) InitializeSchema(ctx context.Context) error {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{})
	defer session.Close(ctx)

	queries := []string{
		"CREATE CONSTRAINT author_email IF NOT EXISTS FOR (a:Author) REQUIRE a.email IS UNIQUE",
		"CREATE INDEX author_name IF NOT EXISTS FOR (a:Author) ON (a.name)",
		"CREATE INDEX coauthor_date IF NOT EXISTS FOR ()-[r:COAUTHORED]-() ON (r.established_date)",
	}

	for _, query := range queries {
		if _, err := session.Run(ctx, query, nil); err != nil {
			return err
		}
	}

	return nil
}

// ClearAllData removes all nodes and relationships
func (c *Neo4jClient) ClearAllData(ctx context.Context) error {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{})
	defer session.Close(ctx)

	_, err := session.Run(ctx, "MATCH (n) DETACH DELETE n", nil)
	return err
}

// ImportBatch imports records in batches
func (c *Neo4jClient) ImportBatch(ctx context.Context, records []CoauthorRecord, batchSize int) error {
	total := len(records)
	processed := 0

	for i := 0; i < total; i += batchSize {
		end := i + batchSize
		if end > total {
			end = total
		}

		batch := records[i:end]
		if err := c.importBatch(ctx, batch); err != nil {
			return fmt.Errorf("failed at batch %d-%d: %w", i, end, err)
		}

		processed += len(batch)
		log.Printf("   Progress: %d/%d (%.1f%%)", processed, total, float64(processed)/float64(total)*100)
	}

	return nil
}

// importBatch imports a single batch using transactions
func (c *Neo4jClient) importBatch(ctx context.Context, batch []CoauthorRecord) error {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{})
	defer session.Close(ctx)

	_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		query := `
			UNWIND $records AS record
			MERGE (a1:Author {email: record.author1})
			MERGE (a2:Author {email: record.author2})
			MERGE (a1)-[r:COAUTHORED]->(a2)
			SET r.established_date = record.date,
			    r.paper_link = record.metadata
		`

		// Convert batch to map format for Neo4j
		recordMaps := make([]map[string]any, len(batch))
		for i, rec := range batch {
			recordMaps[i] = map[string]any{
				"author1":  rec.Author1,
				"author2":  rec.Author2,
				"date":     rec.Date,
				"metadata": rec.Metadata,
			}
		}

		params := map[string]any{
			"records": recordMaps,
		}

		_, err := tx.Run(ctx, query, params)
		return nil, err
	})

	return err
}

// GetNodeCount returns the count of nodes with a label
func (c *Neo4jClient) GetNodeCount(ctx context.Context, label string) (int64, error) {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	query := fmt.Sprintf("MATCH (n:%s) RETURN count(n) as count", label)
	result, err := session.Run(ctx, query, nil)
	if err != nil {
		return 0, err
	}

	record, err := result.Single(ctx)
	if err != nil {
		return 0, err
	}

	count, _ := record.Get("count")
	return count.(int64), nil
}

// GetRelationshipCount returns the count of relationships
func (c *Neo4jClient) GetRelationshipCount(ctx context.Context, relType string) (int64, error) {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	query := fmt.Sprintf("MATCH ()-[r:%s]->() RETURN count(r) as count", relType)
	result, err := session.Run(ctx, query, nil)
	if err != nil {
		return 0, err
	}

	record, err := result.Single(ctx)
	if err != nil {
		return 0, err
	}

	count, _ := record.Get("count")
	return count.(int64), nil
}
