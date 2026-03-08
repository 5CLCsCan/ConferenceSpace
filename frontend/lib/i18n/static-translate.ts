import en from "@/locales/en.json"
import vi from "@/locales/vi.json"

type Locale = "en" | "vi"
type TranslationValues = Record<string, string | number>

const LOCALE_STORAGE_KEY = "conference_locale"
const locales = {
  en,
  vi: vi as typeof en,
}

function getValueFromPath(path: string, messages: typeof en) {
  const segments = path.split(".")
  let current: any = messages

  for (const segment of segments) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment]
    } else {
      return undefined
    }
  }

  return current
}

function currentLocale(): Locale {
  if (typeof window === "undefined") {
    return "en"
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  return stored === "vi" || stored === "en" ? stored : "vi"
}

export function tStatic(key: string, values?: TranslationValues): string {
  const locale = currentLocale()
  const messages = locales[locale] ?? locales.en
  const resolved = getValueFromPath(key, messages)
  if (typeof resolved !== "string") {
    return key
  }

  if (!values) {
    return resolved
  }

  return Object.entries(values).reduce((text, [name, value]) => {
    return text.replaceAll(`{${name}}`, String(value))
  }, resolved)
}
