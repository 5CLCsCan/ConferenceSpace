"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  History,
  MessageSquare,
  CheckCircle2,
  Settings2,
  Bell,
  Check,
} from "lucide-react"

export type NotificationType = "deadline" | "review" | "mention" | "system" | "success"

export interface Notification {
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

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onAction?: (href?: string, id?: string) => void
}

export function NotificationCard({ notification, onMarkAsRead, onAction }: NotificationCardProps) {
  const hasAction = Boolean(notification.actionHref)

  const getIcon = () => {
    switch (notification.type) {
      case "deadline":
        return <AlertCircle className="w-3.5 h-3.5 text-red-600" />
      case "review":
        return <History className="w-4 h-4 text-blue-600" />
      case "mention":
        return notification.authorImage ? null : (
          <MessageSquare className="w-4 h-4 text-slate-600" />
        )
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case "system":
        return <Settings2 className="w-4 h-4 text-slate-500" />
      default:
        return <Bell className="w-4 h-4 text-slate-500" />
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
      role={hasAction ? "button" : undefined}
      tabIndex={hasAction ? 0 : undefined}
      onClick={() => {
        if (hasAction) {
          onAction?.(notification.actionHref, notification.id)
        }
      }}
      onKeyDown={(e) => {
        if (!hasAction || (e.key !== "Enter" && e.key !== " ")) return
        e.preventDefault()
        onAction?.(notification.actionHref, notification.id)
      }}
      className={cn(
        "group relative flex gap-4 px-4 pt-4 pb-3 rounded-2xl transition-all duration-300 border",
        hasAction && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3C53]/30",
        notification.isRead
          ? "bg-white dark:bg-neutral-900 border-slate-100 dark:border-neutral-800 opacity-80 hover:opacity-100 shadow-sm hover:shadow-md ring-1 ring-slate-100 dark:ring-neutral-800"
          : "bg-white dark:bg-neutral-900 border-transparent shadow-sm hover:shadow-md ring-1 ring-slate-100 dark:ring-neutral-800",
      )}
    >
      <div
        className={cn(
          "relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-slate-100 dark:border-neutral-800 shadow-inner",
          getIconBg(),
        )}
      >
        {notification.type === "mention" && notification.authorImage ? (
          <Image
            src={notification.authorImage}
            alt=""
            fill
            sizes="32px"
            className="object-cover"
            unoptimized
          />
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

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
          {notification.content}
        </p>

        {notification.meta && (
          <div
            className={cn(
              "mt-0 p-2 rounded-xl text-[10px] flex flex-col gap-1 border-l-2",
              notification.type === "mention"
                ? "bg-slate-50 dark:bg-neutral-800 text-slate-500 italic border-slate-200 dark:border-neutral-700"
                : "bg-neutral-100 dark:bg-neutral-800 text-slate-400 border-slate-200 dark:border-neutral-700",
            )}
          >
            {notification.meta}
          </div>
        )}

        {notification.actionLabel && (
          <div className="mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction?.(notification.actionHref, notification.id)
              }}
              className="text-[10px] font-semibold text-[#234c6a] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-widest"
            >
              {notification.actionLabel}
            </button>
          </div>
        )}
      </div>

      {!notification.isRead && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMarkAsRead?.(notification.id)
          }}
          className="opacity-0 group-hover:opacity-100 transition-all absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
