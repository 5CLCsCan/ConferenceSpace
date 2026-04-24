import { beforeEach, describe, expect, it } from "vitest"

import {
  getRecentConferences,
  recordRecentConference,
  type RecentConferenceRecord,
} from "./recent-conferences"

const conference = (overrides: Partial<RecentConferenceRecord> = {}): RecentConferenceRecord => ({
  id: "1",
  name: "International Conference on Testing",
  acronym: "ICT",
  year: 2026,
  role: "chair",
  href: "/role/chair/conferences/1",
  viewedAt: "2026-04-24T17:00:00.000Z",
  ...overrides,
})

describe("recent conference storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("records conferences per user and role with newest first", () => {
    recordRecentConference({
      userKey: "user@example.com",
      role: "chair",
      conference: conference({ id: "1", name: "First", viewedAt: "2026-04-24T17:00:00.000Z" }),
    })
    recordRecentConference({
      userKey: "user@example.com",
      role: "chair",
      conference: conference({ id: "2", name: "Second", viewedAt: "2026-04-24T18:00:00.000Z" }),
    })

    expect(getRecentConferences({ userKey: "user@example.com", role: "chair" })).toMatchObject([
      { id: "2", name: "Second" },
      { id: "1", name: "First" },
    ])
    expect(getRecentConferences({ userKey: "user@example.com", role: "author" })).toEqual([])
  })

  it("deduplicates by conference id and keeps at most five entries", () => {
    for (let index = 1; index <= 6; index += 1) {
      recordRecentConference({
        userKey: "user@example.com",
        role: "chair",
        conference: conference({
          id: String(index),
          name: `Conference ${index}`,
          viewedAt: `2026-04-24T17:0${index}:00.000Z`,
        }),
      })
    }

    recordRecentConference({
      userKey: "user@example.com",
      role: "chair",
      conference: conference({
        id: "3",
        name: "Conference 3 Updated",
        viewedAt: "2026-04-24T18:00:00.000Z",
      }),
    })

    const recent = getRecentConferences({ userKey: "user@example.com", role: "chair" })

    expect(recent).toHaveLength(5)
    expect(recent[0]).toMatchObject({ id: "3", name: "Conference 3 Updated" })
    expect(recent.map((item) => item.id)).toEqual(["3", "6", "5", "4", "2"])
  })

  it("ignores malformed stored data instead of throwing", () => {
    window.localStorage.setItem("recent-conferences:user@example.com:chair", "{not json")

    expect(getRecentConferences({ userKey: "user@example.com", role: "chair" })).toEqual([])
  })
})
