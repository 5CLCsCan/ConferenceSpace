"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ReviewerConferences } from "@/components/reviewer/reviewer-conferences"
import { useNotifications } from "@/hooks/use-notifications"
import { useReviewerDashboard } from "@/hooks/use-reviewer-dashboard"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/lib/auth-context"
import { ConferencesSkeleton } from "@/components/reviewer/loading-skeletons"
import { getReviewerMenuItems } from "@/components/reviewer/menu-items"
import type { ReviewerConference } from "@/lib/types"

export default function ReviewerConferencesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const reviewerEmail = user?.email || ""

  const [conferenceSearch, setConferenceSearch] = useState("")
  const [conferenceOffset, setConferenceOffset] = useState(0)
  const [allConferences, setAllConferences] = useState<ReviewerConference[]>([])
  const debouncedConferenceSearch = useDebounce(conferenceSearch, 500)

  const { dashboard, isLoading } = useReviewerDashboard(reviewerEmail, {
    conferenceSearch: debouncedConferenceSearch,
    conferenceLimit: 20,
    conferenceOffset,
    invitationLimit: 1,
    invitationOffset: 0,
  })

  useEffect(() => {
    if (!dashboard?.conferences) {
      return
    }

    if (conferenceOffset === 0) {
      setAllConferences(dashboard.conferences)
      return
    }

    setAllConferences((prev) => {
      const existingIds = new Set(prev.map((conference) => conference.id))
      const newItems = dashboard.conferences.filter((conference) => !existingIds.has(conference.id))
      return [...prev, ...newItems]
    })
  }, [conferenceOffset, dashboard?.conferences])

  useEffect(() => {
    setConferenceOffset(0)
    setAllConferences([])
  }, [debouncedConferenceSearch])

  if (!user) {
    return null
  }

  const hasMoreConferences = dashboard?.total_conferences
    ? allConferences.length < dashboard.total_conferences
    : false

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getReviewerMenuItems(unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto py-8 px-12 w-full">
          {isLoading && allConferences.length === 0 ? (
            <ConferencesSkeleton />
          ) : (
            <ReviewerConferences
              conferences={allConferences}
              onSelectConference={(conferenceId) =>
                router.push(`/role/reviewer/conferences/${conferenceId}/submissions`)
              }
              onLoadMore={() => {
                if (!isLoading && hasMoreConferences) {
                  setConferenceOffset((prev) => prev + 20)
                }
              }}
              hasMore={hasMoreConferences}
              isLoadingMore={isLoading && conferenceOffset > 0}
              searchQuery={conferenceSearch}
              onSearchChange={setConferenceSearch}
            />
          )}
        </div>
      </main>
    </div>
  )
}
