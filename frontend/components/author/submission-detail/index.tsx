"use client"

import { useState } from "react"
import type { Conference } from "@/lib/types"
import type { Submission } from "@/lib/api/submissions"
import { SubmissionHeader, type TabId } from "./submission-header"
import { OverviewTab } from "./overview-tab"
import { DiscussionTab } from "./discussion-tab"
import { RebuttalTab } from "./rebuttal-tab"

interface SubmissionDetailViewProps {
  submission: Submission
  conferenceId: string
  conferenceName?: string
  conference?: Conference | null
  initialTab?: TabId
  onSubmissionChange?: (submission: Submission) => void
}

export function SubmissionDetailView({
  submission,
  conferenceId,
  conferenceName,
  conference,
  initialTab = "overview",
  onSubmissionChange,
}: SubmissionDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky Header with Tabs */}
      <SubmissionHeader
        submission={submission}
        conferenceId={conferenceId}
        conferenceName={conferenceName}
        conference={conference}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black">
        <div className="px-8 py-6 w-full max-w-[1600px] mx-auto">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <OverviewTab
              submission={submission}
              conferenceId={conferenceId}
              conference={conference}
              onSubmissionChange={onSubmissionChange}
            />
          )}

          {/* Discussion Tab */}
          {activeTab === "discussion" && (
            <div className="animate-in fade-in duration-200">
              <DiscussionTab conferenceId={conferenceId} submissionId={String(submission.id)} />
            </div>
          )}

          {/* Rebuttal Tab */}
          {activeTab === "rebuttal" && (
            <div className="animate-in fade-in duration-200 pb-24">
              <RebuttalTab conferenceId={conferenceId} submissionId={String(submission.id)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Re-export types
export type { SubmissionDetailViewProps }
