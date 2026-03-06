"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  getConferenceById,
  getConferenceDates,
  type Conference,
  type ImportantDate,
} from "@/lib/api/conferences"
import { getConferenceSubmissions } from "@/lib/api/submissions"
import {
  ConferenceHeader,
  OverviewTab,
  CallForPapersTab,
  ImportantDatesTab,
  CommitteeTab,
  type TabType,
} from "./conference-detail"
import { useTranslation } from "@/lib/i18n/translation-context"

interface AuthorConferenceDetailProps {
  conferenceId: string
}

export function AuthorConferenceDetail({ conferenceId }: AuthorConferenceDetailProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [conference, setConference] = useState<Conference | null>(null)
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [hasSubmission, setHasSubmission] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const [conferenceResponse, datesResponse, submissionsResponse] = await Promise.all([
          getConferenceById(conferenceId),
          getConferenceDates(conferenceId),
          user?.email
            ? getConferenceSubmissions(conferenceId, { author: user.email, limit: 1, offset: 0 })
            : Promise.resolve({ data: null, error: null, status: 200 }),
        ])

        if (!conferenceResponse.data) {
          throw new Error(conferenceResponse.error || "Conference not found")
        }

        setConference(conferenceResponse.data)
        setDates(datesResponse.data || [])
        setHasSubmission((submissionsResponse.data?.submissions || []).length > 0)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load conference")
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [conferenceId, user?.email])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">{t("runtime.components.author.author-conference-detail.text_loading_conference_details")}</div>
      </div>
    )
  }

  if (error || !conference) {
    return (
      <div className="flex items-center justify-center h-screen px-6">
        <div className="w-full max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("runtime.components.author.author-conference-detail.text_failed_to_load_conference_details")}{" "}{error || "Unknown error"}
        </div>
      </div>
    )
  }

  return (
    <main className="flex-grow flex flex-col h-screen overflow-hidden">
      <ConferenceHeader
        conference={conference}
        conferenceId={conferenceId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasSubmission={hasSubmission}
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black">
        <div className="px-8 py-6 w-full max-w-[1600px] mx-auto">
          {activeTab === "overview" && <OverviewTab conference={conference} />}
          {activeTab === "cfp" && <CallForPapersTab conference={conference} />}
          {activeTab === "dates" && <ImportantDatesTab dates={dates} />}
          {activeTab === "committee" && <CommitteeTab conference={conference} />}
        </div>
      </div>
    </main>
  )
}
