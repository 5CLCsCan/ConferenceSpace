import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { DetailedFeedbackSection } from "../detailed-feedback"
import { FinalRecommendationCard } from "../recommendation-selector"
import { CriterionScoreCard, ScoreSummary } from "../scoring-criteria"
import { PhaseHeader } from "@/components/shared/rebuttal/components/phase-header"
import { ScoreSummaryPanel } from "@/components/shared/rebuttal/components/score-summary-panel"

vi.mock("@/lib/i18n/translation-context", async () => {
  const { tStatic } = await vi.importActual<typeof import("@/lib/i18n/static-translate")>(
    "@/lib/i18n/static-translate",
  )

  return {
    useTranslation: () => ({
      locale: "en",
      messages: {},
      setLocale: vi.fn(),
      t: tStatic,
      tList: () => [],
    }),
  }
})

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const reviewers = [
  {
    id: "r1",
    anonymousId: "Reviewer #1",
    isCurrentUser: true,
    scores: { original: 6, current: 8, updated: true },
    recommendation: { original: "borderline", current: "accept", updated: true },
    confidence: 4,
  },
]

describe("workflow design aliases", () => {
  it("uses semantic aliases for detailed feedback", () => {
    render(
      <DetailedFeedbackSection
        summary="Summary"
        strengths="Strengths"
        weaknesses="Weaknesses"
        questions="Questions"
        onSummaryChange={vi.fn()}
        onStrengthsChange={vi.fn()}
        onWeaknessesChange={vi.fn()}
        onQuestionsChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/review synthesis/i)).toHaveClass("text-card-header")
    expect(screen.getAllByRole("textbox")[0]).toHaveClass("text-body")
  })

  it("uses semantic aliases for recommendation and confidence panels", () => {
    render(
      <FinalRecommendationCard
        recommendation="accept"
        confidence={4}
        onRecommendationChange={vi.fn()}
        onConfidenceChange={vi.fn()}
        averageScore={7.8}
        isComplete
      />,
    )

    expect(screen.getByText(/final assessment/i)).toHaveClass("text-card-header")
    expect(screen.getByText(/ready/i)).toHaveClass("badge-neutral", "text-tiny-label")
  })

  it("uses semantic aliases for scoring cards", () => {
    const onChange = vi.fn()
    render(
      <>
        <CriterionScoreCard
          criterionKey="originality"
          label="Originality"
          value={8}
          onChange={onChange}
        />
        <ScoreSummary
          scores={{
            originality: 8,
            technicalQuality: 7,
            clarity: 9,
            significance: 6,
            methodology: 8,
          }}
        />
      </>,
    )

    expect(screen.getByText("Originality")).toHaveClass("text-table-header")
    expect(screen.getByText(/average score/i)).toHaveClass("text-tiny-label")
  })

  it("uses semantic aliases for rebuttal phase and score summary shells", () => {
    render(
      <>
        <PhaseHeader
          settings={{
            phase: "submitted",
            deadline: "2026-04-20",
            daysRemaining: 4,
            characterLimitPerReview: 1000,
            charLimitGeneral: 2000,
            charLimitPerPoint: 500,
            allowRevisions: true,
            allowNewResults: false,
            requireResponseToAll: true,
          }}
          userRole="reviewer"
        />
        <ScoreSummaryPanel reviewers={reviewers} />
      </>,
    )

    expect(screen.getByText(/rebuttal submitted/i)).toHaveClass("text-card-header")
    expect(screen.getByText(/response deadline/i)).toHaveClass("text-tiny-label")
    expect(screen.getByText(/reviewer scores/i)).toHaveClass("text-table-header")
  })
})
