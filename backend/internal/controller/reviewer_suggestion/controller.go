package reviewer_suggestion

import (
	"strconv"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	reviewerSuggestionService "github.com/dcao/conferencespace/internal/service/reviewer_suggestion"
	"github.com/gin-gonic/gin"
)

// Controller handles reviewer suggestion HTTP requests
type Controller struct {
	service *reviewerSuggestionService.Service
}

// New creates a new reviewer suggestion controller
func New(service *reviewerSuggestionService.Service) *Controller {
	return &Controller{service: service}
}

// GetSuggestions returns reviewer suggestions for a conference.
// @Summary      Get reviewer suggestions for a conference
// @Description  Returns merged internal + external reviewer suggestions ranked by topic match.
// @Tags         conferences
// @Produce      json
// @Param        conference_id path int true "Conference ID"
// @Param        limit query int false "Maximum number of suggestions (default 20)"
// @Success      200 {object} dto.ReviewerSuggestionResponse
// @Router       /conferences/{conference_id}/reviewer-suggestions [get]
func (c *Controller) GetSuggestions(ctx *gin.Context, req *dto.ReviewerSuggestionRequest) (*dto.ReviewerSuggestionResponse, error) {
	if req.ConferenceID == 0 {
		conferenceIDStr := ctx.Param("conference_id")
		id, err := strconv.ParseInt(conferenceIDStr, 10, 64)
		if err != nil {
			return nil, handler.NewErrorResponse(400, "invalid conference_id")
		}
		req.ConferenceID = id
	}

	return c.service.GetSuggestions(ctx.Request.Context(), req.ConferenceID, req.Limit)
}
