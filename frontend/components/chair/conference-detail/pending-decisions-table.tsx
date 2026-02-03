"use client"

import { cn } from "@/lib/utils"
import type { PendingDecision } from "./types"

interface PendingDecisionsTableProps {
  decisions?: PendingDecision[]
  onViewAll?: () => void
  onDecide?: (id: string) => void
  className?: string
}

// Default mock data
const DEFAULT_DECISIONS: PendingDecision[] = [
  {
    id: "#1024",
    title: "Deep Learning for Autonomous Navigation in...",
    score: 4.8,
    status: "Reviews Done",
    scoreVariant: "high",
  },
  {
    id: "#1056",
    title: "Generative Adversarial Networks for Image...",
    score: 3.2,
    status: "Borderline",
    scoreVariant: "medium",
  },
  {
    id: "#1089",
    title: "Reinforcement Learning in Robotics: A Survey",
    score: 1.5,
    status: "Low Confidence",
    scoreVariant: "low",
  },
]

const scoreVariantStyles = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  low: "bg-red-50 text-red-700 border-red-100",
}

export function PendingDecisionsTable({
  decisions = DEFAULT_DECISIONS,
  onViewAll,
  onDecide,
  className,
}: PendingDecisionsTableProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-800/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 text-slate-500 rounded-md">
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              gavel
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Pending Decisions
          </h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-[10px] text-[#1B3C53] dark:text-sky-400 font-bold hover:underline uppercase tracking-wider"
        >
          View All Submissions
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-[9px] uppercase text-slate-400 font-bold tracking-widest">
            <tr>
              <th className="px-4 py-2.5">ID</th>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Score</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {decisions.map((decision) => (
              <tr
                key={decision.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{decision.id}</td>
                <td className="px-4 py-3 font-medium text-[#1B3C53] dark:text-white max-w-xs truncate text-[12px]">
                  {decision.title}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border",
                      scoreVariantStyles[decision.scoreVariant],
                    )}
                  >
                    {decision.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-[11px]">{decision.status}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDecide?.(decision.id)}
                    className="text-slate-500 hover:text-[#1B3C53] font-medium text-[10px] uppercase tracking-wider"
                  >
                    Decide
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
