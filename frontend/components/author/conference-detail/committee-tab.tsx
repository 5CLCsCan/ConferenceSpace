"use client"

import { cn } from "@/lib/utils"
import type { TabProps } from "./types"
import { MemberAvatar } from "./components/member-avatar"
import { useTranslation } from "@/lib/i18n/translation-context"

// Consistent icon styling for 16px material symbols
const iconStyle = {
  fontSize: "14px",
  width: "14px",
  height: "14px",
  maxWidth: "14px",
  maxHeight: "14px",
  minWidth: "14px",
  minHeight: "14px",
  lineHeight: "1",
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  flexShrink: 0,
  transform: "none",
  boxSizing: "border-box" as const,
}

interface CommitteeMember {
  name: string
  role?: string
  organization?: string
  email?: string
  track?: string
}

function MemberCard({
  member,
  variant = "default",
}: {
  member: CommitteeMember
  variant?: "featured" | "default" | "compact"
}) {
  const { t } = useTranslation()
  if (variant === "featured") {
    return (
      <div 
        className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer relative group"
        onClick={(e) => {
          e.preventDefault()
          // No action - just visual feedback
        }}
      >
        <MemberAvatar name={member.name} email={member.email || member.name} size="lg" />
        <div className="flex-1">
          <div className="font-bold text-[#1B3C53] dark:text-white text-sm tracking-tight">
            {member.name}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {member.organization || "Academic Institution"}
          </div>
          {member.email && (
            <a
              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-1"
              href={`mailto:${member.email}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="material-symbols-outlined" style={iconStyle}>
                mail
              </span>
              {member.email}
            </a>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            // No action - just visual feedback
          }}
          className="text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <span className="material-symbols-outlined" style={iconStyle}>
            open_in_new
          </span>
        </button>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div 
        className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 hover:shadow-sm transition-all bg-white dark:bg-slate-900 cursor-pointer relative group"
        onClick={(e) => {
          e.preventDefault()
          // No action - just visual feedback
        }}
      >
        <div className="font-bold text-[#1B3C53] dark:text-white text-[12px] tracking-tight">
          {member.name}
        </div>
        <div className="text-[10px] text-slate-500 truncate">
          {member.organization || "Academic Committee"}
        </div>
        {member.track && (
          <div className="mt-1.5 text-[9px] uppercase font-semibold text-slate-400 tracking-wider">
            {member.track}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            // No action - just visual feedback
          }}
          className="absolute top-2 right-2 text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <span className="material-symbols-outlined" style={iconStyle}>
            open_in_new
          </span>
        </button>
      </div>
    )
  }

  return (
    <div 
      className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer relative group"
      onClick={(e) => {
        e.preventDefault()
        // No action - just visual feedback
      }}
    >
      <MemberAvatar name={member.name} email={member.email || member.name} />
      <div className="flex-1">
        <div className="font-bold text-[#1B3C53] dark:text-white text-[12px] tracking-tight">
          {member.name}
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400">
          {member.role || "Committee Member"}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          // No action - just visual feedback
        }}
        className="text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100"
      >
        <span className="material-symbols-outlined" style={iconStyle}>
          open_in_new
        </span>
      </button>
    </div>
  )
}

export function CommitteeTab({ conference }: TabProps) {
  const { t } = useTranslation()
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            {t("runtime.components.author.conference-detail.committee-tab.text_organizing_committee")}{" "}</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {t("runtime.components.author.conference-detail.committee-tab.text_meet_the_team_behind")}{" "}{conference.name}.
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* General Chairs */}
          <div>
            <h3 className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              {t("runtime.components.author.conference-detail.committee-tab.text_general_chairs")}{" "}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {conference.chair && (
                <MemberCard
                  member={{
                    name: conference.chair,
                    email: `${conference.chair.toLowerCase().replace(/\s+/g, ".")}@conference.org`,
                    organization: "Conference Organization",
                  }}
                  variant="featured"
                />
              )}

              {conference.co_chairs?.map((co, idx) => (
                <MemberCard
                  key={idx}
                  member={{
                    name: co,
                    email: `${co.toLowerCase().replace(/\s+/g, ".")}@conference.org`,
                    role: "Conference Co-Chair",
                  }}
                  variant="featured"
                />
              ))}
            </div>
          </div>

          {/* Program Chairs */}
          <div>
            <h3 className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              {t("runtime.components.author.conference-detail.committee-tab.text_program_chairs")}{" "}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {["Alex Brown", "Emily Zhang", "Robert Klein"].map((name) => (
                <MemberCard
                  key={name}
                  member={{
                    name,
                    role: "Research & Peer Review",
                  }}
                  variant="default"
                />
              ))}
            </div>
          </div>

          {/* Area Chairs */}
          <div>
            <h3 className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              {t("runtime.components.author.conference-detail.committee-tab.text_area_chairs")}{" "}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                { name: "David Miller", track: "Reinforcement Learning" },
                { name: "Sarah Jenkins", track: "Computer Vision" },
                { name: "Wei Liu", track: "NLP & LLMs" },
                { name: "Carlos Mendez", track: "Generative Models" },
              ].map((chair) => (
                <MemberCard
                  key={chair.name}
                  member={{
                    name: chair.name,
                    track: chair.track,
                  }}
                  variant="compact"
                />
              ))}
              <div className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 hover:shadow-sm transition-all bg-white dark:bg-slate-900 flex flex-col justify-center cursor-pointer group">
                <div className="font-bold text-[#1B3C53] dark:text-white text-[12px] tracking-tight group-hover:text-blue-600">
                  {t("runtime.components.author.conference-detail.committee-tab.text_more_members")}{" "}</div>
                <div className="text-[10px] text-slate-500">{t("runtime.components.author.conference-detail.committee-tab.text_view_full_list")}</div>
                <div className="mt-1.5 flex">
                  <span
                    className="material-symbols-outlined text-slate-400 group-hover:text-blue-600"
                    style={iconStyle}
                  >
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
