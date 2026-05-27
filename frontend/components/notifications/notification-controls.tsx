"use client"

import { cn } from "@/lib/utils"

interface TabButtonProps {
  label: string
  active: boolean
  onClick: () => void
  badge?: number
  badgeActiveBg?: string
}

export function TabButton({
  label,
  active,
  onClick,
  badge,
  badgeActiveBg = "bg-slate-900",
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "py-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2",
        active
          ? "text-[#1B3C53] dark:text-white border-[#1B3C53] dark:border-white"
          : "text-slate-500 dark:text-slate-400 border-transparent hover:text-[#1B3C53] dark:hover:text-slate-300 hover:border-slate-300",
      )}
    >
      {label}
      {badge !== undefined && (
        <span
          className={cn(
            "rounded px-1 text-[8px] font-normal min-w-4 h-4 inline-flex items-center justify-center mt-0 tabular-nums",
            active
              ? `${badgeActiveBg} text-white`
              : "bg-slate-100 dark:bg-neutral-800 text-slate-500",
          )}
          style={{ verticalAlign: "bottom" }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

interface FilterPillProps {
  label: string
  icon?: React.ReactNode
  active: boolean
  onClick: () => void
}

export function FilterPill({ label, icon, active, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 h-8 px-3 rounded-full text-[11px] font-medium transition-all duration-200 border",
        active
          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md"
          : "bg-white dark:bg-neutral-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700",
      )}
    >
      {icon}
      {label}
    </button>
  )
}
