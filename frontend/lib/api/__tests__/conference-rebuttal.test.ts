/**
 * Tests for lib/api/conference-rebuttal.ts
 * Verifies all functions call the correct backend endpoints with correct DTOs.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getRebuttalOverview,
  saveRebuttalSettings,
  openRebuttal,
  finalizeRebuttal,
  openDiscussion,
} from "../conference-rebuttal"

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from "@/lib/api/client"
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>

const MOCK_OVERVIEW = {
  settings: {
    enabled: true,
    phase: "not_started",
    start_at: null,
    deadline: null,
    char_limit_general: 3000,
    char_limit_per_point: 1000,
    allow_discussion: false,
  },
  submissions: [],
}

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe("getRebuttalOverview", () => {
  it("calls GET /api/v1/conferences/:id/rebuttal/settings", async () => {
    mockApiFetch.mockResolvedValue({ data: { data: MOCK_OVERVIEW }, response: { status: 200 } })

    await getRebuttalOverview("5")

    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/conferences/5/rebuttal/settings")
  })

  it("returns settings and submissions on success", async () => {
    mockApiFetch.mockResolvedValue({ data: { data: MOCK_OVERVIEW }, response: { status: 200 } })

    const result = await getRebuttalOverview("5")

    expect(result.error).toBeNull()
    expect(result.data!.settings.phase).toBe("not_started")
    expect(result.data!.settings.char_limit_general).toBe(3000)
    expect(result.data!.submissions).toEqual([])
  })

  it("returns error on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("Not found"))

    const result = await getRebuttalOverview("5")

    expect(result.data).toBeNull()
    expect(result.error).toBe("Not found")
  })
})

describe("saveRebuttalSettings", () => {
  it("calls PATCH /api/v1/conferences/:id/rebuttal/settings with correct body", async () => {
    mockApiFetch.mockResolvedValue({
      data: { data: { ...MOCK_OVERVIEW.settings, enabled: true, char_limit_general: 2000 } },
      response: { status: 200 },
    })

    await saveRebuttalSettings("5", {
      enabled: true,
      char_limit_general: 2000,
      char_limit_per_point: 500,
      allow_discussion: true,
    })

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/5/rebuttal/settings",
      expect.objectContaining({ method: "PATCH" }),
    )

    const body = JSON.parse((mockApiFetch.mock.calls[0][1] as { body: string }).body)
    expect(body.enabled).toBe(true)
    expect(body.char_limit_general).toBe(2000)
    expect(body.allow_discussion).toBe(true)
  })

  it("returns updated config on success", async () => {
    const updatedSettings = { ...MOCK_OVERVIEW.settings, enabled: true }
    mockApiFetch.mockResolvedValue({
      data: { data: updatedSettings },
      response: { status: 200 },
    })

    const result = await saveRebuttalSettings("5", { enabled: true })

    expect(result.error).toBeNull()
    expect(result.data!.enabled).toBe(true)
  })

  it("returns error on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("Forbidden"))

    const result = await saveRebuttalSettings("5", { enabled: true })

    expect(result.error).toBe("Forbidden")
  })
})

describe("openRebuttal", () => {
  it("calls POST /api/v1/conferences/:id/rebuttal/open", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    await openRebuttal("5")

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/5/rebuttal/open",
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("returns no error on success", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    const result = await openRebuttal("5")

    expect(result.error).toBeNull()
  })

  it("returns error when server returns error", async () => {
    mockApiFetch.mockRejectedValue(new Error("Phase transition failed"))

    const result = await openRebuttal("5")

    expect(result.error).toBe("Phase transition failed")
  })
})

describe("finalizeRebuttal", () => {
  it("calls POST /api/v1/conferences/:id/rebuttal/finalize", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    await finalizeRebuttal("7")

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/7/rebuttal/finalize",
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("returns no error on success", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    const result = await finalizeRebuttal("7")

    expect(result.error).toBeNull()
  })

  it("returns error on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("Internal server error"))

    const result = await finalizeRebuttal("7")

    expect(result.error).toBe("Internal server error")
  })
})

describe("openDiscussion", () => {
  it("calls POST /api/v1/conferences/:id/rebuttal/open-discussion", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    await openDiscussion("3")

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/3/rebuttal/open-discussion",
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("returns no error on success", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    const result = await openDiscussion("3")

    expect(result.error).toBeNull()
  })

  it("returns error when allow_discussion is false", async () => {
    mockApiFetch.mockRejectedValue(new Error("Discussion not allowed"))

    const result = await openDiscussion("3")

    expect(result.error).toBe("Discussion not allowed")
  })
})
