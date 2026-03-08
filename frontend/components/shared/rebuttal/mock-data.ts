import type { RebuttalPoint, RebuttalSettings, RebuttalSubmission, ReviewerInfo } from "./types"
import type { Conference } from "@/lib/types"

// =============================================================================
// Mock Settings
// =============================================================================

export const MOCK_SETTINGS: RebuttalSettings = {
  phase: "submitted",
  deadline: "2024-08-15T23:59:00Z",
  daysRemaining: 3,
  characterLimitPerReview: 10000,
  allowRevisions: true,
  allowNewResults: true,
  requireResponseToAll: false,
}

export function buildRebuttalSettingsFromConference(
  conference?: Conference | null,
): RebuttalSettings {
  const rebuttal = conference?.configurations?.rebuttal_settings
  const deadline = rebuttal?.end_at || MOCK_SETTINGS.deadline
  const deadlineDate = new Date(deadline)
  const daysRemaining = Number.isNaN(deadlineDate.getTime())
    ? MOCK_SETTINGS.daysRemaining
    : Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return {
    phase: rebuttal?.enabled ? "submitted" : "awaiting",
    deadline,
    daysRemaining,
    characterLimitPerReview: rebuttal?.character_limit || MOCK_SETTINGS.characterLimitPerReview,
    allowRevisions: rebuttal?.allow_revisions ?? MOCK_SETTINGS.allowRevisions,
    allowNewResults: rebuttal?.allow_new_results ?? MOCK_SETTINGS.allowNewResults,
    requireResponseToAll: rebuttal?.require_response_to_all ?? MOCK_SETTINGS.requireResponseToAll,
  }
}

// =============================================================================
// Mock Reviewers
// =============================================================================

export const MOCK_REVIEWERS: ReviewerInfo[] = [
  {
    id: "r1",
    anonymousId: "Reviewer #1",
    isCurrentUser: true,
    scores: { original: 6, current: 6, updated: false },
    recommendation: { original: "Weak Accept", current: "Weak Accept", updated: false },
    confidence: 4,
  },
  {
    id: "r2",
    anonymousId: "Reviewer #2",
    isCurrentUser: false,
    scores: { original: 5, current: 7, updated: true },
    recommendation: { original: "Borderline", current: "Accept", updated: true },
    confidence: 3,
  },
  {
    id: "r3",
    anonymousId: "Reviewer #3",
    isCurrentUser: false,
    scores: { original: 7, current: 7, updated: false },
    recommendation: { original: "Accept", current: "Accept", updated: false },
    confidence: 5,
  },
]

// =============================================================================
// Mock Rebuttal Points
// =============================================================================

export const MOCK_POINTS: RebuttalPoint[] = [
  {
    id: "p1",
    reviewerId: "r1",
    category: "weakness",
    section: "Weaknesses",
    originalComment:
      "The ablation study is insufficient to support the claim about component X being the main driver of latency reduction.",
    authorResponse:
      "We acknowledge this point. To address it, we performed a leave-one-out ablation study (New Table 5). The results demonstrate that removing Component X leads to a **14% increase in latency** without significant accuracy gain, isolating its contribution.",
    status: "pending_review",
    characterCount: 285,
  },
  {
    id: "p2",
    reviewerId: "r1",
    category: "question",
    section: "Questions for Authors",
    originalComment: "Can you clarify how the hyperparameter alpha was chosen?",
    authorResponse:
      "Alpha was selected using grid search on a validation set (10% split of training data). We tested values {0.1, 0.3, 0.5, 0.7, 0.9} and found 0.5 yielded the best trade-off. We have clarified this in Section 3.4.",
    status: "pending_review",
    characterCount: 218,
  },
  {
    id: "p3",
    reviewerId: "r2",
    category: "weakness",
    section: "Weaknesses",
    originalComment:
      "The baseline comparisons in Table 2 don't account for specialized hardware acceleration usually available for standard architectures like MobileNetV2.",
    authorResponse:
      "We thank the reviewer for this observation. We have added benchmarks on Jetson Nano (Table 2, updated) and Raspberry Pi 4 (new Appendix C). Our method shows consistent 1.3x-1.8x speedup across all tested platforms.",
    status: "addressed",
    reviewerAcknowledgment: {
      acknowledged: true,
      satisfactory: true,
      note: "Thank you for the additional experiments. The new results adequately address my concern.",
    },
    characterCount: 267,
  },
  {
    id: "p4",
    reviewerId: "r3",
    category: "clarification",
    section: "Minor Issues",
    originalComment:
      "There seems to be a typo in Eq. 3 regarding the regularization term lambda notation.",
    authorResponse:
      "Thank you for catching this. We have corrected the notation in Equation 3 to be consistent with the definition in Section 2.1. The lambda subscript now correctly refers to the layer index.",
    status: "addressed",
    reviewerAcknowledgment: {
      acknowledged: true,
      satisfactory: true,
    },
    characterCount: 198,
  },
]

// =============================================================================
// Mock Submission
// =============================================================================

export const MOCK_SUBMISSION: RebuttalSubmission = {
  id: "rebuttal-1",
  submittedAt: "Aug 12, 2024 at 11:42 PM",
  generalResponse: {
    content: `We thank all reviewers for their insightful and constructive feedback. We are encouraged that they find our DP-NAS framework novel (R1, R3) and our results on edge devices significant (R2).

In this response, we address each reviewer's concerns in detail below. We have also revised the manuscript to incorporate the suggested changes, including:

- **New ablation study** (Table 5): Leave-one-out analysis of each component
- **Extended hardware benchmarks** (Appendix C): Results on Jetson Nano and Raspberry Pi 4
- **Hyperparameter analysis** (Appendix B): Sensitivity study for alpha and beta
- **Notation corrections**: Fixed Equation 3 and terminology consistency`,
    wordCount: 724,
  },
  perReviewerResponses: [
    { reviewerId: "r1", characterCount: 503, characterLimit: 10000 },
    { reviewerId: "r2", characterCount: 267, characterLimit: 10000 },
    { reviewerId: "r3", characterCount: 198, characterLimit: 10000 },
  ],
  attachments: [
    {
      id: "att-1",
      name: "Revised Manuscript",
      type: "revised_manuscript",
      size: "2.4 MB",
      uploadedAt: "Aug 12, 2024",
      version: "v2",
    },
    {
      id: "att-2",
      name: "Supplementary Material (Updated)",
      type: "supplementary",
      size: "8.1 MB",
      uploadedAt: "Aug 12, 2024",
    },
  ],
}
