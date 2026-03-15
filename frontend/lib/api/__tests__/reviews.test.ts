import { describe, it, expect, vi, beforeEach } from "vitest"
import { getAssignmentReview } from "../reviews"

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:8080",
}))

import { apiFetch } from "@/lib/api/client"
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe("getAssignmentReview", () => {
  it("returns data on success", async () => {
    const reviewData = { assignment_id: 42, review_status: "submitted", review_score: 8 }
    mockApiFetch.mockResolvedValue({
      data: { data: reviewData },
      response: { status: 200 },
    })

    const result = await getAssignmentReview("1", "42")

    expect(result.error).toBeNull()
    expect(result.data).toEqual(reviewData)
    expect(result.status).toBe(200)
  })

  it("surfaces 403 status and error when caller is not the assigned reviewer", async () => {
    // apiFetch throws on non-2xx responses.
    const err = Object.assign(new Error("Forbidden"), { status: 403 })
    mockApiFetch.mockRejectedValue(err)

    const result = await getAssignmentReview("1", "42")

    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
    expect(result.status).toBe(403)
  })

  it("returns a generic 500 status when error has no status field", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"))

    const result = await getAssignmentReview("1", "42")

    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
    expect(result.status).toBe(500)
  })
})
