"use client"

import { cn } from "@/lib/utils"

interface ChairAction {
  id: string
  label: string
  icon: string
  onClick?: () => void
}

interface NextMilestone {
  label: string
  date: string
}

interface ChairActionsPanelProps {
  actions?: ChairAction[]
  nextMilestone?: NextMilestone
  className?: string
}

const DEFAULT_ACTIONS: ChairAction[] = [
  { id: "assign", label: "Assign Reviewers", icon: "person_add" },
  { id: "cfp", label: "Edit CFP Details", icon: "edit_note" },
  { id: "tracks", label: "Manage Tracks", icon: "alt_route" },
]

const DEFAULT_MILESTONE: NextMilestone = {
  label: "Author Notification",
  date: "Dec 10",
}

export function ChairActionsPanel({
  actions = DEFAULT_ACTIONS,
  nextMilestone = DEFAULT_MILESTONE,
  className,
}: ChairActionsPanelProps) {
  return (
    <div
      className={cn(
        "bg-[#1B3C53] text-white px-4 pt-4 pb-4 rounded-xl shadow-lg relative overflow-hidden",
        className,
      )}
    >
      {/* Decorative blur */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

      <div className="relative z-10">
        <h3 className="text-sm font-bold mb-3 tracking-tight">Chair Actions</h3>

        {/* Action Buttons */}
        <div className="space-y-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all"
            >
              <span className="text-[11px] font-medium">{action.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                {action.icon}
              </span>
            </button>
          ))}
        </div>

        {/* Next Milestone */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-[9px] text-slate-300 mb-1.5 uppercase tracking-widest font-medium">
            Next Milestone
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold">{nextMilestone.label}</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-medium">
              {nextMilestone.date}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
