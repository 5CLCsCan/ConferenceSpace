import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import React from "react"
import { OverviewTab } from "../overview-tab"
import type { Submission } from "@/lib/api/submissions"

// Mock translation context (required by all overview-tab sub-components).
vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mock the papers API module used by CameraReadySection (dynamic import).
vi.mock("@/lib/api/papers", () => ({
  submitCameraReady: vi.fn(),
}))

const BASE_SUBMISSION: Submission = {
  id: 1,
  conference_id: 1,
  author: "author@test.com",
  title: "Test Paper",
  abstract: "Abstract",
  domain: ["AI"],
  status: "draft",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function makeSubmission(overrides: Partial<Submission>): Submission {
  return { ...BASE_SUBMISSION, ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("CameraReadySection (via OverviewTab)", () => {
  it("does NOT render for status=draft", () => {
    render(<OverviewTab submission={makeSubmission({ status: "draft" })} conferenceId="1" />)
    expect(screen.queryByText("Camera-Ready Version")).toBeNull()
  })

  it("does NOT render for status=reviewing", () => {
    render(<OverviewTab submission={makeSubmission({ status: "reviewing" })} conferenceId="1" />)
    expect(screen.queryByText("Camera-Ready Version")).toBeNull()
  })

  it("does NOT render for status=rejected", () => {
    render(<OverviewTab submission={makeSubmission({ status: "rejected" })} conferenceId="1" />)
    expect(screen.queryByText("Camera-Ready Version")).toBeNull()
  })

  it("renders upload button when status=accepted and no file uploaded", () => {
    render(
      <OverviewTab
        submission={makeSubmission({ status: "accepted", camera_ready: undefined })}
        conferenceId="1"
      />,
    )
    expect(screen.getByText("Camera-Ready Version")).toBeTruthy()
    expect(screen.getByText("Upload PDF")).toBeTruthy()
    expect(screen.queryByText("Replace File")).toBeNull()
  })

  it("renders file info and replace button when camera_ready metadata exists", () => {
    const submission = makeSubmission({
      status: "accepted",
      camera_ready: {
        filename: "final-paper.pdf",
        original_name: "final-paper.pdf",
        size: 2 * 1024 * 1024,
        mime_type: "application/pdf",
        path: "/uploads/camera-ready/final-paper.pdf",
      },
    })
    render(<OverviewTab submission={submission} conferenceId="1" />)
    expect(screen.getByText("final-paper.pdf")).toBeTruthy()
    expect(screen.getByText("Replace File")).toBeTruthy()
    expect(screen.queryByText("Upload PDF")).toBeNull()
  })

  it("shows error message when submitCameraReady returns an error", async () => {
    const { submitCameraReady } = await import("@/lib/api/papers")
    const mockSubmit = submitCameraReady as ReturnType<typeof vi.fn>
    mockSubmit.mockResolvedValue({ data: null, error: "Server error during upload" })

    render(
      <OverviewTab
        submission={makeSubmission({ status: "accepted", camera_ready: undefined })}
        conferenceId="1"
      />,
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["content"], "test.pdf", { type: "application/pdf" })
    Object.defineProperty(fileInput, "files", { value: [file] })
    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText("Server error during upload")).toBeTruthy()
    })
  })
})
