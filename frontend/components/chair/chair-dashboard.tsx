"use client"

import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import {
  ActionCard,
  ActionCardList,
  MetricCard,
  SectionHeader,
  type ActionPriority,
} from "./action-card"

// Mock data for dashboard metrics
const MOCK_STATS = {
  totalSubmissions: 4285,
  reviewsCompleted: 8942,
  reviewsConferences: 12,
  avgAcceptance: 24.5,
  activeConferences: 3,
  totalConferences: 8,
}

// Mock data for action items
const MOCK_ACTIONS: Array<{
  id: number
  conference: string
  conferenceName: string
  year: string
  priority: ActionPriority
  title: string
  description: string
  dueLabel?: string
  dueDate?: string
  statusLabel?: string
  statusDate?: string
  buttonLabel: string
  isOverdue?: boolean
}> = [
  {
    id: 1,
    conference: "CVPR",
    conferenceName: "Computer Vision and Pattern Recognition",
    year: "2025",
    priority: "high",
    title: "Assign Reviewers to Tracks",
    description: "145 papers currently unassigned. Deadline approaching.",
    dueLabel: "2 Days",
    dueDate: "Oct 24",
    buttonLabel: "Assign Now",
  },
  {
    id: 2,
    conference: "ICML",
    conferenceName: "Intl. Conf. on Machine Learning",
    year: "2024",
    priority: "medium",
    title: "Approve Camera Ready Papers",
    description: "45 papers waiting for final chair approval.",
    dueLabel: "5 Days",
    dueDate: "Oct 27",
    buttonLabel: "Review List",
  },
  {
    id: 3,
    conference: "NeurIPS",
    conferenceName: "Neural Info. Processing Systems",
    year: "2023",
    priority: "urgent",
    title: "Resolve Conflict Flags",
    description: "12 flagged conflicts require manual adjudication.",
    statusLabel: "Overdue",
    statusDate: "Yesterday",
    buttonLabel: "Resolve",
    isOverdue: true,
  },
]

/**
 * Chair Dashboard - Primary management overview
 * Uses reusable ActionCard, MetricCard, and SectionHeader components
 */
export default function ChairDashboard() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()

  const handleActionClick = (actionId: number) => {
    // Handle action button clicks
    console.log("Action clicked:", actionId)
  }

  const handleCardClick = (actionId: number) => {
    // Handle card clicks for navigation
    console.log("Card clicked:", actionId)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-[1.1]">
            Chair Dashboard
          </h1>
          <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Overview &amp; management across all conferences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            Last updated: Today, 9:41 AM
          </span>
          <button className="p-1.5 h-7 text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center">
            <span 
              className="material-symbols-outlined" 
              style={{ 
                fontSize: '16px', 
                width: '16px', 
                height: '16px', 
                maxWidth: '16px', 
                maxHeight: '16px',
                minWidth: '16px',
                minHeight: '16px',
                lineHeight: '16px',
                display: 'inline-block',
                flexShrink: 0,
                transform: 'none',
                boxSizing: 'border-box'
              }}
            >
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Grid using MetricCard */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Total Submissions" value={MOCK_STATS.totalSubmissions} />
        <MetricCard
          label="Reviews Completed"
          value={MOCK_STATS.reviewsCompleted}
          subtext={`Across ${MOCK_STATS.reviewsConferences} conferences`}
        />
        <MetricCard label="Avg. Acceptance" value={`${MOCK_STATS.avgAcceptance}%`} />
        <MetricCard
          label="Active Conferences"
          value={MOCK_STATS.activeConferences}
          suffix={`/ ${MOCK_STATS.totalConferences}`}
        />
      </div>

      {/* Actions Required Section */}
      <div className="flex flex-col gap-2">
        <SectionHeader
          title="Actions Required"
          actionLabel="View all"
          onAction={() => router.push("/dashboard/chair/tasks")}
        />

        <ActionCardList>
          {MOCK_ACTIONS.map((action) => (
            <ActionCard
              key={action.id}
              id={action.id}
              conference={action.conference}
              conferenceName={action.conferenceName}
              year={action.year}
              priority={action.priority}
              title={action.title}
              description={action.description}
              dueLabel={action.dueLabel}
              dueDate={action.dueDate}
              statusLabel={action.statusLabel}
              statusDate={action.statusDate}
              isOverdue={action.isOverdue}
              buttonLabel={action.buttonLabel}
              onAction={() => handleActionClick(action.id)}
              onClick={() => handleCardClick(action.id)}
            />
          ))}
        </ActionCardList>
      </div>
    </div>
  )
}
