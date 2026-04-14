import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { PaperHeader, ReviewHeaderBar, TabNavigation } from "../review-header"
import type { SubmissionDetails } from "../types"

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

vi.mock("@/lib/api/papers", () => ({
  downloadPaperFile: vi.fn(),
}))

const submission: SubmissionDetails = {
  id: "42",
  submissionId: "paper-42",
  title: "Design Tokens for Serious Systems",
  abstract: "Abstract",
  keywords: ["design"],
  track: "Systems",
  status: "under_review",
  dueDate: "",
  daysLeft: 5,
  conference: {
    id: "conf-1",
    acronym: "CONF",
    name: "Conference",
  },
}

describe("review-header design aliases", () => {
  it("uses semantic aliases for the sticky review chrome", () => {
    render(<ReviewHeaderBar submission={submission} />)

    const deadlineChip = screen.getByText(/deadline/i).closest("span")
    expect(deadlineChip).toHaveClass("badge-neutral", "text-tiny-label")

    const breadcrumbNav = screen.getByRole("navigation")
    expect(breadcrumbNav).toHaveClass("text-ui-meta")
  })

  it("uses semantic aliases for paper hierarchy and actions", () => {
    render(<PaperHeader submission={submission} />)

    expect(screen.getByRole("heading", { name: "Design Tokens for Serious Systems" })).toHaveClass(
      "text-detail-title",
    )

    expect(screen.getByRole("button", { name: /download pdf/i })).toHaveClass(
      "button-secondary",
      "control-dense",
      "text-ui-meta",
    )

    const badges = screen.getAllByText(/under review|track/i)
    for (const badge of badges) {
      expect(badge).toHaveClass("badge-neutral", "text-tiny-label")
    }
  })

  it("uses semantic aliases for tab navigation", () => {
    render(<TabNavigation activeTab="discussion" onTabChange={vi.fn()} discussionCount={3} />)

    const reviewTab = screen.getByRole("button", { name: /review form/i })
    const discussionTab = screen.getByRole("button", { name: /discussion/i })
    const counter = screen.getByText("3")

    expect(reviewTab).toHaveClass("text-ui-meta")
    expect(discussionTab).toHaveClass("text-ui-meta")
    expect(counter).toHaveClass("badge-neutral", "text-tiny-label")
  })
})
