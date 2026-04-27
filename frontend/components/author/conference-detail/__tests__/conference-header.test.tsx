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
})
