import type { DiscussionMessage, ReviewerReview } from "./types"

export const MOCK_DISCUSSION_THREADS: DiscussionMessage[] = [
  {
    id: "1",
    threadId: "#9921",
    threadTitle: "Clarification on Figure 3 Baseline",
    author: { name: "Reviewer #2", role: "reviewer", initials: "R2" },
    content:
      "I noticed that the baseline comparison in Figure 3 seems to use the 2021 version of the algorithm. Could you clarify why the 2023 update wasn't included? It might significantly change the relative performance metrics.",
    timestamp: "May 12, 10:30 AM",
    replies: [
      {
        id: "1-1",
        threadId: "#9921",
        threadTitle: "",
        author: { name: "Dr. Alex Chen", role: "author", initials: "AC" },
        content:
          "Thank you for pointing this out. We actually ran the experiments with the 2023 version as well, but the results were statistically similar to the 2021 version due to the nature of our sparse dataset. We will include these additional results in the appendix of the revised paper.",
        timestamp: "May 12, 02:15 PM",
      },
    ],
  },
  {
    id: "2",
    threadId: "#9925",
    threadTitle: "Rebuttal Period Deadline",
    author: { name: "Area Chair", role: "chair", initials: "AC" },
    content:
      "Just a reminder that the rebuttal period closes in 3 days. Please ensure all your responses to reviewers are finalized by then.",
    timestamp: "Yesterday, 09:00 AM",
  },
]

export const MOCK_REVIEWS: ReviewerReview[] = [
  {
    id: "R1",
    reviewerNum: 1,
    confidence: "4/5",
    confidenceLevel: "High",
    score: 8,
    scoreLabel: "Strong Accept",
    scoreColor: "green",
    summary:
      "The paper proposes a novel scalable transformer architecture suitable for sparse data environments. The theoretical grounding is solid, and the empirical results on standard sparse datasets are impressive. I particularly appreciated the ablation study on the attention mechanism, which clearly demonstrates the value of the proposed modification.",
    questions: [
      "Can the authors clarify the computational complexity in the worst-case scenario? The paper mentions O(N log N) but I suspect edge cases might approach O(N^2).",
      "How does this method compare to SparseFormer (2023) in terms of inference latency?",
    ],
    isExpanded: true,
  },
  {
    id: "R2",
    reviewerNum: 2,
    confidence: "3/5",
    confidenceLevel: "Medium",
    score: 5,
    scoreLabel: "Weak Accept",
    scoreColor: "yellow",
    summary:
      "I noticed that the baseline comparison in Figure 3 seems to use the 2021 version of the algorithm. Could you clarify why the 2023 update wasn't included? It might significantly change the relative performance metrics. The writing is generally good but the related work section misses some key references from ICML '23.",
    weaknesses: [
      "Outdated baselines in Figure 3.",
      "Missing citations (see list below).",
      "The methodology description in Section 4.2 is vague.",
    ],
    isExpanded: true,
  },
  {
    id: "R3",
    reviewerNum: 3,
    confidence: "2/5",
    confidenceLevel: "Low",
    score: 5,
    scoreLabel: "Borderline",
    scoreColor: "neutral",
    summary:
      "The paper addresses an interesting problem but I am not fully convinced by the experimental setup. More ablation studies would strengthen the contribution.",
    isExpanded: false,
  },
]
