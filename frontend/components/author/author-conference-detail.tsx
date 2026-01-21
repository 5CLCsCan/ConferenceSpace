"use client"

import { useState, useEffect } from "react"
import {
  getConferenceById,
  getConferenceDates,
  type Conference,
  type ImportantDate,
} from "@/lib/api/conferences"
import {
  ConferenceHeader,
  OverviewTab,
  CallForPapersTab,
  ImportantDatesTab,
  CommitteeTab,
  type TabType,
} from "./conference-detail"

interface AuthorConferenceDetailProps {
  conferenceId: string
}

export function AuthorConferenceDetail({ conferenceId }: AuthorConferenceDetailProps) {
  const [conference, setConference] = useState<Conference | null>(null)
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [hasSubmission, setHasSubmission] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [confResp, datesResp] = await Promise.all([
        getConferenceById(conferenceId),
        getConferenceDates(conferenceId),
      ])

      if (confResp.data) setConference(confResp.data)
      if (datesResp.data) setDates(datesResp.data)
      setHasSubmission(false) // TODO: Check if user has submission

      setLoading(false)
    }

    fetchData()
  }, [conferenceId])

  if (loading || !conference) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">Loading conference details...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black h-screen overflow-y-auto relative">
      <ConferenceHeader
        conference={conference}
        conferenceId={conferenceId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasSubmission={hasSubmission}
      />

      <main className="flex-grow flex flex-col px-8 py-8 w-full">
        {activeTab === "overview" && <OverviewTab conference={conference} />}
        {activeTab === "cfp" && <CallForPapersTab conference={conference} />}
        {activeTab === "dates" && <ImportantDatesTab dates={dates} />}
        {activeTab === "committee" && <CommitteeTab conference={conference} />}
      </main>
    </div>
  )
}
