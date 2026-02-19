"use client"

import { useMemo } from "react"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { useTranslation } from "@/lib/i18n/translation-context"

const languageOptions: Array<{
  value: "vi" | "en"
  labelKey: "common.messages.languages.vietnamese" | "common.messages.languages.english"
  emoji: string
}> = [
  { value: "vi", labelKey: "common.messages.languages.vietnamese", emoji: "🇻🇳" },
  { value: "en", labelKey: "common.messages.languages.english", emoji: "🇺🇸" },
]

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation()

  const currentOption = useMemo(() => {
    return languageOptions.find((item) => item.value === locale) ?? languageOptions[0]
  }, [locale])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="bg-transparent hover:bg-accent flex items-center gap-2 text-foreground"
        >
          <span aria-hidden="true">{currentOption.emoji}</span>
          <span>{t(currentOption.labelKey)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-card border border-border text-foreground min-w-[180px] shadow-lg"
      >
        {languageOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
            onClick={() => setLocale(option.value)}
          >
            <span aria-hidden="true" className="mr-2">
              {option.emoji}
            </span>
            {t(option.labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
