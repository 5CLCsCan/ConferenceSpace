package submission

import (
	"net/http"
	"strings"

	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/gin-gonic/gin"
)

const (
	minTrackRecommendationTitleChars    = 8
	minTrackRecommendationAbstractWords = 20
)

func (c *Controller) RecommendTracks(
	ginCtx *gin.Context,
	req *dto.TrackRecommendationRequest,
) (*dto.TrackRecommendationResponse, error) {
	if c.trackRecommendation == nil {
		return nil, handler.NewErrorResponse(http.StatusServiceUnavailable, "track recommendation service is not configured")
	}

	title := strings.TrimSpace(req.Title)
	abstract := strings.TrimSpace(req.Abstract)
	if len(title) < minTrackRecommendationTitleChars || len(strings.Fields(abstract)) < minTrackRecommendationAbstractWords {
		return nil, handler.NewErrorResponse(http.StatusUnprocessableEntity, "need more paper detail before recommending tracks")
	}

	conference, err := c.conferenceStorage.GetByID(ginCtx.Request.Context(), req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}
	if len(conference.Tracks) == 0 {
		return nil, handler.NewErrorResponse(http.StatusUnprocessableEntity, "conference has no tracks configured")
	}

	callForPapers := ""
	if conference.Configurations != nil && conference.Configurations.CallForPaperText != nil {
		callForPapers = strings.TrimSpace(*conference.Configurations.CallForPaperText)
	}

	response, err := c.trackRecommendation.RecommendTracks(
		ginCtx.Request.Context(),
		ginCtx.GetHeader("Authorization"),
		&aiServiceClient.TrackRecommendationRequest{
			Conference: aiServiceClient.TrackRecommendationConferenceContext{
				Title:         strings.TrimSpace(conference.Title),
				Acronym:       strings.TrimSpace(conference.Acronym),
				Description:   strings.TrimSpace(conference.Description),
				CallForPapers: callForPapers,
				Domains:       append([]string(nil), conference.Domain...),
				Tracks:        append([]string(nil), conference.Tracks...),
			},
			Paper: aiServiceClient.TrackRecommendationPaperContext{
				Title:    title,
				Abstract: abstract,
				Keywords: normalizeTrackRecommendationKeywords(req.Keywords),
			},
		},
	)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadGateway, "track recommendation workflow failed")
	}

	items := make([]dto.TrackRecommendation, 0, len(response.Recommendations))
	for _, item := range response.Recommendations {
		items = append(items, dto.TrackRecommendation{
			TrackName:  strings.TrimSpace(item.TrackName),
			Confidence: item.Confidence,
			Reasoning:  strings.TrimSpace(item.Reasoning),
			Rank:       item.Rank,
		})
	}

	return &dto.TrackRecommendationResponse{Recommendations: items}, nil
}

func normalizeTrackRecommendationKeywords(keywords []string) []string {
	if len(keywords) == 0 {
		return nil
	}

	seen := make(map[string]struct{}, len(keywords))
	result := make([]string, 0, len(keywords))
	for _, keyword := range keywords {
		normalized := strings.Join(strings.Fields(keyword), " ")
		if normalized == "" {
			continue
		}
		key := strings.ToLower(normalized)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, normalized)
	}
	if len(result) == 0 {
		return nil
	}
	return result
}
