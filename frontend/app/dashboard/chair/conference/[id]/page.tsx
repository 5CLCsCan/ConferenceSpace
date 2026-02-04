"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import {
  ConferenceDetailHeader,
  ConferenceDetailDashboard,
  ConferenceOverview,
  ConferenceCFP,
  ConferenceDates,
  ConferenceCommittee,
  ConferenceCOI,
  ConferenceSubmissions,
  type TabId,
  type ConferenceInfo,
} from "@/components/chair/conference-detail"

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

export default function ChairConferenceDetailPage() {
  const params = useParams()
  const conferenceId = params.id as string

  const { isAuthenticated, user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")

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

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ConferenceDetailDashboard conferenceId={conferenceId} />
      case "overview":
        return <ConferenceOverview conferenceId={conferenceId} />
      case "cfp":
        return <ConferenceCFP conferenceId={conferenceId} />
      case "dates":
        return <ConferenceDates conferenceId={conferenceId} />
      case "committee":
        return <ConferenceCommittee conferenceId={conferenceId} />
      case "submissions":
        return <ConferenceSubmissions conferenceId={conferenceId} />
      case "coi":
        return <ConferenceCOI conferenceId={conferenceId} />
      default:
        return null
    }
  }

  return (
    <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={menuItems} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Sticky Header with Tabs */}
        <ConferenceDetailHeader
          conference={MOCK_CONFERENCE}
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
              {renderTabContent()}
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
