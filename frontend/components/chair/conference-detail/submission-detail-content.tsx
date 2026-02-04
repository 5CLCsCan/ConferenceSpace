"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { SubmissionDetail, SubmissionSubTab } from "./submission-detail/types"
import { FileTypeIcon, AuthorAvatar } from "./submission-detail/components"
import { ChairDiscussionTab } from "./submission-detail/chair-discussion-tab"
import { ChairReviewsTab } from "./submission-detail/chair-reviews-tab"
import { ChairHistoryTab } from "./submission-detail/chair-history-tab"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface SubmissionDetailContentProps {
  submission: SubmissionDetail
  activeTab: SubmissionSubTab
  className?: string
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
export function SubmissionDetailContent({
  submission,
  activeTab,
  className,
}: SubmissionDetailContentProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Content Grid */}
      {activeTab === "overview" && (
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
      {activeTab === "reviews" && <ChairReviewsTab submission={submission} />}

      {activeTab === "discussion" && <ChairDiscussionTab />}

      {activeTab === "history" && <ChairHistoryTab />}
    </div>
  )
}
