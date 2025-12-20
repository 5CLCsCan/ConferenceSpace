"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Settings2,
  Trash2,
  Bell,
  BellOff,
  MessageSquare,
  FileText,
  AlertCircle,
  History,
  Check,
} from "lucide-react"

// Types
type NotificationType = "deadline" | "review" | "mention" | "system" | "success"

interface Notification {
  id: string
  type: NotificationType
  title: string
  content: string
  time: string
  isRead: boolean
  actionLabel?: string
  actionHref?: string
  meta?: string
  authorImage?: string
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "mentions">("all")
  const [activeFilter, setActiveFilter] = useState("all")

  const notifications: Notification[] = [
    {
      id: "1",
      type: "deadline",
      title: "Submission Deadline Approaching",
      content:
        "The camera-ready deadline for Track B (AI & ML) is in 24 hours. Please ensure all metadata is correct.",
      time: "2 hours ago",
      isRead: false,
      actionLabel: "View Submission",
      meta: "Conference: CVPR 2024",
    },
    {
      id: "2",
      type: "review",
      title: "New Review Posted",
      content:
        'Reviewer #3 has submitted their evaluation for Paper #1042: "Deep Learning in Resource-Constrained Environments".',
      time: "4 hours ago",
      isRead: false,
      meta: "Conference: ICML 2023",
    },
    {
      id: "3",
      type: "mention",
      title: "Mentioned in Discussion",
      content: "Dr. Sarah Jenkins mentioned you in a comment on Paper #1042.",
      time: "1 day ago",
      isRead: false,
      meta: '"@AlexChen could you verify the conflict of interest statement on this one?"',
      authorImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    },
    {
      id: "4",
      type: "system",
      title: "System Maintenance Completed",
      content:
        "The scheduled maintenance for the submission portal has been completed successfully. All services are operational.",
      time: "Yesterday, 10:00 AM",
      isRead: true,
    },
    {
      id: "5",
      type: "success",
      title: "Submission Accepted",
      content:
        'Paper #992: "Optimizing Neural Networks" has been successfully submitted to the review queue.',
      time: "Yesterday, 9:15 AM",
      isRead: true,
    },
    {
      id: "6",
      type: "review",
      title: "Review Assigned",
      content:
        "You have been assigned as a secondary reviewer for Paper #1105. Please accept or decline by Nov 12.",
      time: "Yesterday, 8:30 AM",
      isRead: true,
      actionLabel: "Accept Review",
    },
  ]

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.isRead
    if (activeTab === "mentions") return n.type === "mention"
    return true
  })

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar
        menuItems={[
          { label: "Dashboard", href: "/role", icon: "dashboard" },
          {
            label: "Notifications",
            href: "/notifications",
            icon: "notifications",
            badge: unreadCount,
          },
        ]}
      />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-10 md:px-16 py-8 md:py-12 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Notifications
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Stay updated on your submissions, reviews, and deadlines.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark all as read
              </button>
              <button className="p-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors shadow-sm">
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters & Tabs */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center gap-6 border-b border-slate-200 dark:border-neutral-800">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "flex items-center gap-2 pb-3 pt-1 px-1 text-sm font-bold transition-all relative",
                  activeTab === "all"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                )}
              >
                All
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-black",
                    activeTab === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {notifications.length}
                </span>
                {activeTab === "all" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={cn(
                  "flex items-center gap-2 pb-3 pt-1 px-1 text-sm font-bold transition-all relative",
                  activeTab === "unread"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                )}
              >
                Unread
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-black",
                    activeTab === "unread"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {unreadCount}
                </span>
                {activeTab === "unread" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("mentions")}
                className={cn(
                  "flex items-center gap-2 pb-3 pt-1 px-1 text-sm font-bold transition-all relative",
                  activeTab === "mentions"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                )}
              >
                Mentions
                {activeTab === "mentions" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white rounded-t-full"></div>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterPill
                label="All Types"
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              />
              <FilterPill
                label="Deadlines"
                icon={<AlertCircle className="w-3 h-3" />}
                active={activeFilter === "deadline"}
                onClick={() => setActiveFilter("deadline")}
              />
              <FilterPill
                label="Submissions"
                icon={<FileText className="w-3 h-3" />}
                active={activeFilter === "submission"}
                onClick={() => setActiveFilter("submission")}
              />
              <FilterPill
                label="Reviews"
                icon={<History className="w-3 h-3" />}
                active={activeFilter === "review"}
                onClick={() => setActiveFilter("review")}
              />
            </div>
          </div>

          {/* Notification List */}
          <div className="flex flex-col gap-3 pb-12">
            {filteredNotifications.length > 0 ? (
              <>
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-slate-200 dark:bg-neutral-800 flex-1"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Today
                  </span>
                  <div className="h-px bg-slate-200 dark:bg-neutral-800 flex-1"></div>
                </div>
                {filteredNotifications
                  .filter((n) => !n.time.includes("Yesterday") && !n.time.includes("day ago"))
                  .map((n) => (
                    <NotificationCard key={n.id} notification={n} />
                  ))}

                <div className="flex items-center gap-4 py-4 mt-2">
                  <div className="h-px bg-slate-200 dark:bg-neutral-800 flex-1"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Earlier
                  </span>
                  <div className="h-px bg-slate-200 dark:bg-neutral-800 flex-1"></div>
                </div>
                {filteredNotifications
                  .filter((n) => n.time.includes("Yesterday") || n.time.includes("day ago"))
                  .map((n) => (
                    <NotificationCard key={n.id} notification={n} />
                  ))}
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function FilterPill({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon?: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 h-8 px-4 rounded-full text-xs font-bold transition-all duration-200 border",
        active
          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md"
          : "bg-white dark:bg-neutral-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700",
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function NotificationCard({ notification }: { notification: Notification }) {
  const getIcon = () => {
    switch (notification.type) {
      case "deadline":
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case "review":
        return <History className="w-5 h-5 text-blue-600" />
      case "mention":
        return notification.authorImage ? null : (
          <MessageSquare className="w-5 h-5 text-slate-600" />
        )
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "system":
        return <Settings2 className="w-5 h-5 text-slate-500" />
      default:
        return <Bell className="w-5 h-5 text-slate-500" />
    }
  }

  const getIconBg = () => {
    switch (notification.type) {
      case "deadline":
        return "bg-red-50 dark:bg-red-950/30"
      case "review":
        return "bg-blue-50 dark:bg-blue-950/30"
      case "mention":
        return "bg-slate-100 dark:bg-neutral-800"
      case "success":
        return "bg-green-50 dark:bg-green-950/30"
      case "system":
        return "bg-slate-100 dark:bg-neutral-800"
      default:
        return "bg-slate-50 dark:bg-neutral-800"
    }
  }

  return (
    <div
      className={cn(
        "group relative flex gap-4 p-5 rounded-2xl transition-all duration-300 border cursor-pointer",
        notification.isRead
          ? "bg-white/60 dark:bg-neutral-900/40 border-slate-100 dark:border-neutral-800 opacity-80 hover:opacity-100"
          : "bg-white dark:bg-neutral-900 border-transparent shadow-sm hover:shadow-md ring-1 ring-slate-100 dark:ring-neutral-800",
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border border-slate-100 dark:border-neutral-800 shadow-inner",
          getIconBg(),
        )}
      >
        {notification.type === "mention" && notification.authorImage ? (
          <img src={notification.authorImage} alt="" className="w-full h-full object-cover" />
        ) : (
          getIcon()
        )}
      </div>

      <div className="flex flex-col flex-1 gap-1.5">
        <div className="flex justify-between items-start gap-4">
          <h3
            className={cn(
              "text-sm font-bold leading-[1.2] tracking-tight",
              notification.isRead
                ? "text-slate-800 dark:text-slate-200"
                : "text-slate-900 dark:text-white",
            )}
          >
            {notification.title}
          </h3>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap pt-0.5">
            {notification.time}
          </span>
        </div>

        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
          {notification.content}
        </p>

        {notification.meta && (
          <div
            className={cn(
              "mt-1 p-3 rounded-xl text-xs flex flex-col gap-1 border-l-2",
              notification.type === "mention"
                ? "bg-slate-50 dark:bg-neutral-800 text-slate-500 italic border-slate-200 dark:border-neutral-700"
                : "bg-transparent text-slate-400 border-slate-200 dark:border-neutral-800",
            )}
          >
            {notification.meta}
          </div>
        )}

        {notification.actionLabel && (
          <div className="mt-2.5">
            <button className="text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-widest">
              {notification.actionLabel}
            </button>
          </div>
        )}
      </div>

      <button className="opacity-0 group-hover:opacity-100 transition-all absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-300 hover:text-slate-900 dark:hover:text-white">
        <Check className="w-4 h-4" />
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-20 h-20 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <BellOff className="w-8 h-8 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
        You're all caught up!
      </h3>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
        No new notifications at the moment. Check back later for updates on your submissions.
      </p>
    </div>
  )
}
