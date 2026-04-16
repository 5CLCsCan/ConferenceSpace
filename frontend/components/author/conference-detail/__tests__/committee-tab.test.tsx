import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { CommitteeTab } from "../committee-tab"
import type { Conference } from "@/lib/api/conferences"

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

vi.mock("@/lib/api/user", () => ({
  userApi: {
    getByEmail: vi.fn(async (email: string) => ({
      data: {
        data: {
          id: 1,
          email,
          first_name: email.split("@")[0].replace(/[._-]/g, " "),
          last_name: "User",
          domain: ["AI"],
        },
      },
    })),
  },
}))

const makeConference = (overrides: Partial<Conference> = {}): Conference => ({
  id: "1",
  name: "Test Conference 2026",
  acronym: "TC26",
  year: 2026,
  description: "A test conference",
  submission_deadline: "",
  review_deadline: "",
  camera_ready_deadline: "",
  notification_date: "",
  conference_date: "",
  location: "Online",
  status: "open",
  tracks: [],
  chair: "chair@example.com",
  co_chairs: ["cochair@example.com"],
  pc_members: ["pc1@example.com", "pc2@example.com"],
  ...overrides,
})

describe("CommitteeTab", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders organizing committee heading", async () => {
    render(<CommitteeTab conference={makeConference()} />)

    expect(screen.getByText("Organizing Committee")).toBeInTheDocument()
  })

  it("shows chair and co-chairs in general chairs section", async () => {
    render(<CommitteeTab conference={makeConference()} />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText("chair@example.com")).toBeInTheDocument()
    expect(screen.getByText("cochair@example.com")).toBeInTheDocument()
  })

  it("shows pc_members in program committee section", async () => {
    render(<CommitteeTab conference={makeConference()} />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText("pc1 User")).toBeInTheDocument()
    expect(screen.getByText("pc2 User")).toBeInTheDocument()
  })

  it("does not fetch or show reviewer data", async () => {
    render(<CommitteeTab conference={makeConference()} />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    expect(screen.queryByText("Reviewer")).not.toBeInTheDocument()
  })

  it("shows empty state when no pc_members", async () => {
    render(<CommitteeTab conference={makeConference({ pc_members: [] })} />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText(/No committee members/i)).toBeInTheDocument()
  })

  it("shows empty state when no chairs listed", async () => {
    render(
      <CommitteeTab
        conference={makeConference({ chair: undefined, co_chairs: [] })}
      />,
    )

    expect(screen.getByText(/No general chairs listed/i)).toBeInTheDocument()
  })
})
