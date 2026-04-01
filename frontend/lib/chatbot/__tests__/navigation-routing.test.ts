import { describe, expect, it } from "vitest"

import { buildNavigationPath, resolveCurrentNavigation } from "@/lib/chatbot/navigation-routing"

describe("resolveCurrentNavigation", () => {
  it("matches dynamic path segments to the correct destination id", () => {
    const resolved = resolveCurrentNavigation({
      pathname: "/role/chair/conferences/123/submissions/456",
      searchParams: new URLSearchParams("tab=review&ignored=yes"),
    })

    expect(resolved).toMatchObject({
      destinationId: "chair.submission.detail",
      matchStatus: "matched",
      params: {
        conferenceId: "123",
        submissionId: "456",
        tab: "review",
      },
    })
    expect(resolved.params).not.toHaveProperty("ignored")
  })

  it("matches mixed path and query destinations", () => {
    const resolved = resolveCurrentNavigation({
      pathname: "/role/reviewer/assignments/assign-1",
      searchParams: new URLSearchParams("conferenceId=conf-9&tab=discussion"),
    })

    expect(resolved).toMatchObject({
      destinationId: "reviewer.assignment.detail",
      matchStatus: "matched",
      params: {
        assignmentId: "assign-1",
        conferenceId: "conf-9",
        tab: "discussion",
      },
    })
  })

  it("returns unmapped when the pathname is outside the sitemap", () => {
    const resolved = resolveCurrentNavigation({
      pathname: "/dashboard",
      searchParams: new URLSearchParams(),
    })

    expect(resolved).toEqual({
      destinationId: null,
      matchStatus: "unmapped",
      params: {},
    })
  })
})

describe("buildNavigationPath", () => {
  it("builds a path from required params and declared query params", () => {
    expect(
      buildNavigationPath("author.submission.new", {
        conferenceId: "conf-1",
      }),
    ).toBe("/role/author/submissions/new?conferenceId=conf-1")
  })

  it("throws when required params are missing", () => {
    expect(() => buildNavigationPath("profile.detail", {})).toThrow(
      /Missing required params for profile\.detail: user_id/,
    )
  })
})
