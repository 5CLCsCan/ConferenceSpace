import { describe, expect, it, vi } from "vitest"

import {
  getCurrentNavigationSnapshot,
  navigateToDestination,
} from "@/lib/chatbot/navigation-executor"

describe("getCurrentNavigationSnapshot", () => {
  it("returns current route information together with the sitemap", () => {
    const snapshot = getCurrentNavigationSnapshot({
      href: "https://app.example.com/role/chair/conferences/conf-1/submissions/sub-2?tab=review",
      pathname: "/role/chair/conferences/conf-1/submissions/sub-2",
      searchParams: new URLSearchParams("tab=review"),
    })

    expect(snapshot.url).toBe(
      "https://app.example.com/role/chair/conferences/conf-1/submissions/sub-2?tab=review",
    )
    expect(snapshot.pathname).toBe("/role/chair/conferences/conf-1/submissions/sub-2")
    expect(snapshot.destinationId).toBe("chair.submission.detail")
    expect(snapshot.params).toEqual({
      conferenceId: "conf-1",
      submissionId: "sub-2",
      tab: "review",
    })
    expect(snapshot.matchStatus).toBe("matched")
    expect(snapshot.sitemap.destinations.length).toBeGreaterThan(0)
  })
})

describe("navigateToDestination", () => {
  it("navigates to a valid destination for the current role", () => {
    const push = vi.fn()
    const result = navigateToDestination({
      currentRole: "chair",
      destinationId: "chair.conference.detail",
      params: { conferenceId: "conf-7" },
      push,
    })

    expect(push).toHaveBeenCalledWith("/role/chair/conferences/conf-7")
    expect(result).toEqual({
      success: true,
      message: "Navigated to chair.conference.detail",
      destinationId: "chair.conference.detail",
      path: "/role/chair/conferences/conf-7",
    })
  })

  it("fails for an unknown destination id", () => {
    const result = navigateToDestination({
      currentRole: "chair",
      destinationId: "unknown.destination",
      params: {},
      push: vi.fn(),
    })

    expect(result.success).toBe(false)
    expect(result.message).toMatch(/Unknown destinationId: unknown\.destination/)
  })

  it("fails when required params are missing", () => {
    const result = navigateToDestination({
      currentRole: "author",
      destinationId: "profile.detail",
      params: {},
      push: vi.fn(),
    })

    expect(result.success).toBe(false)
    expect(result.message).toMatch(/Missing required params/)
  })

  it("fails for destinations outside the current role scope", () => {
    const push = vi.fn()
    const result = navigateToDestination({
      currentRole: "reviewer",
      destinationId: "chair.conference.new",
      params: {},
      push,
    })

    expect(push).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(result.message).toMatch(/not available for the current role/i)
  })

  it("can activate a role before navigating to a role-scoped destination", () => {
    const push = vi.fn()
    const activateRole = vi.fn(() => true)
    const result = navigateToDestination({
      currentRole: null,
      destinationId: "author.dashboard",
      params: {},
      push,
      activateRole,
    })

    expect(activateRole).toHaveBeenCalledWith("author")
    expect(push).toHaveBeenCalledWith("/role/author")
    expect(result.success).toBe(true)
  })
})
