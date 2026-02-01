"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useConferencePapers } from "@/hooks/use-conference-papers"
import { useReviewerDashboard } from "@/hooks/use-reviewer-dashboard"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ArrowLeft, AlertCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PapersSkeleton } from "./loading-skeletons"
import { typography, iconSizes } from "@/lib/typography"

// =============================================================================
// MOCK DATA - Toggle USE_MOCK_DATA to switch between mock and real API data
// =============================================================================
const USE_MOCK_DATA = true

const MOCK_ASSIGNED_PAPERS = [
  {
    id: "1",
    assignment_id: 101,
    title: "Efficient Vision Transformers for Edge Devices with Limited Memory",
    abstract:
      "This paper presents a novel approach to deploying vision transformers on edge devices.",
    keywords: ["Vision Transformers", "Edge Computing", "Model Compression"],
    assignment_status: "in_progress",
    due_date: "2024-05-15",
    track: "Computer Vision",
  },
  {
    id: "2",
    assignment_id: 102,
    title: "Robust Object Detection in Adverse Weather Using Multi-Modal Fusion",
    abstract: "We propose a multi-modal fusion framework for robust object detection.",
    keywords: ["Object Detection", "Weather Robustness", "Sensor Fusion"],
    assignment_status: "not_started",
    due_date: "2024-05-15",
    track: "Computer Vision",
  },
  {
    id: "3",
    assignment_id: 103,
    title: "Self-Supervised Learning for 3D Point Cloud Understanding",
    abstract: "A self-supervised approach to learning representations from 3D point clouds.",
    keywords: ["Self-Supervised Learning", "3D Vision", "Point Clouds"],
    assignment_status: "not_started",
    due_date: "2024-05-20",
    track: "Machine Learning",
  },
  {
    id: "4",
    assignment_id: 104,
    title: "Neural Radiance Fields for Dynamic Scene Reconstruction",
    abstract: "Extending NeRF to handle dynamic scenes with moving objects.",
    keywords: ["NeRF", "Dynamic Scenes", "Novel View Synthesis"],
    assignment_status: "completed",
    due_date: "2024-05-10",
    track: "3D Vision",
  },
  {
    id: "5",
    assignment_id: 105,
    title: "Attention Mechanisms in Video Understanding: A Comprehensive Survey",
    abstract: "A comprehensive survey of attention mechanisms used in video understanding tasks.",
    keywords: ["Attention", "Video Understanding", "Survey"],
    assignment_status: "completed",
    due_date: "2024-05-08",
    track: "Survey",
  },
]

const MOCK_CONFERENCE = {
  id: "1",
  name: "Computer Vision & Pattern Recognition Conference",
  acronym: "CVPR 2024",
  year: 2024,
  status: "active",
}
// =============================================================================

type ReviewStatus = "not_started" | "in_progress" | "completed"
type StatusFilter = "all" | "not_started" | "in_progress" | "completed"
type SortOption = "deadline" | "title" | "status"

function getStatusConfig(status: ReviewStatus) {
  switch (status) {
    case "completed":
      return {
        label: "Submitted",
        bgClass: "bg-emerald-50 dark:bg-emerald-900/20",
        textClass: "text-emerald-700 dark:text-emerald-400",
        dotClass: "bg-emerald-500",
      }
    case "in_progress":
      return {
        label: "Draft",
        bgClass: "bg-amber-50 dark:bg-amber-900/20",
        textClass: "text-amber-700 dark:text-amber-400",
        dotClass: "bg-amber-500",
      }
    default:
      return {
        label: "Pending",
        bgClass: "bg-slate-100 dark:bg-slate-700",
        textClass: "text-slate-600 dark:text-slate-300",
        dotClass: "bg-slate-400",
      }
  }
}

// =============================================================================
// Table Row Component
// =============================================================================
interface PaperRowProps {
  paper: {
    id?: string
    assignment_id?: number
    title: string
    keywords?: string[]
    assignment_status?: string
    due_date?: string
    track?: string
  }
  index: number
  onSelectPaper: (paperId: string) => void
}

function PaperRow({ paper, index, onSelectPaper }: PaperRowProps) {
  const status = (paper.assignment_status as ReviewStatus) || "not_started"
  const config = getStatusConfig(status)
  const isCompleted = status === "completed"

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    })
  }

  const getDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return null
    const due = new Date(dateStr)
    const now = new Date()
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const daysRemaining = getDaysRemaining(paper.due_date)
  const isOverdue = daysRemaining !== null && daysRemaining < 0
  const isUrgent = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3

  const getActionButton = () => {
    switch (status) {
      case "completed":
        return {
          text: "View",
          icon: "visibility",
          className:
            "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600",
        }
      case "in_progress":
        return {
          text: "Continue",
          icon: "edit_document",
          className:
            "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-700",
        }
      default:
        return {
          text: "Start",
          icon: "arrow_forward",
          className: "bg-[#1B3C53] hover:bg-[#234C6A] text-white",
        }
    }
  }

  const actionButton = getActionButton()

  return (
    <tr
      className={`group border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
        isCompleted ? "opacity-70 hover:opacity-100" : ""
      }`}
    >
      {/* Index/ID */}
      <td className="py-3 pl-4 pr-2 w-12">
        <span className="font-mono text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {String(index + 1).padStart(2, "0")}
        </span>
      </td>

      {/* Title & Keywords */}
      <td className="py-3 px-3">
        <div className="space-y-1">
          <h4
            className={`text-[13px] font-bold leading-[1.3] tracking-tight ${
              isCompleted
                ? "text-slate-500 dark:text-slate-400"
                : "text-[#141414] dark:text-white group-hover:text-[#1B3C53] dark:group-hover:text-slate-200"
            } transition-colors line-clamp-2`}
          >
            {paper.title}
          </h4>
          {paper.keywords && paper.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {paper.keywords.slice(0, 2).map((kw, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium text-slate-400 dark:text-slate-500"
                >
                  {kw}
                  {i < Math.min(paper.keywords!.length - 1, 1) && " /"}
                </span>
              ))}
              {paper.keywords.length > 2 && (
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  +{paper.keywords.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </td>

      {/* Track */}
      <td className="py-3 px-3 hidden lg:table-cell">
        {paper.track && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {paper.track}
          </span>
        )}
      </td>

      {/* Status */}
      <td className="py-3 px-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${config.bgClass} ${config.textClass}`}
        >
          {config.label}
        </span>
      </td>

      {/* Due Date */}
      <td className="py-3 px-3">
        <div className="flex flex-col items-start">
          <span
            className={`text-[11px] font-semibold ${
              isCompleted
                ? "text-emerald-600 dark:text-emerald-400"
                : isOverdue
                  ? "text-red-600 dark:text-red-400"
                  : isUrgent
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-600 dark:text-slate-300"
            }`}
          >
            {formatDate(paper.due_date)}
          </span>
          {!isCompleted && daysRemaining !== null && (
            <span
              className={`text-[8px] font-bold uppercase tracking-wider ${
                isOverdue
                  ? "text-red-500 dark:text-red-400"
                  : isUrgent
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
            </span>
          )}
        </div>
      </td>

      {/* Action */}
      <td className="py-3 pl-3 pr-4 text-right">
        <button
          onClick={() => onSelectPaper(String(paper.assignment_id || paper.id))}
          className={`h-7 px-2.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all duration-200 inline-flex items-center gap-1.5 ${actionButton.className}`}
        >
          {actionButton.text}
          <span className="material-symbols-outlined text-[16px]">{actionButton.icon}</span>
        </button>
      </td>
    </tr>
  )
}

// =============================================================================
// Progress Bar Component
// =============================================================================
interface ProgressBarProps {
  completed: number
  inProgress: number
  total: number
}

function ProgressBar({ completed, inProgress, total }: ProgressBarProps) {
  if (total === 0) return null
  const completedPct = (completed / total) * 100
  const inProgressPct = (inProgress / total) * 100

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${completedPct}%` }}
            />
            <div
              className="bg-amber-400 transition-all duration-300"
              style={{ width: `${inProgressPct}%` }}
            />
          </div>
        </div>
        <span className="text-[11px] font-bold text-[#1B3C53] dark:text-white tabular-nums">
          {completed}/{total}
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// AssignedDashboard - Conference-specific assigned papers view
// =============================================================================

interface AssignedDashboardProps {
  conferenceId: string
}

export function AssignedDashboard({ conferenceId }: AssignedDashboardProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const currentReviewerEmail = user?.email || ""

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("deadline")
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Mock data for UI testing
  const papers = USE_MOCK_DATA ? MOCK_ASSIGNED_PAPERS : []
  const isLoading = false
  const error = null
  const conference = USE_MOCK_DATA ? MOCK_CONFERENCE : null

  // Filter and sort papers
  const filteredPapers = papers
    .filter((p) => {
      if (statusFilter !== "all" && p.assignment_status !== statusFilter) return false
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        return (
          p.title.toLowerCase().includes(q) || p.keywords?.some((k) => k.toLowerCase().includes(q))
        )
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "status":
          const order = { not_started: 0, in_progress: 1, completed: 2 }
          return (
            (order[a.assignment_status as keyof typeof order] || 0) -
            (order[b.assignment_status as keyof typeof order] || 0)
          )
        case "deadline":
        default:
          return new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime()
      }
    })

  const handleSelectPaper = (paperId: string) => {
    router.push(`/dashboard/conference/${conferenceId}/reviewer/submissions/${paperId}`)
  }

  const handleBack = () => {
    router.push("/dashboard/reviewer?tab=conferences")
  }

  // Calculate stats
  const total = papers.length
  const completed = papers.filter((p) => p.assignment_status === "completed").length
  const inProgress = papers.filter((p) => p.assignment_status === "in_progress").length
  const pending = papers.filter((p) => p.assignment_status === "not_started").length

  const statusCounts = {
    all: total,
    not_started: pending,
    in_progress: inProgress,
    completed: completed,
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className={iconSizes.sm} />
        <AlertTitle className={typography.h6}>
          {t("dashboard.roles.reviewer.review.errors.loadFailed")}
        </AlertTitle>
        <AlertDescription>
          <p className={`mb-4 ${typography.body}`}>{error}</p>
          <Button onClick={handleBack} variant="outline" size="sm">
            {t("common.actions.goBack")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return <PapersSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 py-8 px-12">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-[#1B3C53] dark:hover:text-white transition-colors w-fit group"
        >
          <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Back</span>
        </button>

        {/* Title Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[32px] font-bold tracking-tight text-[#141414] dark:text-white leading-none">
                {conference?.acronym || "Assigned Papers"}
              </h1>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase tracking-wider rounded">
                {total} {total === 1 ? "Paper" : "Papers"}
              </span>
            </div>
            <p className="text-sm font-light text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
              {conference?.name || `Conference ID: ${conferenceId}`}
            </p>
          </div>

          {/* Progress Summary */}
          <div className="w-full md:w-64 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Review Progress
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {total > 0 ? Math.round((completed / total) * 100) : 0}%
              </span>
            </div>
            <ProgressBar completed={completed} inProgress={inProgress} total={total} />
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  {completed} done
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  {inProgress} draft
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  {pending} pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {(["all", "not_started", "in_progress", "completed"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                statusFilter === status
                  ? "bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {status === "all"
                ? "All"
                : status === "not_started"
                  ? "Pending"
                  : status === "in_progress"
                    ? "Draft"
                    : "Done"}
              <span className="ml-1 opacity-60">{statusCounts[status]}</span>
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 pl-8 pr-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1B3C53] dark:focus:ring-slate-500 transition-shadow"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            <span className="material-symbols-outlined text-[14px]">sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#1B3C53] dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="deadline">Deadline</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {filteredPapers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3">
              description
            </span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              No papers found
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {searchQuery
                ? "Try adjusting your search query"
                : "No assigned papers match the selected filter"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="py-2.5 pl-4 pr-2 text-left text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 w-12">
                  #
                </th>
                <th className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Paper Title
                </th>
                <th className="py-2.5 px-3 text-left text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden lg:table-cell">
                  Track
                </th>
                <th className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Status
                </th>
                <th className="py-2.5 px-3 text-left text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Due
                </th>
                <th className="py-2.5 pl-3 pr-4 text-right text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPapers.map((paper, index) => (
                <PaperRow
                  key={paper.assignment_id || paper.id}
                  paper={paper}
                  index={index}
                  onSelectPaper={handleSelectPaper}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Stats */}
      {filteredPapers.length > 0 && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
          <span>
            Showing {filteredPapers.length} of {total} paper{total !== 1 ? "s" : ""}
          </span>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="text-[10px] font-medium text-[#1B3C53] dark:text-slate-300 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  )
}
