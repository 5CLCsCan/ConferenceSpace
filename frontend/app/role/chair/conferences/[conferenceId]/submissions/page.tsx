"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import {
  ConferenceDetailHeader,
  ConferenceSubmissions,
  type TabId,
  type ConferenceInfo,
} from "@/components/chair/conference-detail"
import { getSidebarMenuItems } from "@/lib/navigation"
import { ROUTES } from "@/lib/routes"
import { getConferenceById } from "@/lib/api/conferences"

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

export default function ChairConferenceSubmissionsPage() {
  const params = useParams()
  const conferenceId = params.conferenceId as string

  const { unreadCount } = useNotifications({ limit: 1 })
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>("submissions")
  const [conference, setConference] = useState<ConferenceInfo>({
    id: conferenceId,
    acronym: "CONF",
    fullName: "Conference Detail",
    location: "TBD",
    startDate: "-",
    endDate: "-",
    year: "2026",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadConference() {
      setLoading(true)
      setError(null)
      const response = await getConferenceById(conferenceId)
      if (response.error || !response.data) {
        setError(response.error || "Failed to load conference")
        setLoading(false)
        return
      }

      const data = response.data
      setConference({
        id: conferenceId,
        acronym: data.acronym || data.name || "CONF",
        fullName: data.name || "Conference",
        location: data.location || "TBD",
        startDate: formatDate(data.conference_date),
        endDate: formatDate(data.conference_end_date),
        year: String(data.year || new Date().getFullYear()),
      })
      setLoading(false)
    }

    void loadConference()
  }, [conferenceId])

  const handleTabChange = (tab: TabId) => {
    if (tab === "submissions") {
      setActiveTab(tab)
      return
    }

    router.push(ROUTES.CHAIR.CONFERENCE_DETAIL(conferenceId))
  }

  return (
    <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("chair", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <ConferenceDetailHeader
          conference={conference}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black">
          <div className="px-8 py-6 w-full max-w-[1600px] mx-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
                Loading...
              </div>
            ) : error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                Failed to load conference: {error}
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
                    Loading...
                  </div>
                }
              >
                <ConferenceSubmissions conferenceId={conferenceId} />
              </Suspense>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
