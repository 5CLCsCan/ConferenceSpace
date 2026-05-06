import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { PaperDetailsStep } from "../paper-details-step"

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}))

vi.mock("next/dynamic", () => ({
  default: () => {
    return function MockEditor(props: { value?: string; onChange?: (value: string) => void }) {
      return (
        <textarea
          aria-label="Abstract editor"
          value={props.value || ""}
          onChange={(event) => props.onChange?.(event.target.value)}
        />
      )
    }
  },
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

describe("PaperDetailsStep", () => {
  const baseProps = {
    title: "Serving LLMs Efficiently",
    abstract:
      "This paper studies scalable inference systems for large language models in production deployments with detailed evaluation across latency and throughput trade-offs.",
    keywords: ["LLM Serving", "Inference Systems"],
    keywordInput: "",
    selectedTrack: "",
    isStudentPaper: false,
    availableTracks: ["AI Systems", "Theory", "Software Engineering", "HCI"],
    recommendationEligible: true,
    recommendationLoading: false,
    recommendationStale: false,
    recommendationError: null,
    recommendations: [
      {
        track_name: "AI Systems",
        confidence: 0.91,
        reasoning: "Best fit for inference infrastructure and deployment concerns.",
        rank: 1,
      },
      {
        track_name: "Software Engineering",
        confidence: 0.62,
        reasoning: "Some overlap with deployment workflows and tooling.",
        rank: 2,
      },
      {
        track_name: "Theory",
        confidence: 0.21,
        reasoning: "Less emphasis on formal analysis.",
        rank: 3,
      },
      {
        track_name: "HCI",
        confidence: 0.08,
        reasoning: "Limited user-interface focus.",
        rank: 4,
      },
    ],
    onTitleChange: vi.fn(),
    onAbstractChange: vi.fn(),
    onKeywordInputChange: vi.fn(),
    onAddKeyword: vi.fn(),
    onRemoveKeyword: vi.fn(),
    onTrackChange: vi.fn(),
    onStudentPaperChange: vi.fn(),
    onFindRecommendations: vi.fn(),
  }

  it("keeps track recommendation controls hidden", () => {
    render(<PaperDetailsStep {...baseProps} />)

    expect(screen.queryByText(/track recommendation/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /find best-fit tracks/i })).not.toBeInTheDocument()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("copies the manually selected track from the selector", () => {
    render(<PaperDetailsStep {...baseProps} />)

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "AI Systems" } })

    expect(baseProps.onTrackChange).toHaveBeenCalledWith("AI Systems")
  })

  it("does not show stale recommendation messaging after paper changes", () => {
    render(<PaperDetailsStep {...baseProps} recommendationStale />)

    expect(screen.queryByText(/paper details changed/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /refresh recommendation/i })).not.toBeInTheDocument()
  })
})
