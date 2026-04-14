import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { ConferenceRebuttalSettings } from "../conference-rebuttal-settings"

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

vi.mock("@/lib/api/conference-rebuttal", () => ({
  getRebuttalOverview: vi.fn(async () => ({
    data: {
      settings: {
        enabled: true,
        start_at: "2026-04-20T00:00:00.000Z",
        deadline: "2026-04-25T00:00:00.000Z",
        char_limit_general: 3000,
        char_limit_per_point: 1000,
      },
    },
    error: null,
  })),
  saveRebuttalSettings: vi.fn(async () => ({ data: {}, error: null })),
}))

describe("ConferenceRebuttalSettings design aliases", () => {
  it("uses semantic aliases for the settings shell", async () => {
    const { container } = render(<ConferenceRebuttalSettings conferenceId="1" />)

    expect(await screen.findByText(/rebuttal configuration/i)).toHaveClass("text-card-header")
    expect(container.querySelector("input[type='date']")).toHaveClass(
      "control-standard",
      "text-body",
    )
    expect(screen.getByRole("button", { name: /save settings/i })).toHaveClass("button-primary")
  })
})
