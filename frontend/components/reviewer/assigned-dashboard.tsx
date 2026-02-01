"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useConferencePapers } from "@/hooks/use-conference-papers"
import { useReviewerDashboard } from "@/hooks/use-reviewer-dashboard"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ArrowLeft, AlertCircle } from "lucide-react"
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
  },
  {
    id: "2",
    assignment_id: 102,
    title: "Robust Object Detection in Adverse Weather Using Multi-Modal Fusion",
    abstract: "We propose a multi-modal fusion framework for robust object detection.",
    keywords: ["Object Detection", "Weather Robustness", "Sensor Fusion"],
    assignment_status: "not_started",
    due_date: "2024-05-15",
  },
  {
    id: "3",
    assignment_id: 103,
    title: "Self-Supervised Learning for 3D Point Cloud Understanding",
    abstract: "A self-supervised approach to learning representations from 3D point clouds.",
    keywords: ["Self-Supervised Learning", "3D Vision", "Point Clouds"],
    assignment_status: "not_started",
    due_date: "2024-05-20",
  },
  {
    id: "4",
    assignment_id: 104,
    title: "Neural Radiance Fields for Dynamic Scene Reconstruction",
    abstract: "Extending NeRF to handle dynamic scenes with moving objects.",
    keywords: ["NeRF", "Dynamic Scenes", "Novel View Synthesis"],
    assignment_status: "completed",
    due_date: "2024-05-10",
  },
  {
    id: "5",
    assignment_id: 105,
    title: "Attention Mechanisms in Video Understanding: A Comprehensive Survey",
    abstract: "A comprehensive survey of attention mechanisms used in video understanding tasks.",
    keywords: ["Attention", "Video Understanding", "Survey"],
    assignment_status: "completed",
    due_date: "2024-05-08",
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

function getStatusConfig(status: ReviewStatus) {
  switch (status) {
    case "completed":
      return {
        label: "Submitted",
        dotClass: "bg-green-500",
        badgeClass: "bg-green-50 text-green-700 border-green-200",
        cardBorder: "border-l-4 border-l-green-500",
        icon: "check",
      }
    case "in_progress":
      return {
        label: "Draft Saved",
        dotClass: "bg-amber-500",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        cardBorder: "border-l-4 border-l-amber-500",
        icon: null,
      }
    default:
      return {
        label: "Not Started",
        dotClass: "bg-slate-400",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
        cardBorder: "",
        icon: null,
      }
  }
}

interface PaperCardProps {
  paper: {
    id?: string
    assignment_id?: number
    title: string
    keywords?: string[]
    assignment_status?: string
    due_date?: string
  }
  onSelectPaper: (paperId: string) => void
}

function PaperCard({ paper, onSelectPaper }: PaperCardProps) {
  const status = (paper.assignment_status as ReviewStatus) || "not_started"
  const config = getStatusConfig(status)
  const isCompleted = status === "completed"

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
  }

  const getButtonConfig = () => {
    switch (status) {
      case "completed":
        return {
          text: "View Review",
          icon: "visibility",
          className: "bg-slate-100 text-slate-600 hover:bg-slate-200",
        }
      case "in_progress":
        return {
          text: "Continue Review",
          icon: "edit_document",
          className: "bg-white border border-amber-500 text-amber-700 hover:bg-amber-50",
        }
      default:
        return {
          text: "Start Review",
          icon: "arrow_forward",
          className: "bg-[#1e3a8a] hover:bg-blue-900 text-white shadow-lg shadow-blue-900/10",
        }
    }
  }

  const buttonConfig = getButtonConfig()

  return (
    <div
      className={`group bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-5px_rgba(30,58,138,0.1)] hover:border-[#1e3a8a]/30 transition-all duration-300 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden ${config.cardBorder}`}
    >
      <div
        className={`flex-1 space-y-3 ${isCompleted ? "opacity-80 group-hover:opacity-100 transition-opacity" : ""}`}
      >
        {/* Paper ID + Status Badge */}
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
            ID: #{paper.id || paper.assignment_id}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeClass}`}
          >
            {config.icon ? (
              <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
            ) : (
              <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
            )}
            {config.label}
          </span>
        </div>

        {/* Paper Title */}
        <h3 className="text-lg font-bold text-[#141414] group-hover:text-[#1e3a8a] transition-colors">
          {paper.title}
        </h3>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
          {paper.due_date && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span>Due: {formatDate(paper.due_date)}</span>
            </div>
          )}
          {paper.keywords && paper.keywords.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">label</span>
              <span>{paper.keywords.slice(0, 3).join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Deadline/Completed + Action Button */}
      <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between gap-4 pl-0 md:pl-6 md:border-l border-slate-100">
        <div className="text-right hidden md:block">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            {isCompleted ? "Completed" : "Deadline"}
          </span>
          <div className={`text-sm font-bold ${isCompleted ? "text-green-600" : "text-slate-700"}`}>
            {formatDate(paper.due_date)}
          </div>
        </div>
        <button
          onClick={() => onSelectPaper(String(paper.assignment_id || paper.id))}
          className={`w-full md:w-auto px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${buttonConfig.className}`}
        >
          {buttonConfig.text}
          <span className="material-symbols-outlined text-sm">{buttonConfig.icon}</span>
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// AssignedDashboard - Conference-specific assigned papers view
// =============================================================================

interface AssignedDashboardProps {
  /** The conference ID to show assigned papers for */
  conferenceId: string
}

export function AssignedDashboard({ conferenceId }: AssignedDashboardProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const currentReviewerEmail = user?.email || ""

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 500)

  // TODO: Re-enable API calls for production (set USE_MOCK_DATA = false)
  // const {
  //   papers,
  //   isLoading,
  //   error,
  //   refresh: refreshPapers,
  // } = useConferencePapers(currentReviewerEmail, conferenceId, {
  //   search: debouncedSearch,
  //   status: statusFilter,
  //   limit: 20,
  // })
  // const { dashboard } = useReviewerDashboard(currentReviewerEmail, { conferenceLimit: 100 })
  // const conference = dashboard?.conferences?.find((c: any) => String(c.id) === conferenceId)

  // Mock data for UI testing
  const papers = USE_MOCK_DATA ? MOCK_ASSIGNED_PAPERS : []
  const isLoading = false
  const error = null
  const conference = USE_MOCK_DATA ? MOCK_CONFERENCE : null

  const handleSelectPaper = (paperId: string) => {
    const params = new URLSearchParams()
    params.set("conference_id", conferenceId)
    params.set("from", "conference-assigned")
    router.push(`/dashboard/reviewer/papers/${paperId}?${params.toString()}`)
  }

  const handleBack = () => {
    router.push("/dashboard/reviewer?tab=conferences")
  }

  // Calculate stats
  const total = papers.length
  const completed = papers.filter((p) => p.assignment_status === "completed").length
  const pending = total - completed

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
    <div className="flex flex-col gap-6">
      {/* Header with Back Button */}
      <div className="flex flex-col gap-6 mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors w-fit"
        >
          <ArrowLeft className="size-4" />
          <span className="text-sm font-medium">Back to Conferences</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#141414] mb-2">
              {conference?.acronym || conference?.name || "Assigned Papers"}
            </h2>
            <p className="text-slate-500">{conference?.name || `Conference ID: ${conferenceId}`}</p>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm">
              Total: {total}
            </span>
            <span className="px-3 py-1 bg-green-50 border border-green-100 rounded-full text-xs font-semibold text-green-700 shadow-sm">
              Completed: {completed}
            </span>
            <span className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-xs font-semibold text-amber-700 shadow-sm">
              Pending: {pending}
            </span>
          </div>
        </div>
      </div>

      {/* Paper Cards */}
      <div className="flex flex-col gap-6">
        {papers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">No assigned papers found for this conference</p>
          </div>
        ) : (
          papers.map((paper) => (
            <PaperCard
              key={paper.assignment_id || paper.id}
              paper={paper}
              onSelectPaper={handleSelectPaper}
            />
          ))
        )}
      </div>
    </div>
  )
}
