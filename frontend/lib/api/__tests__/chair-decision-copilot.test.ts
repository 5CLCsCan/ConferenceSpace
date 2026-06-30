import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiFetch } from "../client"
import {
  generateChairDecisionCopilot,
  getChairDecisionCopilot,
  regenerateChairDecisionCopilot,
  type ChairDecisionCopilotResponse,
} from "../chair-decision-copilot"

vi.mock("../client", () => ({
  apiFetch: vi.fn(),
}))

const mockApiFetch = vi.mocked(apiFetch)

function buildResponse(
  status: ChairDecisionCopilotResponse["status"],
): ChairDecisionCopilotResponse {
  return {
    status,
    run_id: status === "idle" ? null : "run-1",
    cache: {
      hit: status === "ready",
      evidence_fingerprint: "sha256:evidence",
      is_stale: status === "stale",
      stale_reasons: status === "stale" ? ["review_updated"] : [],
    },
    artifact:
      status === "idle"
        ? null
        : {
            evidence_summary: {
              overview: "Summary of the current evidence set.",
              evidence_basis: ["3 submitted reviews", "2 discussion messages"],
            },
            review_feedback_synthesis: {
              summary: "Reviewers consistently raise methodology and clarity concerns.",
              strengths: ["Clear problem framing"],
              weaknesses: ["Experimental evaluation depth"],
              questions: ["How reproducible is the setup?"],
            },
            review_analytics: {
              review_distribution: [
                { label: "accept", count: 1 },
                { label: "reject", count: 2 },
              ],
              confidence_mix: [
                { label: "high", count: 1 },
                { label: "medium", count: 2 },
              ],
              strongest_criteria: ["Originality"],
              weakest_criteria: ["Technical quality"],
              review_coverage_completeness: "3 of 3 assigned reviews submitted.",
              score_changes_after_rebuttal: "1 reviewer updated their score after rebuttal.",
            },
            discussion_signals: {
              summary: "Discussion focused on evaluation strength and rebuttal follow-through.",
              thread_count: 1,
              message_count: 2,
              last_activity_at: "2026-03-31T09:30:00Z",
            },
            rebuttal_signals: {
              status: "available",
              summary: "Authors addressed one point directly and partially addressed another.",
            },
            disagreement_map: {
              areas_of_agreement: ["Problem relevance"],
              areas_of_disagreement: ["Strength of empirical validation"],
              unresolved_concerns: ["Ablation depth"],
              confidence_limits: ["One review has limited confidence."],
            },
            suggested_chair_note: "This draft summarizes the evidence without making the decision.",
            evidence_fingerprint: "sha256:evidence",
            generated_at: "2026-03-31T09:45:00Z",
          },
    error:
      status === "failed"
        ? {
            code: "workflow_failed",
            message: "Copilot generation failed.",
          }
        : null,
  }
}

describe("chair decision copilot api", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches chair decision copilot lookup", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: buildResponse("idle"),
      },
      response: { status: 200 },
    } as any)

    const result = await getChairDecisionCopilot("1", "42")

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/1/submissions/42/decision-copilot",
    )
    expect(result.data?.status).toBe("idle")
  })

  it("posts chair decision copilot generation", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: buildResponse("ready"),
      },
      response: { status: 200 },
    } as any)

    const result = await generateChairDecisionCopilot("1", "42")

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/1/submissions/42/decision-copilot/generate",
      { method: "POST" },
    )
    expect(result.data?.status).toBe("ready")
  })

  it("posts chair decision copilot regeneration", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: buildResponse("stale"),
      },
      response: { status: 200 },
    } as any)

    const result = await regenerateChairDecisionCopilot("1", "42")

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/1/submissions/42/decision-copilot/regenerate",
      { method: "POST" },
    )
    expect(result.data?.status).toBe("stale")
  })

  it("supports all typed lifecycle states", () => {
    const states: ChairDecisionCopilotResponse["status"][] = [
      "idle",
      "generating",
      "ready",
      "stale",
      "failed",
    ]

    expect(states).toEqual(["idle", "generating", "ready", "stale", "failed"])
  })
})
