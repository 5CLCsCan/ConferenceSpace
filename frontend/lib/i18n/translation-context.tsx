"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import en from "@/locales/en.json"
import vi from "@/locales/vi.json"

type Locale = "en" | "vi"

type Messages = typeof en

type DeepKey<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? DeepKey<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`
    }[keyof T & string]
  : never

type TranslationKey = DeepKey<Messages>

type TranslationValues = Record<string, string | number>

interface TranslationContextValue {
  locale: Locale
  messages: Messages
  setLocale: (locale: Locale) => void
  t: (key: string, values?: TranslationValues) => string
  tList: (key: string) => string[]
}

const LOCALE_STORAGE_KEY = "conference_locale"

const locales: Record<Locale, Messages> = {
  en,
  vi,
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined)

function resolveMessage(path: string, messages: Messages, values?: TranslationValues): string {
  const segments = path.split(".")
  let current: any = messages

  for (const segment of segments) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment]
    } else {
      return path
    }
  }

  let result = typeof current === "string" ? current : path

  if (values) {
    result = Object.entries(values).reduce((text, [key, value]) => {
      return text.replaceAll(`{${key}}`, String(value))
    }, result)
  }

  return result
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi")

  useEffect(() => {
    const storedLocale = (localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null) ?? "vi"
    setLocaleState(storedLocale)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale)
  }

  const messages = useMemo(() => locales[locale] ?? locales.vi, [locale])

  const translate = useCallback(
    (key: string, values?: TranslationValues) => resolveMessage(key, messages, values),
    [messages],
  )

  const translateList = useCallback(
    (key: string) => {
      const segments = key.split(".")
      let current: any = messages

      for (const segment of segments) {
        if (current && typeof current === "object" && segment in current) {
          current = current[segment]
        } else {
          return []
        }
      }

      if (Array.isArray(current)) {
        return current.map((item) => String(item))
      }

      return []
    },
    [messages],
  )

  const value = useMemo<TranslationContextValue>(
    () => ({
      locale,
      messages,
      setLocale,
      t: translate,
      tList: translateList,
    }),
    [locale, messages, translate, translateList],
  )

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}
