"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import type { Submission } from "@/lib/api/submissions"
import { SubmissionReviewTab } from "@/components/chair/submission-review-tab"
import { SubmissionHeader } from "./submission-header"
import { OverviewTab } from "./overview-tab"
import { DiscussionTab } from "./discussion-tab"
import { RebuttalTab } from "./rebuttal-tab"

type TabId = "overview" | "discussion" | "rebuttal"

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

  const handleDecision = async (decision: "accepted" | "rejected") => {
    try {
      const { updateSubmissionStatus } = await import("@/lib/api/submissions")
      const response = await updateSubmissionStatus(
        conferenceId,
        submission.id.toString(),
        decision,
      )

      if (response.error) {
        console.error("Failed to update submission status:", response.error)
        return
      }

      console.log(`Successfully updated submission ${submission.id} to ${decision}`)
      window.location.reload()
    } catch (error) {
      console.error("Error updating submission status:", error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SubmissionHeader
        submission={submission}
        conferenceId={conferenceId}
        conferenceName={conferenceName}
        onDecision={handleDecision}
      />

      {/* Tabs */}
      <div className="relative">
        <div className="border-b border-neutral-200 mb-6">
          <nav className="flex gap-8">
            {(["overview", "discussion", "rebuttal"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer py-3 border-b-2 font-bold text-sm transition-all ${
                  activeTab === tab
                    ? "border-[#1e3a8a] text-[#1e3a8a]"
                    : "border-transparent text-neutral-500 hover:text-[#1e3a8a]"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

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
  )
}

// Re-export types
export type { SubmissionDetailViewProps }
