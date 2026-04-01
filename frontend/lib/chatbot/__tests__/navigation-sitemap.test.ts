import { describe, expect, it } from "vitest"

import {
  CHATBOT_NAVIGATION_SITEMAP,
  CHATBOT_NAVIGATION_DESTINATIONS,
  getNavigationDestination,
} from "@/lib/chatbot/navigation-sitemap"

describe("CHATBOT_NAVIGATION_SITEMAP", () => {
  it("contains the approved authenticated destination ids", () => {
    expect(CHATBOT_NAVIGATION_SITEMAP.destinations.map((destination) => destination.id)).toEqual(
      expect.arrayContaining([
        "role.select",
        "notifications.index",
        "profile.detail",
        "author.dashboard",
        "author.conference.detail",
        "author.submissions.index",
        "author.submission.new",
        "author.submission.detail",
        "author.submission.edit",
        "author.schedules.index",
        "reviewer.dashboard",
        "reviewer.conferences.index",
        "reviewer.conference.submissions",
        "reviewer.assignment.detail",
        "reviewer.invitations.index",
        "reviewer.completed.index",
        "reviewer.schedules.index",
        "chair.dashboard",
        "chair.conferences.index",
        "chair.conference.new",
        "chair.conference.detail",
        "chair.conference.edit",
        "chair.conference.submissions",
        "chair.submission.detail",
        "chair.schedules.index",
        "chair.template.new",
      ]),
    )
  })

  it("describes dynamic destinations with stable metadata", () => {
    expect(getNavigationDestination("chair.submission.detail")).toMatchObject({
      id: "chair.submission.detail",
      label: "Chair Submission Detail",
      roleScope: "chair",
      pathTemplate: "/role/chair/conferences/:conferenceId/submissions/:submissionId",
      requiredParams: ["conferenceId", "submissionId"],
      optionalParams: ["tab"],
      kind: "detail",
    })
  })

  it("declares optional query params for mixed path and query routes", () => {
    expect(getNavigationDestination("reviewer.assignment.detail")).toMatchObject({
      requiredParams: ["assignmentId"],
      optionalParams: ["conferenceId", "tab"],
      paramLocations: {
        assignmentId: "path",
        conferenceId: "query",
        tab: "query",
      },
    })
  })

  it("does not include destinations for non-existent pages", () => {
    expect(CHATBOT_NAVIGATION_DESTINATIONS).not.toHaveProperty("chair.templates.index")
  })
})
