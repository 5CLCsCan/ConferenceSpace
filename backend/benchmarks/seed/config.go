package main

import (
	"flag"
	"os"
	"strconv"
)

type Config struct {
	BaseURL                  string
	AuthToken                string
	Conferences              int
	Reviewers                int
	Submissions              int
	SubmissionsPerConference int
	ReviewersPerConference   int
	Concurrency              int
	DeclaredConflicts        int
	Authors                  int
	CoauthorEdges            int
	GraphOnly                bool
	Neo4jURI                 string
	Neo4jUser                string
	Neo4jPass                string
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func parseConfig(args []string) Config {
	fs := flag.NewFlagSet("seed", flag.ContinueOnError)
	cfg := Config{}
	fs.StringVar(&cfg.BaseURL, "base-url", envOr("BASE_URL", "http://localhost:8080"), "backend base URL")
	fs.StringVar(&cfg.AuthToken, "token", os.Getenv("AUTH_TOKEN"), "pre-supplied JWT (optional)")
	fs.IntVar(&cfg.Conferences, "conferences", envInt("SEED_CONFERENCES", 1), "number of conferences")
	fs.IntVar(&cfg.Reviewers, "reviewers", envInt("SEED_REVIEWERS", 200), "global reviewer user pool size")
	fs.IntVar(&cfg.Submissions, "submissions", envInt("SEED_SUBMISSIONS", 0), "total submissions (used only if submissions-per-conference is 0)")
	fs.IntVar(&cfg.SubmissionsPerConference, "submissions-per-conference", envInt("SEED_SUBMISSIONS_PER_CONFERENCE", 0), "submissions per conference (overrides --submissions)")
	fs.IntVar(&cfg.ReviewersPerConference, "reviewers-per-conference", envInt("SEED_REVIEWERS_PER_CONFERENCE", 0), "reviewers invited per conference from the pool (0 = whole pool)")
	fs.IntVar(&cfg.Concurrency, "concurrency", envInt("SEED_CONCURRENCY", 8), "parallel workers seeding conferences")
	fs.IntVar(&cfg.DeclaredConflicts, "declared-conflicts", envInt("SEED_DECLARED_CONFLICTS", 100), "declared conflicts")
	fs.IntVar(&cfg.Authors, "authors", envInt("SEED_AUTHORS", 500), "graph authors")
	fs.IntVar(&cfg.CoauthorEdges, "coauthor-edges", envInt("SEED_COAUTHOR_EDGES", 4000), "graph coauthor edges")
	fs.BoolVar(&cfg.GraphOnly, "graph-only", false, "only seed the Neo4j co-authorship graph")
	fs.StringVar(&cfg.Neo4jURI, "neo4j-uri", envOr("NEO4J_URI", "bolt://localhost:7687"), "Neo4j URI")
	fs.StringVar(&cfg.Neo4jUser, "neo4j-user", envOr("NEO4J_USER", "neo4j"), "Neo4j user")
	fs.StringVar(&cfg.Neo4jPass, "neo4j-pass", envOr("NEO4J_PASS", "conferencespace"), "Neo4j password")
	_ = fs.Parse(args)
	return cfg
}

// submissionsPerConf returns the resolved per-conference submission count.
func (c Config) submissionsPerConf() int {
	if c.SubmissionsPerConference > 0 {
		return c.SubmissionsPerConference
	}
	if c.Submissions > 0 {
		return c.Submissions / max(c.Conferences, 1)
	}
	return 0
}

// reviewersPerConf returns how many reviewers from the pool to invite per conference.
func (c Config) reviewersPerConf() int {
	if c.ReviewersPerConference > 0 && c.ReviewersPerConference < c.Reviewers {
		return c.ReviewersPerConference
	}
	return c.Reviewers
}
