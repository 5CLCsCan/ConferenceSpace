"use client"

import { cn } from "@/lib/utils"
import type { ActivityItem } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface RecentActivityCardProps {
  activities?: ActivityItem[]
  onMore?: () => void
  className?: string
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    user: {
      name: "Prof. Alan",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
    action: "submitted review for",
    target: "#1024",
    timestamp: "2 mins ago",
  },
  {
    id: "2",
    user: {
      name: "Dr. Emily",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    },
    action: "updated COI list.",
    timestamp: "45 mins ago",
  },
  {
    id: "3",
    user: {
      name: "You",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    action: "changed deadline to Feb 22.",
    timestamp: "2 hours ago",
  },
]

export function RecentActivityCard({
  activities = DEFAULT_ACTIVITIES,
  onMore,
  className,
}: RecentActivityCardProps) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
          {t(
            "runtime.components.chair.conference-detail.recent-activity-card.text_recent_activity",
          )}{" "}
        </h3>
        <button
          onClick={onMore}
          className="text-slate-400 hover:text-[#1B3C53] transition-colors p-1"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            more_horiz
          </span>
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-2.5">
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0 bg-cover bg-center"
              style={{
                backgroundImage: activity.user.avatar
                  ? `url('${activity.user.avatar}')`
                  : undefined,
              }}
            >
              {!activity.user.avatar && (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {activity.user.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#1B3C53] dark:text-white leading-relaxed">
                <span className="font-bold">{activity.user.name}</span>{" "}
                <span className="text-slate-500">{activity.action}</span>
                {activity.target && (
                  <span className="text-slate-500 hover:underline cursor-pointer font-medium ml-0.5">
                    {activity.target}
                  </span>
                )}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
