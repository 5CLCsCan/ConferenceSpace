"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { CompletedReviews } from "@/components/reviewer/completed-reviews"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/lib/auth-context"
import { getReviewerMenuItems } from "@/components/reviewer/menu-items"
import { useRouter } from "next/navigation"

export default function ReviewerCompletedPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { unreadCount } = useNotifications({ limit: 1 })

  if (!user) {
    return null
  }

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getReviewerMenuItems(unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto py-8 px-12 w-full">
          <CompletedReviews
            reviewerId={user.email}
            onSelectPaper={(assignmentId, conferenceId) => {
              const query = conferenceId ? `?conferenceId=${conferenceId}` : ""
              router.push(`/role/reviewer/assignments/${assignmentId}${query}`)
            }}
          />
        </div>
      </main>
    </div>
  )
}
