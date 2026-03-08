package brevo

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

const apiURL = "https://api.brevo.com/v3/smtp/email"

type Config struct {
	APIKey    string
	FromEmail string
	FromName  string
}

type Client struct {
	cfg        Config
	httpClient *http.Client
}

func New(cfg Config) *Client {
	return &Client{
		cfg:        cfg,
		httpClient: &http.Client{},
	}
}

type emailSender struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type emailRecipient struct {
	Email string `json:"email"`
}

type sendEmailRequest struct {
	Sender      emailSender      `json:"sender"`
	To          []emailRecipient `json:"to"`
	Subject     string           `json:"subject"`
	HtmlContent string           `json:"htmlContent"`
}

func (c *Client) SendEmail(ctx context.Context, toEmail, subject, htmlContent string) error {
	if c.cfg.APIKey == "" {
		// No-op in dev when API key not set
		log.Printf("[Brevo] Skipping email send (no API key): to=%s subject=%s", toEmail, subject)
		return nil
	}

	payload := sendEmailRequest{
		Sender:      emailSender{Name: c.cfg.FromName, Email: c.cfg.FromEmail},
		To:          []emailRecipient{{Email: toEmail}},
		Subject:     subject,
		HtmlContent: htmlContent,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("accept", "application/json")
	req.Header.Set("api-key", c.cfg.APIKey)
	req.Header.Set("content-type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("brevo API returned status %d", resp.StatusCode)
	}

	return nil
}
