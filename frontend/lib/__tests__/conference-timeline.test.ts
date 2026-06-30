import { describe, expect, it } from "vitest"

import type { ImportantDate } from "@/lib/api/conferences"
import { getNextMajorDeadline } from "@/lib/conference-timeline"

const now = new Date("2026-06-02T12:00:00.000Z")

function date(
  id: string,
  title: string,
  iso: string,
  isPast: boolean,
): ImportantDate {
  return {
    id,
    title,
    date: iso,
    description: "",
    type: "deadline",
    isPast,
  }
}

describe("getNextMajorDeadline", () => {
  it("skips conference logistics and picks the next submission or review milestone", () => {
    const dates: ImportantDate[] = [
      date("submission-deadline", "Paper Submission Deadline", "2026-06-02T00:00:00.000Z", true),
      date("conference-end-date", "Conference End Date", "2026-06-16T00:00:00.000Z", false),
      date(
        "notification-date",
        "Notification of Acceptance",
        "2026-07-03T00:00:00.000Z",
        false,
      ),
      date("camera-ready-deadline", "Camera-Ready Deadline", "2026-06-29T00:00:00.000Z", false),
    ]

    expect(getNextMajorDeadline(dates, now)?.id).toBe("notification-date")
  })
})
