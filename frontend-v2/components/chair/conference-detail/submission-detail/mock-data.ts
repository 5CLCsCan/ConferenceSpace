// Mock Data for Submission Detail
import type { SubmissionDetail } from "./types"

export const MOCK_SUBMISSION_DETAIL: SubmissionDetail = {
  id: "submission-4291",
  displayId: "#4291",
  title: "Scalable Transformer Architectures for Sparse Data",
  abstract: `Recent advancements in transformer models have revolutionized natural language processing, yet their application to sparse data regimes remains a challenge. In this paper, we propose a novel architectural modification that introduces sparsity-aware attention mechanisms. Our approach demonstrates a 40% reduction in computational overhead while maintaining comparable accuracy to dense models on standard benchmarks. We evaluate our method across multiple datasets, highlighting its efficacy in resource-constrained environments.`,
  track: "Deep Learning",
  status: "under_review",
  keywords: ["Transformers", "Sparse Data", "Deep Learning", "Optimization"],
  authors: [
    {
      id: "author-1",
      name: "Dr. Alex Chen (Corr.)",
      affiliation: "Stanford University",
      isCorresponding: true,
    },
    {
      id: "author-2",
      name: "Sarah Williams",
      affiliation: "MIT",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCLDTQyjC_Z-Cx0cyLm9KBsVE29h-Qao4HwZMBFIrhBEPvQDf8YeoPBL9foAN4iVlBK-0DNmAjDI0VGFvmkTZMmgrt1c1dPLJ4mYRlvY_I4DQpESzD07GqZbfZsjb_kUYLFzzO87unZtqLqEG-0sbV4nksG67eo_Sli5Alw4VSOj4I1Wwlc9_T0JEjE7gvBH97PpY_ofXnhqSkAcVoBuAXuHMUNrWj9HYRd56y7yBQBBhwb_s_WSMCjSuchVYSwfFeJaiw69GIROdJe",
    },
    {
      id: "author-3",
      name: "James Park",
      affiliation: "KAIST",
    },
  ],
  conflictsOfInterest: ["Microsoft Research", "Google DeepMind"],
  files: [
    {
      id: "file-1",
      name: "Main_Submission_v2.pdf",
      size: "1.2 MB",
      type: "pdf",
    },
    {
      id: "file-2",
      name: "Supplementary_Code_Data.zip",
      size: "15.4 MB",
      type: "zip",
    },
  ],
  coverLetter:
    "We are pleased to submit our manuscript titled 'Scalable Transformer Architectures for Sparse Data' for consideration at AAAI 2024...",
  lastUpdated: "May 12, 2024",
  reviewOverview: {
    averageScore: 7.8,
    maxScore: 10,
    confidence: "high",
    status: "Pending",
    individualScores: [
      {
        reviewerId: "r1",
        reviewerName: "Reviewer 1",
        avatarColor: "bg-indigo-100 text-indigo-700",
        decision: "accept",
        score: 8,
        confidence: "high",
      },
      {
        reviewerId: "r2",
        reviewerName: "Reviewer 2",
        avatarColor: "bg-purple-100 text-purple-700",
        decision: "accept",
        score: 8,
        confidence: "medium",
      },
      {
        reviewerId: "r3",
        reviewerName: "Reviewer 3",
        avatarColor: "bg-pink-100 text-pink-700",
        decision: "weak_accept",
        score: 7,
        confidence: "high",
      },
    ],
  },
  reviewerAssignments: [
    { id: "ra1", name: "R. Gupta", status: "completed" },
    { id: "ra2", name: "L. Wei", status: "completed" },
    { id: "ra3", name: "K. O'Neal", status: "completed" },
  ],
}
