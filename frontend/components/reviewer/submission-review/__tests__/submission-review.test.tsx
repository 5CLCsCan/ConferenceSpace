import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SubmissionReviewScreen } from "../../submission-review"

const mockToast = vi.fn()
const mockSaveReview = vi.fn()
const mockRunAudit = vi.fn()
const mockReplaceAudit = vi.fn()

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

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
    replaceAudit: mockReplaceAudit,
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
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

describe("SubmissionReviewScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRunAudit.mockResolvedValue({
      success: true,
      data: {
        status: "warn",
        active_findings: [],
        dismissed_findings: [],
      },
    })
  })

  it("hydrates blocked audit findings from submit response", async () => {
    mockSaveReview.mockResolvedValueOnce({
      success: false,
      error: "review audit found blocking issues",
      errorData: {
        data: {
          code: "review_audit_blocked",
          audit: {
            status: "block",
            active_findings: [
              {
                code: "consistency.recommendation_conflicts_with_written_review",
                severity: "blocking",
                field: "recommendation",
                message: "The written review does not support the final recommendation.",
                suggestion: "Reconcile the recommendation with the written reasoning.",
                condition_fingerprint: "sha256:test",
              },
            ],
            dismissed_findings: [],
          },
        },
      },
    })

    render(
      <SubmissionReviewScreen
        conferenceId="62"
        assignmentId="13"
        submissionId="43"
        submission={null}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }))

    await waitFor(() => {
      expect(mockReplaceAudit).toHaveBeenCalledWith({
        status: "block",
        active_findings: [
          {
            code: "consistency.recommendation_conflicts_with_written_review",
            severity: "blocking",
            field: "recommendation",
            message: "The written review does not support the final recommendation.",
            suggestion: "Reconcile the recommendation with the written reasoning.",
            condition_fingerprint: "sha256:test",
          },
        ],
        dismissed_findings: [],
      })
    })
  })
})
