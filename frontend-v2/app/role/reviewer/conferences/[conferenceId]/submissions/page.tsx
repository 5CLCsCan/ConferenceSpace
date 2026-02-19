"use client"

import { useParams } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AssignedDashboard } from "@/components/reviewer/assigned-dashboard"
import { useNotifications } from "@/hooks/use-notifications"
import { getSidebarMenuItems } from "@/lib/navigation"

export default function ReviewerConferenceSubmissionsPage() {
  const params = useParams() as { conferenceId: string }
  const { unreadCount } = useNotifications({ limit: 1 })

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("reviewer", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full">
          <AssignedDashboard conferenceId={params.conferenceId} />
        </div>
      </main>
    </div>
  )
}
