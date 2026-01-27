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
        "flex items-center gap-2 pb-1 pt-1 px-1.5 text-xs font-medium transition-all relative",
        active
          ? "text-slate-900 dark:text-white"
          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
      )}
    >
      {label}
      {badge !== undefined && (
        <span
          className={cn(
            "rounded text-[8px] font-normal w-[12px] h-[12px] inline-flex items-end justify-center mt-0",
            active
              ? `${badgeActiveBg} text-white`
              : "bg-slate-100 dark:bg-neutral-800 text-slate-500",
          )}
          style={{ verticalAlign: "bottom" }}
        >
          {badge}
        </span>
      )}
      {active && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white rounded-t-full"></div>
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
