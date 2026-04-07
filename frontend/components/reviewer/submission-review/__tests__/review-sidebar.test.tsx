import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AIAssistantCard } from "../review-sidebar"

vi.mock("@/hooks/use-assignment-briefing", () => ({
  default: () => ({
    briefing: {
      status: "ready",
      cache: { hit: false, submission_state_fingerprint: "sha256:test" },
      artifact: {
        submission_snapshot: {
          title: "Reliable Systems",
          abstract_summary: "Structured reviewer pre-read workflow.",
          manuscript_overview: "The manuscript presents the workflow and expected reviewer value.",
          keywords: ["review"],
          track: "main",
        },
        review_readiness_signals: [
          {
            label: "Claim support visibility",
            status: "present",
            detail: "Claims are tied to concrete manuscript evidence.",
            source: "derived",
          },
        ],
        claimed_contributions: [{ label: "Structured pre-read workflow", evidence: [], source: "submission" }],
        notable_elements: [{ label: "Reviewer orientation", detail: "Focuses on reducing rereading effort.", source: "submission" }],
        reviewer_attention_points: [{ focus: "Verify manuscript support", reason: "Core claims depend on manuscript evidence.", source: "derived" }],
        stated_scope_and_limitations: [{ label: "Neutral assistance", detail: "No recommendation or score output.", source: "submission" }],
        guardrails: {
          no_recommendation: true,
          no_score: true,
          bias_notice: "This briefing is assistive only and must not replace independent review judgment.",
        },
      },
    },
    loading: false,
    generating: false,
    error: null,
    generateBriefing: vi.fn(),
  }),
}))

vi.mock("@/lib/api/papers", () => ({
  downloadPaperFile: vi.fn(async () => ({
    data: new Blob(["pdf"], { type: "application/pdf" }),
    filename: "paper.pdf",
    error: null,
  })),
}))

vi.mock("@/lib/i18n/translation-context", async () => {
  const { tStatic } = await vi.importActual<typeof import("@/lib/i18n/static-translate")>(
    "@/lib/i18n/static-translate",
  )

  return {
    useTranslation: () => ({
      t: tStatic,
    }),
  }
})

describe("AIAssistantCard", () => {
  it("renders a ready-state card and opens the modal analysis view on demand", () => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    })

    render(
      <AIAssistantCard
        conferenceId="1"
        assignmentId="42"
        submissionId="7"
        submissionTitle="Reliable Systems"
      />,
    )

    expect(screen.getByText(/report generated/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /view analysis/i })).toBeInTheDocument()
    expect(screen.queryByText(/review readiness signals/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /view analysis/i }))

    expect(screen.getByText(/reviewer pre-read analysis/i)).toBeInTheDocument()
    expect(screen.getByText(/review readiness signals/i)).toBeInTheDocument()
    expect(screen.getByText("Claim support visibility")).toBeInTheDocument()
  })
})
