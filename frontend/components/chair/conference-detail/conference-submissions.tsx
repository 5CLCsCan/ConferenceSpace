"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// --- Types ---

type SubmissionStatus = "under_review" | "accepted" | "pending" | "rejected" | "withdrawn"

interface Submission {
  id: string
  title: string
  authors: string
  status: SubmissionStatus
  reviews: {
    completed: number
    total: number
  }
  score: number | null
}

interface ConferenceSubmissionsProps {
  conferenceId: string
  className?: string
}

// --- Mock Data ---

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "#1024",
    title: "Deep Learning for Autonomous Navigation in Unstructured Environments",
    authors: "J. Doe, A. Smith, et al.",
    status: "under_review",
    reviews: { completed: 2, total: 3 },
    score: 4.2,
  },
  {
    id: "#1042",
    title: "Transformer Models for Low-Resource Language Translation",
    authors: "M. Johnson, K. Lee",
    status: "accepted",
    reviews: { completed: 3, total: 3 },
    score: 4.8,
  },
  {
    id: "#1089",
    title: "Ethical Implications of Large Language Models in Healthcare",
    authors: "S. Williams, R. Brown",
    status: "pending",
    reviews: { completed: 3, total: 3 },
    score: 3.5,
  },
  {
    id: "#1105",
    title: "Reinforcement Learning for Dexterous Manipulation",
    authors: "L. Zhang, Y. Wang",
    status: "rejected",
    reviews: { completed: 3, total: 3 },
    score: 1.8,
  },
  {
    id: "#1132",
    title: "Novel Architecture for Real-time Object Detection",
    authors: "P. Gupta, S. Kumar",
    status: "withdrawn",
    reviews: { completed: 1, total: 3 },
    score: null,
  },
]

const TRACKS = ["All Tracks", "Computer Vision", "NLP", "Robotics", "AI Ethics"]
const STATUSES = ["All Statuses", "Under Review", "Accepted", "Pending", "Rejected", "Withdrawn"]
const SORT_OPTIONS = ["Sort by ID", "Sort by Score", "Sort by Date"]

// --- Status Badge Component ---

function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const config: Record<SubmissionStatus, { label: string; icon?: string; className: string }> = {
    under_review: {
      label: "Under Review",
      className: "bg-yellow-50 text-yellow-700 border-yellow-100",
    },
    accepted: {
      label: "Accepted",
      icon: "check",
      className: "bg-green-50 text-green-700 border-green-100",
    },
    pending: {
      label: "Pending",
      className: "bg-purple-50 text-purple-700 border-purple-100",
    },
    rejected: {
      label: "Rejected",
      icon: "close",
      className: "bg-red-50 text-red-700 border-red-100",
    },
    withdrawn: {
      label: "Withdrawn",
      icon: "remove_circle_outline",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
  }

  const { label, icon, className } = config[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
        className,
      )}
    >
      {icon && (
        <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
          {icon}
        </span>
      )}
      {label}
    </span>
  )
}

// --- Review Progress Component ---

function ReviewProgress({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = completed === total

  return (
    <div className="w-full max-w-[120px]">
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-slate-600 dark:text-slate-400">
          {completed}/{total} Done
        </span>
        <span className={cn("font-medium", isComplete ? "text-green-600" : "text-slate-400")}>
          {isComplete ? "100%" : `${percentage}%`}
        </span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
        <div
          className={cn(
            "h-1 rounded-full transition-all",
            isComplete ? "bg-green-600" : "bg-[#1B3C53]",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// --- Score Badge Component ---

function ScoreBadge({ score, status }: { score: number | null; status: SubmissionStatus }) {
  if (score === null || status === "withdrawn") {
    return <span className="text-slate-400 text-[10px] font-medium">--</span>
  }

  const getScoreVariant = (s: number) => {
    if (s >= 4.0) return "bg-green-100 text-green-700 border-green-200"
    if (s >= 3.0) return "bg-slate-100 text-slate-700 border-slate-200"
    return "bg-red-50 text-red-700 border-red-100"
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-md text-[11px] font-medium border",
        getScoreVariant(score),
      )}
    >
      {score.toFixed(1)}
    </span>
  )
}

// --- Pagination Component ---

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalEntries: number
  entriesPerPage: number
  onPageChange: (page: number) => void
}

function SubmissionsPagination({
  currentPage,
  totalPages,
  totalEntries,
  entriesPerPage,
  onPageChange,
}: PaginationProps) {
  const startEntry = (currentPage - 1) * entriesPerPage + 1
  const endEntry = Math.min(currentPage * entriesPerPage, totalEntries)

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("ellipsis")
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis")
      if (totalPages > 1) pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
      <div className="text-[11px] text-slate-500">
        Showing <span className="font-bold text-[#1B3C53] dark:text-white">{startEntry}</span> to{" "}
        <span className="font-bold text-[#1B3C53] dark:text-white">{endEntry}</span> of{" "}
        <span className="font-bold text-[#1B3C53] dark:text-white">
          {totalEntries.toLocaleString()}
        </span>{" "}
        entries
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>
        {getVisiblePages().map((page, idx) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 text-[10px]">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "px-2.5 py-1 rounded text-[10px]",
                currentPage === page
                  ? "bg-[#1B3C53] text-white hover:bg-[#234C6A]"
                  : "border border-slate-200 text-slate-500 hover:bg-slate-50",
              )}
            >
              {page}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

// --- Main Component ---

export function ConferenceSubmissions({ conferenceId, className }: ConferenceSubmissionsProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTrack, setSelectedTrack] = useState(TRACKS[0])
  const [selectedStatus, setSelectedStatus] = useState(STATUSES[0])
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0])
  const [currentPage, setCurrentPage] = useState(1)

  // For demo, use mock data. In production, this would be filtered/paginated from API
  const filteredSubmissions = MOCK_SUBMISSIONS
  const totalEntries = 1245 // Mock total
  const entriesPerPage = 5
  const totalPages = Math.ceil(totalEntries / entriesPerPage)

  const handleSubmissionClick = (submissionId: string) => {
    // Remove # from submission ID if present
    const cleanId = submissionId.replace("#", "")
    router.push(`/dashboard/chair/conference/${conferenceId}/submission/${cleanId}`)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Submissions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, filter, and assign reviewers to incoming papers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="h-8 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              download
            </span>
            Export CSV
          </button>
          <button className="h-8 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              send
            </span>
            Notifications
          </button>
          <button className="h-8 px-3 bg-[#1B3C53] text-white text-[11px] font-medium rounded-md hover:bg-[#234C6A] transition-colors flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              group_add
            </span>
            Assign Reviewers
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filters Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <span
              className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              style={{ fontSize: "16px" }}
            >
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, title, or author..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] dark:text-white outline-none transition-colors"
            />
          </div>

          {/* Dropdowns */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] rounded-md py-1.5 pl-2.5 pr-6 focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] outline-none cursor-pointer"
            >
              {TRACKS.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] rounded-md py-1.5 pl-2.5 pr-6 focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] outline-none cursor-pointer"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] rounded-md py-1.5 pl-2.5 pr-6 focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-16">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-[#1B3C53]">
                    ID
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                      unfold_more
                    </span>
                  </div>
                </th>
                <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                  Paper Details
                </th>
                <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-32">
                  Status
                </th>
                <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-[168px]">
                  Reviews
                </th>
                <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-20 text-center">
                  Score
                </th>
                <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-[62px] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[12px]">
              {filteredSubmissions.map((submission) => (
                <tr
                  key={submission.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-3 py-3 font-mono text-[11px] text-slate-400">
                    {submission.id}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleSubmissionClick(submission.id)}
                        className="text-[13px] font-semibold text-slate-900 dark:text-white hover:text-[#456882] transition-colors line-clamp-1 tracking-tight leading-[1.3] text-left"
                      >
                        {submission.title}
                      </button>
                      <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                        {submission.authors}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <SubmissionStatusBadge status={submission.status} />
                  </td>
                  <td className="px-3 py-3">
                    <ReviewProgress
                      completed={submission.reviews.completed}
                      total={submission.reviews.total}
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ScoreBadge score={submission.score} status={submission.status} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                        more_vert
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <SubmissionsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalEntries={totalEntries}
          entriesPerPage={entriesPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
