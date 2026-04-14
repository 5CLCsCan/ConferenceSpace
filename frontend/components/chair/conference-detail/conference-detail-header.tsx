"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { ConferenceInfo, TabId, TabItem } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ROUTES } from "@/lib/routes"

const CHAIR_ONLY_TABS: TabId[] = ["coi", "rebuttal"]

interface ConferenceDetailHeaderProps {
  conference: ConferenceInfo
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  userRole?: string
  className?: string
}

export function ConferenceDetailHeader({
  conference,
  activeTab,
  onTabChange,
  userRole,
  className,
}: ConferenceDetailHeaderProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const tabs: TabItem[] = [
    {
      id: "dashboard",
      label: t(
        "runtime.components.chair.conference-detail.conference-detail-header.prop_label_dashboard",
      ),
      icon: "analytics",
    },
    {
      id: "overview",
      label: t(
        "runtime.components.chair.conference-detail.conference-detail-header.prop_label_overview",
      ),
      icon: "info",
    },
    {
      id: "cfp",
      label: t(
        "runtime.components.chair.conference-detail.conference-detail-header.prop_label_call_for_papers",
      ),
      icon: "campaign",
    },
    {
      id: "dates",
      label: t(
        "runtime.components.chair.conference-detail.conference-detail-header.prop_label_important_dates",
      ),
      icon: "event",
    },
    {
      id: "committee",
      label: t(
        "runtime.components.chair.conference-detail.conference-detail-header.prop_label_committee",
      ),
      icon: "groups",
    },
    {
      id: "submissions",
      label: t(
        "runtime.components.chair.conference-detail.conference-detail-header.prop_label_submissions",
      ),
      icon: "description",
    },
    {
      id: "assignments",
      label: t(
        "runtime.components.chair.conference-detail.conference-detail-header.prop_label_assignments",
      ),
      icon: "assignment_ind",
    },
    {
      id: "coi",
      label: t(
        "runtime.components.chair.conference-detail.conference-detail-header.prop_label_coi",
      ),
      icon: "warning",
    },
    {
      id: "rebuttal",
      label: t(
        "runtime.components.chair.conference-detail.conference-detail-header.prop_label_rebuttal",
      ),
      icon: "rate_review",
    },
  ]
  const visibleTabs =
    userRole === "chair" ? tabs : tabs.filter((tab) => !CHAIR_ONLY_TABS.includes(tab.id))
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-[var(--color-border-strong)] bg-[var(--color-surface)]",
        className,
      )}
    >
      {/* Title Section */}
      <div className="px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          {/* Breadcrumb */}
          <div className="text-ui-meta mb-1 flex items-center gap-1.5">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "17.5px",
                width: "17.5px",
                height: "17.5px",
                maxWidth: "17.5px",
                maxHeight: "17.5px",
                minWidth: "17.5px",
                minHeight: "17.5px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              folder_open
            </span>
            <span>
              {t(
                "runtime.components.chair.conference-detail.conference-detail-header.text_conferences",
              )}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              chevron_right
            </span>
            <span className="font-[600] text-[var(--color-primary-ink)]">
              {conference.acronym} {conference.year}
            </span>
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <h1 className="text-page-title">{conference.fullName}</h1>
            <span className="text-detail-secondary">
              {conference.acronym} {conference.year}
            </span>
          </div>

          {/* Meta */}
          <p className="text-meta mt-0.5 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                location_on
              </span>
              {conference.location}
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                calendar_month
              </span>
              {conference.startDate} - {conference.endDate}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(ROUTES.CHAIR.CONFERENCE_EDIT(conference.id))}
            className="button-header inline-flex items-center gap-1.5 px-3"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "17.5px",
                width: "17.5px",
                height: "17.5px",
                maxWidth: "17.5px",
                maxHeight: "17.5px",
                minWidth: "17.5px",
                minHeight: "17.5px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              settings
            </span>
            {t(
              "runtime.components.chair.conference-detail.conference-detail-header.text_settings",
            )}{" "}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto border-t border-[var(--color-border-soft)] px-8">
        <div className="flex space-x-6 min-w-max">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "text-ui-meta flex items-center gap-1.5 border-b-2 py-3 transition-colors",
                activeTab === tab.id
                  ? "border-[var(--color-primary-ink)] text-[var(--color-primary-ink)]"
                  : "border-transparent hover:text-[var(--color-primary-ink)]",
              )}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "17.5px",
                  width: "17.5px",
                  height: "17.5px",
                  maxWidth: "17.5px",
                  maxHeight: "17.5px",
                  minWidth: "17.5px",
                  minHeight: "17.5px",
                  lineHeight: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: "none",
                  boxSizing: "border-box",
                }}
              >
                {tab.icon}
              </span>
              {tab.label}
              {tab.badge && (
                <span className="badge-neutral text-tiny-label ml-0.5">
                  {tab.badge.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
