import { describe, expect, it, vi, beforeEach } from "vitest"
import { generateICS, downloadICS } from "@/lib/utils/ics-calendar"
import type { ImportantDate } from "@/lib/api/conferences"

const MOCK_DATES: ImportantDate[] = [
  {
    id: "abstract-deadline",
    title: "Abstract Submission Deadline",
    date: "2026-06-15T23:59:00.000Z",
    description: "Deadline for abstract submissions",
    type: "deadline",
    isPast: false,
  },
  {
    id: "conf-start",
    title: "Conference Start Date",
    date: "2026-09-10T09:00:00.000Z",
    description: "Main conference event begins",
    type: "event",
    isPast: false,
  },
  {
    id: "paper-deadline",
    title: "Paper Submission Deadline",
    date: "2026-07-01T23:59:00.000Z",
    description: "Full paper submission deadline",
    type: "deadline",
    isPast: false,
  },
]

describe("ICS Calendar Utility", () => {
  describe("generateICS", () => {
    it("generates a valid ICS calendar string", () => {
      const result = generateICS(MOCK_DATES, "AAAI", "AAAI Conference 2026")

      expect(result).toContain("BEGIN:VCALENDAR")
      expect(result).toContain("END:VCALENDAR")
      expect(result).toContain("VERSION:2.0")
      expect(result).toContain("PRODID:-//ConferenceSpace//Schedules//EN")
      expect(result).toContain("METHOD:PUBLISH")
    })

    it("includes events for each date", () => {
      const result = generateICS(MOCK_DATES, "AAAI", "AAAI Conference 2026")

      expect(result).toContain("BEGIN:VEVENT")
      expect(result).toContain("END:VEVENT")
      // Should have 3 events
      const eventCount = (result.match(/BEGIN:VEVENT/g) || []).length
      expect(eventCount).toBe(3)
    })

    it("includes conference acronym in event summaries", () => {
      const result = generateICS(MOCK_DATES, "AAAI", "AAAI Conference 2026")

      expect(result).toContain("[AAAI] Abstract Submission Deadline")
      expect(result).toContain("[AAAI] Conference Start Date")
      expect(result).toContain("[AAAI] Paper Submission Deadline")
    })

    it("includes VALARM for deadline events", () => {
      const result = generateICS(MOCK_DATES, "AAAI", "AAAI Conference 2026")

      expect(result).toContain("BEGIN:VALARM")
      expect(result).toContain("TRIGGER:-P1D")
      expect(result).toContain("END:VALARM")
    })

    it("sets calendar name in X-WR-CALNAME", () => {
      const result = generateICS(MOCK_DATES, "AAAI", "AAAI Conference 2026")

      expect(result).toContain("X-WR-CALNAME:AAAI Conference 2026 - Important Dates")
    })

    it("generates UIDs with conference acronym", () => {
      const result = generateICS(MOCK_DATES, "AAAI", "AAAI Conference 2026")

      expect(result).toContain("@conferencespace")
      expect(result).toContain("AAAI")
    })

    it("includes DTSTART and DTEND for each event", () => {
      const result = generateICS(MOCK_DATES, "AAAI", "AAAI Conference 2026")

      const dtStartCount = (result.match(/DTSTART:/g) || []).length
      const dtEndCount = (result.match(/DTEND:/g) || []).length
      expect(dtStartCount).toBe(3)
      expect(dtEndCount).toBe(3)
    })

    it("handles empty dates array", () => {
      const result = generateICS([], "AAAI", "AAAI Conference 2026")

      expect(result).toContain("BEGIN:VCALENDAR")
      expect(result).toContain("END:VCALENDAR")
      expect(result).not.toContain("BEGIN:VEVENT")
    })

    it("escapes special characters in text", () => {
      const dates: ImportantDate[] = [
        {
          id: "test",
          title: "Test; with, special\\chars",
          date: "2026-06-15T23:59:00.000Z",
          description: "Description with; semicolons, commas",
          type: "deadline",
          isPast: false,
        },
      ]

      const result = generateICS(dates, "TEST", "Test Conference")
      expect(result).toContain("\\;")
      expect(result).toContain("\\,")
    })

    it("includes CATEGORIES for event type", () => {
      const result = generateICS(MOCK_DATES, "AAAI", "AAAI Conference 2026")

      expect(result).toContain("CATEGORIES:DEADLINE")
      expect(result).toContain("CATEGORIES:EVENT")
    })
  })

  describe("downloadICS", () => {
    beforeEach(() => {
      // Mock DOM APIs
      vi.spyOn(document, "createElement").mockReturnValue({
        href: "",
        download: "",
        click: vi.fn(),
      } as unknown as HTMLAnchorElement)
      vi.spyOn(document.body, "appendChild").mockImplementation((node) => node)
      vi.spyOn(document.body, "removeChild").mockImplementation((node) => node)
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-url")
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
    })

    it("creates and triggers a download link", () => {
      downloadICS(MOCK_DATES, "AAAI", "AAAI Conference")

      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(document.createElement).toHaveBeenCalledWith("a")
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url")
    })

    it("uses conference acronym in filename", () => {
      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      } as unknown as HTMLAnchorElement

      vi.spyOn(document, "createElement").mockReturnValue(mockLink)

      downloadICS(MOCK_DATES, "AAAI", "AAAI Conference")

      expect(mockLink.download).toBe("aaai-dates.ics")
    })
  })
})
