import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  flushAnalytics,
  getAnalyticsSessionId,
  getQueuedAnalyticsCount,
  resetAnalyticsForTests,
  setAnalyticsContext,
  trackEvent,
  trackFlowStep,
} from "@/lib/analytics"

const user = {
  id: "42",
  email: "researcher@example.com",
  name: "Researcher",
  roles: ["reviewer" as const],
  expertise: [],
}

describe("analytics client", () => {
  beforeEach(() => {
    resetAnalyticsForTests()
    window.sessionStorage.clear()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    resetAnalyticsForTests()
  })

  it("persists one session id for the browser session", () => {
    const first = getAnalyticsSessionId()
    const second = getAnalyticsSessionId()

    expect(first).toBe(second)
    expect(first).toMatch(/^[0-9a-f-]{36}$/)
  })

  it("queues valid feature events and flushes them in a batch", async () => {
    setAnalyticsContext({ user, role: "reviewer", route: "/role/reviewer" })

    trackEvent("review_started", {
      feature: "review",
      metadata: {
        assignment_id: 7,
        review_comment: "must not be stored",
      },
    })

    expect(getQueuedAnalyticsCount()).toBe(1)

    await flushAnalytics()

    expect(fetch).toHaveBeenCalledWith(
      "/api/backend/api/v1/analytics/events",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    )
    const body = JSON.parse((fetch as any).mock.calls[0][1].body)
    expect(body.events).toHaveLength(1)
    expect(body.events[0]).toMatchObject({
      event_name: "review_started",
      event_type: "feature",
      route: "/role/reviewer",
      role: "reviewer",
      feature: "review",
    })
    expect(body.events[0].metadata).toEqual({ assignment_id: 7 })
    expect(getQueuedAnalyticsCount()).toBe(0)
  })

  it("creates consistent flow ids for flow steps", async () => {
    setAnalyticsContext({ user, role: "chair", route: "/role/chair" })

    trackFlowStep("chair_assignment", "chair_dashboard_opened", 1)
    trackFlowStep("chair_assignment", "reviewer_suggestions_opened", 3)

    await flushAnalytics()

    const body = JSON.parse((fetch as any).mock.calls[0][1].body)
    expect(body.events[0].flow_id).toBe(body.events[1].flow_id)
    expect(body.events[0]).toMatchObject({
      event_type: "flow_step",
      flow_name: "chair_assignment",
      step_name: "chair_dashboard_opened",
      step_index: 1,
    })
  })

  it("does not throw or clear events when flush fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failed")))
    setAnalyticsContext({ user, role: "author", route: "/role/author" })

    trackEvent("submission_created", { feature: "submission" })
    await expect(flushAnalytics()).resolves.toBeUndefined()

    expect(getQueuedAnalyticsCount()).toBe(1)
  })
})
