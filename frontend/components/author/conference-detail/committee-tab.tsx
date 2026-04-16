"use client"

import { useEffect, useState } from "react"
import type { TabProps } from "./types"
import { MemberAvatar } from "./components/member-avatar"
import { useTranslation } from "@/lib/i18n/translation-context"
import { userApi, type User } from "@/lib/api/user"

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
  const handleOpenProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    window.open(
      `https://scholar.google.com/scholar?q=${encodeURIComponent(member.name)}`,
      "_blank",
      "noopener,noreferrer",
    )
  }
  if (variant === "featured") {
    return (
      <div
        className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer relative group"
        onClick={handleOpenProfile}
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
          onClick={handleOpenProfile}
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
        onClick={handleOpenProfile}
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
          onClick={handleOpenProfile}
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
      onClick={handleOpenProfile}
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
        onClick={handleOpenProfile}
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
  const [loading, setLoading] = useState(true)
  const [resolvedUsers, setResolvedUsers] = useState<Map<string, User>>(new Map())

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const allEmails = [
        conference.chair,
        ...(conference.co_chairs ?? []),
        ...(conference.pc_members ?? []),
      ].filter(Boolean) as string[]

      const uniqueEmails = [...new Set(allEmails)]

      const userResults = await Promise.all(
        uniqueEmails.map((email) => userApi.getByEmail(email).catch(() => null)),
      )

      const map = new Map<string, User>()
      uniqueEmails.forEach((email, i) => {
        const result = userResults[i] as { data: { data: User } } | null
        const user = result?.data?.data
        if (user) map.set(email, user)
      })
      setResolvedUsers(map)

      setLoading(false)
    }
    void fetchData()
  }, [conference.id, conference.chair, conference.co_chairs, conference.pc_members])

  const getDisplayName = (email: string): string => {
    const u = resolvedUsers.get(email)
    if (u) return `${u.first_name} ${u.last_name}`.trim() || email
    return email
  }

  const getOrganization = (email: string): string | undefined => {
    const u = resolvedUsers.get(email)
    if (u?.domain?.length) return u.domain[0]
    return undefined
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            {t(
              "runtime.components.author.conference-detail.committee-tab.text_organizing_committee",
            )}{" "}
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {t(
              "runtime.components.author.conference-detail.committee-tab.text_meet_the_team_behind",
            )}{" "}
            {conference.name}.
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* General Chairs */}
          <div>
            <h3 className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              {t(
                "runtime.components.author.conference-detail.committee-tab.text_general_chairs",
              )}{" "}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {conference.chair && (
                <MemberCard
                  member={{
                    name: getDisplayName(conference.chair),
                    email: conference.chair,
                    role: "General Chair",
                    organization: getOrganization(conference.chair),
                  }}
                  variant="featured"
                />
              )}

              {conference.co_chairs?.map((co, idx) => (
                <MemberCard
                  key={idx}
                  member={{
                    name: getDisplayName(co),
                    email: co,
                    role: "Co-Chair",
                    organization: getOrganization(co),
                  }}
                  variant="featured"
                />
              ))}

              {!conference.chair && !conference.co_chairs?.length && (
                <p className="text-[11px] text-slate-400 col-span-2">
                  {t(
                    "runtime.components.author.conference-detail.committee-tab.text_no_chairs_listed",
                  ) || "No general chairs listed."}
                </p>
              )}
            </div>
          </div>

          {/* Program Committee */}
          <div>
            <h3 className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              {t(
                "runtime.components.author.conference-detail.committee-tab.text_program_committee",
              )}
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-slate-400 text-[11px]">
                <span
                  className="material-symbols-outlined animate-spin"
                  style={{ fontSize: "14px" }}
                >
                  progress_activity
                </span>
                {t("runtime.components.author.conference-detail.committee-tab.text_loading_members")}{" "}</div>
            ) : !conference.pc_members?.length ? (
              <p className="text-[11px] text-slate-400 py-2">
                {t(
                  "runtime.components.author.conference-detail.committee-tab.text_no_committee_members",
                ) || "No committee members yet."}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {conference.pc_members.map((email) => (
                  <MemberCard
                    key={email}
                    member={{
                      name: getDisplayName(email),
                      email: email,
                      role: getOrganization(email) || "Program Committee",
                    }}
                    variant="default"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
