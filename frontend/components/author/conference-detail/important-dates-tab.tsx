import { cn } from "@/lib/utils"
import type { DatesTabProps, ImportantDate } from "./types"
import { DeadlineCountdown, HelpSection } from "./components/deadline-countdown"

const categories = [
  {
    id: "submission",
    title: "Submission Phase",
    pattern: /submission|abstract|paper/i,
    icon: "upload_file",
  },
  {
    id: "review",
    title: "Review & Decision",
    pattern: /review|notification|rebuttal|acceptance/i,
    icon: "assignment_late",
  },
  {
    id: "event",
    title: "Camera Ready & Conference",
    pattern: /camera|registration|conference/i,
    icon: "event_available",
  },
]

export function ImportantDatesTab({ dates }: DatesTabProps) {
  const now = new Date()

  const groupedDates = categories.map((cat) => ({
    ...cat,
    items: dates.filter((d) => cat.pattern.test(d.title)),
  }))

  const nextDeadline = dates.find((d) => new Date(d.date) > now)
  const daysUntil = nextDeadline
    ? Math.ceil((new Date(nextDeadline.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 dark:text-white">Conference Timeline</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Keep track of important deadlines for your submissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">calendar_add_on</span>
            Sync to Calendar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        <div className="lg:col-span-8 space-y-12">
          {groupedDates.map((group) => {
            if (group.items.length === 0) return null
            const allPast = group.items.every((i) => i.isPast)
            const inProgress =
              group.items.some((i) => !i.isPast) && group.items.some((i) => i.isPast)

            return (
              <div
                key={group.id}
                className={cn(
                  "relative pl-8 border-l-2",
                  allPast
                    ? "border-slate-200 dark:border-slate-800"
                    : "border-navy-900 dark:border-white",
                  group.id === "event" && "border-dashed",
                )}
              >
                <span
                  className={cn(
                    "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900",
                    allPast
                      ? "bg-slate-300 dark:bg-slate-600"
                      : "bg-navy-900 dark:bg-white ring-4 ring-blue-50 dark:ring-slate-700",
                  )}
                ></span>

                <div className="mb-6">
                  <h3
                    className={cn(
                      "text-lg font-bold",
                      allPast
                        ? "text-slate-400 dark:text-slate-500"
                        : "text-navy-900 dark:text-white",
                    )}
                  >
                    {group.title}
                  </h3>
                  <p
                    className={cn(
                      "text-xs uppercase tracking-wider font-bold mt-1",
                      allPast
                        ? "text-slate-400 dark:text-slate-600"
                        : "text-blue-600 dark:text-blue-400",
                    )}
                  >
                    {allPast ? "Completed" : inProgress ? "In Progress" : "Upcoming"}
                  </p>
                </div>

                <div className="space-y-4">
                  {group.items.map((date) => (
                    <DateCard key={date.id} date={date} isNext={nextDeadline?.id === date.id} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {nextDeadline && daysUntil !== null && (
            <DeadlineCountdown nextDeadline={nextDeadline} daysUntil={daysUntil} />
          )}
          <HelpSection />
        </div>
      </div>
    </div>
  )
}

function DateCard({ date, isNext }: { date: ImportantDate; isNext: boolean }) {
  const d = new Date(date.date)
  const month = d.toLocaleString("en-US", { month: "short" })
  const day = d.getDate()

  return (
    <div
      className={cn(
        "bg-white/80 dark:bg-slate-900 border rounded-xl p-4 flex items-start gap-4 transition-all",
        date.isPast
          ? "border-slate-200 dark:border-slate-800 opacity-60"
          : isNext
            ? "border-navy-900/20 dark:border-slate-700 shadow-md relative overflow-hidden"
            : "border-slate-200 dark:border-slate-800",
      )}
    >
      {isNext && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 dark:from-slate-800 to-transparent -mr-10 -mt-10 rounded-full pointer-events-none"></div>
      )}

      <div
        className={cn(
          "rounded-lg w-14 h-14 flex flex-col items-center justify-center shrink-0 shadow-sm",
          isNext ? "bg-navy-900 dark:bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800",
        )}
      >
        <span
          className={cn(
            "text-[10px] uppercase font-bold",
            isNext ? "opacity-80" : "text-slate-500",
          )}
        >
          {month}
        </span>
        <span
          className={cn(
            "text-lg font-bold",
            isNext ? "text-white" : "text-slate-700 dark:text-slate-300",
          )}
        >
          {day}
        </span>
      </div>

      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={cn(
              "font-bold",
              isNext
                ? "text-base text-navy-900 dark:text-white"
                : "text-sm text-navy-900 dark:text-white",
            )}
          >
            {date.title}
          </h4>
          {isNext && <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{date.description}</p>
      </div>

      <div className="text-right flex flex-col items-end gap-2 shrink-0 z-10">
        <span
          className={cn(
            "inline-block px-2.5 py-1 text-[10px] font-bold rounded-full border",
            date.isPast
              ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent"
              : isNext
                ? "bg-blue-50 dark:bg-blue-900/30 text-navy-900 dark:text-blue-200 border-blue-100 dark:border-blue-900/50"
                : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100",
          )}
        >
          {date.isPast ? "PASSED" : isNext ? "UPCOMING" : "OPEN"}
        </span>
        {!date.isPast && (
          <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            <span className="material-symbols-outlined text-[12px] mr-1">schedule</span>
            23:59 AoE
          </div>
        )}
      </div>
    </div>
  )
}
