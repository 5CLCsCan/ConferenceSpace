"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"

import { useChatbot } from "./chatbot-provider"
import { useTranslation } from "@/lib/i18n/translation-context"

const MASK_TIMEOUT_MS = 8000

export function ChatbotNavigationMask() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { navigationMask, clearNavigationMask } = useChatbot()

  const currentPath = React.useMemo(() => {
    const query = searchParams.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  React.useEffect(() => {
    if (!navigationMask) {
      return
    }

    if (currentPath === navigationMask.targetPath) {
      clearNavigationMask()
    }
  }, [clearNavigationMask, currentPath, navigationMask])

  React.useEffect(() => {
    if (!navigationMask) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      clearNavigationMask()
    }, MASK_TIMEOUT_MS)

    return () => window.clearTimeout(timeoutId)
  }, [clearNavigationMask, navigationMask])

  if (!navigationMask) {
    return null
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/78 backdrop-blur-[3px]">
      <div className="flex min-w-[260px] max-w-[420px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl shadow-slate-200/70">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B3C53]/[0.08] text-[#1B3C53]">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-tight text-slate-800">
            {t("runtime.components.chatbot.chatbot-navigation-mask.text_navigating_to")}{" "}{navigationMask.destinationLabel}...
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            {t("runtime.components.chatbot.chatbot-navigation-mask.text_preparing_the_next_screen")}{" "}</p>
        </div>
      </div>
    </div>
  )
}
