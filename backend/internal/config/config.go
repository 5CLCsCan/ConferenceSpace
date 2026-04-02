package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	Server                   ServerConfig
	Database                 DatabaseConfig
	Neo4j                    Neo4jConfig
	Gemini                   GeminiConfig
	AIService                AIServiceConfig
	SemanticScholar          SemanticScholarConfig
	FileStorage              FileStorageConfig
	JWT                      JWTConfig
	Brevo                    BrevoConfig
	RequireEmailVerification bool
	AppBaseURL               string
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port              string
	Env               string
	AdminToken        string // Admin token to bypass authentication
	AgentServiceToken string
}

// JWTConfig holds JWT-related configuration
type JWTConfig struct {
	Secret string
	Expiry int // in hours
}

// DatabaseConfig holds database-related configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// Neo4jConfig holds Neo4j graph database configuration
type Neo4jConfig struct {
	URI      string
	Username string
	Password string
	Enabled  bool
}

// GeminiConfig holds Google Gemini API configuration
type GeminiConfig struct {
	APIKey  string
	Model   string // e.g., "gemini-pro" or "gemini-1.5-pro"
	Enabled bool
}

// AIServiceConfig holds AI service workflow proxy configuration
type AIServiceConfig struct {
	BaseURL        string
	TimeoutSeconds int
}

// SemanticScholarConfig holds Semantic Scholar API configuration
type SemanticScholarConfig struct {
	APIKey  string
	Enabled bool
}

// FileStorageConfig holds file storage provider configuration
type FileStorageConfig struct {
	Provider               string
	LocalBasePath          string
	SupabaseURL            string
	SupabaseServiceRoleKey string
	SupabaseBucket         string
}

// BrevoConfig holds Brevo transactional email configuration
type BrevoConfig struct {
	APIKey    string
	FromEmail string
	FromName  string
	Enabled   bool
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	// Try to load .env file, but don't fail if it doesn't exist
	_ = godotenv.Load()

	cfg := &Config{
		Server: ServerConfig{
			Port:              getEnv("SERVER_PORT", "8080"),
			Env:               getEnv("SERVER_ENV", "development"),
			AdminToken:        getEnv("ADMIN_TOKEN", ""),
			AgentServiceToken: getEnv("AGENT_SERVICE_TOKEN", ""),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			DBName:   getEnv("DB_NAME", "conferencespace"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Neo4j: Neo4jConfig{
			URI:      getEnv("NEO4J_URI", "bolt://localhost:7687"),
			Username: getEnv("NEO4J_USERNAME", "neo4j"),
			Password: getEnv("NEO4J_PASSWORD", "conferencespace"),
			Enabled:  getEnv("NEO4J_ENABLED", "true") == "true",
		},
		Gemini: GeminiConfig{
			APIKey:  getEnv("GEMINI_API_KEY", ""),
			Model:   getEnv("GEMINI_MODEL", "gemini-1.5-pro"),
			Enabled: getEnv("GEMINI_ENABLED", "false") == "true",
		},
		AIService: AIServiceConfig{
			BaseURL:        getEnv("AI_SERVICE_BASE_URL", "http://localhost:8090"),
			TimeoutSeconds: getEnvAsInt("AI_SERVICE_TIMEOUT_SECONDS", 30),
		},
		SemanticScholar: SemanticScholarConfig{
			APIKey:  getEnv("SEMANTIC_SCHOLAR_API_KEY", ""),
			Enabled: getEnv("SEMANTIC_SCHOLAR_ENABLED", "true") == "true",
		},
		FileStorage: FileStorageConfig{
			Provider:               getEnv("FILE_STORAGE_PROVIDER", "local"),
			LocalBasePath:          getEnv("FILE_STORAGE_LOCAL_BASE_PATH", "./uploads/submissions"),
			SupabaseURL:            getEnv("SUPABASE_URL", ""),
			SupabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
			SupabaseBucket:         getEnv("SUPABASE_STORAGE_BUCKET", ""),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "your-secret-key-change-this-in-production"),
			Expiry: getEnvAsInt("JWT_EXPIRY_HOURS", 24),
		},
		Brevo: BrevoConfig{
			APIKey:    getEnv("BREVO_API_KEY", ""),
			FromEmail: getEnv("BREVO_FROM_EMAIL", "noreply@conferencespace.io"),
			FromName:  getEnv("BREVO_FROM_NAME", "ConferenceSpace"),
			Enabled:   getEnv("BREVO_API_KEY", "") != "",
		},
		RequireEmailVerification: getEnv("REQUIRE_EMAIL_VERIFICATION", "false") == "true",
		AppBaseURL:               getEnv("APP_BASE_URL", "http://localhost:3000"),
	}

	return cfg, nil
}

// GetDSN returns the database connection string
func (c *DatabaseConfig) GetDSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode,
	)
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as int or returns a default value
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := parseInt(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func parseInt(s string) (int, error) {
	var result int
	_, err := fmt.Sscanf(s, "%d", &result)
	return result, err
}
