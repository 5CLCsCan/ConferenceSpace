"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SubmissionDetailHeader } from "@/components/chair/conference-detail/submission-detail-header"
import { SubmissionDetailContent } from "@/components/chair/conference-detail/submission-detail-content"
import { MOCK_SUBMISSION_DETAIL } from "@/components/chair/conference-detail/submission-detail/mock-data"
import type { ConferenceInfo } from "@/components/chair/conference-detail/types"
import type { SubmissionSubTab } from "@/components/chair/conference-detail/submission-detail/types"

// Mock conference data - will be replaced with API call
const MOCK_CONFERENCE: ConferenceInfo = {
  id: "aaai-2024",
  acronym: "AAAI",
  fullName: "38th AAAI Conference on Artificial Intelligence",
  location: "Vancouver, Canada",
  startDate: "Feb 20",
  endDate: "Feb 27, 2024",
  year: "2024",
}

export default function ChairSubmissionDetailPage() {
  const params = useParams()
  const conferenceId = params.id as string
  const submissionId = params.submissionId as string

  const { isAuthenticated, user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [activeTab, setActiveTab] = useState<SubmissionSubTab>("overview")

  // Auth check
  useEffect(() => {
    const timer = setTimeout(() => setAuthChecked(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push("/login")
    }
  }, [authChecked, isAuthenticated, router])

  if (!authChecked) {
    return (
      <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  // In production, fetch submission by submissionId
  const submission = MOCK_SUBMISSION_DETAIL

  const menuItems = [
    { label: "Conferences", href: "/dashboard/conference", icon: "folder_open" },
    { label: "Schedules", href: "/dashboard/chair/schedules", icon: "calendar_month" },
    {
      label: "Notifications",
      href: "/notifications",
      icon: "notifications",
      badge: unreadCount,
    },
    { label: "Dashboard", href: "/dashboard/chair", icon: "dashboard" },
  ]

  return (
    <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={menuItems} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Sticky Header with Tabs */}
        <SubmissionDetailHeader
          conference={MOCK_CONFERENCE}
          conferenceId={conferenceId}
          submissionId={submissionId}
          submissionTitle={submission.title}
          submissionDisplayId={submission.displayId}
          submissionTrack={submission.track}
          submissionStatus={submission.status}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black">
          <div className="px-8 py-6 w-full max-w-[1600px] mx-auto">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
                  Loading...
                </div>
              }
            >
              <SubmissionDetailContent submission={submission} activeTab={activeTab} />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
