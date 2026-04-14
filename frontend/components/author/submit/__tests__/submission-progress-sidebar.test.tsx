import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { SubmissionProgressSidebar } from "../submission-progress-sidebar"

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

describe("SubmissionProgressSidebar design aliases", () => {
  it("uses semantic aliases for the sidebar shell and active step", () => {
    const { container } = render(
      <SubmissionProgressSidebar currentStep="paper" onStepChange={vi.fn()} />,
    )

    expect(container.firstElementChild).toHaveClass("surface-sidebar")
    expect(screen.getByText(/conferencespace/i)).toHaveClass("text-card-title")
    expect(screen.getByText(/submit new paper/i)).toHaveClass("text-card-header")
  })
})
