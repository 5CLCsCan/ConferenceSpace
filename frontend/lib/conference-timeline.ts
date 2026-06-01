import type { ImportantDate } from "@/lib/api/conferences"
import { MAJOR_DEADLINE_IDS } from "@/lib/important-date-i18n"

export function getNextMajorDeadline(
  dates: ImportantDate[],
  now: Date = new Date(),
): ImportantDate | undefined {
  return dates
    .filter(
      (date) =>
        !date.isPast &&
        new Date(date.date) > now &&
        MAJOR_DEADLINE_IDS.has(date.id),
    )
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())[0]
}
