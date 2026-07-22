import { useCallback } from "react"
import { formatLocalizedDate } from "@/lib/format-localized-date"
import { useTranslation } from "@/lib/i18n/translation-context"

export function useLocalizedDate() {
  const { locale } = useTranslation()

  return useCallback(
    (value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) =>
      formatLocalizedDate(value, locale, options),
    [locale],
  )
}
