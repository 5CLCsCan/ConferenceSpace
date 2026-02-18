"use client"

import { Suspense, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import {
  ConferenceDetailHeader,
  ConferenceSubmissions,
  type TabId,
  type ConferenceInfo,
} from "@/components/chair/conference-detail"
import { getChairMenuItems } from "@/components/chair/menu-items"

export default function ChairConferenceSubmissionsPage() {
  const params = useParams()
  const conferenceId = params.conferenceId as string

  const { unreadCount } = useNotifications({ limit: 1 })
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>("submissions")

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

  const handleTabChange = (tab: TabId) => {
    if (tab === "submissions") {
      setActiveTab(tab)
      return
    }

    router.push(`/role/chair/conferences/${conferenceId}`)
  }

  return (
    <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getChairMenuItems(unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <ConferenceDetailHeader
          conference={conference}
          activeTab={activeTab}
          onTabChange={handleTabChange}
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
              <ConferenceSubmissions conferenceId={conferenceId} />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}

