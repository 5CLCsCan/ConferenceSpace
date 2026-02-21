"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { SubmissionDetail, SubmissionSubTab } from "./types"
import { MOCK_SUBMISSION_DETAIL } from "./mock-data"
import { SubmissionStatusBadge, FileTypeIcon, AuthorAvatar } from "./components"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface SubmissionDetailViewProps {
  conferenceId: string
  submissionId: string
  onBack?: () => void
  className?: string
}

// --- Sub Tab Navigation ---
const SUB_TABS: { id: SubmissionSubTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "reviews", label: "Reviews & Feedback" },
  { id: "discussion", label: "Discussion" },
  { id: "history", label: "History" },
]

function SubTabNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: SubmissionSubTab
  onTabChange: (tab: SubmissionSubTab) => void
}) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
      <div className="flex gap-8">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "pb-3 border-b-2 text-sm font-medium cursor-pointer transition-colors",
              activeTab === tab.id
                ? "border-[#1B3C53] text-[#1B3C53] dark:text-white dark:border-white font-semibold"
                : "border-transparent text-slate-500 hover:text-[#1B3C53] dark:hover:text-white",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// --- Abstract Card ---
function AbstractCard({ abstract, keywords }: { abstract: string; keywords: string[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-4 tracking-tight">
        Abstract
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{abstract}</p>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium rounded-full"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  )
}

// --- Submission Files Card ---
function SubmissionFilesCard({
  files,
  lastUpdated,
}: {
  files: SubmissionDetail["files"]
  lastUpdated: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
          Submission Files
        </h3>
        <span className="text-[10px] text-slate-400">Last updated: {lastUpdated}</span>
      </div>
      <div className="space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <FileTypeIcon type={file.type} />
            <div className="flex-1 min-w-0 ml-4">
              <h4 className="text-xs font-medium text-[#1B3C53] dark:text-white truncate">
                {file.name}
              </h4>
              <p className="text-[10px] text-slate-500">
                {file.size} - {file.type.toUpperCase()}{" "}
                {file.type === "pdf" ? "Document" : "Archive"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {file.type === "pdf" && (
                <button
                  className="p-2 text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors"
                  title="Preview"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    visibility
                  </span>
                </button>
              )}
              <button
                className="p-2 text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors"
                title="Download"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  download
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Cover Letter Card (Collapsible) ---
function CoverLetterCard({ content }: { content?: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "20px" }}>
            mail
          </span>
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Cover Letter
          </h3>
        </div>
        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "20px" }}>
          {isExpanded ? "expand_less" : "expand_more"}
        </span>
      </button>
      {isExpanded && content && (
        <div className="px-6 pb-6 pt-0">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{content}</p>
        </div>
      )}
    </div>
  )
}

// --- Submission Meta Card (Sidebar) ---
function SubmissionMetaCard({
  authors,
  conflictsOfInterest,
}: {
  authors: SubmissionDetail["authors"]
  conflictsOfInterest: string[]
}) {
  const [selectedAffiliation, setSelectedAffiliation] = useState<string | null>(null)

  const handleAuthorProfileClick = (authorId: string) => {
    // TODO: Implement profile navigation
    console.log("Navigate to author profile:", authorId)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-4">
        Submission Meta
      </h3>
      <div className="space-y-6">
        {/* Authors */}
        <div>
          <h4 className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Author(s)
          </h4>
          <div className="space-y-3">
            {authors.map((author) => (
              <div
                key={author.id}
                className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <AuthorAvatar name={author.name} avatar={author.avatar} />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-[#1B3C53] dark:text-white truncate">
                    {author.name}
                    {author.isCorresponding && " (Corr.)"}
                  </span>
                  <span className="text-[9px] text-slate-500 truncate">{author.affiliation}</span>
                </div>
                <button
                  onClick={() => handleAuthorProfileClick(author.id)}
                  className="p-1.5 text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors flex-shrink-0"
                  title="View profile"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    open_in_new
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Conflicts of Interest */}
        <div>
          <h4 className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Conflicts of Interest
          </h4>
          <div className="flex flex-wrap gap-2">
            {conflictsOfInterest.map((affiliation, index) => (
              <button
                key={index}
                onClick={() => setSelectedAffiliation(affiliation)}
                className="px-3 py-1.5 text-[10px] text-[#1B3C53] dark:text-white font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {affiliation}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Affiliation Details Dialog */}
      <Dialog
        open={selectedAffiliation !== null}
        onOpenChange={(open) => !open && setSelectedAffiliation(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Affiliation Details</DialogTitle>
            <DialogDescription>{selectedAffiliation}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Additional details about this affiliation will be displayed here.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Main Component ---
export function SubmissionDetailView({
  conferenceId,
  submissionId,
  onBack,
  className,
}: SubmissionDetailViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubmissionSubTab>("overview")

  // In production, fetch submission by submissionId
  const submission = MOCK_SUBMISSION_DETAIL

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <button
              onClick={onBack}
              className="hover:text-[#1B3C53] dark:hover:text-white transition-colors"
            >
              Submissions
            </button>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              chevron_right
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Submission {submission.displayId}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-[#1B3C53] dark:text-white leading-tight tracking-tight mb-3">
            {submission.title}
          </h2>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>
              Track:{" "}
              <strong className="text-slate-700 dark:text-slate-300">{submission.track}</strong>
            </span>
            <SubmissionStatusBadge status={submission.status} />
            <span className="text-[10px] text-slate-400">{submission.displayId}</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <SubTabNavigation activeTab={activeSubTab} onTabChange={setActiveSubTab} />

      {/* Content Grid */}
      {activeSubTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <AbstractCard abstract={submission.abstract} keywords={submission.keywords} />
            <SubmissionFilesCard files={submission.files} lastUpdated={submission.lastUpdated} />
            <CoverLetterCard content={submission.coverLetter} />
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            <SubmissionMetaCard
              authors={submission.authors}
              conflictsOfInterest={submission.conflictsOfInterest}
            />
          </div>
        </div>
      )}

      {/* Other tabs - placeholder */}
      {activeSubTab === "reviews" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
          <span
            className="material-symbols-outlined text-slate-300 dark:text-slate-600 mb-4"
            style={{ fontSize: "48px" }}
          >
            rate_review
          </span>
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
            Reviews & Feedback
          </h3>
          <p className="text-xs text-slate-400">
            Detailed review comments and feedback will be displayed here.
          </p>
        </div>
      )}

      {activeSubTab === "discussion" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
          <span
            className="material-symbols-outlined text-slate-300 dark:text-slate-600 mb-4"
            style={{ fontSize: "48px" }}
          >
            forum
          </span>
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Discussion</h3>
          <p className="text-xs text-slate-400">
            Reviewer discussion threads and meta-reviews will be displayed here.
          </p>
        </div>
      )}

      {activeSubTab === "history" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
          <span
            className="material-symbols-outlined text-slate-300 dark:text-slate-600 mb-4"
            style={{ fontSize: "48px" }}
          >
            history
          </span>
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">History</h3>
          <p className="text-xs text-slate-400">
            Submission history and status changes will be displayed here.
          </p>
        </div>
      )}
    </div>
  )
}
