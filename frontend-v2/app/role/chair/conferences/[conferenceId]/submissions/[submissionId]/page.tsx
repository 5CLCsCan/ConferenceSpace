"use client"

import { Suspense, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SubmissionDetailHeader } from "@/components/chair/conference-detail/submission-detail-header"
import { SubmissionDetailContent } from "@/components/chair/conference-detail/submission-detail-content"
import { MOCK_SUBMISSION_DETAIL } from "@/components/chair/conference-detail/submission-detail/mock-data"
import type { ConferenceInfo } from "@/components/chair/conference-detail/types"
import type { SubmissionSubTab } from "@/components/chair/conference-detail/submission-detail/types"
import { getSidebarMenuItems } from "@/lib/navigation"

export default function ChairSubmissionDetailPage() {
  const params = useParams()
  const conferenceId = params.conferenceId as string
  const submissionId = params.submissionId as string

  const { unreadCount } = useNotifications({ limit: 1 })
  const [activeTab, setActiveTab] = useState<SubmissionSubTab>("overview")

  const conference = useMemo<ConferenceInfo>(
    () => ({
      id: conferenceId,
      acronym: "CONF",
      fullName: "Conference Detail",
      location: "TBD",
      startDate: "-",
      endDate: "-",
      year: "2026",
    }),
    [conferenceId],
  )

  const submission = MOCK_SUBMISSION_DETAIL

  return (
    <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("chair", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <SubmissionDetailHeader
          conference={conference}
          conferenceId={conferenceId}
          submissionTitle={submission.title}
          submissionDisplayId={submission.displayId}
          submissionTrack={submission.track}
          submissionStatus={submission.status}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black">
          <div className="px-8 py-6 w-full max-w-[1600px] mx-auto">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
                  Loading...
                </div>
              }
            >
              <SubmissionDetailContent
                submission={submission}
                activeTab={activeTab}
                conferenceId={conferenceId}
                submissionId={submissionId}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}

