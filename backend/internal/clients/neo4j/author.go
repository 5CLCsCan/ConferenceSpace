package neo4j

import (
	"context"
	"fmt"
)

// Author represents an author node in the graph
type Author struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

// CoauthorRelationship represents a co-authorship relationship
type CoauthorRelationship struct {
	EstablishedDate int    `json:"established_date"` // Year
	PaperLink       string `json:"paper_link,omitempty"`
}

// AuthorService provides methods for author-related graph operations
type AuthorService struct {
	client *Client
}

// NewAuthorService creates a new author service
func NewAuthorService(client *Client) *AuthorService {
	return &AuthorService{client: client}
}

// CreateAuthor creates or updates an author node
func (s *AuthorService) CreateAuthor(ctx context.Context, author Author) error {
	query := `
		MERGE (a:Author {email: $email})
		SET a.name = $name
		RETURN a
	`
	params := map[string]any{
		"email": author.Email,
		"name":  author.Name,
	}

	_, err := s.client.ExecuteQuery(ctx, query, params)
	if err != nil {
		return fmt.Errorf("failed to create author: %w", err)
	}
	return nil
}

// CreateCoauthorship creates a co-authorship relationship between two authors
func (s *AuthorService) CreateCoauthorship(
	ctx context.Context,
	author1Email, author2Email string,
	rel CoauthorRelationship,
) error {
	query := `
		MERGE (a1:Author {email: $email1})
		MERGE (a2:Author {email: $email2})
		MERGE (a1)-[r:COAUTHORED]->(a2)
		SET r.established_date = $established_date,
		    r.paper_link = $paper_link
		RETURN r
	`
	params := map[string]any{
		"email1":           author1Email,
		"email2":           author2Email,
		"established_date": rel.EstablishedDate,
		"paper_link":       rel.PaperLink,
	}

	_, err := s.client.ExecuteQuery(ctx, query, params)
	if err != nil {
		return fmt.Errorf("failed to create coauthorship: %w", err)
	}
	return nil
}

// GetCoauthors returns all co-authors of a given author
func (s *AuthorService) GetCoauthors(ctx context.Context, email string) ([]Author, error) {
	query := `
		MATCH (a:Author {email: $email})-[:COAUTHORED]->(coauthor:Author)
		RETURN coauthor.email as email, coauthor.name as name
	`
	params := map[string]any{"email": email}

	result, err := s.client.ExecuteQuery(ctx, query, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get coauthors: %w", err)
	}

	authors := make([]Author, 0, len(result.Records))
	for _, record := range result.Records {
		email, _ := record.Get("email")
		name, _ := record.Get("name")

		author := Author{
			Email: email.(string),
		}
		if name != nil {
			author.Name = name.(string)
		}
		authors = append(authors, author)
	}

	return authors, nil
}

// GetCoauthorsSince returns co-authors since a specific year
func (s *AuthorService) GetCoauthorsSince(
	ctx context.Context,
	email string,
	yearThreshold int,
) ([]Author, error) {
	query := `
		MATCH (a:Author {email: $email})-[r:COAUTHORED]->(coauthor:Author)
		WHERE r.established_date >= $year_threshold
		RETURN DISTINCT coauthor.email as email, coauthor.name as name
	`
	params := map[string]any{
		"email":          email,
		"year_threshold": yearThreshold,
	}

	result, err := s.client.ExecuteQuery(ctx, query, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get coauthors since year: %w", err)
	}

	authors := make([]Author, 0, len(result.Records))
	for _, record := range result.Records {
		email, _ := record.Get("email")
		name, _ := record.Get("name")

		author := Author{
			Email: email.(string),
		}
		if name != nil {
			author.Name = name.(string)
		}
		authors = append(authors, author)
	}

	return authors, nil
}

// HasRecentCollaboration checks if two authors have collaborated since a specific year
func (s *AuthorService) HasRecentCollaboration(
	ctx context.Context,
	email1, email2 string,
	yearThreshold int,
) (bool, error) {
	query := `
		MATCH (a1:Author {email: $email1})-[r:COAUTHORED]-(a2:Author {email: $email2})
		WHERE r.established_date >= $year_threshold
		RETURN count(r) > 0 as hasCollaboration
	`
	params := map[string]any{
		"email1":         email1,
		"email2":         email2,
		"year_threshold": yearThreshold,
	}

	result, err := s.client.ExecuteQuery(ctx, query, params)
	if err != nil {
		return false, fmt.Errorf("failed to check collaboration: %w", err)
	}

	if len(result.Records) == 0 {
		return false, nil
	}

	hasCollab, _ := result.Records[0].Get("hasCollaboration")
	return hasCollab.(bool), nil
}

// HasIndirectCollaboration checks for indirect collaboration (N-hop)
func (s *AuthorService) HasIndirectCollaboration(
	ctx context.Context,
	email1, email2 string,
	maxDepth int,
	yearThreshold int,
) (bool, error) {
	query := fmt.Sprintf(`
		MATCH path = (a1:Author {email: $email1})-[:COAUTHORED*1..%d]-(a2:Author {email: $email2})
		WHERE ALL(rel IN relationships(path) WHERE rel.established_date >= $year_threshold)
		RETURN count(path) > 0 as hasCollaboration
	`, maxDepth)

	params := map[string]any{
		"email1":         email1,
		"email2":         email2,
		"year_threshold": yearThreshold,
	}

	result, err := s.client.ExecuteQuery(ctx, query, params)
	if err != nil {
		return false, fmt.Errorf("failed to check indirect collaboration: %w", err)
	}

	if len(result.Records) == 0 {
		return false, nil
	}

	hasCollab, _ := result.Records[0].Get("hasCollaboration")
	return hasCollab.(bool), nil
}

// DeleteAuthor deletes an author and all their relationships
func (s *AuthorService) DeleteAuthor(ctx context.Context, email string) error {
	query := `
		MATCH (a:Author {email: $email})
		DETACH DELETE a
	`
	params := map[string]any{"email": email}

	_, err := s.client.ExecuteQuery(ctx, query, params)
	if err != nil {
		return fmt.Errorf("failed to delete author: %w", err)
	}
	return nil
}

// GetAuthorByEmail retrieves an author by email
func (s *AuthorService) GetAuthorByEmail(ctx context.Context, email string) (*Author, error) {
	query := `
		MATCH (a:Author {email: $email})
		RETURN a.email as email, a.name as name
	`
	params := map[string]any{"email": email}

	result, err := s.client.ExecuteQuery(ctx, query, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get author: %w", err)
	}

	if len(result.Records) == 0 {
		return nil, nil
	}

	emailVal, _ := result.Records[0].Get("email")
	nameVal, _ := result.Records[0].Get("name")

	author := &Author{
		Email: emailVal.(string),
	}
	if nameVal != nil {
		author.Name = nameVal.(string)
	}

	return author, nil
}
