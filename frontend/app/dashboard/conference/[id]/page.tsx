"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Conference } from "@/lib/types"
import { getConferenceById } from "@/lib/api/conferences"
import { ConferenceOverview } from "@/components/conference/conference-overview"
import { ConferenceCallForPapers } from "@/components/conference/conference-call-for-papers"
import { ConferenceImportantDates } from "@/components/conference/conference-important-dates"
import { ConferenceCommittee } from "@/components/conference/conference-committee"
import { ConferenceSubmissions } from "@/components/conference/conference-submissions"
import { COIDashboard } from "@/components/coi"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n/translation-context"

type TabType = "overview" | "call-for-papers" | "dates" | "committee" | "submissions" | "coi-demo"

export default function ConferencePage() {
  const params = useParams()
  const conferenceId = params.id as string
  const { user, currentRole, switchRole } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("overview")

  useEffect(() => {
    async function loadConference() {
      setLoading(true)
      const response = await getConferenceById(conferenceId)
      if (response.data) {
        setConference(response.data)
      }
      setLoading(false)
    }

    loadConference()
  }, [conferenceId])

  const tabs = useMemo(
    () => [
      { id: "overview" as TabType, label: t("dashboard.conference.details.tabs.overview") },
      {
        id: "call-for-papers" as TabType,
        label: t("dashboard.conference.details.tabs.callForPapers"),
      },
      { id: "dates" as TabType, label: t("dashboard.conference.details.tabs.dates") },
      { id: "committee" as TabType, label: t("dashboard.conference.details.tabs.committee") },
      { id: "submissions" as TabType, label: t("dashboard.conference.details.tabs.submissions") },
      {
        id: "coi-demo" as TabType,
        label: t("dashboard.conference.details.tabs.coiDemo") || "COI Demo",
      },
    ],
    [t],
  )

  const roleConfig = useMemo(
    () => ({
      author: { label: t("dashboard.roles.author.name"), color: "bg-blue-100 text-blue-700" },
      reviewer: { label: t("dashboard.roles.reviewer.name"), color: "bg-green-100 text-green-700" },
      chair: { label: t("dashboard.roles.chair.name"), color: "bg-purple-100 text-purple-700" },
      admin: { label: t("dashboard.roles.admin.name"), color: "bg-red-100 text-red-700" },
    }),
    [t],
  )

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!conference) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard.conference.details.notFoundTitle")}
          </h1>
          <p className="mt-2 text-gray-600">{t("dashboard.conference.details.notFound")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {currentRole && ["author", "reviewer", "chair"].includes(currentRole) && (
        <DashboardHeader role={currentRole as "author" | "reviewer" | "chair"} />
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="sticky top-0">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900">{conference.acronym}</h2>
              <p className="mt-1 text-sm text-gray-600">{conference.year}</p>
            </div>

            <nav className="p-4">
              <ul className="space-y-1">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {user && (
              <div className="border-t border-gray-200 p-4">
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    {t("dashboard.conference.details.currentRole")}
                  </p>
                  {currentRole && (
                    <Badge className={`${roleConfig[currentRole].color} border-0`}>
                      {roleConfig[currentRole].label}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">
                    {t("dashboard.conference.details.switchRole")}
                  </p>
                  <div className="flex flex-col gap-2">
                    {user.roles.map((role) => (
                      <Button
                        key={role}
                        variant={currentRole === role ? "default" : "outline"}
                        size="sm"
                        onClick={() => switchRole(role)}
                        className="w-full justify-start text-xs"
                      >
                        {roleConfig[role].label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {user && (
              <div className="border-t border-gray-200 p-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">
                    {t("dashboard.conference.details.loggedInAs")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto relative">
          <div className="mx-auto max-w-7xl p-8">
            {currentRole === "author" && (
              <Button
                onClick={() => router.push(`/dashboard/author/submit?conference=${conference.id}`)}
                className="absolute top-4 right-4 bg-primary text-white px-4 py-2 rounded-md shadow-md hover:bg-primary/90 flex items-center gap-2 text-sm font-medium"
              >
                {t("dashboard.conference.details.joinNow")}
              </Button>
            )}
            {activeTab === "overview" && <ConferenceOverview conference={conference} />}
            {activeTab === "call-for-papers" && <ConferenceCallForPapers conference={conference} />}
            {activeTab === "dates" && <ConferenceImportantDates conferenceId={conference.id} />}
            {activeTab === "committee" && <ConferenceCommittee conferenceId={conference.id} />}
            {activeTab === "submissions" && <ConferenceSubmissions conferenceId={conference.id} />}
            {activeTab === "coi-demo" && <COIDashboard conferenceId={conference.id} />}
          </div>
        </main>
      </div>
    </div>
  )
}
