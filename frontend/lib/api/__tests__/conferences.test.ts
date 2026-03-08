import { describe, it, expect, vi, beforeEach } from "vitest"
import { getConferenceStats } from "../conferences"

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from "@/lib/api/client"
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>

const BACKEND_STATS_RESPONSE = {
  data: {
    submissions: { total: 10, draft: 2, submitted: 4, accepted: 3, rejected: 1 },
    reviews: { total_assigned: 8, completed: 6, pending: 2 },
    tracks: [
      { name: "ML", submission_count: 5, accepted_count: 2 },
      { name: "CV", submission_count: 5, accepted_count: 1 },
    ],
  },
}

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe("getConferenceStats", () => {
  it("maps total_submissions correctly from backend submissions.total", async () => {
    mockApiFetch.mockResolvedValue({ data: BACKEND_STATS_RESPONSE, response: { status: 200 } })

    const result = await getConferenceStats("1")

    expect(result.data).not.toBeNull()
    expect(result.data!.total_submissions).toBe(10)
  })

  it("computes acceptance_rate as (accepted/total)*100", async () => {
    mockApiFetch.mockResolvedValue({ data: BACKEND_STATS_RESPONSE, response: { status: 200 } })

    const result = await getConferenceStats("1")

    // 3/10 * 100 = 30
    expect(result.data!.acceptance_rate).toBe(30)
  })

  it("computes avg_reviews_per_paper as total_reviews/total_submissions", async () => {
    mockApiFetch.mockResolvedValue({ data: BACKEND_STATS_RESPONSE, response: { status: 200 } })

    const result = await getConferenceStats("1")

    // 8/10 = 0.8
    expect(result.data!.avg_reviews_per_paper).toBe(0.8)
  })

  it("maps tracks to submissions_by_track with track/count fields", async () => {
    mockApiFetch.mockResolvedValue({ data: BACKEND_STATS_RESPONSE, response: { status: 200 } })

    const result = await getConferenceStats("1")

    expect(result.data!.submissions_by_track).toHaveLength(2)
    expect(result.data!.submissions_by_track[0]).toEqual({ track: "ML", count: 5 })
    expect(result.data!.submissions_by_track[1]).toEqual({ track: "CV", count: 5 })
  })

  it("maps review_progress correctly", async () => {
    mockApiFetch.mockResolvedValue({ data: BACKEND_STATS_RESPONSE, response: { status: 200 } })

    const result = await getConferenceStats("1")

    expect(result.data!.review_progress.completed).toBe(6)
    expect(result.data!.review_progress.pending).toBe(2)
    expect(result.data!.review_progress.in_progress).toBe(0)
  })

  it("handles zero total_submissions without division by zero — all rates become 0", async () => {
    mockApiFetch.mockResolvedValue({
      data: {
        data: {
          submissions: { total: 0, draft: 0, submitted: 0, accepted: 0, rejected: 0 },
          reviews: { total_assigned: 0, completed: 0, pending: 0 },
          tracks: [],
        },
      },
      response: { status: 200 },
    })

    const result = await getConferenceStats("1")

    expect(result.data!.acceptance_rate).toBe(0)
    expect(result.data!.avg_reviews_per_paper).toBe(0)
    expect(result.data!.total_submissions).toBe(0)
  })

  it("returns error on fetch failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"))

    const result = await getConferenceStats("1")

    expect(result.data).toBeNull()
    expect(result.error).toBe("Network error")
  })
})
