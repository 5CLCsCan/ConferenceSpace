package reviewer

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// Client provides methods to call reviewer dashboard endpoints
type Client struct {
	ctx *testutils.TestContext
}

// NewClient creates a new reviewer client
func NewClient(ctx *testutils.TestContext) *Client {
	return &Client{ctx: ctx}
}

// GetDashboard calls the reviewer dashboard endpoint
func (c *Client) GetDashboard(reviewerEmail string, params *DashboardParams, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/reviewer/%s/dashboard", url.PathEscape(reviewerEmail))
	
	if params != nil {
		query := url.Values{}
		if params.ConferenceLimit > 0 {
			query.Add("conference_limit", fmt.Sprintf("%d", params.ConferenceLimit))
		}
		if params.ConferenceOffset > 0 {
			query.Add("conference_offset", fmt.Sprintf("%d", params.ConferenceOffset))
		}
		if params.ConferenceSearch != "" {
			query.Add("conference_search", params.ConferenceSearch)
		}
		if params.InvitationLimit > 0 {
			query.Add("invitation_limit", fmt.Sprintf("%d", params.InvitationLimit))
		}
		if params.InvitationOffset > 0 {
			query.Add("invitation_offset", fmt.Sprintf("%d", params.InvitationOffset))
		}
		if params.InvitationStatus != "" {
			query.Add("invitation_status", params.InvitationStatus)
		}
		if params.RecentAssignmentLimit > 0 {
			query.Add("recent_assignment_limit", fmt.Sprintf("%d", params.RecentAssignmentLimit))
		}
		if params.RecentAssignmentOffset > 0 {
			query.Add("recent_assignment_offset", fmt.Sprintf("%d", params.RecentAssignmentOffset))
		}
		
		if len(query) > 0 {
			path += "?" + query.Encode()
		}
	}
	
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// GetConferencePapers calls the reviewer conference papers endpoint
func (c *Client) GetConferencePapers(reviewerEmail string, conferenceID int64, params *PaperParams, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", url.PathEscape(reviewerEmail), conferenceID)
	
	if params != nil {
		query := url.Values{}
		if params.Limit > 0 {
			query.Add("limit", fmt.Sprintf("%d", params.Limit))
		}
		if params.Offset > 0 {
			query.Add("offset", fmt.Sprintf("%d", params.Offset))
		}
		if params.Search != "" {
			query.Add("search", params.Search)
		}
		if params.Status != "" {
			query.Add("status", params.Status)
		}
		
		if len(query) > 0 {
			path += "?" + query.Encode()
		}
	}
	
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// GetCompletedPapers calls the reviewer completed papers endpoint
func (c *Client) GetCompletedPapers(reviewerEmail string, params *PaperParams, token string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/reviewer/%s/completed-papers", url.PathEscape(reviewerEmail))
	
	if params != nil {
		query := url.Values{}
		if params.Limit > 0 {
			query.Add("limit", fmt.Sprintf("%d", params.Limit))
		}
		if params.Offset > 0 {
			query.Add("offset", fmt.Sprintf("%d", params.Offset))
		}
		if params.Search != "" {
			query.Add("search", params.Search)
		}
		
		if len(query) > 0 {
			path += "?" + query.Encode()
		}
	}
	
	return c.ctx.MakeRequest("GET", path, nil, token)
}

// DashboardParams holds parameters for dashboard queries
type DashboardParams struct {
	ConferenceLimit        int
	ConferenceOffset       int
	ConferenceSearch       string
	InvitationLimit        int
	InvitationOffset       int
	InvitationStatus       string
	RecentAssignmentLimit  int
	RecentAssignmentOffset int
}

// PaperParams holds parameters for paper queries
type PaperParams struct {
	Limit  int
	Offset int
	Search string
	Status string
}

// GetDashboardSuccess is a helper that gets the dashboard and returns the response
func (c *Client) GetDashboardSuccess(reviewerEmail string, params *DashboardParams, token string) (*dto.ReviewerDashboardResponseWithPagination, error) {
	resp, err := c.GetDashboard(reviewerEmail, params, token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.ReviewerDashboardResponseWithPagination `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)
	return response.Data, nil
}

// GetConferencePapersSuccess is a helper that gets conference papers and returns the response
func (c *Client) GetConferencePapersSuccess(reviewerEmail string, conferenceID int64, params *PaperParams, token string) (*dto.GetConferencePapersResponse, error) {
	resp, err := c.GetConferencePapers(reviewerEmail, conferenceID, params, token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.GetConferencePapersResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)
	return response.Data, nil
}

// GetCompletedPapersSuccess is a helper that gets completed papers and returns the response
func (c *Client) GetCompletedPapersSuccess(reviewerEmail string, params *PaperParams, token string) (*dto.GetCompletedPapersResponse, error) {
	resp, err := c.GetCompletedPapers(reviewerEmail, params, token)
	if err != nil {
		return nil, err
	}

	var response struct {
		Data *dto.GetCompletedPapersResponse `json:"data"`
	}
	testutils.DecodeResponse(c.ctx.T, resp, &response)
	return response.Data, nil
}

