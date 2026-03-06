"use client"

import { Suspense } from "react"
import { AuthorSubmissionsList } from "@/components/author/author-submissions-list"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { getSidebarMenuItems } from "@/lib/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { useTranslation } from "@/lib/i18n/translation-context"

export default function AuthorSubmissionsPage() {
  const { t } = useTranslation()
  const { unreadCount } = useNotifications({ limit: 1 })

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("author", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-6 md:py-8 w-full">
          {/* Header Section - Scholar-Compact */}
          <div className="flex flex-col">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
              <div>
                <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-none">
                  {t("runtime.app.role.author.submissions.page.text_my_submissions")}{" "}</h1>
                <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
                  {t("runtime.app.role.author.submissions.page.text_track_and_manage_all_your_research")}{" "}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
                {t("runtime.app.role.author.submissions.page.text_loading")}{" "}</div>
            }
          >
            <AuthorSubmissionsList />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
