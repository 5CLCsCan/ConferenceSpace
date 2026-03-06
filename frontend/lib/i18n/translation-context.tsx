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
  vi: vi as unknown as Messages,
}

const keyAliases: Record<string, string> = {
  coi: "dashboard.coi",
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined)

function buildCandidatePaths(path: unknown): string[] {
  if (typeof path !== "string" || path.length === 0) {
    return []
  }

  const [first, ...rest] = path.split(".")
  const alias = keyAliases[first]
  if (alias) {
    const suffix = rest.length > 0 ? `.${rest.join(".")}` : ""
    return [path, `${alias}${suffix}`]
  }
  return [path]
}

function getValueFromPath(path: string, messages: Messages) {
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

function resolveMessage(path: string, messages: Messages, values?: TranslationValues): string {
  if (typeof path !== "string" || path.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Translation] Invalid key: ${String(path)}`)
    }
    return ""
  }

  for (const candidate of buildCandidatePaths(path)) {
    const resolved = getValueFromPath(candidate, messages)

    if (resolved === undefined) {
      continue
    }

    if (typeof resolved !== "string") {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[Translation] Key "${candidate}" does not point to a string value:`,
          typeof resolved,
        )
      }
      return path
    }

    let result = resolved

    if (values) {
      result = Object.entries(values).reduce((text, [key, value]) => {
        return text.replaceAll(`{${key}}`, String(value))
      }, result)
    }

    return result
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(`[Translation] Key not found: ${path}`)
  }
  return path
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
      if (typeof key !== "string" || key.length === 0) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[Translation] Invalid list key: ${String(key)}`)
        }
        return []
      }

      for (const candidate of buildCandidatePaths(key)) {
        const resolved = getValueFromPath(candidate, messages)
        if (Array.isArray(resolved)) {
          return resolved.map((item) => String(item))
        }
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
