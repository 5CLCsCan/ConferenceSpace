import useSWR from "swr"
import { swrConfig } from "@/lib/swr-config"
import type { AssignedPaper } from "@/lib/types"

/**
 * Hook for fetching completed reviews
 * 
 * Currently returns mock data. To integrate with backend:
 * 1. Create backend endpoint: GET /api/v1/reviewer/:reviewerId/completed-reviews
 * 2. Backend should return papers with assignment_status: "completed"
 * 3. Replace mockFetcher with actual API call using apiFetch from @/lib/api/client
 * 
 * Example backend integration:
 * ```typescript
 * import { apiFetch } from "@/lib/api/client"
 * 
 * const fetcher = async () => {
 *   const { data } = await apiFetch<{ data: AssignedPaper[] }>(
 *     `/api/v1/reviewer/${reviewerId}/completed-reviews?limit=${limit}&offset=${offset}`
 *   )
 *   return data.data
 * }
 * ```
 */
export function useCompletedReviews(
  reviewerId: string | null,
  options: { limit?: number; offset?: number } = {}
) {
  const key = reviewerId ? ["completed-reviews", reviewerId, JSON.stringify(options)] : null

  // Mock fetcher - replace with actual API call
  const mockFetcher = async (): Promise<AssignedPaper[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock data - this should come from backend
    const mockReviews: AssignedPaper[] = [
      {
        id: "1",
        title: "Deep Learning Approaches for Natural Language Processing",
        abstract:
          "This paper presents novel deep learning techniques for improving natural language understanding tasks. We propose a new architecture that combines transformer models with graph neural networks to capture both sequential and structural information in text.",
        keywords: ["deep learning", "NLP", "transformers", "graph neural networks"],
        authors: [
          { name: "John Doe", email: "john@example.com", affiliation: "MIT" },
          { name: "Jane Smith", email: "jane@example.com", affiliation: "Stanford" },
        ],
        conference_id: "1",
        track_id: "ml",
        status: "under_review",
        submitted_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-02-20T14:30:00Z",
        version: 2,
        reviews: [],
        assignment_status: "completed",
        assigned_at: "2024-01-20T09:00:00Z",
        assignment_id: 1,
      },
      {
        id: "2",
        title: "Quantum Computing Applications in Cryptography",
        abstract:
          "We explore the implications of quantum computing on modern cryptographic systems and propose quantum-resistant algorithms that can withstand attacks from quantum computers.",
        keywords: ["quantum computing", "cryptography", "security", "post-quantum"],
        authors: [
          { name: "Alice Johnson", email: "alice@example.com", affiliation: "Oxford" },
        ],
        conference_id: "2",
        track_id: "security",
        status: "accepted",
        submitted_at: "2024-01-10T08:00:00Z",
        updated_at: "2024-02-15T16:45:00Z",
        version: 1,
        reviews: [],
        assignment_status: "completed",
        assigned_at: "2024-01-12T10:00:00Z",
        assignment_id: 2,
      },
      {
        id: "3",
        title: "Federated Learning for Privacy-Preserving Machine Learning",
        abstract:
          "This work introduces a novel federated learning framework that enables collaborative model training while preserving data privacy. Our approach reduces communication overhead by 40% compared to existing methods.",
        keywords: ["federated learning", "privacy", "machine learning", "distributed systems"],
        authors: [
          { name: "Bob Wilson", email: "bob@example.com", affiliation: "CMU" },
          { name: "Carol Davis", email: "carol@example.com", affiliation: "Berkeley" },
        ],
        conference_id: "1",
        track_id: "ml",
        status: "under_review",
        submitted_at: "2024-02-01T11:00:00Z",
        updated_at: "2024-03-10T13:20:00Z",
        version: 1,
        reviews: [],
        assignment_status: "completed",
        assigned_at: "2024-02-05T09:30:00Z",
        assignment_id: 3,
      },
    ]

    return mockReviews
  }

  const { data, error, isLoading, mutate } = useSWR(key, mockFetcher, {
    ...swrConfig,
    dedupingInterval: 300000, // Cache for 5 minutes
  })

  return {
    reviews: data || [],
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}
