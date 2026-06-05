import { describe, expect, it, vi, beforeEach } from "vitest"

import { apiFetch } from "../client"
import {
  generateReviewerInitialAnalysis,
  getReviewerInitialAnalysis,
} from "../reviewer-initial-analysis"

vi.mock("../client", () => ({
  apiFetch: vi.fn(),
}))

const mockApiFetch = vi.mocked(apiFetch)

const readyArtifact = {
  briefing: {
    submission_snapshot: {
      title: "Reliable Systems",
      abstract_summary: "Summary",
      manuscript_overview: "Overview",
      keywords: ["review"],
      track: "main",
    },
    review_readiness_signals: [],
    claimed_contributions: [],
    notable_elements: [],
    reviewer_attention_points: [],
    stated_scope_and_limitations: [],
  },
  annotations: {
    overall_impression: "Clear enough for initial review.",
    domain_context: "Conference review workflow",
    sections: [
      {
        section_name: "Introduction",
        summary: "Introduces the review workflow.",
        annotations: [
          {
            category: "question",
            severity: null,
            quoted_passage: "We study reviewer workflows.",
            commentary: "The reviewer should verify the stated scope.",
            reviewer_hint: "Check whether later sections support the claim.",
          },
        ],
      },
    ],
  },
}

describe("reviewer initial analysis api", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches reviewer initial analysis lookup", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: {
          status: "idle",
          cache: { hit: false, submission_state_fingerprint: "sha256:test" },
        },
      },
      response: { status: 200 },
    } as any)

    const result = await getReviewerInitialAnalysis("1", "42")

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/1/assignments/42/initial-analysis",
    )
    expect(result.data?.status).toBe("idle")
  })

  it("posts reviewer initial analysis generation", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: {
          status: "ready",
          cache: { hit: false, submission_state_fingerprint: "sha256:test" },
          artifact: readyArtifact,
        },
      },
      response: { status: 200 },
    } as any)

    const result = await generateReviewerInitialAnalysis("1", "42")

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/1/assignments/42/initial-analysis/generate",
      { method: "POST" },
    )
    expect(result.data?.status).toBe("ready")
  })

  it("returns artifact with briefing and annotations", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: {
          status: "ready",
          cache: { hit: false, submission_state_fingerprint: "sha256:test" },
          artifact: readyArtifact,
        },
      },
      response: { status: 200 },
    } as any)

    const result = await getReviewerInitialAnalysis("1", "42")

    expect(result.data?.artifact?.briefing.submission_snapshot.title).toBe("Reliable Systems")
    expect(result.data?.artifact?.annotations.sections[0]?.annotations[0]?.quoted_passage).toBe(
      "We study reviewer workflows.",
    )
  })
})
