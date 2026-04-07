import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { ChairDecisionCopilotPanel } from "../chair-decision-copilot-panel"
import type { ChairDecisionCopilotResponse } from "@/lib/api/chair-decision-copilot"

function buildResponse(
  overrides: Partial<ChairDecisionCopilotResponse> = {},
): ChairDecisionCopilotResponse {
  return {
    status: "ready",
    run_id: "run-1",
    cache: {
      hit: true,
      evidence_fingerprint: "sha256:evidence",
      is_stale: false,
      stale_reasons: [],
    },
    artifact: {
      evidence_summary: {
        overview: "Current evidence highlights consistent concerns around evaluation depth.",
        evidence_basis: ["3 submitted reviews", "1 discussion thread"],
      },
      review_feedback_synthesis: {
        summary: "Reviewers align on novelty but diverge on empirical support.",
        strengths: ["Problem relevance"],
        weaknesses: ["Evaluation breadth"],
        questions: ["How robust is the comparison set?"],
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
        summary: "Discussion centered on methodology and how much the rebuttal addressed it.",
        thread_count: 1,
        message_count: 2,
        last_activity_at: "2026-03-31T10:00:00Z",
      },
      rebuttal_signals: {
        status: "available",
        summary: "Authors addressed some, but not all, reviewer concerns.",
      },
      disagreement_map: {
        areas_of_agreement: ["Problem significance"],
        areas_of_disagreement: ["Strength of evaluation"],
        unresolved_concerns: ["Ablation depth"],
        confidence_limits: ["One review cites limited confidence."],
      },
      suggested_chair_note:
        "Draft rationale summarizing the evidence package without making the decision.",
      guardrails: {
        advisory_only: true,
        no_decision: true,
        no_automatic_status_change: true,
        human_judgment_required: "Final decision remains with the chair.",
      },
      evidence_fingerprint: "sha256:evidence",
      generated_at: "2026-03-31T10:05:00Z",
    },
    error: null,
    ...overrides,
  }
}

describe("ChairDecisionCopilotPanel", () => {
  it("renders the idle empty state and generate action", () => {
    render(
      <ChairDecisionCopilotPanel
        copilot={buildResponse({
          status: "idle",
          run_id: null,
          artifact: null,
          cache: {
            hit: false,
            evidence_fingerprint: "sha256:evidence",
            is_stale: false,
            stale_reasons: [],
          },
        })}
        loading={false}
        generating={false}
        regenerating={false}
        error={null}
        onGenerate={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Expand Decision Advisory" })).toBeInTheDocument()
    expect(screen.queryByText(/no advisory generated yet/i)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Expand Decision Advisory" }))
    expect(screen.getByText(/no advisory generated yet/i)).toBeInTheDocument()
  })

  it("renders the ready artifact with regenerate action", () => {
    render(
      <ChairDecisionCopilotPanel
        copilot={buildResponse()}
        loading={false}
        generating={false}
        regenerating={false}
        error={null}
        onGenerate={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )

    expect(screen.getByText("Decision Advisory")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "About Decision Advisory" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Expand Decision Advisory" })).toBeInTheDocument()
    expect(screen.queryByText(/evidence overview/i)).not.toBeInTheDocument()
    expect(
      screen.queryByText("Current evidence highlights consistent concerns around evaluation depth."),
    ).not.toBeInTheDocument()
    expect(screen.queryByText("Decision workflow")).not.toBeInTheDocument()
    expect(screen.queryByText("Advisory only")).not.toBeInTheDocument()
    expect(screen.queryByText("Current package")).not.toBeInTheDocument()
    expect(screen.queryByText("Review signal")).not.toBeInTheDocument()
    expect(screen.queryByText("Discussion signal")).not.toBeInTheDocument()
    expect(screen.queryByText("Rebuttal")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeInTheDocument()
  })

  it("renders the stale state without auto-running", () => {
    render(
      <ChairDecisionCopilotPanel
        copilot={buildResponse({
          status: "stale",
          cache: {
            hit: false,
            evidence_fingerprint: "sha256:evidence",
            is_stale: true,
            stale_reasons: ["review_updated"],
          },
        })}
        loading={false}
        generating={false}
        regenerating={false}
        error={null}
        onGenerate={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )

    expect(screen.getByText(/last generated/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeInTheDocument()
    expect(screen.queryByText("Generating...")).not.toBeInTheDocument()
  })

  it("preserves the last artifact when the latest run failed", () => {
    render(
      <ChairDecisionCopilotPanel
        copilot={buildResponse({
          status: "failed",
          error: {
            code: "workflow_failed",
            message: "The copilot could not synthesize this submission right now.",
          },
        })}
        loading={false}
        generating={false}
        regenerating={false}
        error="The copilot could not synthesize this submission right now."
        onGenerate={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Collapse Decision Advisory" })).toBeInTheDocument()
    expect(screen.getByText(/could not generate recommendation/i)).toBeInTheDocument()
    expect(
      screen.getByText("Current evidence highlights consistent concerns around evaluation depth."),
    ).toBeInTheDocument()
  })

  it("does not render the removed guardrail banner in non-idle states", () => {
    const states: ChairDecisionCopilotResponse["status"][] = ["ready", "stale", "failed"]

    for (const status of states) {
      const { unmount } = render(
        <ChairDecisionCopilotPanel
          copilot={buildResponse({ status })}
          loading={false}
          generating={false}
          regenerating={false}
          error={null}
          onGenerate={vi.fn()}
          onRegenerate={vi.fn()}
        />,
      )

      expect(screen.queryByText("This is not a decision")).not.toBeInTheDocument()
      expect(
        screen.queryByText(
          "This copilot summarizes available evidence and highlights disagreement. It does not approve, reject, or update submission status.",
        ),
      ).not.toBeInTheDocument()

      unmount()
    }
  })

  it("triggers generation and regeneration actions from the correct state", () => {
    const onGenerate = vi.fn()
    const onRegenerate = vi.fn()

    const { rerender } = render(
      <ChairDecisionCopilotPanel
        copilot={buildResponse({
          status: "idle",
          run_id: null,
          artifact: null,
          cache: {
            hit: false,
            evidence_fingerprint: "sha256:evidence",
            is_stale: false,
            stale_reasons: [],
          },
        })}
        loading={false}
        generating={false}
        regenerating={false}
        error={null}
        onGenerate={onGenerate}
        onRegenerate={onRegenerate}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Generate" }))
    expect(onGenerate).toHaveBeenCalledTimes(1)

    rerender(
      <ChairDecisionCopilotPanel
        copilot={buildResponse()}
        loading={false}
        generating={false}
        regenerating={false}
        error={null}
        onGenerate={onGenerate}
        onRegenerate={onRegenerate}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }))
    expect(onRegenerate).toHaveBeenCalledTimes(1)
  })

  it("toggles the advisory body from the header control", () => {
    render(
      <ChairDecisionCopilotPanel
        copilot={buildResponse()}
        loading={false}
        generating={false}
        regenerating={false}
        error={null}
        onGenerate={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Expand Decision Advisory" }))

    expect(screen.getByRole("button", { name: "Collapse Decision Advisory" })).toBeInTheDocument()
    expect(screen.getByText(/evidence overview/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Collapse Decision Advisory" }))

    expect(screen.getByRole("button", { name: "Expand Decision Advisory" })).toBeInTheDocument()
    expect(screen.queryByText(/evidence overview/i)).not.toBeInTheDocument()
  })

  it("does not crash when optional artifact arrays are omitted", () => {
    const response = buildResponse()
    if (!response.artifact) {
      throw new Error("artifact is required for this test")
    }

    const sparseResponse: ChairDecisionCopilotResponse = {
      ...response,
      artifact: {
        ...response.artifact,
        evidence_summary: {
          ...response.artifact.evidence_summary,
          evidence_basis: undefined as unknown as string[],
        },
        review_feedback_synthesis: {
          ...response.artifact.review_feedback_synthesis,
          strengths: undefined as unknown as string[],
          weaknesses: undefined as unknown as string[],
          questions: undefined as unknown as string[],
        },
        disagreement_map: {
          ...response.artifact.disagreement_map,
          areas_of_agreement: undefined as unknown as string[],
          areas_of_disagreement: undefined as unknown as string[],
          unresolved_concerns: undefined as unknown as string[],
          confidence_limits: undefined as unknown as string[],
        },
      },
    }

    render(
      <ChairDecisionCopilotPanel
        copilot={sparseResponse}
        loading={false}
        generating={false}
        regenerating={false}
        error={null}
        onGenerate={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Expand Decision Advisory" }))
    expect(screen.getByText(/evidence overview/i)).toBeInTheDocument()
    expect(screen.getByText(/suggested chair note/i)).toBeInTheDocument()
  })

  it("renders explicit zero discussion counts and a disagreement fallback for sparse evidence", () => {
    const response = buildResponse()
    if (!response.artifact) {
      throw new Error("artifact is required for this test")
    }

    render(
      <ChairDecisionCopilotPanel
        copilot={{
          ...response,
          artifact: {
            ...response.artifact,
            discussion_signals: {
              ...response.artifact.discussion_signals,
              thread_count: undefined as unknown as number,
              message_count: undefined as unknown as number,
            },
            disagreement_map: {
              ...response.artifact.disagreement_map,
              areas_of_agreement: [],
              areas_of_disagreement: [],
              unresolved_concerns: [],
              confidence_limits: [],
            },
          },
        }}
        loading={false}
        generating={false}
        regenerating={false}
        error={null}
        onGenerate={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Expand Decision Advisory" }))
    expect(screen.getByText(/0 threads/i)).toBeInTheDocument()
    expect(screen.getByText(/0 messages/i)).toBeInTheDocument()

    const suggestedNote = screen.getByText(
      "Draft rationale summarizing the evidence package without making the decision.",
    )

    expect(screen.queryByText(/reviewer alignment/i)).not.toBeInTheDocument()
    expect(suggestedNote).toBeInTheDocument()
  })
})
