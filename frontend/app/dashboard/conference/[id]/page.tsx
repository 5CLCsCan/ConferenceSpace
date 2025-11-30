"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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
import { typography, spacing } from "@/lib/typography"
import { ConferenceDashboard } from "@/components/conference/conference-dashboard"

type TabType =
  | "dashboard"
  | "overview"
  | "call-for-papers"
  | "dates"
  | "committee"
  | "submissions"
  | "coi-demo"

export default function ConferencePage() {
  const params = useParams()
  const conferenceId = params.id as string
  const searchParams = useSearchParams()
  const { user, currentRole, isAuthenticated } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get("tab") as TabType) || (currentRole === "chair" ? "dashboard" : "overview"),
  )

  // Wait for auth to be checked before redirecting
  useEffect(() => {
    // Give auth context time to initialize from localStorage
    const timer = setTimeout(() => {
      setAuthChecked(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!authChecked) {
      return
    }

    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [authChecked, isAuthenticated, router])

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

  // Redirect authors away from COI Demo tab and Dashboard tab
  useEffect(() => {
    if (currentRole === "author" && (activeTab === "coi-demo" || activeTab === "dashboard")) {
      setActiveTab("overview")
    }
  }, [currentRole, activeTab])

  const tabs = useMemo(() => {
    const allTabs = [
      { id: "overview" as TabType, label: t("dashboard.conference.details.tabs.overview") },
      {
        id: "call-for-papers" as TabType,
        label: t("dashboard.conference.details.tabs.callForPapers"),
      },
      { id: "dates" as TabType, label: t("dashboard.conference.details.tabs.dates") },
      {
        id: "committee" as TabType,
        label:
          currentRole === "chair" ? "Reviewers" : t("dashboard.conference.details.tabs.committee"),
      },
      { id: "submissions" as TabType, label: t("dashboard.conference.details.tabs.submissions") },
      {
        id: "coi-demo" as TabType,
        label: t("dashboard.conference.details.tabs.coiDemo") || "COI Demo",
      },
      ...(currentRole === "chair"
        ? [
            {
              id: "dashboard" as TabType,
              label: "Statistics",
            },
          ]
        : []),
    ]
    // Hide COI Demo tab for authors
    return currentRole === "author" ? allTabs.filter((tab) => tab.id !== "coi-demo") : allTabs
  }, [t, currentRole])

  const roleConfig = useMemo(
    () => ({
      author: { label: t("dashboard.roles.author.name"), color: "bg-muted text-muted-foreground" },
      reviewer: {
        label: t("dashboard.roles.reviewer.name"),
        color: "bg-secondary/10 text-secondary-foreground",
      },
      chair: { label: t("dashboard.roles.chair.name"), color: "bg-primary/10 text-primary" },
      admin: {
        label: t("dashboard.roles.admin.name"),
        color: "bg-destructive/10 text-destructive",
      },
    }),
    [t],
  )

  if (!authChecked || !isAuthenticated || loading) {
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
          <h1 className={`${typography.h2} ${typography.bold} text-gray-900`}>
            {t("dashboard.conference.details.notFoundTitle")}
          </h1>
          <p className={`mt-2 ${typography.body} text-gray-600`}>
            {t("dashboard.conference.details.notFound")}
          </p>
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
            <div className={`border-b border-gray-200 ${spacing.padding.card}`}>
              <h2 className={`${typography.h5} ${typography.bold} text-gray-900`}>
                {conference.name}
              </h2>
              <p className={`mt-0.5 ${typography.bodySmall} text-gray-600`}>{conference.acronym}</p>
            </div>

            <nav className={spacing.padding.card}>
              <ul className={spacing.tight}>
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => {
                        setActiveTab(tab.id)
                        // Update URL without triggering navigation for instant switching
                        const url = new URL(window.location.href)
                        url.searchParams.set("tab", tab.id)
                        window.history.replaceState({}, "", url)
                      }}
                      className={`flex w-full items-center ${spacing.gap.sm} rounded-lg px-3 py-2 text-left ${typography.bodySmall} ${typography.medium} transition-colors ${
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
              <div className={`border-t border-gray-200 ${spacing.padding.card}`}>
                <div>
                  <p
                    className={`${typography.bodySmall} ${typography.medium} text-gray-500 mb-1.5`}
                  >
                    {t("dashboard.conference.details.currentRole")}
                  </p>
                  {currentRole && (
                    <Badge
                      className={`${roleConfig[currentRole].color} border-0 ${typography.bodySmall}`}
                    >
                      {roleConfig[currentRole].label}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {user && (
              <div className={`border-t border-gray-200 ${spacing.padding.card}`}>
                <div className={`rounded-lg bg-gray-50 p-2.5`}>
                  <p className={`${typography.bodySmall} ${typography.medium} text-gray-500`}>
                    {t("dashboard.conference.details.loggedInAs")}
                  </p>
                  <p
                    className={`mt-0.5 ${typography.bodySmall} ${typography.semibold} text-gray-900`}
                  >
                    {user.name}
                  </p>
                  <p className={`${typography.bodySmall} text-gray-600`}>{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto relative">
          <div className="mx-auto max-w-7xl p-5">
            {activeTab === "dashboard" && <ConferenceDashboard conferenceId={conference.id} />}
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
