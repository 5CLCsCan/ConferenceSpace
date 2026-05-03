import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ReviewAuditPanel } from "../review-audit-panel"

describe("ReviewAuditPanel", () => {
  it("renders priority signals, suggestions, and dismissed findings with the right actions", () => {
    const onDismiss = vi.fn()
    const onUndismiss = vi.fn()

    render(
      <ReviewAuditPanel
        audit={{
          status: "block",
          active_findings: [
            {
              code: "quality.review_too_generic_to_submit",
              severity: "blocking",
              field: "review",
              rationale: "The finding is raised because the review lacks paper-specific evidence.",
              message: "The review is too generic to submit.",
              suggestion: "Make the review engage the paper concretely.",
              condition_fingerprint: "sha256:block",
            },
            {
              code: "warn-1",
              severity: "warning",
              field: "strengths",
              rationale: "The finding is raised because the strength is asserted without support.",
              message: "Needs stronger justification.",
              suggestion: "Add specifics.",
              condition_fingerprint: "sha256:a",
            },
          ],
          dismissed_findings: [
            {
              code: "warn-2",
              severity: "warning",
              field: "review",
              rationale: "The finding was dismissed after the reviewer accepted the risk.",
              message: "Previously dismissed.",
              suggestion: "Optional.",
              condition_fingerprint: "sha256:b",
            },
          ],
        }}
        auditing={false}
        updatingDismissal={false}
        error={null}
        onDismiss={onDismiss}
        onUndismiss={onUndismiss}
      />,
    )

    expect(screen.getByText("Priority findings")).toBeInTheDocument()
    expect(screen.getByText("Suggestions")).toBeInTheDocument()
    expect(screen.getByText("Dismissed findings")).toBeInTheDocument()
    expect(screen.getByText("Priority signals: 1")).toBeInTheDocument()
    expect(screen.getByText("Suggestions: 1")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onUndismiss).toHaveBeenCalledTimes(1)
  })
})
