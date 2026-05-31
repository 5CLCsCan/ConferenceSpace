import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn().mockResolvedValue({ data: { inserted: 1 }, response: new Response() }),
}))

describe("usage events", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
    window.localStorage.clear()
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    })
    vi.clearAllMocks()
  })

  it("batches usage events with a stable browser session id", async () => {
    const { apiFetch } = await import("@/lib/api/client")
    const { flushUsageEvents, trackUsageEvent } = await import("../usage-events")

    trackUsageEvent("submission_started", {
      role: "author",
      entityType: "conference",
      entityId: 12,
      metadata: { runLabel: "test-run", personaId: "p-author-1" },
    })
    await flushUsageEvents()

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/usage-events",
      expect.objectContaining({
        method: "POST",
        body: expect.any(String),
      }),
    )

    const body = JSON.parse(vi.mocked(apiFetch).mock.calls[0][1]?.body as string)
    expect(body.events).toHaveLength(1)
    expect(body.events[0]).toMatchObject({
      role: "author",
      event_name: "submission_started",
      entity_type: "conference",
      entity_id: "12",
      metadata: { runLabel: "test-run", personaId: "p-author-1" },
    })
    expect(body.events[0].session_id).toBeTruthy()
  })

  it("does not throw when event delivery fails", async () => {
    const { apiFetch } = await import("@/lib/api/client")
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error("network"))
    const { flushUsageEvents, trackUsageEvent } = await import("../usage-events")

    trackUsageEvent("role_selected")

    await expect(flushUsageEvents()).resolves.toBeUndefined()
  })

  it("flushes queued events when the page is hidden", async () => {
    const { apiFetch } = await import("@/lib/api/client")
    const { trackUsageEvent } = await import("../usage-events")

    trackUsageEvent("review_started")
    document.dispatchEvent(new Event("visibilitychange"))
    await Promise.resolve()

    expect(apiFetch).not.toHaveBeenCalled()

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    })
    document.dispatchEvent(new Event("visibilitychange"))
    await Promise.resolve()

    expect(apiFetch).toHaveBeenCalledTimes(1)
  })
})
