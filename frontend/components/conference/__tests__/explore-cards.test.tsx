import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ExploreConferenceCard, ExploreConferenceList } from "../explore-cards"
import type { ExploreConference } from "../types"

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

const longDescription =
  "Sustainable AI systems for climate resilience, governance, and global infrastructure."
const longLocation = "Marina Bay Sands Expo & Convention Centre, 10 Bayfront Ave, Singapore 018956"
const truncatedDescription = "Sustainable AI systems for climate resilience,..."
const truncatedLocation = "Marina Bay Sands Expo & Convention Centre, 10 B..."

const conference: ExploreConference = {
  id: "conf-1",
  name: "GSSAI 2025",
  fullDescription: longDescription,
  location: longLocation,
  dates: "Mar 15, 2026 - Mar 17, 2026",
  exploreStatus: "call-for-papers",
  topics: ["NLP", "CV"],
}

describe("Explore conference previews", () => {
  it("limits the card description and location previews to 50 characters", () => {
    render(<ExploreConferenceCard conference={conference} onViewDetails={vi.fn()} />)

    expect(screen.getByText(truncatedDescription)).toBeInTheDocument()
    expect(screen.getByText(truncatedLocation)).toBeInTheDocument()
    expect(screen.queryByText(longDescription)).not.toBeInTheDocument()
    expect(screen.queryByText(longLocation)).not.toBeInTheDocument()
  })

  it("limits the list description and location previews to 50 characters", () => {
    render(<ExploreConferenceList conferences={[conference]} onViewDetails={vi.fn()} />)

    expect(screen.getAllByText(truncatedDescription).length).toBeGreaterThan(0)
    expect(screen.getAllByText(truncatedLocation).length).toBeGreaterThan(0)
    expect(screen.queryByText(longDescription)).not.toBeInTheDocument()
    expect(screen.queryByText(longLocation)).not.toBeInTheDocument()
  })

  it("shows submission closed without the primary submit action on closed cards", () => {
    render(
      <ExploreConferenceCard
        conference={{ ...conference, exploreStatus: "submission-closed" }}
        onViewDetails={vi.fn()}
        primaryActionLabel="Submit Paper"
        onPrimaryAction={vi.fn()}
      />,
    )

    expect(screen.getByText(/submission closed/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /submit paper/i })).not.toBeInTheDocument()
  })

  it("shows submission closed without the primary submit action on closed list rows", () => {
    render(
      <ExploreConferenceList
        conferences={[{ ...conference, exploreStatus: "submission-closed" }]}
        onViewDetails={vi.fn()}
        primaryActionLabel="Submit Paper"
        onPrimaryAction={vi.fn()}
      />,
    )

    expect(screen.getAllByText(/submission closed/i).length).toBeGreaterThan(0)
    expect(screen.queryByRole("button", { name: /submit paper/i })).not.toBeInTheDocument()
  })
})
