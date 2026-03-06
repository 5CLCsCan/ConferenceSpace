"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Settings2, FileText, AlertCircle, History } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationCard, type Notification as CardNotification } from "@/components/notifications/notification-card"
import { TabButton, FilterPill } from "@/components/notifications/notification-controls"
import { EmptyState } from "@/components/notifications/empty-state"
import type { Notification } from "@/lib/types"
import { resolveNotificationActionUrl } from "@/lib/notifications/resolve-action-url"
import { cn } from "@/lib/utils"
import { getSidebarMenuItems } from "@/lib/navigation"
import { useTranslation } from "@/lib/i18n/translation-context"

function notificationKind(type: Notification["type"]): CardNotification["type"] {
  if (type === "deadline_reminder") return "deadline"
  if (type === "review_assigned" || type === "review_submitted") return "review"
  if (type === "discussion_thread" || type === "discussion_message") return "mention"
  if (type === "submission_received" || type === "paper_accepted") return "success"
  return "system"
}

function actionLabelForType(type: Notification["type"]): string {
  if (type === "deadline_reminder") return "View Deadline"
  if (type === "review_assigned" || type === "review_submitted") return "Open Review"
  if (type === "discussion_thread" || type === "discussion_message") return "Open Discussion"
  if (type === "paper_accepted" || type === "paper_rejected") return "View Decision"
  return "Open"
}

function metadataToString(metadata?: Record<string, unknown>): string | undefined {
  if (!metadata) return undefined

  const preferred = ["conference_name", "submission_title", "paper_title", "thread_title"]
    .map((key) => metadata[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0)

  if (preferred.length > 0) {
    return preferred.join(" • ")
  }

  const keys = Object.keys(metadata)
  if (keys.length === 0) return undefined
  return keys
    .slice(0, 2)
    .map((key) => `${key}: ${String(metadata[key])}`)
    .join(" • ")
}

function mapNotification(notification: Notification): CardNotification {
  const actionHref = resolveNotificationActionUrl(notification.action_url)

  return {
    id: String(notification.id),
    type: notificationKind(notification.type),
    title: notification.title,
    content: notification.message,
    time: formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }),
    isRead: notification.read,
    actionLabel: actionHref ? actionLabelForType(notification.type) : undefined,
    actionHref: actionHref || undefined,
    meta: metadataToString(notification.metadata),
  }
}

const PAGE_SIZE = 5


export default function NotificationsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { currentRole, isAuthenticated, isAuthLoading } = useAuth()
  const {
    notifications,
    unreadCount,
    total,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    isLoading,
    error,
  } = useNotifications({ limit: PAGE_SIZE })

  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "mentions">("all")
  const [activeFilter, setActiveFilter] = useState("all")

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleTabChange = useCallback(
    (tab: "all" | "unread" | "mentions") => {
      setActiveTab(tab)
      setCurrentPage(1)
      const params: { limit: number; offset: number; unread?: boolean } = {
        limit: PAGE_SIZE,
        offset: 0,
      }
      if (tab === "unread") params.unread = true
      fetchNotifications(params)
    },
    [fetchNotifications],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page)
        const params: { limit: number; offset: number; unread?: boolean } = {
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        }
        if (activeTab === "unread") params.unread = true
        fetchNotifications(params)
      }
    },
    [totalPages, activeTab, fetchNotifications],
  )

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push("ellipsis")
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push("ellipsis")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }
    return pages
  }

  const cardNotifications = useMemo(() => notifications.map(mapNotification), [notifications])

  const filteredNotifications = useMemo(() => {
    return cardNotifications.filter((n) => {
      const tabMatch =
        activeTab === "unread" ? !n.isRead : activeTab === "mentions" ? n.type === "mention" : true

      const filterMatch =
        activeFilter === "all"
          ? true
          : activeFilter === "deadline"
            ? n.type === "deadline"
            : activeFilter === "review"
              ? n.type === "review"
              : activeFilter === "submission"
                ? n.type === "success"
                : true

      return tabMatch && filterMatch
    })
  }, [activeFilter, activeTab, cardNotifications])

  const handleMarkAsRead = async (id: string) => {
    const numericId = Number(id)
    if (Number.isFinite(numericId)) {
      await markAsRead(numericId)
    }
  }

  const handleAction = async (href?: string, id?: string) => {
    if (id) {
      await handleMarkAsRead(id)
    }
    if (!href) return

    if (/^https?:\/\//i.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer")
      return
    }

    router.push(href)
  }

  const menuItems = getSidebarMenuItems(currentRole, unreadCount)

  return (
    <div className="text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={menuItems} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-10 md:px-12 py-8 w-full relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-4">
            <div>
              <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-none">
                {t("runtime.app.notifications.page.text_notifications")}{" "}</h1>
              <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
                {t("runtime.app.notifications.page.text_stay_updated_on_submissions_reviews_deadlines")}{" "}</p>
            </div>

            <div className="absolute top-8 right-12 flex items-center gap-2">
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-full text-xs font-normal text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all shadow-sm"
              >
                {t("runtime.app.notifications.page.text_mark_all_as_read")}{" "}</button>
              <button className="p-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all shadow-sm">
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-0 mb-4">
            <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex gap-6">
                <TabButton
                  label="All"
                  active={activeTab === "all"}
                  onClick={() => handleTabChange("all")}
                  badge={cardNotifications.length}
                />
                <TabButton
                  label="Unread"
                  active={activeTab === "unread"}
                  onClick={() => handleTabChange("unread")}
                  badge={unreadCount}
                  badgeActiveBg="bg-blue-600"
                />
                <TabButton
                  label="Mentions"
                  active={activeTab === "mentions"}
                  onClick={() => handleTabChange("mentions")}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <FilterPill
                label="All Types"
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              />
              <FilterPill
                label="Deadlines"
                icon={<AlertCircle className="w-3.5 h-3.5" />}
                active={activeFilter === "deadline"}
                onClick={() => setActiveFilter("deadline")}
              />
              <FilterPill
                label="Submissions"
                icon={<FileText className="w-3.5 h-3.5" />}
                active={activeFilter === "submission"}
                onClick={() => setActiveFilter("submission")}
              />
              <FilterPill
                label="Reviews"
                icon={<History className="w-3.5 h-3.5" />}
                active={activeFilter === "review"}
                onClick={() => setActiveFilter("review")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 pb-20">
            {isLoading ? (
              <div className="text-sm text-slate-500">{t("runtime.app.notifications.page.text_loading_notifications")}</div>
            ) : error ? (
              <div className="text-sm text-red-600">{t("runtime.app.notifications.page.text_failed_to_load_notifications")}{" "}{error.message}</div>
            ) : filteredNotifications.length > 0 ? (
              <>
                <SectionLabel label="Latest" />
                {filteredNotifications.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onMarkAsRead={handleMarkAsRead}
                    onAction={handleAction}
                  />
                ))}
              </>
            ) : (
              <EmptyState />
            )}

            {/* Pagination */}
            {!isLoading && !error && total > 0 && (
              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Showing{" "}
                  <span className="font-bold text-[#1B3C53] dark:text-white">
                    {Math.min((currentPage - 1) * PAGE_SIZE + 1, total)}-
                    {Math.min(currentPage * PAGE_SIZE, total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#1B3C53] dark:text-white">
                    {total.toLocaleString()}
                  </span>{" "}
                  notifications
                </div>

                {totalPages > 1 && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {getPageNumbers().map((page, idx) =>
                      page === "ellipsis" ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1.5 text-slate-400 text-[10px] flex items-center"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-2.5 py-1 rounded text-[10px] ${
                            page === currentPage
                              ? "bg-[#1B3C53] text-white hover:bg-[#234C6A]"
                              : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function SectionLabel({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 py-2", className)}>
      <div className="h-[1px] bg-slate-100 dark:bg-neutral-800/50 flex-1"></div>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</span>
      <div className="h-[1px] bg-slate-100 dark:bg-neutral-800/50 flex-1"></div>
    </div>
  )
}
