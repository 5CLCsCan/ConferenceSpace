import { apiFetch } from "./client"

export interface ReviewerSuggestion {
  id: string
  source: "internal" | "external"
  name: string
  email: string
  affiliation: string
  on_platform: boolean
  score: number
  fields: string[]
  matched_fields: string[]
  publications: number
  past_reviews: number | null
  scholar_id: string
  platform_user_id: number | null
}

export interface ReviewerSuggestionResponse {
  suggestions: ReviewerSuggestion[]
  conference_topics: string[]
  total: number
}

export async function getReviewerSuggestions(
  conferenceId: string,
  limit?: number,
): Promise<{ data: ReviewerSuggestionResponse | null; error: string | null }> {
  try {
    const params = new URLSearchParams()
    if (limit) params.set("limit", String(limit))
    const query = params.toString() ? `?${params.toString()}` : ""

    const { data } = await apiFetch<
      { data: ReviewerSuggestionResponse } | ReviewerSuggestionResponse
    >(`/api/v1/conferences/${conferenceId}/reviewer-suggestions${query}`)

    // Handle both wrapped and unwrapped response formats
    const result =
      data && typeof data === "object" && "data" in data && (data as { data: unknown }).data
        ? (data as { data: ReviewerSuggestionResponse }).data
        : (data as ReviewerSuggestionResponse)

    return { data: result, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch suggestions",
    }
  }
}
