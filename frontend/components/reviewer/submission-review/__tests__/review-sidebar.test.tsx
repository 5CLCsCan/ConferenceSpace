import { render, screen } from "@testing-library/react"
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

vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({
    t: (value: string) => value,
  }),
}))

describe("AIAssistantCard", () => {
  it("renders typed reviewer briefing sections without prompt textarea", () => {
    render(<AIAssistantCard conferenceId="1" assignmentId="42" />)

    expect(screen.getByText("Summary")).toBeInTheDocument()
    expect(screen.getByText("Highlights")).toBeInTheDocument()
    expect(screen.getByText("Attention Points")).toBeInTheDocument()
    expect(screen.getByText("Structured reviewer pre-read workflow.")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })
})
