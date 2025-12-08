"use client"

import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import {
  FileText,
  ClipboardCheck,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react"
import type { Notification, NotificationType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: number) => void
  onDelete?: (id: number) => void
  compact?: boolean
}

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  submission_received: FileText,
  review_assigned: ClipboardCheck,
  review_submitted: MessageSquare,
  paper_accepted: CheckCircle,
  paper_rejected: XCircle,
  deadline_reminder: Clock,
  status_change: AlertCircle,
}

const notificationColors: Record<NotificationType, string> = {
  submission_received: "text-blue-500",
  review_assigned: "text-purple-500",
  review_submitted: "text-amber-500",
  paper_accepted: "text-green-500",
  paper_rejected: "text-red-500",
  deadline_reminder: "text-orange-500",
  status_change: "text-slate-500",
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const router = useRouter()
  const Icon = notificationIcons[notification.type] || AlertCircle
  const iconColor = notificationColors[notification.type] || "text-slate-500"

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(notification.id)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-slate-50",
          !notification.read && "bg-blue-50/50",
        )}
      >
        <div className={cn("mt-0.5", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm truncate",
              !notification.read ? "font-medium text-slate-900" : "text-slate-700",
            )}
          >
            {notification.title}
          </p>
          <p className="text-xs text-slate-500 truncate">{notification.message}</p>
          <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
        )}
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-100 last:border-b-0",
        !notification.read && "bg-blue-50/30",
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          notification.type === "paper_accepted" && "bg-green-100",
          notification.type === "paper_rejected" && "bg-red-100",
          notification.type === "review_assigned" && "bg-purple-100",
          notification.type === "review_submitted" && "bg-amber-100",
          notification.type === "submission_received" && "bg-blue-100",
          notification.type === "deadline_reminder" && "bg-orange-100",
          notification.type === "status_change" && "bg-slate-100",
        )}
      >
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm",
                !notification.read ? "font-semibold text-slate-900" : "font-medium text-slate-700",
              )}
            >
              {notification.title}
            </p>
            <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
            <p className="text-xs text-slate-400 mt-2">{timeAgo}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-slate-600"
                onClick={handleDelete}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

