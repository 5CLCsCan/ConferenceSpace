"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { ConferenceInfo, TabId, TabItem } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ROUTES } from "@/lib/routes"
import { isReadOnlyRole } from "@/lib/role-helpers"
import type { UserRole } from "@/lib/types"

const RESTRICTED_TABS: TabId[] = ["submissions", "assignments", "coi", "rebuttal"]


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
  const normalizedRole = (userRole || "").toLowerCase()
  const canAccessRestrictedTabs =
    normalizedRole === "chair" ||
    normalizedRole === "co-chair" ||
    normalizedRole === "co_chair" ||
    normalizedRole === "pc"
  const visibleTabs = canAccessRestrictedTabs
    ? tabs
    : tabs.filter((tab) => !RESTRICTED_TABS.includes(tab.id))
  const readOnly = isReadOnlyRole(userRole as UserRole)
  return (
    <header
      className={cn(
        "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30",
        className,
      )}
    >
      {/* Title Section */}
      <div className="px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
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
            <button
              type="button"
              onClick={() => router.push(ROUTES.CHAIR.CONFERENCES)}
              className="hover:text-[#1B3C53] dark:hover:text-white transition-colors"
            >
              {t(
                "runtime.components.chair.conference-detail.conference-detail-header.text_conferences",
              )}
            </button>
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              chevron_right
            </span>
            <span className="font-semibold text-[#1B3C53] dark:text-white">
              {conference.acronym} {conference.year}
            </span>
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#1B3C53] dark:text-white tracking-tight">
              {conference.fullName}
            </h1>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-tight">
              {conference.acronym} {conference.year}
            </span>
          </div>

          {/* Meta */}
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
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
          {!readOnly && <button
            type="button"
            onClick={() => router.push(ROUTES.CHAIR.CONFERENCE_EDIT(conference.id))}
            className="h-8 px-3 bg-white border border-slate-200 text-slate-600 font-medium text-[11px] rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1.5"
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
          </button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
        <div className="flex space-x-6 min-w-max">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "py-3 border-b-2 font-medium text-[11px] tracking-wider transition-colors flex items-center gap-1.5",
                activeTab === tab.id
                  ? "border-[#1B3C53] text-[#1B3C53] dark:border-white dark:text-white"
                  : "border-transparent text-slate-400 hover:text-[#1B3C53] dark:hover:text-white",
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
                <span className="bg-slate-100 text-slate-500 text-[9px] py-0.5 px-1.5 rounded-full ml-0.5 font-bold">
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
