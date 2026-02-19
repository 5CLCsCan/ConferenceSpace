"use client"

import { Suspense, useMemo, useState } from "react"
import { useParams } from "next/navigation"
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
import { getSidebarMenuItems } from "@/lib/navigation"

export default function ChairConferenceDetailPage() {
  const params = useParams()
  const conferenceId = params.conferenceId as string

  const { unreadCount } = useNotifications({ limit: 1 })
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")

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
      <DashboardSidebar menuItems={getSidebarMenuItems("chair", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <ConferenceDetailHeader
          conference={conference}
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
              {renderTabContent()}
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}

