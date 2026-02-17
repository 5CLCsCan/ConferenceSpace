"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import type { Submission } from "@/lib/api/submissions"
import { SubmissionReviewTab } from "@/components/chair/submission-review-tab"
import { SubmissionHeader, type TabId } from "./submission-header"
import { OverviewTab } from "./overview-tab"
import { DiscussionTab } from "./discussion-tab"
import { RebuttalTab } from "./rebuttal-tab"

interface SubmissionDetailViewProps {
  submission: Submission
  conferenceId: string
  conferenceName?: string
}

export function SubmissionDetailView({
  submission,
  conferenceId,
  conferenceName,
}: SubmissionDetailViewProps) {
  const { currentRole } = useAuth()
  const isChair = currentRole === "chair"
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky Header with Tabs */}
      <SubmissionHeader
        submission={submission}
        conferenceId={conferenceId}
        conferenceName={conferenceName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black">
        <div className="px-8 py-6 w-full max-w-[1600px] mx-auto">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <OverviewTab submission={submission} conferenceId={conferenceId} />
          )}

          {/* Discussion Tab */}
          {activeTab === "discussion" && (
            <div className="animate-in fade-in duration-200">
              {isChair ? (
                <SubmissionReviewTab
                  conferenceId={conferenceId}
                  submissionId={submission.id.toString()}
                />
              ) : (
                <DiscussionTab />
              )}
            </div>
          )}

          {/* Rebuttal Tab */}
          {activeTab === "rebuttal" && (
            <div className="animate-in fade-in duration-200 pb-24">
              <RebuttalTab />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Re-export types
export type { SubmissionDetailViewProps }
