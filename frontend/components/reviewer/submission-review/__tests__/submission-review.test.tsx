import { useState } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SubmissionReviewScreen } from "../../submission-review"

const mockToast = vi.fn()
const mockSaveReview = vi.fn()
const mockRunAudit = vi.fn()
const mockReplaceAudit = vi.fn()

const blockingAuditResult = {
  success: true,
  data: {
    status: "block",
    active_findings: [
      {
        code: "quality.review_too_generic_to_submit",
        severity: "blocking",
        field: "review",
        rationale: "Missing paper-specific evidence.",
        message: "The review is too generic to submit.",
        suggestion: "Engage the paper concretely.",
        condition_fingerprint: "sha256:block",
      },
    ],
    dismissed_findings: [],
  },
}

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock("@/lib/i18n/translation-context", async () => {
  const { tStatic } = await vi.importActual<typeof import("@/lib/i18n/static-translate")>(
    "@/lib/i18n/static-translate",
  )

  return {
    useTranslation: () => ({ t: tStatic }),
  }
})

vi.mock("@/hooks/use-assignment-review", () => ({
  default: () => ({
    review: {
      review_data: {
        criteria: {
          originality: 8,
          technical_quality: 8,
          clarity: 8,
          significance: 8,
          methodology: 8,
        },
        feedback: {
          summary: "A substantive summary.",
          strengths: "Concrete strengths are documented here.",
          weaknesses: "Concrete weaknesses are documented here.",
          questions: "Questions for the authors.",
        },
        recommendation: "accept",
        confidence: "high",
      },
    },
    saving: false,
    saveReview: mockSaveReview,
  }),
}))

vi.mock("@/hooks/use-review-audit", () => ({
  default: () => {
    const [audit, setAudit] = useState(null)
    return {
      audit,
      auditing: false,
      updatingDismissal: false,
      error: null,
      runAudit: mockRunAudit,
      dismissFinding: vi.fn(),
      undismissFinding: vi.fn(),
      replaceAudit: (value: any) => {
        mockReplaceAudit(value)
        setAudit(value)
      },
    }
  },
}))

vi.mock("../../submission-review/review-header", () => ({
  ReviewHeaderBar: () => <div>header</div>,
  PaperHeader: () => <div>paper-header</div>,
  TabNavigation: () => <div>tab-nav</div>,
}))

vi.mock("../../submission-review/review-sidebar", () => ({
  AbstractCard: () => <div>abstract</div>,
  AIAssistantCard: () => <div>assistant</div>,
}))

vi.mock("../../submission-review/scoring-criteria", () => ({
  CriterionScoreCard: () => <div>criterion</div>,
  ScoreSummary: () => <div>score-summary</div>,
}))

vi.mock("../../submission-review/detailed-feedback", () => ({
  DetailedFeedbackSection: ({ onSummaryChange }: any) => (
    <div>
      feedback
      <button type="button" onClick={() => onSummaryChange("A changed summary.")}>
        Change summary
      </button>
      <button type="button" onClick={() => onSummaryChange("A substantive summary.")}>
        Restore summary
      </button>
    </div>
  ),
}))

vi.mock("../../submission-review/recommendation-selector", () => ({
  FinalRecommendationCard: () => <div>recommendation</div>,
}))

vi.mock("../../submission-review/discussion-tab", () => ({
  DiscussionTab: () => <div>discussion</div>,
}))

vi.mock("../../submission-review/rebuttal-tab", () => ({
  RebuttalTab: () => <div>rebuttal</div>,
}))

vi.mock("../../submission-review/review-audit-panel", () => ({
  ReviewAuditPanel: ({ audit, canSubmitAnyway, onSubmitAnyway }: any) => (
    <div>
      audit-panel
      {audit?.active_findings?.map((finding: any) => (
        <p key={finding.code}>{finding.message}</p>
      ))}
      {canSubmitAnyway && (
        <button aria-label="Submit anyway after reviewing findings" onClick={onSubmitAnyway}>
          Submit anyway
        </button>
      )}
    </div>
  ),
}))

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => <button onClick={onClick}>{children}</button>,
}))

describe("SubmissionReviewScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRunAudit.mockResolvedValue(blockingAuditResult)
    mockSaveReview.mockResolvedValue({ success: true })
  })

  it("shows blocking findings before allowing the reviewer to submit anyway", async () => {
    render(
      <SubmissionReviewScreen
        conferenceId="62"
        assignmentId="13"
        submissionId="43"
        submission={null}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }))

    await waitFor(() => {
      expect(mockRunAudit).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "submit_preflight" }),
      )
      expect(mockReplaceAudit).toHaveBeenCalled()
    })
    expect(mockSaveReview).not.toHaveBeenCalled()
    expect(screen.getByText("The review is too generic to submit.")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }))
    expect(mockRunAudit).toHaveBeenCalledTimes(1)
    expect(mockSaveReview).not.toHaveBeenCalled()

    fireEvent.click(
      screen.getByRole("button", { name: "Submit anyway after reviewing findings" }),
    )

    await waitFor(() => {
      expect(mockSaveReview).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "submitted",
          audit_failure_override_confirmed: true,
        }),
      )
    })
  })

  it("runs a fresh audit when the review changed after a blocking result", async () => {
    mockRunAudit
      .mockResolvedValueOnce(blockingAuditResult)
      .mockResolvedValueOnce({
        success: true,
        data: { status: "pass", active_findings: [], dismissed_findings: [] },
      })

    render(
      <SubmissionReviewScreen
        conferenceId="62"
        assignmentId="13"
        submissionId="43"
        submission={null}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }))
    await screen.findByRole("button", { name: "Submit anyway after reviewing findings" })

    fireEvent.click(screen.getByRole("button", { name: "Change summary" }))
    expect(
      screen.queryByRole("button", { name: "Submit anyway after reviewing findings" }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }))

    await waitFor(() => {
      expect(mockRunAudit).toHaveBeenCalledTimes(2)
      expect(mockSaveReview).toHaveBeenCalledWith(
        expect.objectContaining({ status: "submitted" }),
      )
    })
    expect(mockSaveReview.mock.calls[0][0]).not.toHaveProperty(
      "audit_failure_override_confirmed",
    )
  })

  it("restores the existing override when edits are reverted to the audited content", async () => {
    render(
      <SubmissionReviewScreen
        conferenceId="62"
        assignmentId="13"
        submissionId="43"
        submission={null}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }))
    await screen.findByRole("button", { name: "Submit anyway after reviewing findings" })

    fireEvent.click(screen.getByRole("button", { name: "Change summary" }))
    expect(
      screen.queryByRole("button", { name: "Submit anyway after reviewing findings" }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Restore summary" }))
    expect(
      screen.getByRole("button", { name: "Submit anyway after reviewing findings" }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }))
    expect(mockRunAudit).toHaveBeenCalledTimes(1)
    expect(mockSaveReview).not.toHaveBeenCalled()
  })
})
