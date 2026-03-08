package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

const defaultPassword = "DemoPass123!"

type apiClient struct {
	baseURL string
	client  *http.Client
}

type apiError struct {
	StatusCode int
	Message    string
}

func (e *apiError) Error() string {
	return fmt.Sprintf("api error (%d): %s", e.StatusCode, e.Message)
}

type responseEnvelope[T any] struct {
	Data  T      `json:"data"`
	Error string `json:"error"`
}

type session struct {
	Token string
	User  *dto.UserResponse
}

type seedUser struct {
	Email     string
	FirstName string
	LastName  string
	Domain    []string
}

type seededConference struct {
	ID      int64
	Acronym string
	Title   string
	Status  string
}

type seedConference struct {
	Title          string
	Acronym        string
	Description    string
	Venue          string
	Domain         []string
	Tracks         []string
	CoChairs       []string
	DesiredStatus  string
	Configurations *dto.ConferenceConfiguration
}

type seedReviewerInvite struct {
	User   seedUser
	Domain []string
	Status string
}

type conferenceQueryResponse struct {
	Conferences []*dto.UserConferenceResponse `json:"conferences"`
	Total       int64                         `json:"total"`
}

type reviewerBatchInviteResponse struct {
	Success []dto.Reviewer `json:"success"`
	Failed  []struct {
		UserID int64  `json:"user_id"`
		Error  string `json:"error"`
	} `json:"failed"`
}

type reviewerListResponse struct {
	Reviewers []*dto.Reviewer `json:"reviewers"`
	Total     int64           `json:"total"`
}

func main() {
	baseURLFlag := flag.String("base-url", "http://localhost:8080", "ConferenceSpace API base URL")
	passwordFlag := flag.String("password", defaultPassword, "Password for all seeded accounts")
	flag.Parse()

	client := &apiClient{
		baseURL: strings.TrimRight(*baseURLFlag, "/"),
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}

	fmt.Printf("Seeding ConferenceSpace manual QA data against %s\n", client.baseURL)

	if err := client.healthcheck(); err != nil {
		fmt.Fprintf(os.Stderr, "Unable to reach backend: %v\n", err)
		os.Exit(1)
	}

	chairMain := seedUser{
		Email:     "chair.main@conferencespace.local",
		FirstName: "Maya",
		LastName:  "Chen",
		Domain:    []string{"Artificial Intelligence", "Program Management"},
	}
	chairCo := seedUser{
		Email:     "chair.ops@conferencespace.local",
		FirstName: "Ibrahim",
		LastName:  "Khan",
		Domain:    []string{"Natural Language Processing", "Conference Operations"},
	}
	authorPrimary := seedUser{
		Email:     "nora.author@conferencespace.local",
		FirstName: "Nora",
		LastName:  "Tran",
		Domain:    []string{"Machine Learning", "Computer Vision"},
	}
	authorSecondary := seedUser{
		Email:     "liam.author@conferencespace.local",
		FirstName: "Liam",
		LastName:  "Nguyen",
		Domain:    []string{"Responsible AI", "Evaluation"},
	}
	reviewerQA := seedUser{
		Email:     "qa.reviewer@conferencespace.local",
		FirstName: "Quinn",
		LastName:  "Pham",
		Domain:    []string{"Machine Learning", "NLP"},
	}
	reviewerML := seedUser{
		Email:     "ml.reviewer@conferencespace.local",
		FirstName: "Ava",
		LastName:  "Martinez",
		Domain:    []string{"Foundation Models", "Computer Vision"},
	}
	reviewerCOI := seedUser{
		Email:     "coi.reviewer@conferencespace.local",
		FirstName: "Jon",
		LastName:  "Hoang",
		Domain:    []string{"Responsible AI", "Human-in-the-Loop Systems"},
	}

	allUsers := []seedUser{
		chairMain,
		chairCo,
		authorPrimary,
		authorSecondary,
		reviewerQA,
		reviewerML,
		reviewerCOI,
	}

	sessions := make(map[string]*session, len(allUsers))
	for _, user := range allUsers {
		userSession, err := client.ensureUser(user, *passwordFlag)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Failed to ensure user %s: %v\n", user.Email, err)
			os.Exit(1)
		}
		sessions[user.Email] = userSession
	}

	openStart := mustTime("2026-08-12T09:00:00Z")
	openEnd := mustTime("2026-08-15T18:00:00Z")
	strictStart := mustTime("2026-10-20T09:00:00Z")
	strictEnd := mustTime("2026-10-23T18:00:00Z")
	archivedStart := mustTime("2025-09-09T09:00:00Z")
	archivedEnd := mustTime("2025-09-12T18:00:00Z")
	abstractDeadline := mustTime("2026-05-10T23:59:59Z")
	fullDeadline := mustTime("2026-05-24T23:59:59Z")
	strictAbstractDeadline := mustTime("2026-07-01T23:59:59Z")
	strictFullDeadline := mustTime("2026-07-15T23:59:59Z")
	archivedAbstractDeadline := mustTime("2025-05-01T23:59:59Z")
	archivedFullDeadline := mustTime("2025-05-15T23:59:59Z")
	cameraReadyDeadline := mustTime("2026-07-01T23:59:59Z")
	strictCameraReadyDeadline := mustTime("2026-09-01T23:59:59Z")
	archivedCameraReadyDeadline := mustTime("2025-07-01T23:59:59Z")

	conferences := []seedConference{
		{
			Title:         "International Conference on Applied Intelligence 2026",
			Acronym:       "ICAI26",
			Description:   "A realistic demo conference focused on LLM systems, multimodal review workflows, and trustworthy AI evaluation.",
			Venue:         "Singapore Expo, Singapore",
			Domain:        []string{"Artificial Intelligence", "Machine Learning", "Computer Vision"},
			Tracks:        []string{"Foundation Models", "Computer Vision", "Responsible AI"},
			CoChairs:      []string{chairCo.Email},
			DesiredStatus: "open",
			Configurations: &dto.ConferenceConfiguration{
				StartDate:                   &openStart,
				EndDate:                     &openEnd,
				AbstractSubmissionDeadline:  &abstractDeadline,
				FullPaperSubmissionDeadline: &fullDeadline,
				CameraReadyDeadline:         &cameraReadyDeadline,
				Format:                      stringPtr("double_blind"),
				ReviewType:                  stringPtr("double_blind"),
				SubmissionType:              stringPtr("full_paper"),
				HaveCOI:                     boolPtr(true),
				COIWindowYears:              intPtr(4),
				MaximumPages:                intPtr(12),
				SubmissionFormat:            stringPtr("pdf"),
				CallForPaperText:            stringPtr("We welcome original research on review automation, scientific document intelligence, and transparent conference workflows."),
				DeskRejectionSettings: &dto.DeskRejectionSettings{
					Enabled:          boolPtr(true),
					MinReferences:    intPtr(1),
					RequiredSections: []string{"Abstract", "Introduction", "Method", "Experiments", "Conclusion"},
					TitleMaxWords:    intPtr(25),
					MaxSentenceWords: intPtr(45),
					Thresholds: &dto.DeskRejectionThresholds{
						DeskRejectScore: floatPtr(0.15),
						AcceptScore:     floatPtr(0.35),
					},
					CustomRules: &dto.DeskRejectionCustomRules{
						MinimumTables:               intPtr(0),
						MinDatasets:                 intPtr(0),
						AuthorAnonymizationRequired: boolPtr(false),
					},
					ScopeKeywords: []string{"artificial intelligence", "machine learning", "computer vision", "multimodal", "review automation"},
					PromptFragments: []string{
						"Prefer accept_for_review when the paper is structurally complete and clearly within AI/ML scope.",
						"Do not fail the paper solely because it uses a workshop-style evaluation section if the methodology is clear.",
					},
				},
				DiscussionSettings: &dto.DiscussionSettings{
					Enabled:             boolPtr(true),
					AllowAuthorResponse: boolPtr(true),
				},
				RebuttalSettings: &dto.RebuttalSettings{
					Enabled:              boolPtr(true),
					CharacterLimit:       intPtr(3500),
					AllowRevisions:       boolPtr(false),
					AllowNewResults:      boolPtr(false),
					RequireResponseToAll: boolPtr(false),
				},
				WorkflowSettings: &dto.WorkflowSettings{
					StrictDeadlines: boolPtr(false),
				},
			},
		},
		{
			Title:         "Responsible Systems and Data Learning Workshop 2026",
			Acronym:       "RSDL26",
			Description:   "A stricter workshop setup used to exercise desk rejection and configuration-driven precheck rules.",
			Venue:         "Online + Hanoi, Vietnam",
			Domain:        []string{"Responsible AI", "Evaluation", "Data Governance"},
			Tracks:        []string{"Fairness", "Evaluation Protocols"},
			DesiredStatus: "open",
			Configurations: &dto.ConferenceConfiguration{
				StartDate:                   &strictStart,
				EndDate:                     &strictEnd,
				AbstractSubmissionDeadline:  &strictAbstractDeadline,
				FullPaperSubmissionDeadline: &strictFullDeadline,
				CameraReadyDeadline:         &strictCameraReadyDeadline,
				Format:                      stringPtr("double_blind"),
				ReviewType:                  stringPtr("double_blind"),
				SubmissionType:              stringPtr("full_paper"),
				HaveCOI:                     boolPtr(true),
				COIWindowYears:              intPtr(5),
				MaximumPages:                intPtr(10),
				SubmissionFormat:            stringPtr("pdf"),
				CallForPaperText:            stringPtr("Submissions should include clear evaluation methodology, explicit contributions, and empirical evidence."),
				DeskRejectionSettings: &dto.DeskRejectionSettings{
					Enabled:          boolPtr(true),
					MinReferences:    intPtr(8),
					RequiredSections: []string{"Abstract", "Introduction", "Methods", "Experiments", "Conclusions"},
					TitleMaxWords:    intPtr(18),
					MaxSentenceWords: intPtr(30),
					Thresholds: &dto.DeskRejectionThresholds{
						DeskRejectScore: floatPtr(0.45),
						AcceptScore:     floatPtr(0.72),
					},
					CustomRules: &dto.DeskRejectionCustomRules{
						MinimumTables:               intPtr(1),
						MinDatasets:                 intPtr(1),
						AuthorAnonymizationRequired: boolPtr(true),
						BannedPhrases:               []string{"to be added", "coming soon"},
					},
					ScopeKeywords: []string{"responsible ai", "evaluation", "data governance", "fairness", "audit"},
					PromptFragments: []string{
						"Be strict about evidence quality and reject papers with placeholder experiments or missing evaluation details.",
					},
				},
				WorkflowSettings: &dto.WorkflowSettings{
					StrictDeadlines: boolPtr(true),
				},
			},
		},
		{
			Title:         "Neural Evaluation and Operations Symposium 2026",
			Acronym:       "NEUROPS26",
			Description:   "Used to verify reviewer invitation states across accepted, pending, and rejected tabs.",
			Venue:         "Seoul Convention Center, South Korea",
			Domain:        []string{"Neural Systems", "Operations", "Evaluation"},
			Tracks:        []string{"Neural Systems", "LLM Ops"},
			DesiredStatus: "open",
			Configurations: &dto.ConferenceConfiguration{
				StartDate:                   &strictStart,
				EndDate:                     &strictEnd,
				AbstractSubmissionDeadline:  &strictAbstractDeadline,
				FullPaperSubmissionDeadline: &strictFullDeadline,
				CameraReadyDeadline:         &strictCameraReadyDeadline,
				ReviewType:                  stringPtr("double_blind"),
				HaveCOI:                     boolPtr(true),
				MaximumPages:                intPtr(10),
				SubmissionFormat:            stringPtr("pdf"),
			},
		},
		{
			Title:         "Software Engineering and Applied AI Summit 2025",
			Acronym:       "SEAA25",
			Description:   "Completed conference to exercise completed-state lists and recent-conference archiving in the sidebar.",
			Venue:         "Berlin Congress Center, Germany",
			Domain:        []string{"Software Engineering", "AI Systems"},
			Tracks:        []string{"Testing", "Reliability", "Tooling"},
			DesiredStatus: "completed",
			Configurations: &dto.ConferenceConfiguration{
				StartDate:                   &archivedStart,
				EndDate:                     &archivedEnd,
				AbstractSubmissionDeadline:  &archivedAbstractDeadline,
				FullPaperSubmissionDeadline: &archivedFullDeadline,
				CameraReadyDeadline:         &archivedCameraReadyDeadline,
				ReviewType:                  stringPtr("single_blind"),
				HaveCOI:                     boolPtr(true),
				MaximumPages:                intPtr(12),
				SubmissionFormat:            stringPtr("pdf"),
			},
		},
	}

	chairSession := sessions[chairMain.Email]
	createdConferences := make(map[string]*dto.ConferenceResponse, len(conferences))
	for _, conf := range conferences {
		result, err := client.ensureConference(chairSession.Token, conf)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Failed to ensure conference %s: %v\n", conf.Acronym, err)
			os.Exit(1)
		}
		createdConferences[conf.Acronym] = result
	}

	if err := client.ensureReviewerSet(
		chairSession.Token,
		createdConferences["ICAI26"].ID,
		[]seedReviewerInvite{
			{User: reviewerQA, Domain: []string{"Machine Learning", "Workflow QA"}, Status: "accepted"},
			{User: reviewerML, Domain: []string{"Foundation Models", "Computer Vision"}, Status: "accepted"},
			{User: reviewerCOI, Domain: []string{"Responsible AI", "Human-in-the-Loop"}, Status: "accepted"},
		},
		sessions,
	); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to ensure ICAI26 reviewers: %v\n", err)
		os.Exit(1)
	}

	if err := client.ensureReviewerSet(
		chairSession.Token,
		createdConferences["RSDL26"].ID,
		[]seedReviewerInvite{
			{User: reviewerQA, Domain: []string{"Evaluation", "Responsible AI"}, Status: "pending"},
		},
		sessions,
	); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to ensure RSDL26 reviewers: %v\n", err)
		os.Exit(1)
	}

	if err := client.ensureReviewerSet(
		chairSession.Token,
		createdConferences["NEUROPS26"].ID,
		[]seedReviewerInvite{
			{User: reviewerQA, Domain: []string{"Neural Systems", "LLM Ops"}, Status: "rejected"},
		},
		sessions,
	); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to ensure NEUROPS26 reviewers: %v\n", err)
		os.Exit(1)
	}

	if err := client.ensureDraftSubmission(
		createdConferences["ICAI26"].ID,
		sessions[authorPrimary.Email].Token,
		&dto.Submission{
			Title:    "Efficient Adapter Routing for Multimodal Review Systems",
			Abstract: "We present a routing strategy for multimodal adapter stacks that improves reviewer-assistance workflows while preserving decision transparency.",
			Domain:   []string{"Machine Learning", "Computer Vision"},
			Track:    "Foundation Models",
			Status:   dto.StatusDraft,
			Information: &dto.SubmissionInformation{
				TrackName: "Foundation Models",
				CoAuthors: []string{"mina.collab@research.example"},
				Keywords:  []string{"adapter routing", "multimodal systems", "review automation"},
				PaperType: "research",
				DeclaredConflicts: []dto.ConflictDeclaration{
					{
						Email:  reviewerCOI.Email,
						Reason: "Recent collaborator on a workshop paper",
					},
				},
				AdditionalNotes: "Use this draft to test final submission, precheck, and declared-conflict editing in the author flow.",
			},
		},
	); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to ensure ICAI26 draft submission: %v\n", err)
		os.Exit(1)
	}

	if err := client.ensureDraftSubmission(
		createdConferences["RSDL26"].ID,
		sessions[authorSecondary.Email].Token,
		&dto.Submission{
			Title:    "Audit Trails for Responsible Reviewer Assignment",
			Abstract: "This draft is intentionally staged for strict precheck testing and workflow configuration validation.",
			Domain:   []string{"Responsible AI", "Evaluation"},
			Track:    "Evaluation Protocols",
			Status:   dto.StatusDraft,
			Information: &dto.SubmissionInformation{
				TrackName: "Evaluation Protocols",
				Keywords:  []string{"audit trails", "coi governance", "review assignment"},
				PaperType: "research",
				DeclaredConflicts: []dto.ConflictDeclaration{
					{
						Email:  reviewerQA.Email,
						Reason: "Same lab during the previous funding cycle",
					},
				},
				AdditionalNotes: "Use this draft to test desk rejection with a stricter conference configuration.",
			},
		},
	); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to ensure RSDL26 draft submission: %v\n", err)
		os.Exit(1)
	}

	summary := []seededConference{
		{ID: createdConferences["ICAI26"].ID, Acronym: "ICAI26", Title: createdConferences["ICAI26"].Title, Status: createdConferences["ICAI26"].Status},
		{ID: createdConferences["RSDL26"].ID, Acronym: "RSDL26", Title: createdConferences["RSDL26"].Title, Status: createdConferences["RSDL26"].Status},
		{ID: createdConferences["NEUROPS26"].ID, Acronym: "NEUROPS26", Title: createdConferences["NEUROPS26"].Title, Status: createdConferences["NEUROPS26"].Status},
		{ID: createdConferences["SEAA25"].ID, Acronym: "SEAA25", Title: createdConferences["SEAA25"].Title, Status: createdConferences["SEAA25"].Status},
	}
	sort.Slice(summary, func(i, j int) bool { return summary[i].Acronym < summary[j].Acronym })

	fmt.Println()
	fmt.Println("Seed complete.")
	fmt.Println()
	fmt.Println("Accounts")
	for _, user := range allUsers {
		fmt.Printf("- %s / %s (%s %s)\n", user.Email, *passwordFlag, user.FirstName, user.LastName)
	}
	fmt.Println()
	fmt.Println("Conferences")
	for _, conf := range summary {
		fmt.Printf("- %s [%d] %s (%s)\n", conf.Acronym, conf.ID, conf.Title, conf.Status)
	}
	fmt.Println()
	fmt.Println("Recommended manual flow")
	fmt.Println("- Chair: log in as chair.main@conferencespace.local and verify ICAI26, RSDL26, NEUROPS26, and SEAA25 appear in recent conferences.")
	fmt.Println("- Reviewer: log in as qa.reviewer@conferencespace.local and verify invitations show accepted (ICAI26), pending (RSDL26), and rejected (NEUROPS26).")
	fmt.Println("- Author: log in as nora.author@conferencespace.local to finish and submit the ICAI26 draft, or liam.author@conferencespace.local to test stricter desk rejection in RSDL26.")
}

func (c *apiClient) healthcheck() error {
	req, err := http.NewRequest(http.MethodGet, c.baseURL+"/health", nil)
	if err != nil {
		return err
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("healthcheck returned %d", resp.StatusCode)
	}
	return nil
}

func (c *apiClient) ensureUser(seed seedUser, password string) (*session, error) {
	registerPayload := &dto.UserCreateRequest{
		User: &dto.User{
			Email:     seed.Email,
			FirstName: seed.FirstName,
			LastName:  seed.LastName,
			Domain:    seed.Domain,
		},
		Password: password,
	}

	_, statusCode, err := requestJSON[dto.UserResponse](c, http.MethodPost, "/api/v1/auth/register", "", registerPayload)
	if err != nil {
		var apiErr *apiError
		if !errors.As(err, &apiErr) || apiErr.StatusCode != http.StatusConflict {
			return nil, err
		}
		_ = statusCode
	}

	loginData, _, err := requestJSON[dto.LoginResponse](c, http.MethodPost, "/api/v1/auth/login", "", &dto.LoginRequest{
		Email:    seed.Email,
		Password: password,
	})
	if err != nil {
		return nil, err
	}

	return &session{
		Token: loginData.Token,
		User:  loginData.User,
	}, nil
}

func (c *apiClient) ensureConference(token string, seed seedConference) (*dto.ConferenceResponse, error) {
	existing, err := c.findConferenceByAcronym(token, seed.Acronym)
	if err != nil {
		return nil, err
	}

	payload := &dto.Conference{
		Title:          seed.Title,
		Acronym:        seed.Acronym,
		Description:    seed.Description,
		CoChairs:       seed.CoChairs,
		Domain:         seed.Domain,
		Tracks:         seed.Tracks,
		Venue:          seed.Venue,
		Configurations: seed.Configurations,
	}

	var conference *dto.ConferenceResponse
	if existing == nil {
		created, _, err := requestJSON[dto.ConferenceResponse](
			c,
			http.MethodPost,
			"/api/v1/conferences",
			token,
			map[string]any{"conference": payload},
		)
		if err != nil {
			return nil, err
		}
		conference = &created
	} else {
		updated, _, err := requestJSON[dto.ConferenceResponse](
			c,
			http.MethodPut,
			fmt.Sprintf("/api/v1/conferences/%d", existing.ID),
			token,
			map[string]any{"conference": payload},
		)
		if err != nil {
			return nil, err
		}
		conference = &updated
	}

	if err := c.transitionConferenceStatus(token, conference.ID, conference.Status, seed.DesiredStatus); err != nil {
		return nil, err
	}

	refreshed, _, err := requestJSON[dto.ConferenceResponse](
		c,
		http.MethodGet,
		fmt.Sprintf("/api/v1/conferences/%d", conference.ID),
		token,
		nil,
	)
	if err != nil {
		return nil, err
	}

	return &refreshed, nil
}

func (c *apiClient) transitionConferenceStatus(token string, conferenceID int64, currentStatus string, desiredStatus string) error {
	if desiredStatus == "" || currentStatus == desiredStatus {
		return nil
	}

	path := fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID)
	switch desiredStatus {
	case "reviewing":
		if currentStatus != "open" {
			return nil
		}
		_, _, err := requestJSON[dto.ConferenceTransitionStatusResponse](c, http.MethodPut, path, token, map[string]any{
			"conference_id": conferenceID,
			"new_status":    "reviewing",
		})
		return err
	case "completed":
		if currentStatus == "open" {
			if _, _, err := requestJSON[dto.ConferenceTransitionStatusResponse](c, http.MethodPut, path, token, map[string]any{
				"conference_id": conferenceID,
				"new_status":    "reviewing",
			}); err != nil {
				return err
			}
			currentStatus = "reviewing"
		}
		if currentStatus == "reviewing" {
			_, _, err := requestJSON[dto.ConferenceTransitionStatusResponse](c, http.MethodPut, path, token, map[string]any{
				"conference_id": conferenceID,
				"new_status":    "completed",
			})
			return err
		}
	}
	return nil
}

func (c *apiClient) ensureReviewerSet(
	chairToken string,
	conferenceID int64,
	reviewers []seedReviewerInvite,
	sessions map[string]*session,
) error {
	existing, err := c.listReviewers(chairToken, conferenceID)
	if err != nil {
		return err
	}

	byEmail := make(map[string]*dto.Reviewer, len(existing))
	for _, reviewer := range existing {
		if reviewer != nil {
			byEmail[strings.ToLower(reviewer.Email)] = reviewer
		}
	}

	for _, reviewer := range reviewers {
		entry := byEmail[strings.ToLower(reviewer.User.Email)]
		if entry == nil {
			session := sessions[reviewer.User.Email]
			if session == nil || session.User == nil || session.User.User == nil {
				return fmt.Errorf("missing session for reviewer %s", reviewer.User.Email)
			}

			inviteResponse, _, err := requestJSON[reviewerBatchInviteResponse](
				c,
				http.MethodPost,
				fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID),
				chairToken,
				&dto.ReviewerBatchInviteRequest{
					ConferenceID: conferenceID,
					Reviewers: []dto.Reviewer{
						{
							UserID: session.User.ID,
							Domain: reviewer.Domain,
						},
					},
				},
			)
			if err != nil {
				return err
			}
			if len(inviteResponse.Success) == 0 {
				return fmt.Errorf("no invite created for reviewer %s", reviewer.User.Email)
			}
			created := inviteResponse.Success[0]
			entry = &created
			byEmail[strings.ToLower(reviewer.User.Email)] = entry
		}

		if reviewer.Status == "" || entry.Status == reviewer.Status {
			continue
		}

		reviewerSession := sessions[reviewer.User.Email]
		if reviewerSession == nil {
			return fmt.Errorf("missing reviewer session for %s", reviewer.User.Email)
		}

		updated, _, err := requestJSON[dto.Reviewer](
			c,
			http.MethodPut,
			fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, entry.ID),
			reviewerSession.Token,
			&dto.ReviewerUpdateStatusRequest{
				ConferenceID: conferenceID,
				ReviewerID:   entry.ID,
				Status:       reviewer.Status,
			},
		)
		if err != nil {
			return err
		}

		copied := updated
		entry = &copied
		byEmail[strings.ToLower(reviewer.User.Email)] = entry
	}

	return nil
}

func (c *apiClient) ensureDraftSubmission(conferenceID int64, authorToken string, submission *dto.Submission) error {
	existing, err := c.listSubmissions(conferenceID, authorToken, submission.Author)
	if err != nil {
		return err
	}

	for _, item := range existing {
		if item != nil && strings.EqualFold(item.Title, submission.Title) {
			return nil
		}
	}

	_, _, err = requestMultipartSubmission[dto.Submission](
		c,
		fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID),
		authorToken,
		submission,
	)
	return err
}

func (c *apiClient) findConferenceByAcronym(token string, acronym string) (*dto.ConferenceResponse, error) {
	query := url.Values{}
	query.Set("limit", "50")
	query.Set("offset", "0")
	query.Set("acronym", acronym)

	listData, _, err := requestJSON[conferenceQueryResponse](
		c,
		http.MethodGet,
		"/api/v1/conferences?"+query.Encode(),
		token,
		nil,
	)
	if err != nil {
		return nil, err
	}

	for _, conference := range listData.Conferences {
		if conference != nil && strings.EqualFold(conference.Acronym, acronym) {
			conf := conference.ConferenceResponse
			return &conf, nil
		}
	}
	return nil, nil
}

func (c *apiClient) listReviewers(token string, conferenceID int64) ([]*dto.Reviewer, error) {
	query := url.Values{}
	query.Set("limit", "100")
	query.Set("offset", "0")

	listData, _, err := requestJSON[reviewerListResponse](
		c,
		http.MethodGet,
		fmt.Sprintf("/api/v1/conferences/%d/reviewers?%s", conferenceID, query.Encode()),
		token,
		nil,
	)
	if err != nil {
		return nil, err
	}
	return listData.Reviewers, nil
}

func (c *apiClient) listSubmissions(conferenceID int64, token string, author string) ([]*dto.Submission, error) {
	query := url.Values{}
	query.Set("limit", "100")
	query.Set("offset", "0")
	if author != "" {
		query.Set("author", author)
	}

	listData, _, err := requestJSON[dto.SubmissionListResponse](
		c,
		http.MethodGet,
		fmt.Sprintf("/api/v1/conferences/%d/submissions?%s", conferenceID, query.Encode()),
		token,
		nil,
	)
	if err != nil {
		return nil, err
	}
	return listData.Submissions, nil
}

func requestJSON[T any](c *apiClient, method string, path string, token string, body any) (T, int, error) {
	var zero T

	var payload io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			return zero, 0, err
		}
		payload = bytes.NewReader(raw)
	}

	req, err := http.NewRequest(method, c.baseURL+path, payload)
	if err != nil {
		return zero, 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return zero, 0, err
	}
	defer resp.Body.Close()

	rawResponse, err := io.ReadAll(resp.Body)
	if err != nil {
		return zero, resp.StatusCode, err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var failure responseEnvelope[json.RawMessage]
		if err := json.Unmarshal(rawResponse, &failure); err == nil && failure.Error != "" {
			return zero, resp.StatusCode, &apiError{StatusCode: resp.StatusCode, Message: failure.Error}
		}
		return zero, resp.StatusCode, &apiError{StatusCode: resp.StatusCode, Message: string(rawResponse)}
	}

	var envelope responseEnvelope[T]
	if err := json.Unmarshal(rawResponse, &envelope); err != nil {
		return zero, resp.StatusCode, err
	}
	return envelope.Data, resp.StatusCode, nil
}

func requestMultipartSubmission[T any](c *apiClient, path string, token string, submission *dto.Submission) (T, int, error) {
	var zero T

	var payload bytes.Buffer
	writer := multipart.NewWriter(&payload)

	body := map[string]any{"submission": submission}
	rawSubmission, err := json.Marshal(body)
	if err != nil {
		return zero, 0, err
	}
	if err := writer.WriteField("submission", string(rawSubmission)); err != nil {
		return zero, 0, err
	}
	if err := writer.Close(); err != nil {
		return zero, 0, err
	}

	req, err := http.NewRequest(http.MethodPost, c.baseURL+path, &payload)
	if err != nil {
		return zero, 0, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return zero, 0, err
	}
	defer resp.Body.Close()

	rawResponse, err := io.ReadAll(resp.Body)
	if err != nil {
		return zero, resp.StatusCode, err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var failure responseEnvelope[json.RawMessage]
		if err := json.Unmarshal(rawResponse, &failure); err == nil && failure.Error != "" {
			return zero, resp.StatusCode, &apiError{StatusCode: resp.StatusCode, Message: failure.Error}
		}
		return zero, resp.StatusCode, &apiError{StatusCode: resp.StatusCode, Message: string(rawResponse)}
	}

	var envelope responseEnvelope[T]
	if err := json.Unmarshal(rawResponse, &envelope); err != nil {
		return zero, resp.StatusCode, err
	}
	return envelope.Data, resp.StatusCode, nil
}

func mustTime(value string) time.Time {
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		panic(err)
	}
	return parsed
}

func boolPtr(value bool) *bool {
	return &value
}

func intPtr(value int) *int {
	return &value
}

func floatPtr(value float64) *float64 {
	return &value
}

func stringPtr(value string) *string {
	return &value
}
