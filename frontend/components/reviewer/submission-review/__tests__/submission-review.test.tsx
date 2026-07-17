import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SubmissionReviewScreen } from "../../submission-review"

const mockToast = vi.fn()
const mockSaveReview = vi.fn()
const mockRunAudit = vi.fn()

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
  default: () => ({
    audit: null,
    auditing: false,
    updatingDismissal: false,
    error: null,
    runAudit: mockRunAudit,
    dismissFinding: vi.fn(),
    undismissFinding: vi.fn(),
    replaceAudit: vi.fn(),
  }),
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
  DetailedFeedbackSection: () => <div>feedback</div>,
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
  ReviewAuditPanel: () => <div>audit-panel</div>,
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
    mockRunAudit.mockResolvedValue({
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
    })
    mockSaveReview.mockResolvedValue({ success: true })
  })

  it("still submits when audit preflight returns block status", async () => {
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
      expect(mockSaveReview).toHaveBeenCalledWith(
        expect.objectContaining({ status: "submitted" }),
      )
    })

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/submitted/i),
      }),
    )
  })
})
