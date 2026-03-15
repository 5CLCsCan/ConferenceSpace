import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { SubmissionDetailContent } from "../submission-detail-content"

vi.mock("../submission-detail/chair-discussion-tab", () => ({
  ChairDiscussionTab: () => <div>mock-discussion-tab</div>,
}))

vi.mock("../submission-detail/chair-history-tab", () => ({
  ChairHistoryTab: () => <div>mock-history-tab</div>,
}))

vi.mock("../submission-detail/chair-reviews-tab", () => ({
  ChairReviewsTab: () => <div>mock-chair-reviews-tab</div>,
}))

describe("SubmissionDetailContent", () => {
  it("renders the chair reviews design for the reviews tab", () => {
    render(
      <SubmissionDetailContent
        submission={
          {
            id: "11",
            displayId: "#11",
            title: "Test submission",
            abstract: "Abstract",
            track: "AI",
            status: "under_review",
            keywords: [],
            authors: [],
            conflictsOfInterest: [],
            files: [],
            lastUpdated: "Mar 09, 2026",
            reviewOverview: {
              averageScore: 0,
              maxScore: 10,
              confidence: "medium",
              status: "0/0 reviews submitted",
              individualScores: [],
            },
            reviewerAssignments: [],
          } as any
        }
        activeTab="reviews"
        conferenceId="41"
        submissionId="11"
        reviews={[]}
        historyEvents={[]}
      />,
    )

    expect(screen.getByText("mock-chair-reviews-tab")).toBeInTheDocument()
  })
})
