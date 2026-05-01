package reviewer_suggestion

import (
	"context"
	"fmt"
	"math"
	"sort"
	"strings"

	"github.com/dcao/conferencespace/internal/clients/semantic_scholar"
	"github.com/dcao/conferencespace/internal/dto"
	conferenceStorage "github.com/dcao/conferencespace/internal/storage/conference"
	reviewerStorage "github.com/dcao/conferencespace/internal/storage/reviewer"
	scholarStorage "github.com/dcao/conferencespace/internal/storage/scholar"
	submissionStorage "github.com/dcao/conferencespace/internal/storage/submission"
	userStorage "github.com/dcao/conferencespace/internal/storage/user"
)

type semanticScholarClient interface {
	SearchPapers(ctx context.Context, query string, limit int) (*semantic_scholar.PaperSearchResponse, error)
}

// Service provides conference-level reviewer suggestion logic
type Service struct {
	conferences conferenceStorage.StorageInterface
	submissions submissionStorage.StorageInterface
	users       userStorage.StorageInterface
	reviewers   reviewerStorage.StorageInterface
	scholars    scholarStorage.StorageInterface
	s2Client    semanticScholarClient
}

// New creates a new reviewer suggestion service
func New(
	conferences conferenceStorage.StorageInterface,
	submissions submissionStorage.StorageInterface,
	users userStorage.StorageInterface,
	reviewers reviewerStorage.StorageInterface,
	scholars scholarStorage.StorageInterface,
	s2Client semanticScholarClient,
) *Service {
	return &Service{
		conferences: conferences,
		submissions: submissions,
		users:       users,
		reviewers:   reviewers,
		scholars:    scholars,
		s2Client:    s2Client,
	}
}

// GetSuggestions returns reviewer suggestions for a conference using two-algorithm merge
func (s *Service) GetSuggestions(ctx context.Context, conferenceID int64, limit int) (*dto.ReviewerSuggestionResponse, error) {
	if limit <= 0 {
		limit = 20
	}

	topics, err := s.buildTopicSet(ctx, conferenceID)
	if err != nil {
		return &dto.ReviewerSuggestionResponse{
			Suggestions:      []*dto.ReviewerSuggestion{},
			ConferenceTopics: []string{},
		}, nil
	}
	if len(topics) == 0 {
		return &dto.ReviewerSuggestionResponse{
			Suggestions:      []*dto.ReviewerSuggestion{},
			ConferenceTopics: []string{},
		}, nil
	}

	excludeUserIDs, err := s.getExistingReviewerUserIDs(ctx, conferenceID)
	if err != nil {
		excludeUserIDs = make(map[int64]bool)
	}

	conf, _ := s.conferences.GetByID(ctx, conferenceID)
	excludeEmails := make(map[string]bool)
	if conf != nil {
		if conf.Chair != "" {
			excludeEmails[strings.ToLower(conf.Chair)] = true
		}
		for _, co := range conf.CoChairs {
			excludeEmails[strings.ToLower(co)] = true
		}
	}

	internal := s.suggestInternal(ctx, topics, excludeUserIDs, excludeEmails)

	internalUserIDs := make(map[int64]bool)
	internalScholarIDs := make(map[string]bool)
	for _, sg := range internal {
		if sg.PlatformUserID != nil {
			internalUserIDs[*sg.PlatformUserID] = true
		}
		if sg.ScholarID != "" {
			internalScholarIDs[sg.ScholarID] = true
		}
	}

	external := s.suggestExternal(ctx, topics, excludeUserIDs, internalUserIDs, internalScholarIDs)

	all := append(internal, external...)
	sort.Slice(all, func(i, j int) bool {
		return all[i].Score > all[j].Score
	})

	if len(all) > limit {
		all = all[:limit]
	}

	return &dto.ReviewerSuggestionResponse{
		Suggestions:      all,
		ConferenceTopics: topics,
		Total:            len(all),
	}, nil
}

// buildTopicSet gathers conference domains + submission keywords into a deduplicated list,
// sorted by frequency (most common first).
func (s *Service) buildTopicSet(ctx context.Context, conferenceID int64) ([]string, error) {
	conf, err := s.conferences.GetByID(ctx, conferenceID)
	if err != nil {
		return nil, err
	}

	topicCounts := make(map[string]int)
	for _, d := range conf.Domain {
		topicCounts[strings.ToLower(strings.TrimSpace(d))]++
	}

	subs, _, err := s.submissions.List(ctx, &submissionStorage.QueryParams{
		ConferenceID: conferenceID,
		Limit:        500,
		Offset:       0,
	})
	if err == nil {
		for _, sub := range subs {
			for _, d := range sub.Domain {
				topicCounts[strings.ToLower(strings.TrimSpace(d))]++
			}
			if sub.Information != nil {
				for _, kw := range sub.Information.Keywords {
					topicCounts[strings.ToLower(strings.TrimSpace(kw))]++
				}
			}
		}
	}

	type topicFreq struct {
		topic string
		count int
	}
	var sorted []topicFreq
	for t, c := range topicCounts {
		if t != "" {
			sorted = append(sorted, topicFreq{t, c})
		}
	}
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].count > sorted[j].count
	})

	var topics []string
	for _, tf := range sorted {
		topics = append(topics, tf.topic)
	}

	return topics, nil
}

// getExistingReviewerUserIDs returns user IDs already in conference_reviewers
func (s *Service) getExistingReviewerUserIDs(ctx context.Context, conferenceID int64) (map[int64]bool, error) {
	reviewers, _, err := s.reviewers.List(ctx, conferenceID, &reviewerStorage.ListParams{
		Limit:  500,
		Offset: 0,
	})
	if err != nil {
		return nil, err
	}

	ids := make(map[int64]bool)
	for _, r := range reviewers {
		if r.UserID > 0 {
			ids[r.UserID] = true
		}
	}
	return ids, nil
}

// suggestInternal finds platform users whose domains overlap with conference topics
// using Jaccard similarity scoring.
func (s *Service) suggestInternal(ctx context.Context, topics []string, excludeUserIDs map[int64]bool, excludeEmails map[string]bool) []*dto.ReviewerSuggestion {
	topicSet := make(map[string]bool)
	for _, t := range topics {
		topicSet[strings.ToLower(t)] = true
	}

	// Fetch a broad set and filter in-memory; users table doesn't expose direct domain-array overlap queries.
	allUsers, _, err := s.users.List(ctx, &userStorage.QueryParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		return nil
	}

	var suggestions []*dto.ReviewerSuggestion
	for _, u := range allUsers {
		if u == nil || u.User == nil {
			continue
		}
		if excludeUserIDs[u.ID] {
			continue
		}
		if excludeEmails[strings.ToLower(u.Email)] {
			continue
		}
		if len(u.Domain) == 0 {
			continue
		}

		userDomains := make(map[string]bool)
		for _, d := range u.Domain {
			userDomains[strings.ToLower(strings.TrimSpace(d))] = true
		}

		intersection := 0
		var matchedFields []string
		for d := range userDomains {
			if topicSet[d] {
				intersection++
				matchedFields = append(matchedFields, d)
			}
		}

		if intersection == 0 {
			continue
		}

		// Jaccard: |A ∩ B| / |A ∪ B|
		union := len(topicSet) + len(userDomains) - intersection
		score := int(math.Round(float64(intersection) / float64(union) * 100))

		userID := u.ID
		sg := &dto.ReviewerSuggestion{
			ID:             fmt.Sprintf("platform-%d", u.ID),
			Source:         "internal",
			Name:           strings.TrimSpace(fmt.Sprintf("%s %s", u.FirstName, u.LastName)),
			Email:          u.Email,
			OnPlatform:     true,
			Score:          score,
			Fields:         u.Domain,
			MatchedFields:  matchedFields,
			PlatformUserID: &userID,
		}

		if s.scholars != nil {
			profile, err := s.scholars.GetProfileByUserID(ctx, u.ID)
			if err == nil && profile != nil {
				sg.Publications = profile.PaperCount
				sg.ScholarID = profile.SemanticScholarID
			}
		}

		suggestions = append(suggestions, sg)
	}

	return suggestions
}

// suggestExternal searches Semantic Scholar for relevant authors across the top conference topics
// and scores them by topic-coverage frequency.
func (s *Service) suggestExternal(ctx context.Context, topics []string, excludeUserIDs map[int64]bool, internalUserIDs map[int64]bool, internalScholarIDs map[string]bool) []*dto.ReviewerSuggestion {
	if s.s2Client == nil {
		return nil
	}

	maxTopics := 5
	if len(topics) < maxTopics {
		maxTopics = len(topics)
	}
	searchTopics := topics[:maxTopics]

	type authorInfo struct {
		author       semantic_scholar.Author
		appearedIn   map[string]bool
		affiliations []string
	}
	authorMap := make(map[string]*authorInfo)

	for _, topic := range searchTopics {
		result, err := s.s2Client.SearchPapers(ctx, topic, 10)
		if err != nil {
			continue
		}

		for _, paper := range result.Data {
			for _, author := range paper.Authors {
				if author.AuthorID == "" {
					continue
				}
				if _, exists := authorMap[author.AuthorID]; !exists {
					authorMap[author.AuthorID] = &authorInfo{
						author:     author,
						appearedIn: make(map[string]bool),
					}
				}
				info := authorMap[author.AuthorID]
				info.appearedIn[topic] = true
				if len(author.Affiliations) > 0 && len(info.affiliations) == 0 {
					info.affiliations = author.Affiliations
				}
				if author.PaperCount > info.author.PaperCount {
					info.author = author
				}
			}
		}
	}

	var suggestions []*dto.ReviewerSuggestion
	for authorID, info := range authorMap {
		if internalScholarIDs[authorID] {
			continue
		}

		var platformUserID *int64
		var platformEmail string
		onPlatform := false
		if s.scholars != nil {
			profile, err := s.scholars.GetProfileBySemanticID(ctx, authorID)
			if err == nil && profile != nil && profile.UserID > 0 {
				if excludeUserIDs[profile.UserID] || internalUserIDs[profile.UserID] {
					continue
				}
				uid := profile.UserID
				platformUserID = &uid
				onPlatform = true
				// Fetch the linked user's email so the frontend can build a
				// working in-app profile URL (the /profile/{id} route resolves
				// by email, not numeric id).
				if s.users != nil {
					if u, uerr := s.users.GetByID(ctx, profile.UserID); uerr == nil && u != nil {
						platformEmail = u.Email
					}
				}
			}
		}

		// Score: appeared_in_count / total_queries * 100
		score := int(math.Round(float64(len(info.appearedIn)) / float64(len(searchTopics)) * 100))

		var matchedFields []string
		for topic := range info.appearedIn {
			matchedFields = append(matchedFields, topic)
		}
		sort.Strings(matchedFields)

		fields := matchedFields

		affiliation := ""
		if len(info.affiliations) > 0 {
			affiliation = info.affiliations[0]
		} else if len(info.author.Affiliations) > 0 {
			affiliation = info.author.Affiliations[0]
		}

		sg := &dto.ReviewerSuggestion{
			ID:             fmt.Sprintf("s2-%s", authorID),
			Source:         "external",
			Name:           info.author.Name,
			Email:          platformEmail,
			Affiliation:    affiliation,
			OnPlatform:     onPlatform,
			Score:          score,
			Fields:         fields,
			MatchedFields:  matchedFields,
			Publications:   info.author.PaperCount,
			ScholarID:      authorID,
			PlatformUserID: platformUserID,
		}

		suggestions = append(suggestions, sg)
	}

	return suggestions
}
