import type { ImportantDate } from "../types"

interface DeadlineCountdownProps {
  nextDeadline: ImportantDate
  daysUntil: number
}

export function DeadlineCountdown({ nextDeadline, daysUntil }: DeadlineCountdownProps) {
  return (
    <div className="bg-navy-900 dark:bg-slate-800 text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">
        Next Major Deadline
      </h3>
      <div className="text-4xl font-bold mb-1">
        {daysUntil} <span className="text-lg font-normal text-slate-400">days</span>
      </div>
      <p className="text-lg font-medium text-white mb-6">Until {nextDeadline.title}</p>
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-slate-300">Target Date</span>
          <span className="font-mono">
            {new Date(nextDeadline.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-300">Timezone</span>
          <span className="font-mono">AoE (UTC-12)</span>
        </div>
      </div>
    </div>
  )
}

export function HelpSection() {
  return (
    <div className="bg-white/80 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <h3 className="font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-slate-400">help</span>
        Need Help?
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Check the conference website or contact the program chairs if you have questions about
        deadlines.
      </p>
      <a
        className="text-sm font-bold text-navy-900 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
        href="#"
      >
        Contact Support <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </a>
    </div>
  )
}
