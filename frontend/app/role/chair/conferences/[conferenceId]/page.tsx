"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
  ConferenceAssignments,
  ConferenceRebuttalSettings,
  ConferenceRebuttalManagement,
  type TabId,
  type ConferenceInfo,
} from "@/components/chair/conference-detail"
import { getSidebarMenuItems } from "@/lib/navigation"
import { getConferenceById } from "@/lib/api/conferences"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

export default function ChairConferenceDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const conferenceId = params.conferenceId as string
  const { currentRole, isAuthLoading } = useAuth()

  const { unreadCount } = useNotifications({ limit: 1 })
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")
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

      // Handle 403 Forbidden - redirect to unauthorized page
      if (response.status === 403) {
        router.push("/")
        return
      }

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
  }, [conferenceId, router])

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <ConferenceDetailDashboard
            conferenceId={conferenceId}
            onNavigateToAssignments={() => setActiveTab("assignments")}
          />
        )
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
      case "assignments":
        return <ConferenceAssignments conferenceId={conferenceId} />
      case "coi":
        return <ConferenceCOI conferenceId={conferenceId} />
      case "rebuttal":
        return (
          <div className="space-y-6">
            <ConferenceRebuttalSettings conferenceId={conferenceId} />
            <ConferenceRebuttalManagement conferenceId={conferenceId} />
          </div>
        )
      default:
        return null
    }
  }

  // Route guard: redirect non-chairs away from chair pages
  if (!isAuthLoading && currentRole !== "chair") {
    router.replace("/role")
    return null
  }

  return (
    <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("chair", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <ConferenceDetailHeader
          conference={conference}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={currentRole ?? undefined}
        />

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black">
          <div className="px-8 py-6 w-full max-w-[1600px] mx-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
                {t("runtime.app.role.chair.conferences.conferenceId.page.text_loading")}{" "}
              </div>
            ) : error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {t(
                  "runtime.app.role.chair.conferences.conferenceId.page.text_failed_to_load_conference",
                )}{" "}
                {error}
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
                    {t("runtime.app.role.chair.conferences.conferenceId.page.text_loading")}{" "}
                  </div>
                }
              >
                {renderTabContent()}
              </Suspense>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
