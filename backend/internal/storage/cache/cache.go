package cache

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
)

const (
	TableName = "semantic_scholar_cache"

	ColID         = "id"
	ColCacheKey   = "cache_key"
	ColCacheType  = "cache_type"
	ColData       = "data"
	ColCreatedAt  = "created_at"
	ColUpdatedAt  = "updated_at"
)

// CacheType constants
const (
	CacheTypeAuthorSearch  = "author_search"
	CacheTypeAuthorDetails = "author_details"
	CacheTypeAuthorPapers  = "author_papers"
)

// StorageInterface defines the cache storage operations
type StorageInterface interface {
	Get(ctx context.Context, key string) ([]byte, bool, error)
	Set(ctx context.Context, key, cacheType string, data []byte) error
	Delete(ctx context.Context, key string) error
	DeleteByType(ctx context.Context, cacheType string) (int64, error)
}

// Storage handles cache data persistence
type Storage struct {
	db *sql.DB
	qb sq.StatementBuilderType
}

// New creates a new cache storage instance
func New(db *sql.DB) *Storage {
	return &Storage{
		db: db,
		qb: sq.StatementBuilder.PlaceholderFormat(sq.Dollar),
	}
}

// GenerateSearchKey creates a cache key for author searches
func GenerateSearchKey(query string, limit int) string {
	normalized := strings.ToLower(strings.TrimSpace(query))
	hash := md5.Sum([]byte(normalized))
	return fmt.Sprintf("search:%x:%d", hash, limit)
}

// GenerateAuthorKey creates a cache key for author details
func GenerateAuthorKey(authorID string) string {
	return fmt.Sprintf("author:%s", authorID)
}

// GeneratePapersKey creates a cache key for author papers
func GeneratePapersKey(authorID string, offset, limit int) string {
	return fmt.Sprintf("papers:%s:%d:%d", authorID, offset, limit)
}

// Get retrieves cached data by key
func (s *Storage) Get(ctx context.Context, key string) ([]byte, bool, error) {
	query, args, err := s.qb.
		Select(ColData).
		From(TableName).
		Where(sq.Eq{ColCacheKey: key}).
		ToSql()

	if err != nil {
		return nil, false, fmt.Errorf("failed to build select query: %w", err)
	}

	var data json.RawMessage
	err = s.db.QueryRowContext(ctx, query, args...).Scan(&data)

	if err == sql.ErrNoRows {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, fmt.Errorf("failed to get cached data: %w", err)
	}

	return []byte(data), true, nil
}

// Set stores data in cache (upsert)
func (s *Storage) Set(ctx context.Context, key, cacheType string, data []byte) error {
	now := time.Now()

	// Use INSERT ... ON CONFLICT for upsert
	query := fmt.Sprintf(`
		INSERT INTO %s (%s, %s, %s, %s, %s)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (%s)
		DO UPDATE SET %s = $3, %s = $5
	`,
		TableName,
		ColCacheKey, ColCacheType, ColData, ColCreatedAt, ColUpdatedAt,
		ColCacheKey,
		ColData, ColUpdatedAt,
	)

	_, err := s.db.ExecContext(ctx, query, key, cacheType, data, now, now)
	if err != nil {
		return fmt.Errorf("failed to set cache: %w", err)
	}

	return nil
}

// Delete removes a cache entry by key
func (s *Storage) Delete(ctx context.Context, key string) error {
	query, args, err := s.qb.
		Delete(TableName).
		Where(sq.Eq{ColCacheKey: key}).
		ToSql()

	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete cache entry: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("cache entry not found")
	}

	return nil
}

// DeleteByType removes all cache entries of a specific type
func (s *Storage) DeleteByType(ctx context.Context, cacheType string) (int64, error) {
	query, args, err := s.qb.
		Delete(TableName).
		Where(sq.Eq{ColCacheType: cacheType}).
		ToSql()

	if err != nil {
		return 0, fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to delete cache entries: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return rows, nil
}
