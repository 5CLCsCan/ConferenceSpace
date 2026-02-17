import type { ImportantDate } from "../types"

// Consistent icon styling for 16px material symbols
const iconStyle = {
  fontSize: "16px",
  width: "16px",
  height: "16px",
  maxWidth: "16px",
  maxHeight: "16px",
  minWidth: "16px",
  minHeight: "16px",
  lineHeight: "1",
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  flexShrink: 0,
  transform: "none",
  boxSizing: "border-box" as const,
}

interface DeadlineCountdownProps {
  nextDeadline: ImportantDate
  daysUntil: number
}

export function DeadlineCountdown({ nextDeadline, daysUntil }: DeadlineCountdownProps) {
  return (
    <div className="bg-[#1B3C53] dark:bg-slate-800 text-white rounded-lg p-4 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />

      <h3 className="text-[10px] font-medium text-slate-300 uppercase tracking-wider mb-1.5">
        Next Major Deadline
      </h3>
      <div className="text-3xl font-bold mb-0.5">
        {daysUntil} <span className="text-sm font-normal text-slate-400">days</span>
      </div>
      <p className="text-sm font-normal text-white mb-4">Until {nextDeadline.title}</p>

      <div className="space-y-2 pt-3 border-t border-white/10">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-300 font-light">Target Date</span>
          <span className="font-light">
            {new Date(nextDeadline.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-300 font-light">Timezone</span>
          <span className="font-light">AoE (UTC-12)</span>
        </div>
      </div>
    </div>
  )
}

export function HelpSection() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4">
      <h3 className="font-bold text-[#1B3C53] dark:text-white mb-2 flex items-center gap-2 text-sm tracking-tight">
        <span className="material-symbols-outlined text-slate-400" style={iconStyle}>
          help
        </span>
        Need Help?
      </h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
        Check the conference website or contact the program chairs if you have questions about
        deadlines.
      </p>
      <a
        className="text-[10px] font-bold text-[#1B3C53] dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center gap-0.5 transition-colors"
        href="#"
      >
        Contact Support
        <span className="material-symbols-outlined" style={iconStyle}>
          arrow_forward
        </span>
      </a>
    </div>
  )
}
