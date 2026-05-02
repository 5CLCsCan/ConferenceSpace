import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ConferenceHeader } from "../conference-header"
import { ROUTES } from "@/lib/routes"

const pushMock = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

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

const conference = {
  id: "123",
  name: "Conference on AI Systems",
  acronym: "CAIS",
  year: 2026,
  description: "Scope and objectives.",
  submission_deadline: "",
  review_deadline: "",
  camera_ready_deadline: "",
  notification_date: "",
  conference_date: "",
  location: "Ho Chi Minh City",
  status: "open",
  tracks: [],
}

describe("ConferenceHeader", () => {
  beforeEach(() => {
    pushMock.mockReset()
    localStorage.setItem("conference_locale", "en")
  })

  it("navigates back to author conferences from the breadcrumb", () => {
    render(
      <ConferenceHeader
        conference={conference as any}
        conferenceId="123"
        activeTab="overview"
        onTabChange={vi.fn()}
        hasSubmission={false}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /conferences/i }))

    expect(pushMock).toHaveBeenCalledWith(ROUTES.AUTHOR.DASHBOARD)
  })

  it("shows a closed submission action after the full-paper deadline when there is no submission", () => {
    render(
      <ConferenceHeader
        conference={
          {
            ...conference,
            configurations: {
              full_paper_submission_deadline: new Date(
                Date.now() - 24 * 60 * 60 * 1000,
              ).toISOString(),
            },
          } as any
        }
        conferenceId="123"
        activeTab="overview"
        onTabChange={vi.fn()}
        submission={null}
      />,
    )

    expect(screen.getByRole("button", { name: /submissions closed/i })).toBeDisabled()
    expect(screen.getByText(/no longer accepts new submissions/i)).toBeInTheDocument()
    expect(screen.getByText(/submission closed/i)).toBeInTheDocument()
  })

  it("routes existing non-final submissions to the edit page after the deadline", () => {
    render(
      <ConferenceHeader
        conference={
          {
            ...conference,
            configurations: {
              full_paper_submission_deadline: new Date(
                Date.now() - 24 * 60 * 60 * 1000,
              ).toISOString(),
            },
          } as any
        }
        conferenceId="123"
        activeTab="overview"
        onTabChange={vi.fn()}
        submission={{ id: 456, status: "published" } as any}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /edit submission/i }))

    expect(pushMock).toHaveBeenCalledWith(
      `${ROUTES.AUTHOR.SUBMISSION_EDIT("456")}?conferenceId=123`,
    )
  })
})
