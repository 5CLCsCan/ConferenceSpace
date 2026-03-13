"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SchedulesPageContent } from "@/components/schedules/schedules-page-content"
import { useNotifications } from "@/hooks/use-notifications"
import { getSidebarMenuItems } from "@/lib/navigation"

export default function ReviewerSchedulesPage() {
  const { unreadCount } = useNotifications({ limit: 1 })

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("reviewer", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-6 md:py-8 w-full">
          <SchedulesPageContent role="reviewer" />
        </div>
      </main>
    </div>
  )
}
