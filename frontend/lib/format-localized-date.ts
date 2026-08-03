import { getDateLocale } from "@/lib/important-date-i18n"

export function formatLocalizedDate(
  value: string | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "2-digit",
    year: "numeric",
  },
): string {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString(getDateLocale(locale), options)
}
