"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ReviewerConferences } from "@/components/reviewer/reviewer-conferences"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useNotifications } from "@/hooks/use-notifications"
import { useReviewerDashboard } from "@/hooks/use-reviewer-dashboard"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/lib/auth-context"
import { ROUTES } from "@/lib/routes"
import { ConferencesSkeleton } from "@/components/reviewer/loading-skeletons"
import { getSidebarMenuItems } from "@/lib/navigation"

const PAGE_SIZE = 8

export default function ReviewerConferencesPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const reviewerEmail = user?.email || ""

  const [conferenceSearch, setConferenceSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const debouncedConferenceSearch = useDebounce(conferenceSearch, 500)

  const handleSearchChange = (query: string) => {
    setConferenceSearch(query)
    setCurrentPage(1)
  }

  const { dashboard, isLoading, error } = useReviewerDashboard(reviewerEmail, {
    conferenceSearch: debouncedConferenceSearch,
    conferenceLimit: PAGE_SIZE,
    conferenceOffset: (currentPage - 1) * PAGE_SIZE,
    invitationLimit: 1,
    invitationOffset: 0,
  })

  const conferences = dashboard?.conferences || []
  const totalConferences = dashboard?.total_conferences || 0
  const totalPages = Math.max(1, Math.ceil(totalConferences / PAGE_SIZE))
  const dashboardStats = dashboard?.stats

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("reviewer", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto py-8 px-12 w-full">
          {isLoading && conferences.length === 0 ? (
            <ConferencesSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-sm font-bold text-red-600">{t("dashboard.reviewer.dashboard.loadError")}</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          ) : (
            <ReviewerConferences
              conferences={conferences}
              onSelectConference={(conferenceId) =>
                router.push(ROUTES.REVIEWER.CONFERENCE_SUBMISSIONS(String(conferenceId)))
              }
              searchQuery={conferenceSearch}
              onSearchChange={handleSearchChange}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalConferences}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              stats={dashboardStats}
            />
          )}
        </div>
      </main>
    </div>
  )
}
