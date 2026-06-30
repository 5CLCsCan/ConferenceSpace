package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"
)

type loginResp struct {
	Data struct {
		Token string `json:"token"`
		User  struct {
			ID    int64  `json:"id"`
			Email string `json:"email"`
		} `json:"user"`
	} `json:"data"`
}

type createdResp struct {
	Data struct {
		ID int64 `json:"id"`
	} `json:"data"`
}

type reviewerInviteResp struct {
	Data struct {
		Success []struct {
			ID     int64 `json:"id"`
			UserID int64 `json:"user_id"`
			Email  string `json:"email"`
		} `json:"success"`
	} `json:"data"`
}

// COITarget is a conference-consistent triple for the COI benchmark: the
// reviewer and author both belong to the conference, so coi-check is valid.
type COITarget struct {
	ConferenceID int64  `json:"conference_id"`
	ReviewerID   int64  `json:"reviewer_id"`
	AuthorEmail  string `json:"author_email"`
}

type Summary struct {
	BaseURL        string      `json:"base_url"`
	ChairToken     string      `json:"chair_token"`
	ConferenceIDs  []int64     `json:"conference_ids"`
	SubmissionIDs  []int64     `json:"submission_ids"`
	ReviewerEmails []string    `json:"reviewer_emails"`
	ReviewerIDs    []int64     `json:"reviewer_ids"`
	AuthorEmail    string      `json:"author_email,omitempty"`
	COITargets     []COITarget `json:"coi_targets"`
	Stats          SeedStats   `json:"stats"`
	GeneratedAt    string      `json:"generated_at"`
}

type SeedStats struct {
	Conferences int `json:"conferences"`
	Submissions int `json:"submissions"`
	Reviewers   int `json:"reviewers"`
	Failures    int `json:"failures"`
}

func login(c *apiClient, email string) (string, int64, error) {
	var resp loginResp
	body := map[string]string{"email": email, "first_name": "Bench", "last_name": "User"}
	if err := c.do("POST", "/api/v1/auth/test-login", "", body, &resp); err != nil {
		return "", 0, fmt.Errorf("test-login failed (is the server in development/test env?): %w", err)
	}
	return resp.Data.Token, resp.Data.User.ID, nil
}

type poolUser struct {
	email  string
	token  string
	userID int64
}

// buildAuthorPool creates the distinct authors reused across all conferences.
// Each author may submit once per conference, so a pool of `size` authors
// yields `size` submissions per conference.
func buildAuthorPool(c *apiClient, size int) ([]poolUser, error) {
	pool := make([]poolUser, size)
	for i := 0; i < size; i++ {
		email := fmt.Sprintf("bench-author-%d@example.com", i)
		token, id, err := login(c, email)
		if err != nil {
			return nil, fmt.Errorf("author pool login %s: %w", email, err)
		}
		pool[i] = poolUser{email: email, token: token, userID: id}
	}
	return pool, nil
}

// buildReviewerPool creates the global reviewer user pool.
func buildReviewerPool(c *apiClient, size int) ([]poolUser, error) {
	pool := make([]poolUser, size)
	for i := 0; i < size; i++ {
		email := fmt.Sprintf("bench-reviewer-%d@example.com", i)
		token, id, err := login(c, email)
		if err != nil {
			return nil, fmt.Errorf("reviewer pool login %s: %w", email, err)
		}
		pool[i] = poolUser{email: email, token: token, userID: id}
	}
	return pool, nil
}

func seedPostgres(c *apiClient, cfg Config) (*Summary, error) {
	chairToken := cfg.AuthToken
	if chairToken == "" {
		t, _, err := login(c, "bench-chair@example.com")
		if err != nil {
			return nil, err
		}
		chairToken = t
	}

	subsPerConf := cfg.submissionsPerConf()
	revsPerConf := cfg.reviewersPerConf()

	fmt.Printf("Building author pool (%d) and reviewer pool (%d)...\n", subsPerConf, cfg.Reviewers)
	authorPool, err := buildAuthorPool(c, subsPerConf)
	if err != nil {
		return nil, err
	}
	reviewerPool, err := buildReviewerPool(c, cfg.Reviewers)
	if err != nil {
		return nil, err
	}

	sum := &Summary{
		BaseURL:     cfg.BaseURL,
		ChairToken:  chairToken,
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
	}
	if len(authorPool) > 0 {
		sum.AuthorEmail = authorPool[0].email
	}
	for _, r := range reviewerPool {
		sum.ReviewerEmails = append(sum.ReviewerEmails, r.email)
	}

	fmt.Printf("Seeding %d conferences (%d submissions, %d reviewers each) with concurrency=%d...\n",
		cfg.Conferences, subsPerConf, revsPerConf, cfg.Concurrency)

	var (
		mu       sync.Mutex
		failures int64
		wg       sync.WaitGroup
		done     int64
	)
	jobs := make(chan int)

	worker := func() {
		defer wg.Done()
		// Each worker uses its own client to avoid connection contention.
		wc := newAPIClient(cfg.BaseURL)
		for i := range jobs {
			res, err := seedConference(wc, chairToken, i, authorPool, reviewerPool, revsPerConf)
			if err != nil {
				atomic.AddInt64(&failures, 1)
				fmt.Fprintf(os.Stderr, "conference %d failed: %v\n", i, err)
				continue
			}
			mu.Lock()
			sum.ConferenceIDs = append(sum.ConferenceIDs, res.conferenceID)
			sum.SubmissionIDs = append(sum.SubmissionIDs, res.submissionIDs...)
			sum.ReviewerIDs = append(sum.ReviewerIDs, res.reviewerIDs...)
			if res.coiTarget != nil {
				sum.COITargets = append(sum.COITargets, *res.coiTarget)
			}
			mu.Unlock()
			n := atomic.AddInt64(&done, 1)
			if n%25 == 0 || int(n) == cfg.Conferences {
				fmt.Printf("  ... %d/%d conferences seeded\n", n, cfg.Conferences)
			}
		}
	}

	workers := cfg.Concurrency
	if workers < 1 {
		workers = 1
	}
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go worker()
	}
	for i := 0; i < cfg.Conferences; i++ {
		jobs <- i
	}
	close(jobs)
	wg.Wait()

	sum.Stats = SeedStats{
		Conferences: len(sum.ConferenceIDs),
		Submissions: len(sum.SubmissionIDs),
		Reviewers:   len(sum.ReviewerIDs),
		Failures:    int(failures),
	}
	if len(sum.ConferenceIDs) == 0 {
		return nil, fmt.Errorf("all %d conferences failed to seed", cfg.Conferences)
	}
	return sum, nil
}

type confResult struct {
	conferenceID  int64
	submissionIDs []int64
	reviewerIDs   []int64
	coiTarget     *COITarget
}

const reviewerBatchSize = 50

func seedConference(
	c *apiClient,
	chairToken string,
	index int,
	authorPool, reviewerPool []poolUser,
	revsPerConf int,
) (*confResult, error) {
	acronym := fmt.Sprintf("BENCH%d-%d", index, time.Now().UnixNano())
	confBody := map[string]interface{}{
		"conference": map[string]interface{}{
			"title":   fmt.Sprintf("Benchmark Conference %d", index),
			"acronym": acronym,
			"venue":   "Benchmark City",
		},
	}
	var cr createdResp
	if err := c.do("POST", "/api/v1/conferences", chairToken, confBody, &cr); err != nil {
		return nil, fmt.Errorf("create conference: %w", err)
	}

	res := &confResult{conferenceID: cr.Data.ID}

	// Invite a rotating slice of the reviewer pool so different conferences use
	// different reviewers, spreading the COI/matching load across the pool.
	reviewerIDs, err := inviteReviewers(c, chairToken, cr.Data.ID, selectReviewers(reviewerPool, revsPerConf, index))
	if err != nil {
		return nil, fmt.Errorf("invite reviewers: %w", err)
	}
	res.reviewerIDs = reviewerIDs

	// Submissions: one per author in the pool.
	path := fmt.Sprintf("/api/v1/conferences/%d/submissions", cr.Data.ID)
	for s, author := range authorPool {
		subJSON, err := json.Marshal(map[string]interface{}{
			"submission": map[string]interface{}{
				"title":    fmt.Sprintf("Benchmark Paper %d-%d", index, s),
				"abstract": "Synthetic abstract for benchmarking purposes.",
			},
		})
		if err != nil {
			return nil, err
		}
		var sr createdResp
		fields := map[string]string{"submission": string(subJSON)}
		if err := c.doMultipart("POST", path, author.token, fields, &sr); err != nil {
			return nil, fmt.Errorf("create submission %d: %w", s, err)
		}
		res.submissionIDs = append(res.submissionIDs, sr.Data.ID)
	}

	if len(res.reviewerIDs) > 0 && len(authorPool) > 0 {
		res.coiTarget = &COITarget{
			ConferenceID: cr.Data.ID,
			ReviewerID:   res.reviewerIDs[0],
			AuthorEmail:  authorPool[0].email,
		}
	}
	return res, nil
}

// selectReviewers picks the rotating reviewer slice for a conference, so
// different conferences draw different reviewers from the shared pool.
func selectReviewers(pool []poolUser, count, index int) []poolUser {
	if count >= len(pool) {
		return pool
	}
	offset := (index * count) % len(pool)
	slice := make([]poolUser, 0, count)
	for i := 0; i < count; i++ {
		slice = append(slice, pool[(offset+i)%len(pool)])
	}
	return slice
}

func inviteReviewers(c *apiClient, chairToken string, conferenceID int64, reviewers []poolUser) ([]int64, error) {
	var ids []int64
	path := fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID)

	for start := 0; start < len(reviewers); start += reviewerBatchSize {
		end := start + reviewerBatchSize
		if end > len(reviewers) {
			end = len(reviewers)
		}
		batch := make([]map[string]interface{}, 0, end-start)
		tokenByUserID := make(map[int64]string)
		for _, r := range reviewers[start:end] {
			tokenByUserID[r.userID] = r.token
			batch = append(batch, map[string]interface{}{
				"user_id": r.userID,
				"domain":  []string{"Computer Science"},
				"status":  "pending",
			})
		}

		var inv reviewerInviteResp
		if err := c.do("POST", path, chairToken, map[string]interface{}{"reviewers": batch}, &inv); err != nil {
			return nil, err
		}
		for _, created := range inv.Data.Success {
			ids = append(ids, created.ID)
			token, ok := tokenByUserID[created.UserID]
			if !ok {
				continue
			}
			acceptPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, created.ID)
			if err := c.do("PUT", acceptPath, token, map[string]string{"status": "accepted"}, nil); err != nil {
				return nil, fmt.Errorf("accept reviewer %d: %w", created.ID, err)
			}
		}
	}
	return ids, nil
}

func writeSummary(sum *Summary) (string, error) {
	dir := resultsDir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	out := filepath.Join(dir, "seed-summary.json")
	buf, err := json.MarshalIndent(sum, "", "  ")
	if err != nil {
		return "", err
	}
	if err := os.WriteFile(out, buf, 0o644); err != nil {
		return "", err
	}
	return out, nil
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
