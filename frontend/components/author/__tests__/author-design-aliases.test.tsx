import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import {
  AuthorConferenceCardBase,
  AuthorStatusBadge,
  type AuthorConference,
} from "../author-conference-cards"
import { AuthorConferenceList } from "../author-conference-list"
import { SubmissionActionBar } from "../submit/submission-action-bar"

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

vi.mock("@/lib/utils", () => ({
  cn: (...args: (string | undefined | boolean)[]) =>
    args.filter((a) => typeof a === "string" && a).join(" "),
}))

const conference: AuthorConference = {
  id: "conf-1",
  name: "Conference on Reliable Systems",
  acronym: "CRS",
  location: "HCMC",
  dates: "Aug 1 - Aug 5",
  submissionDeadline: "Jul 1",
  fullPaperDeadline: "Jul 15",
  status: "submitted",
  paperTitle: "Deterministic UI Contracts",
  trackName: "Systems",
  submissionDate: "2026-04-14",
}

describe("author design aliases", () => {
  it("uses semantic aliases for author status badges", () => {
    render(<AuthorStatusBadge status="accepted" />)

    expect(screen.getByText(/accepted/i)).toHaveClass("text-tiny-label")
  })

  it("uses semantic aliases for the shared author card shell", () => {
    const { container } = render(
      <AuthorConferenceCardBase
        conference={conference}
        footer={<button className="button-primary text-ui-meta">Open</button>}
      >
        <p>Content</p>
      </AuthorConferenceCardBase>,
    )

    expect(container.firstElementChild).toHaveClass("surface-card")
    expect(screen.getByText("CRS")).toHaveClass("text-card-title")
    expect(screen.getByText("Conference on Reliable Systems")).toHaveClass("text-kicker")
  })

  it("uses semantic aliases for the author list shell", () => {
    render(<AuthorConferenceList conferences={[conference]} onNavigate={vi.fn()} />)

    const conferenceHeading = screen.getAllByRole("heading", { name: "CRS" })[0]
    expect(conferenceHeading).toHaveClass("text-card-title")
    expect(screen.getAllByText(/conference/i)[0]).toHaveClass("text-table-header")
  })

  it("uses semantic aliases for the submission action bar", () => {
    render(
      <SubmissionActionBar
        currentStep="review"
        submitting={false}
        onStepChange={vi.fn()}
        onSaveDraft={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: /return/i })).toHaveClass("button-header")
    expect(screen.getByRole("button", { name: /save draft/i })).toHaveClass("button-header")
    expect(screen.getByRole("button", { name: /submit paper/i })).toHaveClass("button-primary")
  })
})
