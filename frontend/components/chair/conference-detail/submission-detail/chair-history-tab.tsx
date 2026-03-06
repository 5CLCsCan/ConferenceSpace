"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type {
  HistoryEventCategory,
  SubmissionHistoryActor,
  SubmissionHistoryEvent,
} from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

// --- Category Configuration ---
const CATEGORY_CONFIG: Record<
  HistoryEventCategory,
  { label: string; icon: string; borderColor: string; iconColor: string; bgColor: string }
> = {
  review: {
    label: t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.prop_label_review"),
    icon: "rate_review",
    borderColor: "border-l-blue-400",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  assignment: {
    label: t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.prop_label_assignment"),
    icon: "group_add",
    borderColor: "border-l-orange-400",
    iconColor: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  submission: {
    label: t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.prop_label_submission"),
    icon: "upload_file",
    borderColor: "border-l-slate-400",
    iconColor: "text-slate-500",
    bgColor: "bg-slate-100",
  },
  status: {
    label: t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.prop_label_status"),
    icon: "sync",
    borderColor: "border-l-purple-400",
    iconColor: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  decision: {
    label: t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.prop_label_decision"),
    icon: "gavel",
    borderColor: "border-l-emerald-400",
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  coi: {
    label: t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.prop_label_coi"),
    icon: "shield",
    borderColor: "border-l-rose-400",
    iconColor: "text-rose-500",
    bgColor: "bg-rose-50",
  },
  discussion: {
    label: t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.prop_label_discussion"),
    icon: "forum",
    borderColor: "border-l-cyan-400",
    iconColor: "text-cyan-500",
    bgColor: "bg-cyan-50",
  },
}

type FilterOption = "all" | HistoryEventCategory

function toInitials(name: string): string {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return "NA"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase()
}

function formatRelativeTime(value?: string): string {
  if (!value) return "-"
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return value
  const diffMs = Date.now() - timestamp.getTime()
  const diffMins = Math.floor(diffMs / (60 * 1000))
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return timestamp.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all",
        active
          ? "bg-[#1B3C53] text-white"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
      )}
    >
      {label}
      <span
        className={cn(
          "ml-1.5 px-1 py-0.5 rounded text-[8px] font-bold",
          active ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700",
        )}
      >
        {count}
      </span>
    </button>
  )
}

function ActorBadge({ actor }: { actor: SubmissionHistoryActor }) {
  const roleColors: Record<string, string> = {
    reviewer: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    chair: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    author: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    system: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  }

  const normalizedRole = actor.role.toLowerCase()
  const initials = actor.initials || toInitials(actor.name)

  return (
    <div className="flex items-center gap-1.5">
      {actor.avatar ? (
        <div
          className="w-4 h-4 rounded-full bg-cover bg-center flex-shrink-0 ring-1 ring-slate-200"
          style={{ backgroundImage: `url("${actor.avatar}")` }}
        />
      ) : (
        <div
          className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold flex-shrink-0",
            roleColors[normalizedRole] || "bg-slate-100 text-slate-600",
          )}
        >
          {initials}
        </div>
      )}
      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
        {actor.name}
      </span>
    </div>
  )
}

function EventRow({ event }: { event: SubmissionHistoryEvent }) {
  const config = CATEGORY_CONFIG[event.category]

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2.5 px-3 border-l-2 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
        config.borderColor,
      )}
    >
      <div
        className={cn(
          "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
          config.bgColor,
          "dark:bg-slate-800",
        )}
      >
        <span
          className={cn("material-symbols-outlined", config.iconColor, "dark:text-slate-400")}
          style={{ fontSize: "14px" }}
        >
          {config.icon}
        </span>
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
          {event.description}
        </span>

        {event.metadata?.score && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 whitespace-nowrap">
            {event.metadata.score}
          </span>
        )}
        {event.metadata?.fileName && (
          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[140px]">
            {event.metadata.fileName}
          </span>
        )}
      </div>

      <ActorBadge actor={event.actor} />

      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2 w-20 text-right">
        {event.relativeTime || formatRelativeTime(event.timestamp)}
      </span>
    </div>
  )
}

function SummaryStats({ events }: { events: SubmissionHistoryEvent[] }) {
  const stats = useMemo(() => {
    const counts: Record<HistoryEventCategory, number> = {
      review: 0,
      assignment: 0,
      submission: 0,
      status: 0,
      decision: 0,
      coi: 0,
      discussion: 0,
    }
    events.forEach((event) => {
      counts[event.category]++
    })
    return counts
  }, [events])

  const significantStats = Object.entries(stats)
    .filter(([, count]) => count > 0)
    .slice(0, 4)

  return (
    <div className="flex items-center gap-2">
      {significantStats.map(([category, count]) => {
        const config = CATEGORY_CONFIG[category as HistoryEventCategory]
        return (
          <div
            key={category}
            className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400"
          >
            <span
              className={cn("material-symbols-outlined", config.iconColor)}
              style={{ fontSize: "12px" }}
            >
              {config.icon}
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{count}</span>
            <span className="hidden sm:inline">{config.label.toLowerCase()}</span>
          </div>
        )
      })}
    </div>
  )
}

interface ChairHistoryTabProps {
  events: SubmissionHistoryEvent[]
  loading?: boolean
}

export function ChairHistoryTab({ events, loading = false }: ChairHistoryTabProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const orderedEvents = useMemo(() => {
    return [...events].sort((left, right) => {
      return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    })
  }, [events])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orderedEvents.length }
    orderedEvents.forEach((event) => {
      counts[event.category] = (counts[event.category] || 0) + 1
    })
    return counts
  }, [orderedEvents])

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return orderedEvents
    return orderedEvents.filter((event) => event.category === activeFilter)
  }, [orderedEvents, activeFilter])

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const filterOptions: { key: FilterOption; label: string }[] = [
    { key: "all", label: t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.prop_label_all") },
    ...(Object.keys(CATEGORY_CONFIG) as HistoryEventCategory[])
      .filter((category) => categoryCounts[category] > 0)
      .map((category) => ({ key: category, label: CATEGORY_CONFIG[category].label })),
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
              {t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.text_activity_log")}{" "}</h3>
            <SummaryStats events={orderedEvents} />
          </div>
        </div>

        {filterOptions.length > 2 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {filterOptions.map((option) => (
              <FilterPill
                key={option.key}
                label={option.label}
                count={categoryCounts[option.key] || 0}
                active={activeFilter === option.key}
                onClick={() => setActiveFilter(option.key)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">{t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.text_loading_history_events")}</p>
          </div>
        ) : paginatedEvents.length > 0 ? (
          paginatedEvents.map((event) => <EventRow key={event.id} event={event} />)
        ) : (
          <div className="px-4 py-8 text-center">
            <span
              className="material-symbols-outlined text-slate-300 dark:text-slate-600 mb-2"
              style={{ fontSize: "32px" }}
            >
              history
            </span>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.text_no_history_events_available_yet")}{" "}</p>
          </div>
        )}
      </div>

      {!loading && filteredEvents.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.text_showing")}{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">
              {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">{filteredEvents.length}</span>{" "}
            events
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.text_previous")}{" "}</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
              if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[10px]",
                      page === currentPage
                        ? "bg-[#1B3C53] text-white hover:bg-[#234C6A]"
                        : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
                    )}
                  >
                    {page}
                  </button>
                )
              }

              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-1.5 text-slate-400 dark:text-slate-500 text-[10px]">
                    ...
                  </span>
                )
              }

              return null
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("runtime.components.chair.conference-detail.submission-detail.chair-history-tab.text_next")}{" "}</button>
          </div>
        </div>
      )}
    </div>
  )
}
