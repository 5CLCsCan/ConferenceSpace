"use client"

import { cn } from "@/lib/utils"
import { DashboardStatsCard, DashboardStatsGrid } from "./dashboard-stats-card"
import { SubmissionTimeline } from "./submission-timeline"
import { PendingDecisionsTable } from "./pending-decisions-table"
import { ChairActionsPanel } from "./chair-actions-panel"
import { TrackStatusCard } from "./track-status-card"
import { RecentActivityCard } from "./recent-activity-card"

interface ConferenceDetailDashboardProps {
  conferenceId: string
  className?: string
}

// Mock stats data
const MOCK_STATS = {
  totalSubmissions: {
    label: "Total Submissions",
    value: "1,245",
    icon: "description",
    trend: {
      value: "+12%",
      direction: "up" as const,
      comparison: "vs 1,112 last year",
    },
    subtext: "12 submissions today",
  },
  reviewsCompleted: {
    label: "Reviews Completed",
    value: "3,402",
    icon: "rate_review",
    progress: {
      current: 3402,
      total: 3735,
      percentage: 91,
    },
    subtext: "91% completion rate",
  },
  acceptanceRate: {
    label: "Acceptance Rate",
    value: "23.5%",
    icon: "verified",
    subtext: "292 papers accepted so far",
    badge: {
      label: "Target: 20-25%",
      variant: "default" as const,
    },
  },
  daysToNotify: {
    label: "Days to Notify",
    value: "14",
    icon: "notifications_active",
    badge: {
      label: "Upcoming",
      variant: "default" as const,
    },
    subtext: "Deadline: Dec 10, 2023",
  },
}

export function ConferenceDetailDashboard({
  conferenceId,
  className,
}: ConferenceDetailDashboardProps) {
  const handleViewAllSubmissions = () => {
    console.log("View all submissions")
  }

  const handleDecide = (id: string) => {
    console.log("Decide on:", id)
  }

  const handleViewTrackReport = () => {
    console.log("View track report")
  }

  const handleMoreActivity = () => {
    console.log("More activity")
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Grid */}
      <DashboardStatsGrid>
        <DashboardStatsCard {...MOCK_STATS.totalSubmissions} />
        <DashboardStatsCard {...MOCK_STATS.reviewsCompleted} />
        <DashboardStatsCard {...MOCK_STATS.acceptanceRate} />
        <DashboardStatsCard {...MOCK_STATS.daysToNotify} />
      </DashboardStatsGrid>

      {/* Main Content Grid: 2/3 + 1/3 layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <SubmissionTimeline />
          <PendingDecisionsTable onViewAll={handleViewAllSubmissions} onDecide={handleDecide} />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <ChairActionsPanel />
          <TrackStatusCard onViewReport={handleViewTrackReport} />
          <RecentActivityCard onMore={handleMoreActivity} />
        </div>
      </div>
    </div>
  )
}
