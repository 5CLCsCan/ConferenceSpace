import { beforeEach, describe, expect, it } from "vitest"

import type { ImportantDate } from "@/lib/api/conferences"
import {
  localizeImportantDate,
  localizeImportantDates,
  phaseNameKey,
} from "@/lib/important-date-i18n"
import { tStatic } from "@/lib/i18n/static-translate"

function date(id: string, title: string, description: string): ImportantDate {
  return {
    id,
    title,
    date: "2099-01-10T23:59:00.000Z",
    description,
    type: "deadline",
    isPast: false,
  }
}

describe("important-date-i18n", () => {
  it("localizes known event ids using locale keys", () => {
    const original = date(
      "submission-deadline",
      "Paper Submission Deadline",
      "Final deadline for paper submissions",
    )

    const localized = localizeImportantDate(original, tStatic)

    expect(localized.title).toBe("Paper Submission Deadline")
    expect(localized.description).toBe("Final deadline for paper submissions")
  })

  it("falls back to original strings for unknown event ids", () => {
    const original = date("custom-event", "Custom Event", "Custom description")

    const localized = localizeImportantDate(original, tStatic)

    expect(localized.title).toBe("Custom Event")
    expect(localized.description).toBe("Custom description")
  })

  it("localizes all dates in a list", () => {
    const dates = [
      date("submission-deadline", "Paper Submission Deadline", "Final deadline"),
      date("custom-event", "Custom Event", "Custom description"),
    ]

    const localized = localizeImportantDates(dates, tStatic)

    expect(localized).toHaveLength(2)
    expect(localized[0].title).toBe("Paper Submission Deadline")
    expect(localized[1].title).toBe("Custom Event")
  })

  it("builds phase name keys under important-dates-tab", () => {
    expect(phaseNameKey("submission")).toBe(
      "runtime.components.author.conference-detail.important-dates-tab.phases.submission",
    )
  })
})

describe("important-date-i18n vi locale", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "vi")
  })

  it("localizes submission deadline into Vietnamese", () => {
    const original = date(
      "submission-deadline",
      "Paper Submission Deadline",
      "Final deadline for paper submissions",
    )

    const localized = localizeImportantDate(original, tStatic)

    expect(localized.title).toBe("Hạn nộp bài")
    expect(localized.description).toBe("Hạn chót cuối cùng để nộp bài báo")
  })
})
