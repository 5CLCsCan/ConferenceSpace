/**
 * ICS Calendar file generation utility
 * Generates .ics files that can be imported into Google Calendar, Apple Calendar, Outlook, etc.
 */

import type { ImportantDate } from "@/lib/api/conferences"

function formatICSDate(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  const hours = String(d.getUTCHours()).padStart(2, "0")
  const minutes = String(d.getUTCMinutes()).padStart(2, "0")
  const seconds = String(d.getUTCSeconds()).padStart(2, "0")
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

function generateUID(id: string, conferenceAcronym: string): string {
  return `${id}-${conferenceAcronym}@conferencespace`
}

/**
 * Generate an ICS calendar string from conference important dates
 */
export function generateICS(
  dates: ImportantDate[],
  conferenceAcronym: string,
  conferenceName: string,
): string {
  const now = formatICSDate(new Date().toISOString())

  const events = dates.map((date) => {
    const dtStart = formatICSDate(date.date)
    // For deadlines, make the event 1 hour; for events, make it all-day
    const endDate = new Date(date.date)
    if (date.type === "event") {
      endDate.setDate(endDate.getDate() + 1)
    } else {
      endDate.setHours(endDate.getHours() + 1)
    }
    const dtEnd = formatICSDate(endDate.toISOString())

    // Add alarm for deadlines (1 day before)
    const alarm =
      date.type === "deadline"
        ? [
            "BEGIN:VALARM",
            "TRIGGER:-P1D",
            "ACTION:DISPLAY",
            `DESCRIPTION:Reminder: ${escapeICSText(date.title)} - ${escapeICSText(conferenceName)}`,
            "END:VALARM",
          ].join("\r\n")
        : ""

    return [
      "BEGIN:VEVENT",
      `UID:${generateUID(date.id, conferenceAcronym)}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICSText(`[${conferenceAcronym}] ${date.title}`)}`,
      `DESCRIPTION:${escapeICSText(date.description || date.title)}`,
      `CATEGORIES:${date.type.toUpperCase()}`,
      alarm,
      "END:VEVENT",
    ]
      .filter(Boolean)
      .join("\r\n")
  })

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ConferenceSpace//Schedules//EN",
    `X-WR-CALNAME:${escapeICSText(conferenceName)} - Important Dates`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n")
}

/**
 * Download an ICS file in the browser
 */
export function downloadICS(
  dates: ImportantDate[],
  conferenceAcronym: string,
  conferenceName: string,
): void {
  const icsContent = generateICS(dates, conferenceAcronym, conferenceName)
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${conferenceAcronym.toLowerCase()}-dates.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download ICS for all events from multiple conferences
 */
export function downloadAllSchedulesICS(
  events: Array<{
    id: string
    title: string
    date: string
    description: string
    type: "deadline" | "notification" | "event"
    conferenceAcronym: string
  }>,
): void {
  const dates: ImportantDate[] = events.map((e) => ({
    id: e.id,
    title: `[${e.conferenceAcronym}] ${e.title}`,
    date: e.date,
    description: e.description,
    type: e.type === "notification" ? "event" : e.type,
    isPast: new Date(e.date) < new Date(),
  }))

  const icsContent = generateICS(dates, "ALL", "ConferenceSpace - All Deadlines")
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "conferencespace-schedules.ics"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
