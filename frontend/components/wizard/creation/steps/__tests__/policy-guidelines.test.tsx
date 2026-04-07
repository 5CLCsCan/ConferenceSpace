import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { initialFormData } from "../../types"
import { PolicyGuidelinesStep } from "../policy-guidelines"

vi.mock("@/lib/i18n/translation-context", async () => {
  const { tStatic } = await vi.importActual<typeof import("@/lib/i18n/static-translate")>(
    "@/lib/i18n/static-translate",
  )

  return {
    useTranslation: () => ({
      t: tStatic,
    }),
  }
})

vi.mock("@/lib/i18n/static-translate", () => ({
  tStatic: (value: string) => value,
}))

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe("PolicyGuidelinesStep submission gating card", () => {
  it("hides gating inputs until the master toggle is enabled", () => {
    const updateData = vi.fn()

    render(<PolicyGuidelinesStep data={initialFormData} updateData={updateData} />)

    expect(screen.queryByLabelText("Minimum references")).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText("Enable submission gating"))

    expect(updateData).toHaveBeenCalledWith({ gatingEnabled: true })
  })

  it("shows gating controls when enabled and trims steering prompts to 2000 characters", () => {
    const updateData = vi.fn()
    const data = { ...initialFormData, gatingEnabled: true }

    render(<PolicyGuidelinesStep data={data} updateData={updateData} />)

    expect(screen.getByLabelText("Minimum references")).toBeInTheDocument()
    expect(screen.getByLabelText("Required sections")).toBeInTheDocument()
    expect(screen.getByLabelText("Steering prompt")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Steering prompt"), {
      target: { value: "x".repeat(2005) },
    })

    expect(updateData).toHaveBeenLastCalledWith({ gatingPrompt: "x".repeat(2000) })
    expect(screen.getByText("0/2000")).toBeInTheDocument()
  })

  it("shows empty optional rule inputs by default when gating is enabled", () => {
    const data = { ...initialFormData, gatingEnabled: true }

    render(<PolicyGuidelinesStep data={data} updateData={vi.fn()} />)

    expect(screen.getByLabelText("Minimum references")).toHaveValue(null)
    expect(screen.getByLabelText("Title max words")).toHaveValue(null)
    expect(screen.getByLabelText("Required sections")).toHaveValue("")
    expect(screen.getByLabelText("Scope keywords")).toHaveValue("")
    expect(screen.getByLabelText("Banned phrases")).toHaveValue("")
    expect(screen.getByLabelText("Require anonymized submissions")).not.toBeChecked()
  })
})
