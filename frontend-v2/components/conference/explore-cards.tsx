import type { ExploreConference, ExploreStatus } from "./types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// -------------------------------------------------------------------------
// Explore Status Badge
// -------------------------------------------------------------------------

const EXPLORE_STATUS_CONFIG: Record<
  ExploreStatus,
  { label: string; className: string; hasPulse?: boolean }
> = {
  "call-for-papers": {
    label: "Call for Papers",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  },
  "registration-open": {
    label: "Registration Open",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    hasPulse: true,
  },
  upcoming: {
    label: "Upcoming",
    className:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
  },
  workshop: {
    label: "Workshop",
    className:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  },
}

interface ExploreStatusBadgeProps {
  status: ExploreStatus
}

function ExploreStatusBadge({ status }: ExploreStatusBadgeProps) {
  const config = EXPLORE_STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${config.className}`}
    >
      {config.label}
    </span>
  )
}

// -------------------------------------------------------------------------
// Explore Conference Card
// -------------------------------------------------------------------------

interface ExploreConferenceCardProps {
  conference: ExploreConference
  onViewDetails: (id: string) => void
}

export function ExploreConferenceCard({ conference, onViewDetails }: ExploreConferenceCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 group flex flex-col h-full">
      {/* Card Content */}
      <div className="px-4 pt-4 pb-3 flex-1">
        {/* Header: Badge + More */}
        <div className="flex justify-between items-start mb-1.5">
          <ExploreStatusBadge status={conference.exploreStatus} />
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-slate-300 hover:text-[#1B3C53] dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
          </button>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold leading-[1.2] tracking-tight text-[#1B3C53] dark:text-white group-hover:text-[#234C6A] dark:group-hover:text-slate-200 transition-colors mb-1">
          {conference.name}
        </h3>

        {/* Full Description */}
        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
          {conference.fullDescription}
        </p>

        {/* Location */}
        <div className="space-y-1.5 mb-4">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-snug">
            {conference.location}
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            {conference.dates}
          </p>
        </div>

        {/* Topic Tags */}
        {conference.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {conference.topics.map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase tracking-wider rounded"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl">
        <button
          onClick={() => onViewDetails(conference.id)}
          className="w-full h-8 px-3 text-[11px] font-medium rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-[#1B3C53] dark:hover:text-white hover:border-slate-300 transition-all duration-200"
        >
          View Details
        </button>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Archived Conference Card
// -------------------------------------------------------------------------

interface ArchivedConferenceCardProps {
  conference: ExploreConference
  onViewDetails: (id: string) => void
}

export function ArchivedConferenceCard({ conference, onViewDetails }: ArchivedConferenceCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 group flex flex-col h-full opacity-90 hover:opacity-100">
      {/* Card Content */}
      <div className="px-4 pt-4 pb-3 flex-1">
        {/* Header: Archived Badge + More */}
        <div className="flex justify-between items-start mb-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600">
            <span
              className="material-symbols-outlined mr-1"
              style={{ fontSize: "12px", width: "12px", height: "12px", lineHeight: "1" }}
            >
              archive
            </span>
            Archived
          </span>
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-slate-300 hover:text-[#1B3C53] dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
          </button>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold leading-[1.2] tracking-tight text-slate-700 dark:text-slate-300 group-hover:text-[#1B3C53] dark:group-hover:text-white transition-colors mb-4">
          {conference.name}
        </h3>

        {/* Location & Dates */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-snug flex items-center gap-1.5">
            {conference.isVirtual && (
              <span
                className="material-symbols-outlined text-slate-300 dark:text-slate-600"
                style={{ fontSize: "14px", width: "14px", height: "14px", lineHeight: "1" }}
              >
                videocam
              </span>
            )}
            {conference.location}
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            {conference.dates}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl">
        <button
          onClick={() => onViewDetails(conference.id)}
          className="w-full h-8 px-3 text-[11px] font-medium rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-[#1B3C53] dark:hover:text-white hover:border-slate-300 transition-all duration-200"
        >
          View Details
        </button>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Explore Conference List (Table View)
// -------------------------------------------------------------------------

interface ExploreConferenceListProps {
  conferences: ExploreConference[]
  onViewDetails: (id: string) => void
  /** Pagination props */
  currentPage?: number
  totalPages?: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange?: (page: number) => void
}

export function ExploreConferenceList({
  conferences,
  onViewDetails,
  currentPage = 1,
  totalPages = 1,
  totalItems,
  itemsPerPage = 5,
  onPageChange,
}: ExploreConferenceListProps) {
  const showPagination = totalPages > 1 || totalItems !== undefined

  const handlePrevPage = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    if (onPageChange && page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  // Calculate display range
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || conferences.length)

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("ellipsis")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // In the middle
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
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header Row */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_200px_190px_210px_minmax(100px,180px)_96px] border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Conference
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Location
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Status
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Dates
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Topics
        </div>
        <div className="px-4 py-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">
          Actions
        </div>
      </div>

      {/* List Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {conferences.map((conference) => (
          <ExploreListRow
            key={conference.id}
            conference={conference}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination ? (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {/* Left: Item count */}
          <div className="text-[11px] text-slate-500">
            Showing{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">
              {startItem}-{endItem}
            </span>{" "}
            of{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">
              {(totalItems || conferences.length).toLocaleString()}
            </span>{" "}
            conferences
          </div>

          {/* Right: Page navigation */}
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {getPageNumbers().map((page, idx) => {
                if (page === "ellipsis") {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 text-[10px]">
                      ...
                    </span>
                  )
                }

                const isActive = page === currentPage
                return (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
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
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {conferences.length} conferences found
          </div>
        </div>
      )}
    </div>
  )
}

function ExploreListRow({
  conference,
  onViewDetails,
}: {
  conference: ExploreConference
  onViewDetails: (id: string) => void
}) {
  return (
    <div
      onClick={() => onViewDetails(conference.id)}
      className="group cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-700/50"
    >
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_200px_190px_210px_minmax(100px,180px)_96px] items-center min-h-[60px]">
        {/* Conference (Name + Full Description) */}
        <div className="px-4 py-3">
          <h3 className="text-[13px] font-bold leading-[1.3] tracking-tight text-[#1B3C53] dark:text-white group-hover:text-[#234C6A] dark:group-hover:text-slate-200 transition-colors line-clamp-1">
            {conference.name}
          </h3>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
            {conference.fullDescription}
          </p>
        </div>

        {/* Location */}
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
            {conference.location}
          </span>
        </div>

        {/* Status */}
        <div className="px-4 py-3">
          <ExploreStatusBadge status={conference.exploreStatus} />
        </div>

        {/* Dates */}
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {conference.dates}
          </span>
        </div>

        {/* Topics */}
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {conference.topics.slice(0, 2).map((topic) => (
              <span
                key={topic}
                className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[8px] font-bold uppercase tracking-wider rounded"
              >
                {topic}
              </span>
            ))}
            {conference.topics.length > 2 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[9px] font-medium text-slate-400 cursor-help">
                    +{conference.topics.length - 2}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-lg p-3 max-w-xs [&>svg]:hidden"
                  sideOffset={8}
                >
                  <div className="flex flex-wrap gap-1">
                    {conference.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[8px] font-bold uppercase tracking-wider rounded"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-2 py-3 pr-4 flex justify-center">
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

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <ExploreStatusBadge status={conference.exploreStatus} />
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

        <h3 className="text-[13px] font-bold leading-[1.3] tracking-tight text-[#1B3C53] dark:text-white mb-0.5">
          {conference.name}
        </h3>
        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 line-clamp-1 mb-2">
          {conference.fullDescription}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 dark:text-slate-500 mb-2">
          <span>{conference.location}</span>
          <span>{conference.dates}</span>
        </div>

        {conference.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {conference.topics.map((topic) => (
              <span
                key={topic}
                className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[8px] font-bold uppercase tracking-wider rounded"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Archived Conference List (Table View)
// -------------------------------------------------------------------------

interface ArchivedConferenceListProps {
  conferences: ExploreConference[]
  onViewDetails: (id: string) => void
  /** Pagination props */
  currentPage?: number
  totalPages?: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange?: (page: number) => void
}

export function ArchivedConferenceList({
  conferences,
  onViewDetails,
  currentPage = 1,
  totalPages = 1,
  totalItems,
  itemsPerPage = 5,
  onPageChange,
}: ArchivedConferenceListProps) {
  const showPagination = totalPages > 1 || totalItems !== undefined

  const handlePrevPage = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    if (onPageChange && page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  // Calculate display range
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || conferences.length)

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("ellipsis")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // In the middle
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
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header Row */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_200px_210px_96px] border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Conference
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Location
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Dates
        </div>
        <div className="px-4 py-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">
          Actions
        </div>
      </div>

      {/* List Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {conferences.map((conference) => (
          <ArchivedListRow
            key={conference.id}
            conference={conference}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination ? (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {/* Left: Item count */}
          <div className="text-[11px] text-slate-500">
            Showing{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">
              {startItem}-{endItem}
            </span>{" "}
            of{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">
              {(totalItems || conferences.length).toLocaleString()}
            </span>{" "}
            archived conferences
          </div>

          {/* Right: Page navigation */}
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {getPageNumbers().map((page, idx) => {
                if (page === "ellipsis") {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 text-[10px]">
                      ...
                    </span>
                  )
                }

                const isActive = page === currentPage
                return (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
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
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {conferences.length} archived conferences
          </div>
        </div>
      )}
    </div>
  )
}

function ArchivedListRow({
  conference,
  onViewDetails,
}: {
  conference: ExploreConference
  onViewDetails: (id: string) => void
}) {
  return (
    <div
      onClick={() => onViewDetails(conference.id)}
      className="group cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-700/50 opacity-80 hover:opacity-100"
    >
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_200px_210px_96px] items-center min-h-[56px]">
        {/* Conference (Name + Archived Badge) */}
        <div className="px-4 py-3 flex items-center gap-3">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-700 dark:text-slate-500 dark:border-slate-600 shrink-0">
            <span
              className="material-symbols-outlined mr-0.5"
              style={{ fontSize: "12.5px", width: "12.5px", height: "12.5px", lineHeight: "1" }}
            >
              archive
            </span>
          </span>
          <h3 className="text-[13px] font-bold leading-[1.3] tracking-tight text-slate-600 dark:text-slate-400 group-hover:text-[#1B3C53] dark:group-hover:text-white transition-colors line-clamp-1">
            {conference.name}
          </h3>
        </div>

        {/* Location */}
        <div className="px-4 py-3 flex items-center gap-1.5">
          {conference.isVirtual && (
            <span
              className="material-symbols-outlined text-slate-300 dark:text-slate-600 shrink-0"
              style={{ fontSize: "14px", width: "14px", height: "14px", lineHeight: "1" }}
            >
              videocam
            </span>
          )}
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
            {conference.location}
          </span>
        </div>

        {/* Dates */}
        <div className="px-4 py-3">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {conference.dates}
          </span>
        </div>

        {/* Actions */}
        <div className="px-2 py-3 pr-4 flex justify-center">
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

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600">
            <span
              className="material-symbols-outlined mr-1"
              style={{ fontSize: "15px", width: "15px", height: "15px", lineHeight: "1" }}
            >
              archive
            </span>
            Archived
          </span>
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

        <h3 className="text-[13px] font-bold leading-[1.3] tracking-tight text-slate-600 dark:text-slate-400 mb-2">
          {conference.name}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            {conference.isVirtual && (
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "12px", width: "12px", height: "12px" }}
              >
                videocam
              </span>
            )}
            {conference.location}
          </span>
          <span>{conference.dates}</span>
        </div>
      </div>
    </div>
  )
}
