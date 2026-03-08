"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { AuthorConferenceDetail } from "@/components/author/author-conference-detail"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { getSidebarMenuItems } from "@/lib/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { useTranslation } from "@/lib/i18n/translation-context"

export default function AuthorConferenceDetailPage() {
  const { t } = useTranslation()
  const { unreadCount } = useNotifications({ limit: 1 })
  const params = useParams()
  const conferenceId = params?.conferenceId as string

  if (!conferenceId) {
    return null
  }

  return (
    <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("author", unreadCount)} />

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen w-full text-slate-400">
            {t(
              "runtime.app.role.author.conferences.conferenceId.page.text_loading_conference_details",
            )}{" "}
          </div>
        }
      >
        <AuthorConferenceDetail conferenceId={conferenceId} />
      </Suspense>
    </div>
  )
}
