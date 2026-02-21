import type { ConferenceStatus } from "./types"

interface StatusBadgeProps {
  status: ConferenceStatus
}

const styles: Record<ConferenceStatus, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  planning: "bg-blue-50 text-blue-700 border-blue-100",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  completed: "bg-slate-100 text-slate-500 border-slate-200",
}

const labels: Record<ConferenceStatus, string> = {
  active: "Active",
  planning: "Planning",
  draft: "Draft",
  completed: "Completed",
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
