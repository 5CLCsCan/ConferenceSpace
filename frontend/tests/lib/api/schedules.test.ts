import { describe, expect, it, vi, beforeEach } from "vitest"
import { getMyScheduleEvents } from "@/lib/api/schedules"
import type { Conference, ConferenceStatus } from "@/lib/types"

// Mock the conferences API
vi.mock("@/lib/api/conferences", () => ({
  listConferences: vi.fn(),
}))

import { listConferences } from "@/lib/api/conferences"
const mockListConferences = vi.mocked(listConferences)

const createMockConference = (overrides: Partial<Conference> = {}): Conference => ({
  id: "1",
  name: "Test Conference",
  acronym: "TC",
  year: 2026,
  description: "A test conference",
  submission_deadline: "2026-06-01",
  review_deadline: "",
  camera_ready_deadline: "2026-08-01",
  notification_date: "",
  conference_date: "2026-09-01",
  location: "Test City",
  status: "open" as ConferenceStatus,
  tracks: [],
  configurations: {
    start_date: "2026-09-01T09:00:00Z",
    end_date: "2026-09-03T18:00:00Z",
    abstract_submission_deadline: "2026-05-15T23:59:00Z",
    full_paper_submission_deadline: "2026-06-01T23:59:00Z",
    camera_ready_deadline: "2026-08-01T23:59:00Z",
  },
  ...overrides,
})

describe("Schedules API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getMyScheduleEvents", () => {
    it("returns empty arrays when no conferences", async () => {
      mockListConferences.mockResolvedValue({
        data: { conferences: [], total: 0 },
        error: null,
        status: 200,
      })

      const result = await getMyScheduleEvents("author")

      expect(result.events).toEqual([])
      expect(result.conferences).toEqual([])
      expect(result.error).toBeNull()
    })

    it("extracts events from conference configurations", async () => {
      mockListConferences.mockResolvedValue({
        data: {
          conferences: [createMockConference()],
          total: 1,
        },
        error: null,
        status: 200,
      })

      const result = await getMyScheduleEvents("author")

      expect(result.events.length).toBeGreaterThan(0)
      expect(result.error).toBeNull()

      // Should have abstract deadline, paper deadline, camera-ready, conf start, conf end
      const eventTitles = result.events.map((e) => e.title)
      expect(eventTitles).toContain("Abstract Submission Deadline")
      expect(eventTitles).toContain("Paper Submission Deadline")
      expect(eventTitles).toContain("Camera-Ready Deadline")
      expect(eventTitles).toContain("Conference Begins")
      expect(eventTitles).toContain("Conference Ends")
    })

    it("sets correct event types", async () => {
      mockListConferences.mockResolvedValue({
        data: {
          conferences: [createMockConference()],
          total: 1,
        },
        error: null,
        status: 200,
      })

      const result = await getMyScheduleEvents("author")

      const deadlines = result.events.filter((e) => e.type === "deadline")
      const events = result.events.filter((e) => e.type === "event")

      expect(deadlines.length).toBeGreaterThanOrEqual(3) // abstract, paper, camera-ready
      expect(events.length).toBeGreaterThanOrEqual(2) // start, end
    })

    it("includes conference info in each event", async () => {
      mockListConferences.mockResolvedValue({
        data: {
          conferences: [createMockConference({ acronym: "AAAI", name: "AAAI Conference" })],
          total: 1,
        },
        error: null,
        status: 200,
      })

      const result = await getMyScheduleEvents("chair")

      result.events.forEach((event) => {
        expect(event.conferenceAcronym).toBe("AAAI")
        expect(event.conference).toBe("AAAI Conference")
        expect(event.conferenceId).toBe("1")
      })
    })

    it("sorts events chronologically", async () => {
      mockListConferences.mockResolvedValue({
        data: {
          conferences: [createMockConference()],
          total: 1,
        },
        error: null,
        status: 200,
      })

      const result = await getMyScheduleEvents("author")

      for (let i = 1; i < result.events.length; i++) {
        expect(result.events[i].date.getTime()).toBeGreaterThanOrEqual(
          result.events[i - 1].date.getTime(),
        )
      }
    })

    it("handles API errors gracefully", async () => {
      mockListConferences.mockResolvedValue({
        data: null,
        error: "Network error",
        status: 500,
      })

      const result = await getMyScheduleEvents("reviewer")

      expect(result.events).toEqual([])
      expect(result.conferences).toEqual([])
      expect(result.error).toBe("Network error")
    })

    it("aggregates events from multiple conferences", async () => {
      const conf1 = createMockConference({ id: "1", acronym: "AAAI" })
      const conf2 = createMockConference({
        id: "2",
        acronym: "CVPR",
        configurations: {
          start_date: "2026-10-01T09:00:00Z",
          full_paper_submission_deadline: "2026-07-01T23:59:00Z",
        },
      })

      mockListConferences.mockResolvedValue({
        data: {
          conferences: [conf1, conf2],
          total: 2,
        },
        error: null,
        status: 200,
      })

      const result = await getMyScheduleEvents("chair")

      const aaaiEvents = result.events.filter((e) => e.conferenceAcronym === "AAAI")
      const cvprEvents = result.events.filter((e) => e.conferenceAcronym === "CVPR")

      expect(aaaiEvents.length).toBeGreaterThan(0)
      expect(cvprEvents.length).toBeGreaterThan(0)
    })

    it("returns conference timelines", async () => {
      mockListConferences.mockResolvedValue({
        data: {
          conferences: [createMockConference({ acronym: "AAAI" })],
          total: 1,
        },
        error: null,
        status: 200,
      })

      const result = await getMyScheduleEvents("chair")

      expect(result.conferences).toHaveLength(1)
      expect(result.conferences[0].acronym).toBe("AAAI")
      expect(result.conferences[0].dates.length).toBeGreaterThan(0)
    })

    it("passes the correct role filter to listConferences", async () => {
      mockListConferences.mockResolvedValue({
        data: { conferences: [], total: 0 },
        error: null,
        status: 200,
      })

      await getMyScheduleEvents("reviewer")

      expect(mockListConferences).toHaveBeenCalledWith({
        myConferences: true,
        role: "reviewer",
        limit: 100,
      })
    })

    it("handles conference with no configurations", async () => {
      const conf = createMockConference({ configurations: undefined })

      mockListConferences.mockResolvedValue({
        data: { conferences: [conf], total: 1 },
        error: null,
        status: 200,
      })

      const result = await getMyScheduleEvents("author")

      expect(result.events).toEqual([])
      expect(result.conferences).toHaveLength(1)
    })

    it("extracts rebuttal and discussion dates when available", async () => {
      const conf = createMockConference({
        configurations: {
          start_date: "2026-09-01T09:00:00Z",
          rebuttal_settings: {
            enabled: true,
            start_at: "2026-07-15T00:00:00Z",
            end_at: "2026-07-22T23:59:00Z",
          },
          discussion_settings: {
            enabled: true,
            start_at: "2026-07-10T00:00:00Z",
            end_at: "2026-07-14T23:59:00Z",
          },
        },
      })

      mockListConferences.mockResolvedValue({
        data: { conferences: [conf], total: 1 },
        error: null,
        status: 200,
      })

      const result = await getMyScheduleEvents("chair")

      const titles = result.events.map((e) => e.title)
      expect(titles).toContain("Rebuttal Period Opens")
      expect(titles).toContain("Rebuttal Submission Deadline")
      expect(titles).toContain("Discussion Period Opens")
      expect(titles).toContain("Discussion Period Closes")
    })
  })
})
