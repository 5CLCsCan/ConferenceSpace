import type { ConferenceSettings, Participant, DiscussionThread } from "./types"

// =============================================================================
// Mock Settings
// =============================================================================

export const MOCK_SETTINGS: ConferenceSettings = {
  reviewMode: "double_blind",
  allowAuthorResponse: true,
  discussionDeadline: "2024-08-15T23:59:00Z",
  currentPhase: "discussion",
}

// =============================================================================
// Mock Current User (Reviewer perspective)
// =============================================================================

export const MOCK_CURRENT_USER: Participant = {
  id: "user-1",
  displayName: "You",
  role: "reviewer",
  anonymousId: "Reviewer #1",
  realName: "Dr. Sarah Smith",
  isCurrentUser: true,
}

// =============================================================================
// Mock Threads
// =============================================================================

export const MOCK_THREADS: DiscussionThread[] = [
  {
    id: "thread-1",
    title: "Baseline Comparison Methodology",
    visibility: "reviewers",
    status: "pinned",
    category: "methodology",
    createdBy: {
      id: "user-2",
      displayName: "Reviewer #2",
      role: "reviewer",
      anonymousId: "Reviewer #2",
    },
    createdAt: "2024-08-10T16:15:00Z",
    lastActivity: "2 hours ago",
    messageCount: 4,
    linkedSection: "Section 4.1, Table 2",
    messages: [
      {
        id: "msg-1",
        author: {
          id: "user-2",
          displayName: "Reviewer #2",
          role: "reviewer",
          anonymousId: "Reviewer #2",
        },
        content:
          "I have concerns about the baseline comparisons in Table 2. The authors compare their pruned model against MobileNetV2, but they don't account for specialized hardware acceleration typically available for standard architectures. The reported speedup may be purely theoretical and not reflect real-world deployment scenarios.",
        timestamp: "Aug 10, 2024 at 4:15 PM",
        relativeTime: "Yesterday",
        attachments: [
          { id: "att-1", type: "paper_reference", label: "Table 2", reference: "p.6" },
          { id: "att-2", type: "paper_reference", label: "Section 4.1", reference: "p.5-6" },
        ],
      },
      {
        id: "msg-2",
        author: MOCK_CURRENT_USER,
        content:
          "Valid point. I checked the supplementary material—they mention running on a Jetson Nano, but setup details are sparse. We should request a breakdown of FLOPs vs actual latency correlation in the rebuttal phase. This is critical for validating their efficiency claims.",
        timestamp: "Aug 10, 2024 at 5:30 PM",
        relativeTime: "Yesterday",
        reactions: [{ emoji: "agree", count: 2, reacted: false }],
      },
      {
        id: "msg-3",
        author: {
          id: "user-3",
          displayName: "Area Chair",
          role: "area_chair",
          anonymousId: "AC",
        },
        content:
          "I agree with both points. I'll mark this as a required clarification in the consolidated feedback. @Reviewer #1, could you draft the specific question regarding hardware setup for the author response period?",
        timestamp: "Aug 11, 2024 at 10:00 AM",
        relativeTime: "2 hours ago",
        reactions: [{ emoji: "thumbs_up", count: 1, reacted: true }],
      },
    ],
  },
  {
    id: "thread-2",
    title: "Notation Inconsistency in Eq. 3",
    visibility: "authors",
    status: "open",
    category: "clarity",
    createdBy: {
      id: "user-4",
      displayName: "Reviewer #3",
      role: "reviewer",
      anonymousId: "Reviewer #3",
    },
    createdAt: "2024-08-09T14:00:00Z",
    lastActivity: "1 day ago",
    messageCount: 1,
    linkedSection: "Section 3, Equation 3",
    messages: [
      {
        id: "msg-4",
        author: {
          id: "user-4",
          displayName: "Reviewer #3",
          role: "reviewer",
          anonymousId: "Reviewer #3",
        },
        content:
          "There appears to be a notation inconsistency in Equation 3. The regularization term uses a different subscript notation than its definition in the introduction (page 2). This seems like a typographical error but should be clarified to avoid reader confusion.",
        timestamp: "Aug 9, 2024 at 2:00 PM",
        relativeTime: "1 day ago",
        attachments: [{ id: "att-3", type: "equation", label: "Equation 3", reference: "p.4" }],
      },
    ],
  },
  {
    id: "thread-3",
    title: "Format Compliance Check",
    visibility: "committee",
    status: "resolved",
    category: "general",
    createdBy: {
      id: "system",
      displayName: "System",
      role: "system",
    },
    createdAt: "2024-08-08T09:00:00Z",
    lastActivity: "2 days ago",
    messageCount: 2,
    isCollapsed: true,
    messages: [
      {
        id: "msg-5",
        author: {
          id: "system",
          displayName: "System",
          role: "system",
        },
        content: "Automated format compliance check completed. All formatting requirements passed.",
        timestamp: "Aug 8, 2024 at 9:00 AM",
        relativeTime: "2 days ago",
      },
    ],
  },
]
