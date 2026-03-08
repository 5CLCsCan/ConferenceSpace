import { describe, it, expect, vi, beforeEach } from "vitest"
import { submitCameraReady } from "../papers"

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:8080",
}))

import { apiFetch } from "@/lib/api/client"
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe("submitCameraReady", () => {
  it("calls the correct URL: /api/v1/conferences/:id/submissions/:id/camera-ready", async () => {
    mockApiFetch.mockResolvedValue({
      data: { data: { id: 42, title: "Paper", status: "accepted" } },
      response: { status: 200 },
    })

    const file = new File(["content"], "paper.pdf", { type: "application/pdf" })
    await submitCameraReady("10", "42", file)

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/10/submissions/42/camera-ready",
      expect.anything(),
    )
  })

  it("uses POST method", async () => {
    mockApiFetch.mockResolvedValue({
      data: { data: { id: 42, title: "Paper", status: "accepted" } },
      response: { status: 200 },
    })

    const file = new File(["content"], "paper.pdf", { type: "application/pdf" })
    await submitCameraReady("10", "42", file)

    const callOptions = mockApiFetch.mock.calls[0][1] as { method: string }
    expect(callOptions.method).toBe("POST")
  })

  it("sends FormData with file field", async () => {
    mockApiFetch.mockResolvedValue({
      data: { data: { id: 42, title: "Paper", status: "accepted" } },
      response: { status: 200 },
    })

    const file = new File(["content"], "camera-ready.pdf", { type: "application/pdf" })
    await submitCameraReady("10", "42", file)

    const callOptions = mockApiFetch.mock.calls[0][1] as { body: unknown }
    expect(callOptions.body).toBeInstanceOf(FormData)

    const formData = callOptions.body as FormData
    expect(formData.get("file")).toBe(file)
  })

  it("returns submission data on success", async () => {
    const submissionData = { id: 42, title: "Camera Ready Paper", status: "accepted" }
    mockApiFetch.mockResolvedValue({
      data: { data: submissionData },
      response: { status: 200 },
    })

    const file = new File(["content"], "paper.pdf", { type: "application/pdf" })
    const result = await submitCameraReady("10", "42", file)

    expect(result.error).toBeNull()
    expect(result.data).toEqual(submissionData)
  })

  it("returns error string on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("Upload failed"))

    const file = new File(["content"], "paper.pdf", { type: "application/pdf" })
    const result = await submitCameraReady("10", "42", file)

    expect(result.data).toBeNull()
    expect(result.error).toBe("Upload failed")
  })
})
