import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiFetch } from "../client"
import { runReviewAudit, updateReviewAuditDismissal } from "../review-audit"

vi.mock("../client", () => ({
  apiFetch: vi.fn(),
  ApiError: class extends Error {
    status = 500
    body?: unknown
  },
}))

const mockApiFetch = vi.mocked(apiFetch)

describe("review audit api", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("posts review audit preflight", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: {
          status: "warn",
          active_findings: [],
          dismissed_findings: [],
        },
      },
      response: { status: 200 },
    } as any)

    const result = await runReviewAudit("1", "42", {
      mode: "submit_preflight",
      review_score: 8.4,
      review_data: {
        criteria: {
          originality: 8,
          technical_quality: 8,
          clarity: 8,
          significance: 9,
          methodology: 9,
        },
        feedback: {
          summary: "Summary",
          strengths: "Strengths",
          weaknesses: "Weaknesses",
          questions: "Questions",
        },
        recommendation: "accept",
        confidence: "high",
      },
    })

    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/conferences/1/assignments/42/review-audit", {
      method: "POST",
      body: expect.any(String),
    })
    expect(result.data?.status).toBe("warn")
  })

  it("puts dismissal updates", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: {
          state: {
            dismissed_warnings: [
              {
                code: "x",
                condition_fingerprint: "sha256:test",
                dismissed_at: "2026-03-31T00:00:00Z",
              },
            ],
          },
        },
      },
      response: { status: 200 },
    } as any)

    const result = await updateReviewAuditDismissal("1", "42", {
      action: "dismiss",
      finding: {
        code: "x",
        severity: "warning",
        field: "review",
        condition_fingerprint: "sha256:test",
      },
    })

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/1/assignments/42/review-audit/dismissals",
      {
        method: "PUT",
        body: expect.any(String),
      },
    )
    expect(result.data?.dismissed_warnings).toHaveLength(1)
  })
})
