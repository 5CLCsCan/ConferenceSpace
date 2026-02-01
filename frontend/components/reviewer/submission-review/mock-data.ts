import type { SubmissionDetails } from "./types"

// =============================================================================
// Mock Data for Submission Review
// =============================================================================

export const MOCK_SUBMISSION: SubmissionDetails = {
  id: "2491",
  paperId: "101",
  title: "Scalable Neural Architecture Search for Edge Devices via Differentiable Pruning",
  abstract: `Deploying deep neural networks on edge devices with limited resources remains a significant challenge. We propose a novel Differentiable Pruning based Neural Architecture Search (DP-NAS) framework that simultaneously optimizes accuracy and latency. Unlike previous methods that separate search and pruning, our approach integrates them into a unified differentiable objective function. Extensive experiments on ImageNet and CIFAR-10 demonstrate that our method achieves state-of-the-art trade-offs, reducing inference latency by 35% on standard mobile GPUs while maintaining comparable accuracy to heavier baseline models.`,
  keywords: ["Neural Architecture Search", "Edge Computing", "Model Compression"],
  track: "Deep Learning",
  status: "under_review",
  dueDate: "2024-05-15",
  daysLeft: 2,
  supplementaryMaterial: { name: "Source Code & Logs.zip", size: "45MB" },
  conference: {
    id: "1",
    acronym: "NeurIPS 2024",
    name: "Neural Information Processing Systems",
  },
}
