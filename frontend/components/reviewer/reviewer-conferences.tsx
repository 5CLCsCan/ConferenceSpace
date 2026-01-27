"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { Loader2 } from "lucide-react"
import type { ReviewerConference } from "@/lib/types"

type TabType = "my-conferences" | "explore"

interface ReviewerConferencesProps {
  conferences: ReviewerConference[]
  exploreConferences?: ReviewerConference[]
  onSelectConference: (conferenceId: number) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

// Status badge configuration
function getStatusBadge(status: string) {
  switch (status) {
    case "open":
    case "active":
      return {
        label: "Active",
        className: "bg-green-50 text-green-700 border-green-100",
      }
    case "reviewing":
      return {
        label: "Reviewing",
        className: "bg-blue-50 text-blue-700 border-blue-100",
      }
    case "completed":
      return {
        label: "Archived",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      }
    case "closed":
      return {
        label: "Legacy",
        className: "bg-slate-100 text-slate-500 border-slate-200",
      }
    default:
      return {
        label: status || "Active",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      }
  }
}

// My Conferences Card
function MyConferenceCard({
  conference,
  onSelect,
}: {
  conference: ReviewerConference
  onSelect: () => void
}) {
  const statusBadge = getStatusBadge(conference.status)
  const reviewed = conference.reviewed_papers || 0
  const total = conference.total_papers || 0
  const pending = total - reviewed
  const isCompleted = pending === 0 && reviewed > 0
  const isArchived = conference.status === "completed" || conference.status === "closed"

  // Calculate due info (mock - would come from API)
  const getDueInfo = () => {
    if (isCompleted || isArchived) {
      return { type: "completed" as const, text: "Completed" }
    }
    if (pending > 0) {
      return { type: "urgent" as const, text: "Due in 2 days" }
    }
    return { type: "normal" as const, text: "Due Nov 15" }
  }

  const dueInfo = getDueInfo()

  return (
    <div
      className={`group flex flex-col xl:flex-row xl:items-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#1B3C53]/30 transition-all duration-200 gap-6 ${isArchived ? "opacity-75 hover:opacity-100" : ""}`}
    >
      {/* Conference Info */}
      <div className="flex flex-col xl:w-[30%] min-w-[240px]">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-bold text-lg text-[#141414] truncate">
            {conference.acronym || conference.name}
          </h3>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        </div>
        <p className="text-sm text-slate-500 truncate">{conference.name}</p>
      </div>

      {/* Stats Section */}
      <div className="flex flex-row items-center justify-between gap-4 xl:gap-12 xl:w-[40%] xl:justify-center border-t border-b xl:border-0 border-slate-100 py-4 xl:py-0">
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold text-[#141414]">{total}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Assigned
          </span>
        </div>
        <div className="hidden xl:block w-px h-8 bg-slate-200" />
        <div className="flex flex-col items-center">
          <span
            className={`text-xl font-bold ${pending > 0 ? "text-amber-600" : "text-slate-400"}`}
          >
            {pending}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Pending
          </span>
        </div>
        <div className="hidden xl:block w-px h-8 bg-slate-200" />
        <div className="flex flex-col items-center">
          <span
            className={`text-xl font-bold ${reviewed > 0 ? "text-green-600" : "text-slate-400"}`}
          >
            {reviewed}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Done
          </span>
        </div>
      </div>

      {/* Action Section */}
      <div className="flex items-center justify-between xl:justify-end gap-6 xl:w-[30%]">
        {dueInfo.type === "urgent" ? (
          <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-md whitespace-nowrap">
            <span className="material-symbols-outlined text-sm">timer</span>
            <span>{dueInfo.text}</span>
          </div>
        ) : dueInfo.type === "completed" ? (
          <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium px-3 py-1.5 whitespace-nowrap">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{dueInfo.text}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium px-3 py-1.5 whitespace-nowrap">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>{dueInfo.text}</span>
          </div>
        )}

        {isCompleted || isArchived ? (
          <button
            onClick={onSelect}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-transparent text-slate-500 hover:text-slate-800 text-sm font-bold transition-all whitespace-nowrap"
          >
            History
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={onSelect}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-[#1B3C53] text-sm font-bold transition-all border border-slate-200 hover:border-[#1B3C53] shadow-sm whitespace-nowrap"
          >
            View Papers
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  )
}

// Explore Conference Card (placeholder for future explore functionality)
function ExploreConferenceCard({ conference }: { conference: ReviewerConference }) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="group flex flex-col xl:flex-row xl:items-center p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#1B3C53]/30 transition-all duration-200 gap-6">
      {/* Conference Info */}
      <div className="flex items-center xl:w-[35%] min-w-[240px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-0.5">
            <h3 className="font-bold text-lg text-[#141414] truncate">
              {conference.acronym || conference.name}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide border border-blue-100">
              Upcoming
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium truncate">{conference.name}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {conference.location || "TBA"}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">group</span>
              {conference.total_papers || 0} Papers
            </span>
          </div>
        </div>
      </div>

      {/* Review Deadline + Topics */}
      <div className="flex flex-row items-center gap-8 px-6 border-l border-r border-slate-100 xl:w-[35%] xl:justify-center">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Review Deadline
          </span>
          <span className="text-sm font-semibold text-[#141414]">
            {formatDate(conference.review_deadline)}
          </span>
        </div>
        <div className="w-px h-8 bg-slate-100 hidden sm:block" />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Topics
          </span>
          <div className="flex gap-1 flex-wrap">
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
              {conference.domain || "AI"}
            </span>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center justify-between xl:justify-end gap-6 xl:w-[30%] mt-2 xl:mt-0">
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-slate-400">Call for Reviewers open</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3C53] text-white hover:bg-[#234C6A] text-sm font-bold transition-all group/btn whitespace-nowrap shadow-sm">
          Apply to Review
          <span className="material-symbols-outlined text-lg group-hover/btn:translate-x-0.5 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  )
}

export function ReviewerConferences({
  conferences,
  exploreConferences,
  onSelectConference,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  searchQuery = "",
  onSearchChange,
}: ReviewerConferencesProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("my-conferences")

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [onLoadMore, hasMore, isLoadingMore])

  return (
    <div className="flex flex-col">
      {/* Header with Title and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#141414]">Conferences</h2>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full md:w-80 group">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 group-focus-within:text-[#1B3C53] transition-colors text-[20px]">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B3C53]/20 focus:border-[#1B3C53] transition-all shadow-sm"
              placeholder="Search conferences..."
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>
      </div>

      {/* Tabs - Using #141414 (Onyx Black) for active tab per insights.md */}
      <div className="flex items-center gap-8 mb-8 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("my-conferences")}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            activeTab === "my-conferences"
              ? "font-bold text-[#141414] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#141414]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          My Conferences
        </button>
        <button
          onClick={() => setActiveTab("explore")}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            activeTab === "explore"
              ? "font-bold text-[#141414] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#141414]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Explore
        </button>
      </div>

      {/* Conference Cards */}
      <div className="flex flex-col gap-4">
        {conferences.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">No conferences found</p>
          </div>
        ) : activeTab === "my-conferences" ? (
          conferences.map((conference) => (
            <MyConferenceCard
              key={conference.id}
              conference={conference}
              onSelect={() => onSelectConference(Number(conference.id))}
            />
          ))
        ) : (
          (exploreConferences || conferences).map((conference) => (
            <ExploreConferenceCard key={conference.id} conference={conference} />
          ))
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div
            ref={loadMoreRef}
            className="py-12 flex flex-col items-center justify-center text-center"
          >
            {isLoadingMore && (
              <>
                <Loader2 className="size-8 text-slate-300 animate-spin mb-2" />
                <p className="text-sm text-slate-500">Loading more conferences...</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
