"use client"

import { cn } from "@/lib/utils"
import type { ConferenceStat } from "./types"

interface DashboardStatsCardProps extends ConferenceStat {
  className?: string
}

export function DashboardStatsCard({
  label,
  value,
  icon,
  trend,
  progress,
  badge,
  subtext,
  className,
}: DashboardStatsCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow",
        className,
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</h3>
        {icon && (
          <div className="w-7 h-7 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-[#1B3C53] dark:text-slate-400 rounded-md">
            <span className="material-symbols-outlined text-base leading-none">
              {icon}
            </span>
          </div>
        )}
      </div>

      {/* Value Row */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-[#1B3C53] dark:text-white tracking-tight">
          {value}
        </span>

        {/* Progress Suffix */}
        {progress && (
          <span className="text-[11px] font-medium text-slate-400">
            / {progress.total.toLocaleString()}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="w-full bg-slate-100 rounded-full h-1 mt-2.5">
          <div
            className="bg-[#1B3C53] h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      )}

      {/* Subtext */}
      {subtext && (
        <p className="text-[10px] text-slate-400 mt-1.5">{subtext}</p>
      )}
    </div>
  )
}

// Metrics Grid Container
interface DashboardStatsGridProps {
  children: React.ReactNode
  className?: string
}

export function DashboardStatsGrid({ children, className }: DashboardStatsGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {children}
    </div>
  )
}
