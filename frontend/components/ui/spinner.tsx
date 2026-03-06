"use client"

import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/translation-context"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const { t } = useTranslation()
  return (
    <Loader2Icon
      role="status"
      aria-label={t("runtime.components.ui.spinner.aria_label_loading")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
