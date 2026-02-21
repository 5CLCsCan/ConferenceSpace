"use client"

import { getUserSubmissions } from "@/lib/api/submissions"
import type { SubmissionWithConference } from "@/lib/api/submissions"
import { formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"

// -------------------------------------------------------------------------
// Status Configuration (Scholar-Compact - Neutralized Colors)
// -------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  under_review: {
    label: "Under Review",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  },
  reviewing: {
    label: "Under Review",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  },
  accepted: {
    label: "Accepted",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
  draft: {
    label: "Draft",
    className:
      "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
  published: {
    label: "Submitted",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  },
}

// -------------------------------------------------------------------------
// Status Badge (No dot indicator per sizings.md)
// -------------------------------------------------------------------------

function SubmissionStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}

// -------------------------------------------------------------------------
// Filter Tabs Component
// -------------------------------------------------------------------------

interface FilterTabsProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}

function FilterTabs({ value, onChange, options, className }: FilterTabsProps) {
  return (
    <div
      className={cn("flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
            value === option.value
              ? "bg-white dark:bg-slate-700 text-[#1B3C53] dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// -------------------------------------------------------------------------
// Main Component
// -------------------------------------------------------------------------

export function AuthorSubmissionsList() {
  const { user } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<SubmissionWithConference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [conferenceFilter, setConferenceFilter] = useState<string>("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await getUserSubmissions(user.email)

        if (response.error) {
          setError(response.error)
        } else if (response.data) {
          setSubmissions(response.data)
        } else {
          setSubmissions([])
        }
      } catch (err) {
        setError("Failed to load submissions")
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [user])

  // Get unique conferences for filter dropdown
  const uniqueConferences = useMemo(() => {
    const conferences = new Map<string, { id: string; name: string; acronym: string }>()
    submissions.forEach((sub) => {
      if (!conferences.has(sub.conference.id)) {
        conferences.set(sub.conference.id, {
          id: sub.conference.id,
          name: sub.conference.name,
          acronym: sub.conference.acronym,
        })
      }
    })
    return Array.from(conferences.values())
  }, [submissions])

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.id.toString().includes(searchQuery) ||
        sub.conference.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.conference.acronym.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || sub.status === statusFilter
      const matchesConference = conferenceFilter === "all" || sub.conference.id === conferenceFilter

      return matchesSearch && matchesStatus && matchesConference
    })
  }, [submissions, searchQuery, statusFilter, conferenceFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage)
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, conferenceFilter])

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "published", label: "Submitted" },
    { value: "reviewing", label: "Review" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Filters Row - Compact Design */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 text-slate-400"
            style={{
              fontSize: "16px",
              width: "16px",
              height: "16px",
              maxWidth: "16px",
              maxHeight: "16px",
              minWidth: "16px",
              minHeight: "16px",
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transform: "translateY(-50%)",
              boxSizing: "border-box",
            }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search papers or conferences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B3C53]/10 focus:border-[#1B3C53] dark:focus:border-white transition-all font-normal text-[#141414] dark:text-white"
          />
        </div>

        {/* Status Filter Tabs */}
        <FilterTabs
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          className="shrink-0 ml-auto"
        />

        {/* Conference Select */}
        {uniqueConferences.length > 1 && (
          <div className="relative min-w-[160px]">
            <select
              value={conferenceFilter}
              onChange={(e) => setConferenceFilter(e.target.value)}
              className="w-full h-9 pl-3 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1B3C53]/10 focus:border-[#1B3C53] text-[#141414] dark:text-white cursor-pointer font-medium"
            >
              <option value="all">All Conferences</option>
              {uniqueConferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.acronym}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[16px]">
              expand_more
            </span>
          </div>
        )}
      </div>

      {/* Submissions Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Desktop Grid Header - Expanded columns */}
        <div className="hidden lg:grid lg:grid-cols-[50px_1fr_240px_110px_160px_44px] border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            #
          </div>
          <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Submission Details
          </div>
          <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Conference
          </div>
          <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Status
          </div>
          <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Submitted
          </div>
          <div className="px-3 py-2.5" />
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="lg:grid lg:grid-cols-[50px_1fr_240px_110px_160px_44px] animate-pulse"
              >
                <div className="px-3 py-4">
                  <div className="h-4 w-6 bg-slate-100 dark:bg-slate-700 rounded" />
                </div>
                <div className="px-3 py-4">
                  <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-700 rounded mb-2" />
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded mb-1.5" />
                  <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-700 rounded" />
                </div>
                <div className="px-3 py-4">
                  <div className="h-4 w-16 bg-slate-100 dark:bg-slate-700 rounded mb-1" />
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded" />
                </div>
                <div className="px-3 py-4">
                  <div className="h-5 w-16 bg-slate-100 dark:bg-slate-700 rounded" />
                </div>
                <div className="px-3 py-4">
                  <div className="h-3 w-16 bg-slate-100 dark:bg-slate-700 rounded" />
                </div>
                <div className="px-3 py-4" />
              </div>
            ))
          ) : paginatedSubmissions.length === 0 ? (
            // Empty state
            <div className="py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-slate-600">
                  description
                </span>
                <div>
                  <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
                    No submissions found
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Submit your first paper to get started"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Submissions rows
            paginatedSubmissions.map((sub) => (
              <SubmissionRow
                key={sub.id}
                submission={sub}
                onClick={() =>
                  router.push(
                    `${ROUTES.AUTHOR.SUBMISSION_DETAIL(String(sub.id))}?conferenceId=${sub.conference_id}`,
                  )
                }
              />
            ))
          )}
        </div>

        {/* Pagination Footer */}
        {filteredSubmissions.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Showing{" "}
              <span className="font-bold text-[#1B3C53] dark:text-white">
                {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredSubmissions.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#1B3C53] dark:text-white">
                {filteredSubmissions.length}
              </span>
            </div>

            {totalPages > 1 &&
              (() => {
                const getPageNumbers = () => {
                  const pages: (number | "ellipsis")[] = []
                  const maxVisible = 5

                  if (totalPages <= maxVisible) {
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    pages.push(1)

                    if (currentPage <= 3) {
                      for (let i = 2; i <= 4; i++) {
                        pages.push(i)
                      }
                      pages.push("ellipsis")
                      pages.push(totalPages)
                    } else if (currentPage >= totalPages - 2) {
                      pages.push("ellipsis")
                      for (let i = totalPages - 3; i <= totalPages; i++) {
                        pages.push(i)
                      }
                    } else {
                      pages.push("ellipsis")
                      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                        pages.push(i)
                      }
                      pages.push("ellipsis")
                      pages.push(totalPages)
                    }
                  }

                  return pages
                }

                return (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {getPageNumbers().map((page, idx) => {
                      if (page === "ellipsis") {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-1.5 text-slate-400 text-[10px]"
                          >
                            ...
                          </span>
                        )
                      }

                      const isActive = page === currentPage
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2.5 py-1 rounded text-[10px] ${
                            isActive
                              ? "bg-[#1B3C53] text-white hover:bg-[#234C6A]"
                              : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )
              })()}
          </div>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Submission Row Component - Expanded Info
// -------------------------------------------------------------------------

interface SubmissionRowProps {
  submission: SubmissionWithConference
  onClick: () => void
}

function SubmissionRow({ submission, onClick }: SubmissionRowProps) {
  const isCompleted = submission.status === "accepted" || submission.status === "rejected"
  const trackName = submission.information?.track_name || null
  const keywords = submission.information?.keywords || []
  const coAuthors = submission.information?.co_authors || []
  const paperType = submission.information?.paper_type || null
  const hasFile = !!submission.file

  // Truncate abstract for preview
  const abstractPreview = submission.abstract
    ? submission.abstract.length > 120
      ? submission.abstract.slice(0, 120) + "..."
      : submission.abstract
    : null

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-700/50",
        isCompleted && "opacity-70 hover:opacity-100",
      )}
    >
      {/* Desktop Layout - Expanded */}
      <div className="hidden lg:grid lg:grid-cols-[50px_1fr_240px_110px_160px_44px] items-start min-h-[72px]">
        {/* ID */}
        <div className="px-3 py-3.5">
          <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500">
            #{submission.id}
          </span>
        </div>

        {/* Submission Details: Title, Abstract, Keywords, Co-authors, Paper Type */}
        <div className="px-3 py-3.5">
          {/* Title Row */}
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={cn(
                "text-[13px] font-bold leading-[1.3] tracking-tight line-clamp-1 transition-colors",
                isCompleted
                  ? "text-slate-600 dark:text-slate-400 group-hover:text-[#1B3C53] dark:group-hover:text-white"
                  : "text-[#1B3C53] dark:text-white group-hover:text-[#234C6A] dark:group-hover:text-slate-200",
              )}
            >
              {submission.title}
            </h4>
            {hasFile && (
              <span
                className="material-symbols-outlined text-emerald-500 shrink-0"
                style={{ fontSize: "14px" }}
                title="Paper uploaded"
              >
                attach_file
              </span>
            )}
          </div>

          {/* Abstract Preview */}
          {abstractPreview && (
            <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-1.5">
              {abstractPreview}
            </p>
          )}

          {/* Meta Row: Track, Paper Type, Keywords */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {trackName && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                <span
                  className="material-symbols-outlined text-slate-400"
                  style={{ fontSize: "12px" }}
                >
                  folder
                </span>
                {trackName}
              </span>
            )}
            {paperType && (
              <>
                {trackName && <span className="w-px h-3 bg-slate-200 dark:bg-slate-600" />}
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {paperType}
                </span>
              </>
            )}
            {keywords.length > 0 && (
              <>
                {(trackName || paperType) && (
                  <span className="w-px h-3 bg-slate-200 dark:bg-slate-600" />
                )}
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 line-clamp-1">
                  {keywords.slice(0, 3).join(", ")}
                  {keywords.length > 3 && ` +${keywords.length - 3}`}
                </span>
              </>
            )}
          </div>

          {/* Co-authors */}
          {coAuthors.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <span
                className="material-symbols-outlined text-slate-400 shrink-0"
                style={{ fontSize: "12px" }}
              >
                group
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 line-clamp-1">
                {coAuthors.length === 1
                  ? coAuthors[0]
                  : `${coAuthors[0]} +${coAuthors.length - 1} other${coAuthors.length > 2 ? "s" : ""}`}
              </span>
            </div>
          )}
        </div>

        {/* Conference Info: Acronym, Full Name, Year, Dates */}
        <div className="px-3 py-3.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[12px] font-bold text-[#1B3C53] dark:text-white">
              {submission.conference.acronym}
            </span>
            {submission.conference.year && (
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {submission.conference.year}
              </span>
            )}
          </div>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {submission.conference.name}
          </p>
          {submission.conference.location && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className="material-symbols-outlined text-slate-400"
                style={{ fontSize: "11px" }}
              >
                location_on
              </span>
              <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                {submission.conference.location}
              </span>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="px-3 py-3.5">
          <SubmissionStatusBadge status={submission.status} />
          {submission.status === "draft" && (
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Not submitted</p>
          )}
        </div>

        {/* Submitted Date */}
        <div className="px-3 py-3.5">
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {formatDate(submission.created_at)}
          </span>
          {submission.updated_at !== submission.created_at && (
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
              Updated {formatDate(submission.updated_at)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-2 py-3.5 flex justify-center">
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", width: "18px", height: "18px", lineHeight: "1" }}
            >
              more_horiz
            </span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Layout - Also Expanded */}
      <div className="lg:hidden p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-medium text-slate-400">
              #{submission.id}
            </span>
            <SubmissionStatusBadge status={submission.status} />
          </div>
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all shrink-0"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", width: "18px", height: "18px", lineHeight: "1" }}
            >
              more_horiz
            </span>
          </button>
        </div>

        {/* Title */}
        <h4
          className={cn(
            "text-[13px] font-bold leading-[1.3] tracking-tight mb-1",
            isCompleted ? "text-slate-600 dark:text-slate-400" : "text-[#1B3C53] dark:text-white",
          )}
        >
          {submission.title}
        </h4>

        {/* Abstract Preview */}
        {abstractPreview && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
            {abstractPreview}
          </p>
        )}

        {/* Conference */}
        <div className="flex items-center gap-1.5 mb-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <span className="text-[11px] font-bold text-[#1B3C53] dark:text-white">
            {submission.conference.acronym}
          </span>
          <span className="text-[10px] text-slate-400">·</span>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
            {submission.conference.name}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 dark:text-slate-500">
          {trackName && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                folder
              </span>
              {trackName}
            </span>
          )}
          {coAuthors.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                group
              </span>
              {coAuthors.length} co-author{coAuthors.length > 1 ? "s" : ""}
            </span>
          )}
          <span>{formatDate(submission.created_at)}</span>
        </div>
      </div>
    </div>
  )
}
