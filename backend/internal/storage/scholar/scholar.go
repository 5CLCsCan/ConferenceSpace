package scholar

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/model"
)

type StorageInterface interface {
	CreateProfile(ctx context.Context, profile *model.ScholarProfile) error
	GetProfileByUserID(ctx context.Context, userID int64) (*model.ScholarProfile, error)
	GetProfileBySemanticID(ctx context.Context, semanticID string) (*model.ScholarProfile, error)
	UpsertPaper(ctx context.Context, paper *model.ScholarPaper) (int64, error)
	LinkPaperToProfile(ctx context.Context, profileID, paperID int64) error
	ClearProfilePapers(ctx context.Context, profileID int64) error
	ReplaceProfilePapers(ctx context.Context, profileID int64, paperIDs []int64) error
	GetPapersByProfileID(ctx context.Context, profileID int64) ([]*model.ScholarPaper, error)
	DeleteProfileByUserID(ctx context.Context, userID int64) error
}

type Storage struct {
	db *sql.DB
	qb squirrel.StatementBuilderType
}

func New(db *sql.DB) *Storage {
	return &Storage{
		db: db,
		qb: squirrel.StatementBuilder.PlaceholderFormat(squirrel.Dollar),
	}
}

func (s *Storage) CreateProfile(ctx context.Context, profile *model.ScholarProfile) error {
	query, args, err := s.qb.Insert(model.ScholarProfileTableName).
		Columns(
			"user_id", "semantic_scholar_id", "name", "affiliations",
			"paper_count", "citation_count", "h_index", "url",
		).
		Values(
			profile.UserID, profile.SemanticScholarID, profile.Name, profile.Affiliations,
			profile.PaperCount, profile.CitationCount, profile.HIndex, profile.URL,
		).
		Suffix("ON CONFLICT (user_id) DO UPDATE SET " +
			"semantic_scholar_id = EXCLUDED.semantic_scholar_id, " +
			"name = EXCLUDED.name, affiliations = EXCLUDED.affiliations, " +
			"paper_count = EXCLUDED.paper_count, citation_count = EXCLUDED.citation_count, " +
			"h_index = EXCLUDED.h_index, url = EXCLUDED.url, updated_at = NOW() " +
			"RETURNING id").
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build create profile query: %w", err)
	}

	err = s.db.QueryRowContext(ctx, query, args...).Scan(&profile.ID)
	if err != nil {
		return fmt.Errorf("failed to create/update profile: %w", err)
	}

	return nil
}

func (s *Storage) UpsertPaper(ctx context.Context, paper *model.ScholarPaper) (int64, error) {
	// Need to handle authors JSONB carefully
	// If authors is nil, store empty array
	if paper.Authors == nil {
		paper.Authors = json.RawMessage("[]")
	}

	query, args, err := s.qb.Insert(model.ScholarPapersTableName).
		Columns(
			"semantic_scholar_id", "title", "abstract", "venue",
			"year", "citation_count", "url", "authors",
		).
		Values(
			paper.SemanticScholarID, paper.Title, paper.Abstract, paper.Venue,
			paper.Year, paper.CitationCount, paper.URL, paper.Authors,
		).
		Suffix("ON CONFLICT (semantic_scholar_id) DO UPDATE SET " +
			"title = EXCLUDED.title, abstract = EXCLUDED.abstract, " +
			"venue = EXCLUDED.venue, year = EXCLUDED.year, " +
			"citation_count = EXCLUDED.citation_count, url = EXCLUDED.url, " +
			"authors = EXCLUDED.authors, updated_at = NOW() " +
			"RETURNING id").
		ToSql()

	if err != nil {
		return 0, fmt.Errorf("failed to build upsert paper query: %w", err)
	}

	var id int64
	err = s.db.QueryRowContext(ctx, query, args...).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("failed to upsert paper: %w", err)
	}
	return id, nil
}

func (s *Storage) LinkPaperToProfile(ctx context.Context, profileID, paperID int64) error {
	query, args, err := s.qb.Insert(model.ScholarProfilePapersTableName).
		Columns("profile_id", "paper_id").
		Values(profileID, paperID).
		Suffix("ON CONFLICT DO NOTHING").
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build link paper query: %w", err)
	}

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to link paper: %w", err)
	}
	return nil
}

func (s *Storage) ClearProfilePapers(ctx context.Context, profileID int64) error {
	query, args, err := s.qb.Delete(model.ScholarProfilePapersTableName).
		Where(squirrel.Eq{"profile_id": profileID}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build clear papers query: %w", err)
	}

	_, err = s.db.ExecContext(ctx, query, args...)
	return err
}

func (s *Storage) ReplaceProfilePapers(ctx context.Context, profileID int64, paperIDs []int64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	builder := squirrel.StatementBuilder.PlaceholderFormat(squirrel.Dollar)

	deleteQuery, deleteArgs, err := builder.Delete(model.ScholarProfilePapersTableName).
		Where(squirrel.Eq{"profile_id": profileID}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build clear profile papers query: %w", err)
	}

	if _, err := tx.ExecContext(ctx, deleteQuery, deleteArgs...); err != nil {
		return fmt.Errorf("failed to clear profile papers: %w", err)
	}

	for _, paperID := range paperIDs {
		insertQuery, insertArgs, err := builder.Insert(model.ScholarProfilePapersTableName).
			Columns("profile_id", "paper_id").
			Values(profileID, paperID).
			Suffix("ON CONFLICT DO NOTHING").
			ToSql()
		if err != nil {
			return fmt.Errorf("failed to build paper link query: %w", err)
		}
		if _, err := tx.ExecContext(ctx, insertQuery, insertArgs...); err != nil {
			return fmt.Errorf("failed to link paper %d to profile %d: %w", paperID, profileID, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit profile paper replacement: %w", err)
	}

	return nil
}

func (s *Storage) GetProfileByUserID(ctx context.Context, userID int64) (*model.ScholarProfile, error) {
	query, args, err := s.qb.Select("*").
		From(model.ScholarProfileTableName).
		Where(squirrel.Eq{"user_id": userID}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build get profile query: %w", err)
	}

	profile := &model.ScholarProfile{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&profile.ID, &profile.UserID, &profile.SemanticScholarID, &profile.Name,
		&profile.Affiliations, &profile.PaperCount, &profile.CitationCount,
		&profile.HIndex, &profile.URL, &profile.CreatedAt, &profile.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Return nil if not found
		}
		return nil, fmt.Errorf("failed to get profile: %w", err)
	}

	return profile, nil
}

func (s *Storage) GetProfileBySemanticID(ctx context.Context, semanticID string) (*model.ScholarProfile, error) {
	query, args, err := s.qb.Select("*").
		From(model.ScholarProfileTableName).
		Where(squirrel.Eq{"semantic_scholar_id": semanticID}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build get profile query: %w", err)
	}

	profile := &model.ScholarProfile{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&profile.ID, &profile.UserID, &profile.SemanticScholarID, &profile.Name,
		&profile.Affiliations, &profile.PaperCount, &profile.CitationCount,
		&profile.HIndex, &profile.URL, &profile.CreatedAt, &profile.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get profile: %w", err)
	}

	return profile, nil
}

func (s *Storage) GetPapersByProfileID(ctx context.Context, profileID int64) ([]*model.ScholarPaper, error) {
	query, args, err := s.qb.Select("p.*").
		From(model.ScholarPapersTableName + " p").
		Join(model.ScholarProfilePapersTableName + " spp ON p.id = spp.paper_id").
		Where(squirrel.Eq{"spp.profile_id": profileID}).
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build get papers query: %w", err)
	}

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get papers: %w", err)
	}
	defer rows.Close()

	var papers []*model.ScholarPaper
	for rows.Next() {
		paper := &model.ScholarPaper{}
		err := rows.Scan(
			&paper.ID, &paper.SemanticScholarID, &paper.Title, &paper.Abstract,
			&paper.Venue, &paper.Year, &paper.CitationCount, &paper.URL,
			&paper.Authors, &paper.CreatedAt, &paper.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan paper: %w", err)
		}
		papers = append(papers, paper)
	}

	return papers, nil
}

func (s *Storage) DeleteProfileByUserID(ctx context.Context, userID int64) error {
	// Due to CASCADE, deleting the profile will also delete scholar_profile_papers entries
	query, args, err := s.qb.Delete(model.ScholarProfileTableName).
		Where(squirrel.Eq{"user_id": userID}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete profile query: %w", err)
	}

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete profile: %w", err)
	}

	return nil
}
