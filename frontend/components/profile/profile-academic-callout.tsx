import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function AcademicStateCallout({
  tone = "neutral",
  icon,
  title,
  description,
  action,
}: {
  tone?: "neutral" | "info" | "danger"
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  const toneClass =
    tone === "info"
      ? "border-blue-200 bg-blue-50 text-blue-900"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-slate-200 bg-slate-50 text-slate-900"

  return (
    <div className={cn("rounded-xl border px-4 py-3", toneClass)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="text-current">{icon}</div>
          <div>
            <p className="text-xs font-bold text-current">{title}</p>
            <p className="text-[11px] leading-relaxed opacity-80 mt-0.5">{description}</p>
          </div>
        </div>
        {action}
      </div>
    </div>
  )
}
