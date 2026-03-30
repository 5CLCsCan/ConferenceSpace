import { describe, expect, it, vi, beforeEach } from "vitest"

import { apiFetch } from "../client"
import { generateAssignmentBriefing, getAssignmentBriefing } from "../reviewer-briefing"

vi.mock("../client", () => ({
  apiFetch: vi.fn(),
}))

const mockApiFetch = vi.mocked(apiFetch)

describe("reviewer briefing api", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches reviewer briefing lookup", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: {
          status: "idle",
          cache: { hit: false, submission_state_fingerprint: "sha256:test" },
        },
      },
      response: { status: 200 },
    } as any)

    const result = await getAssignmentBriefing("1", "42")

    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/conferences/1/assignments/42/briefing")
    expect(result.data?.status).toBe("idle")
  })

  it("posts reviewer briefing generation", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: {
          status: "ready",
          cache: { hit: false, submission_state_fingerprint: "sha256:test" },
          artifact: {
            submission_snapshot: {
              title: "Reliable Systems",
              abstract_summary: "Summary",
              manuscript_overview: "Overview",
              keywords: ["review"],
            },
            claimed_contributions: [],
            notable_elements: [],
            reviewer_attention_points: [],
            stated_scope_and_limitations: [],
            guardrails: {
              no_recommendation: true,
              no_score: true,
              bias_notice: "assistive only",
            },
          },
        },
      },
      response: { status: 200 },
    } as any)

    const result = await generateAssignmentBriefing("1", "42")

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/1/assignments/42/briefing/generate",
      { method: "POST" },
    )
    expect(result.data?.status).toBe("ready")
  })
})
