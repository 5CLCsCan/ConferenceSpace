"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { DashboardStatsCard, DashboardStatsGrid } from "./dashboard-stats-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Types
interface ConflictReason {
  type: "domain" | "coauthor" | "advisor" | "other"
  label: string
  detail: string
}

interface ConflictSource {
  type: "auto" | "declared"
  label: string
}

interface COIEntry {
  id: string
  reviewer: {
    name: string
    institution: string
    avatar?: string
  }
  paper: {
    id: string
    title: string
    track: string
  }
  reason: ConflictReason
  source: ConflictSource
}

interface ActivityEntry {
  id: string
  actor: string
  action: string
  target?: string
  timestamp: string
  variant: "neutral" | "success" | "warning"
}

type TabFilter = "pending" | "confirmed" | "dismissed"

// Mock Data
const MOCK_COI_STATS = {
  totalConflicts: {
    label: "Total Conflicts",
    value: "284",
    icon: "list_alt",
    subtext: "Across 1,245 submissions",
  },
  pendingReview: {
    label: "Pending Review",
    value: "45",
    icon: "pending_actions",
    badge: { label: "+12 today", variant: "warning" as const },
    subtext: "Action required",
  },
  autoDetected: {
    label: "Auto-Detected",
    value: "156",
    icon: "smart_toy",
    subtext: "55% of all conflicts",
  },
  orphanedPapers: {
    label: "Orphaned Papers",
    value: "3",
    icon: "warning",
    subtext: "Papers with 0 eligible reviewers",
  },
}

const MOCK_COI_ENTRIES: COIEntry[] = [
  {
    id: "1",
    reviewer: {
      name: "Prof. Alan Turing",
      institution: "Stanford University",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
    paper: {
      id: "#1024",
      title: "Deep Learning for Autonomous Navigation in Urban Environments",
      track: "Computer Vision",
    },
    reason: { type: "domain", label: "Domain Conflict", detail: "Same institution (Stanford)" },
    source: { type: "auto", label: "Auto" },
  },
  {
    id: "2",
    reviewer: {
      name: "Dr. Emily Chen",
      institution: "Google Research",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    },
    paper: {
      id: "#1056",
      title: "Generative Adversarial Networks for Image Synthesis",
      track: "Computer Vision",
    },
    reason: { type: "coauthor", label: "Co-Author", detail: "Co-authored in 2022" },
    source: { type: "declared", label: "Declared" },
  },
  {
    id: "3",
    reviewer: {
      name: "Prof. David Kim",
      institution: "MIT",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    paper: {
      id: "#1089",
      title: "Reinforcement Learning in Robotics: A Survey",
      track: "Robotics",
    },
    reason: { type: "advisor", label: "Advisor/Advisee", detail: "Ph.D. Advisor Relationship" },
    source: { type: "auto", label: "Auto" },
  },
  {
    id: "4",
    reviewer: {
      name: "Dr. Sarah Connor",
      institution: "Cyberdyne Systems",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    },
    paper: {
      id: "#2201",
      title: "Future of AI Safety",
      track: "AI Ethics",
    },
    reason: { type: "other", label: "Other", detail: "Personal Conflict" },
    source: { type: "declared", label: "Declared" },
  },
]

const MOCK_ACTIVITIES: ActivityEntry[] = [
  {
    id: "1",
    actor: "System",
    action: "auto-detected 15 new conflicts.",
    timestamp: "10 mins ago",
    variant: "neutral",
  },
  {
    id: "2",
    actor: "You",
    action: "confirmed 5 COIs for",
    target: "#1024",
    timestamp: "1 hour ago",
    variant: "success",
  },
  {
    id: "3",
    actor: "Dr. Emily",
    action: "reported a personal conflict.",
    timestamp: "2 hours ago",
    variant: "warning",
  },
]

// Helper Components
function getReasonVariant(type: ConflictReason["type"]) {
  switch (type) {
    case "domain":
      return "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30"
    case "coauthor":
      return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30"
    case "advisor":
      return "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900/30"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
  }
}

function getSourceIcon(type: ConflictSource["type"]) {
  return type === "auto" ? "smart_toy" : "person_alert"
}

function getSourceColor(type: ConflictSource["type"]) {
  return type === "auto" ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"
}

function getActivityDotColor(variant: ActivityEntry["variant"]) {
  switch (variant) {
    case "success":
      return "bg-green-500"
    case "warning":
      return "bg-amber-500"
    default:
      return "bg-slate-300 dark:bg-slate-600"
  }
}

// Sub-components
interface COITableRowProps {
  entry: COIEntry
  onConfirm: (id: string) => void
  onDismiss: (id: string) => void
  onReassign: (id: string) => void
}

function COITableRow({ entry, onConfirm, onDismiss, onReassign }: COITableRowProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
        {/* Reviewer */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 bg-cover bg-center border border-slate-200 dark:border-slate-600"
              style={{
                backgroundImage: entry.reviewer.avatar
                  ? `url('${entry.reviewer.avatar}')`
                  : undefined,
              }}
            />
            <div>
              <div className="text-[12px] font-bold text-[#1B3C53] dark:text-white leading-tight">
                {entry.reviewer.name}
              </div>
              <div className="text-[10px] text-slate-500">{entry.reviewer.institution}</div>
            </div>
          </div>
        </td>

        {/* Paper & ID */}
        <td className="px-3 py-3 max-w-[180px]">
          <div
            className="group/paper bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-[#1B3C53] dark:hover:border-[#1B3C53] transition-all cursor-pointer flex items-start justify-between gap-2"
            title={entry.paper.title}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-[#1B3C53] dark:text-white truncate">
                {entry.paper.id}:{" "}
                {entry.paper.title.length > 20
                  ? `${entry.paper.title.slice(0, 20)}...`
                  : entry.paper.title}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Track: {entry.paper.track}</div>
            </div>
            <span
              className="material-symbols-outlined text-slate-400 group-hover/paper:text-[#1B3C53] dark:group-hover/paper:text-white transition-colors flex-shrink-0"
              style={{ fontSize: "14px" }}
            >
              open_in_new
            </span>
          </div>
        </td>

        {/* Conflict Reason */}
        <td className="px-3 py-3">
          <button
            onClick={() => setIsDialogOpen(true)}
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity",
              getReasonVariant(entry.reason.type),
            )}
          >
            {entry.reason.label}
          </button>
        </td>

        {/* Source */}
        <td className="px-3 py-3">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider",
              entry.source.type === "auto"
                ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30"
                : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30",
            )}
            title={entry.source.type === "auto" ? "Detected by system" : "Declared by Reviewer"}
          >
            {entry.source.label}
          </span>
        </td>

        {/* Actions */}
        <td className="px-3 py-3 text-right">
          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onConfirm(entry.id)}
              className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
              title="Confirm Conflict"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                check_circle
              </span>
            </button>
            <button
              onClick={() => onDismiss(entry.id)}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Dismiss as False Positive"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                cancel
              </span>
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
            <button
              onClick={() => onReassign(entry.id)}
              className="p-1 text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              title="Reassign Reviewer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                person_search
              </span>
            </button>
          </div>
        </td>
      </tr>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Conflict Reason Details</DialogTitle>
            <DialogDescription>
              Detailed information about the conflict of interest.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Type:{" "}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border uppercase tracking-wider",
                    getReasonVariant(entry.reason.type),
                  )}
                >
                  {entry.reason.label}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Details:{" "}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {entry.reason.detail}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface BatchOperationsPanelProps {
  onAutoConfirmInstitutional: () => void
  onAutoConfirmCoauthors: () => void
  onRejectOldCOIs: () => void
  className?: string
}

function BatchOperationsPanel({
  onAutoConfirmInstitutional,
  onAutoConfirmCoauthors,
  onRejectOldCOIs,
  className,
}: BatchOperationsPanelProps) {
  return (
    <div
      className={cn(
        "bg-[#1B3C53] text-white px-4 pt-4 pb-4 rounded-xl shadow-lg relative overflow-hidden",
        className,
      )}
    >
      {/* Decorative blur */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

      <div className="relative z-10">
        <h3 className="text-sm font-bold mb-3 tracking-tight">Batch Operations</h3>

        <div className="space-y-2">
          <button
            onClick={onAutoConfirmInstitutional}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all group"
          >
            <span className="text-[11px] font-medium">Auto-Confirm Instit. COIs</span>
            <span
              className="material-symbols-outlined transition-transform group-hover:translate-x-1"
              style={{ fontSize: "12px" }}
            >
              arrow_forward
            </span>
          </button>
          <button
            onClick={onAutoConfirmCoauthors}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all group"
          >
            <span className="text-[11px] font-medium">Auto-Confirm Co-authors</span>
            <span
              className="material-symbols-outlined transition-transform group-hover:translate-x-1"
              style={{ fontSize: "12px" }}
            >
              arrow_forward
            </span>
          </button>
          <button
            onClick={onRejectOldCOIs}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all group"
          >
            <span className="text-[11px] font-medium">Reject Old COIs (&gt;5 yrs)</span>
            <span
              className="material-symbols-outlined transition-transform group-hover:translate-x-1"
              style={{ fontSize: "12px" }}
            >
              arrow_forward
            </span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-[10px] text-slate-300 leading-relaxed">
            Use these tools to process bulk conflicts based on strict rules.
          </p>
        </div>
      </div>
    </div>
  )
}

interface RecentCOIActivityProps {
  activities: ActivityEntry[]
  onViewFullLog?: () => void
  className?: string
}

function RecentCOIActivity({ activities, onViewFullLog, className }: RecentCOIActivityProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm",
        className,
      )}
    >
      <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
        Recent Activity
      </h3>

      <div className="space-y-3">
        {activities.map((activity, idx) => (
          <div
            key={activity.id}
            className={cn(
              "flex gap-3 relative pl-4",
              idx < activities.length - 1 && "pb-3 border-l border-slate-200 dark:border-slate-700",
            )}
          >
            <div
              className={cn(
                "absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900",
                getActivityDotColor(activity.variant),
              )}
            />
            <div>
              <p className="text-[11px] text-[#1B3C53] dark:text-white leading-relaxed">
                <span className="font-bold">{activity.actor}</span>{" "}
                <span className="text-slate-500">{activity.action}</span>
                {activity.target && (
                  <span className="text-slate-500 font-medium ml-0.5">{activity.target}</span>
                )}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

      {onViewFullLog && (
        <button
          onClick={onViewFullLog}
          className="w-full mt-3 text-[10px] text-slate-400 hover:text-[#1B3C53] font-medium text-center transition-colors"
        >
          View Full Log
        </button>
      )}
    </div>
  )
}

// Main Component
interface ConferenceCOIProps {
  conferenceId: string
  className?: string
}

export function ConferenceCOI({ conferenceId, className }: ConferenceCOIProps) {
  const [activeFilter, setActiveFilter] = useState<TabFilter>("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTrack, setSelectedTrack] = useState("all")

  // Handlers
  const handleConfirm = (id: string) => console.log("Confirm COI:", id)
  const handleDismiss = (id: string) => console.log("Dismiss COI:", id)
  const handleReassign = (id: string) => console.log("Reassign reviewer for COI:", id)
  const handleExportReport = () => console.log("Export COI Report")
  const handleRunAutoDetection = () => console.log("Run Auto-Detection")
  const handleAutoConfirmInstitutional = () => console.log("Auto-confirm institutional COIs")
  const handleAutoConfirmCoauthors = () => console.log("Auto-confirm co-author COIs")
  const handleRejectOldCOIs = () => console.log("Reject old COIs")
  const handleViewFullLog = () => console.log("View full log")

  // Filter entries (mock filtering)
  const filteredEntries = MOCK_COI_ENTRIES.filter((entry) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        entry.reviewer.name.toLowerCase().includes(query) ||
        entry.paper.id.toLowerCase().includes(query) ||
        entry.paper.title.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Conflicts of Interest Management
          </h2>
          <p className="text-[12px] text-slate-500 mt-1 max-w-xl leading-relaxed">
            Review automatically detected conflicts and manage reviewer assignments to ensure fair
            paper evaluation.{" "}
            <span className="text-[#1B3C53] dark:text-slate-300 font-medium cursor-pointer hover:underline">
              Learn more about COI policies
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleExportReport}
            className="h-8 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              file_download
            </span>
            Export Report
          </button>
          <button
            onClick={handleRunAutoDetection}
            className="h-8 px-3 bg-[#1B3C53] text-white text-[11px] font-medium rounded-md hover:bg-[#234C6A] transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              person_add
            </span>
            Auto-assign
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStatsGrid>
        <DashboardStatsCard {...MOCK_COI_STATS.totalConflicts} />
        <DashboardStatsCard
          {...MOCK_COI_STATS.pendingReview}
          className="border-orange-200 dark:border-orange-900/30"
        />
        <DashboardStatsCard {...MOCK_COI_STATS.autoDetected} />
        <DashboardStatsCard {...MOCK_COI_STATS.orphanedPapers} />
      </DashboardStatsGrid>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table Section */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
          {/* Filter Bar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Tab Filter */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                {(["pending", "confirmed", "dismissed"] as TabFilter[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={cn(
                      "px-3 py-1 text-[10px] font-medium rounded transition-all capitalize",
                      activeFilter === tab
                        ? "bg-white dark:bg-slate-700 text-[#1B3C53] dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-[#1B3C53] dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

              {/* Track Selector */}
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="bg-transparent border border-[#e3e3e3] rounded-lg text-[10px] font-medium text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer hover:text-[#1B3C53] py-[7px] px-1 w-[90px]"
              >
                <option value="all">All Tracks</option>
                <option value="cv">Computer Vision</option>
                <option value="nlp">NLP</option>
                <option value="robotics">Robotics</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-56">
              <span
                className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                style={{ fontSize: "16px" }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Search reviewer, paper ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] dark:text-white placeholder-slate-400 transition-shadow"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 tracking-widest">
                <tr>
                  <th className="px-3 py-2.5">Reviewer</th>
                  <th className="px-3 py-2.5">Submission</th>
                  <th className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span>Conflict Reason</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="material-symbols-outlined text-slate-400 cursor-help"
                            style={{ fontSize: "12px" }}
                          >
                            help
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-[8px] font-light">Clicks to view details</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </th>
                  <th className="px-3 py-2.5">Source</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEntries.map((entry) => (
                  <COITableRow
                    key={entry.id}
                    entry={entry}
                    onConfirm={handleConfirm}
                    onDismiss={handleDismiss}
                    onReassign={handleReassign}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Showing{" "}
              <span className="font-bold text-[#1B3C53] dark:text-white">
                1-{filteredEntries.length}
              </span>{" "}
              of <span className="font-bold text-[#1B3C53] dark:text-white">45</span> pending
              conflicts
            </div>
            <div className="flex gap-1">
              <button
                disabled
                className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button className="px-2.5 py-1 bg-[#1B3C53] text-white rounded text-[10px] hover:bg-[#234C6A]">
                1
              </button>
              <button className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50">
                2
              </button>
              <button className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50">
                3
              </button>
              <span className="px-1.5 text-slate-400 text-[10px]">...</span>
              <button className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
