import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ReviewAuditPanel } from "../review-audit-panel"

describe("ReviewAuditPanel", () => {
  it("escalates block status and critical findings above suggestions", () => {
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

    expect(screen.getByText("Critical")).toBeInTheDocument()
    expect(screen.getByText("Critical attention required")).toBeInTheDocument()
    expect(screen.getByText("Critical findings")).toBeInTheDocument()
    expect(screen.getByText("Suggestions")).toBeInTheDocument()
    expect(screen.getByText("Dismissed findings")).toBeInTheDocument()
    expect(screen.getByText("Critical signals: 1")).toBeInTheDocument()
    expect(screen.getByText("Suggestions: 1")).toBeInTheDocument()
    expect(screen.getByText("critical")).toBeInTheDocument()
    expect(screen.getAllByText("suggestion")).toHaveLength(2)

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onUndismiss).toHaveBeenCalledTimes(1)
  })

  it("shows a clear status badge when audit passes", () => {
    render(
      <ReviewAuditPanel
        audit={{
          status: "pass",
          active_findings: [],
          dismissed_findings: [],
        }}
        auditing={false}
        updatingDismissal={false}
        error={null}
        onDismiss={vi.fn()}
        onUndismiss={vi.fn()}
      />,
    )

    expect(screen.getByText("Clear")).toBeInTheDocument()
    expect(screen.queryByText("Critical attention required")).not.toBeInTheDocument()
  })
})
