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
  discussion_thread: MessageSquare,
  discussion_message: MessageSquare,
}

const notificationColors: Record<NotificationType, string> = {
  submission_received: "text-primary",
  review_assigned: "text-secondary",
  review_submitted: "text-foreground",
  paper_accepted: "text-success",
  paper_rejected: "text-destructive",
  deadline_reminder: "text-foreground",
  status_change: "text-muted-foreground",
  discussion_thread: "text-foreground",
  discussion_message: "text-foreground",
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
          "flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-accent",
          !notification.read && "bg-primary/5",
        )}
      >
        <div className={cn("mt-0.5", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm truncate",
              !notification.read ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
        )}
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-accent border-b border-border last:border-b-0",
        !notification.read && "bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          notification.type === "paper_accepted" && "bg-success/10",
          notification.type === "paper_rejected" && "bg-destructive/10",
          notification.type === "review_assigned" && "bg-secondary/10",
          notification.type === "review_submitted" && "bg-accent",
          notification.type === "submission_received" && "bg-primary/10",
          notification.type === "deadline_reminder" && "bg-accent",
          notification.type === "status_change" && "bg-muted",
          notification.type === "discussion_thread" && "bg-accent",
          notification.type === "discussion_message" && "bg-accent",
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
                !notification.read
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground",
              )}
            >
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
            <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.read && <div className="w-2 h-2 bg-primary rounded-full" />}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
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
