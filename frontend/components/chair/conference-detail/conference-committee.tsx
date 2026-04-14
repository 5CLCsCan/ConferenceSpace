"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { getConferenceReviewers, inviteReviewers, removeReviewer } from "@/lib/api/conferences"
import type { Reviewer } from "@/lib/api/conferences"
import { apiFetch } from "@/lib/api/client"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceCommitteeProps {
  conferenceId: string
  className?: string
}

interface UserSearchResult {
  id: number
  email: string
  first_name?: string
  last_name?: string
}

interface SelectedUser {
  id?: number
  email: string
}

type MemberRoleFilter = "all" | "reviewer"
type MemberStatusFilter = "all" | "accepted" | "pending" | "rejected"

function deriveNameFromEmail(email: string, userId: number) {
  const localPart = email.split("@")[0] || `User ${userId}`
  return localPart
    .split(/[._-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function Icon({ name, className, size = 16 }: { name: string; className?: string; size?: number }) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        lineHeight: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transform: "none",
        boxSizing: "border-box",
      }}
    >
      {name}
    </span>
  )
}

function StatCard({
  label,
  value,
  icon,
  iconBgClass,
  iconTextClass,
}: {
  label: string
  value: string | number
  icon: string
  iconBgClass: string
  iconTextClass: string
}) {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">
          {label}
        </p>
        <h3 className="text-xl font-bold text-[#1B3C53]">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>
      </div>
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", iconBgClass)}>
        <Icon name={icon} className={iconTextClass} size={20} />
      </div>
    </div>
  )
}

function RoleBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium border bg-blue-50 text-blue-700 border-blue-100">
      {label}
    </span>
  )
}

function StatusIndicator({
  status,
  labels,
}: {
  status?: string
  labels: {
    active: string
    declined: string
    invited: string
    pendingResponse: string
  }
}) {
  const config =
    status === "accepted"
      ? {
          dotClass: "bg-emerald-500",
          label: labels.active,
          labelClass: "text-slate-600 font-medium",
          detail: null,
        }
      : status === "rejected"
        ? {
            dotClass: "bg-slate-300",
            label: labels.declined,
            labelClass: "text-slate-400 font-medium",
            detail: null,
          }
        : {
            dotClass: "bg-amber-400 animate-pulse",
            label: labels.invited,
            labelClass: "text-slate-600 font-medium",
            detail: labels.pendingResponse,
          }

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
        <span className={cn("text-[11px]", config.labelClass)}>{config.label}</span>
      </div>
      {config.detail && <div className="text-[9px] text-slate-400 mt-0.5">{config.detail}</div>}
    </div>
  )
}

function MemberAvatar({ email, name }: { email: string; name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")

  return (
    <div
      className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-500 text-[10px] font-bold border border-slate-200"
      title={email}
    >
      {initials || email[0]?.toUpperCase() || "U"}
    </div>
  )
}

export function ConferenceCommittee({ conferenceId, className }: ConferenceCommitteeProps) {
  const { t } = useTranslation()
  const labels = {
    text_actions: t("runtime.components.chair.conference-detail.conference-committee.text_actions"),
    text_active: t("runtime.components.chair.conference-detail.conference-committee.text_active"),
    text_add_member: t(
      "runtime.components.chair.conference-detail.conference-committee.text_add_member",
    ),
    text_all_roles: t(
      "runtime.components.chair.conference-detail.conference-committee.text_all_roles",
    ),
    text_all_statuses: t(
      "runtime.components.chair.conference-detail.conference-committee.text_all_statuses",
    ),
    text_area_chairs: t(
      "runtime.components.chair.conference-detail.conference-committee.text_area_chairs",
    ),
    text_assignments: t(
      "runtime.components.chair.conference-detail.conference-committee.text_assignments",
    ),
    text_committee_members: t(
      "runtime.components.chair.conference-detail.conference-committee.text_committee_members",
    ),
    text_committee_subtitle: t(
      "runtime.components.chair.conference-detail.conference-committee.text_committee_subtitle",
    ),
    text_declined: t(
      "runtime.components.chair.conference-detail.conference-committee.text_declined",
    ),
    text_export: t("runtime.components.chair.conference-detail.conference-committee.text_export"),
    text_failed_to_load_committee: t(
      "runtime.components.chair.conference-detail.conference-committee.text_failed_to_load_committee",
    ),
    text_general_track: t(
      "runtime.components.chair.conference-detail.conference-committee.text_general_track",
    ),
    text_import_csv: t(
      "runtime.components.chair.conference-detail.conference-committee.text_import_csv",
    ),
    text_invited: t("runtime.components.chair.conference-detail.conference-committee.text_invited"),
    text_invite_error: t(
      "runtime.components.chair.conference-detail.conference-committee.text_invite_error",
    ),
    text_invite_selected: t(
      "runtime.components.chair.conference-detail.conference-committee.text_invite_selected",
    ),
    text_invite_success: t(
      "runtime.components.chair.conference-detail.conference-committee.text_invite_success",
    ),
    text_loading_committee: t(
      "runtime.components.chair.conference-detail.conference-committee.text_loading_committee",
    ),
    text_member: t("runtime.components.chair.conference-detail.conference-committee.text_member"),
    text_next: t("runtime.components.chair.conference-detail.conference-committee.text_next"),
    text_no_committee_members_found: t(
      "runtime.components.chair.conference-detail.conference-committee.text_no_committee_members_found",
    ),
    text_no_users_found: t(
      "runtime.components.chair.conference-detail.conference-committee.text_no_users_found",
    ),
    text_not_available: t(
      "runtime.components.chair.conference-detail.conference-committee.text_not_available",
    ),
    text_pending_invites: t(
      "runtime.components.chair.conference-detail.conference-committee.text_pending_invites",
    ),
    text_pending_response: t(
      "runtime.components.chair.conference-detail.conference-committee.text_pending_response",
    ),
    text_previous: t(
      "runtime.components.chair.conference-detail.conference-committee.text_previous",
    ),
    text_primary_track: t(
      "runtime.components.chair.conference-detail.conference-committee.text_primary_track",
    ),
    text_remove_reviewer: t(
      "runtime.components.chair.conference-detail.conference-committee.text_remove_reviewer",
    ),
    text_reviewer: t(
      "runtime.components.chair.conference-detail.conference-committee.text_reviewer",
    ),
    text_reviewers: t(
      "runtime.components.chair.conference-detail.conference-committee.text_reviewers",
    ),
    text_role: t("runtime.components.chair.conference-detail.conference-committee.text_role"),
    text_search_by_email: t(
      "runtime.components.chair.conference-detail.conference-committee.text_search_by_email",
    ),
    text_searching: t(
      "runtime.components.chair.conference-detail.conference-committee.text_searching",
    ),
    text_status: t("runtime.components.chair.conference-detail.conference-committee.text_status"),
    text_total_members: t(
      "runtime.components.chair.conference-detail.conference-committee.text_total_members",
    ),
    placeholder_search_by_name_email_affiliation: t(
      "runtime.components.chair.conference-detail.conference-committee.placeholder_search_by_name_email_affiliation",
    ),
    aria_label_select_all_committee_members: t(
      "runtime.components.chair.conference-detail.conference-committee.aria_label_select_all_committee_members",
    ),
    title_edit_member: t(
      "runtime.components.chair.conference-detail.conference-committee.title_edit_member",
    ),
  } as const

  const T = (key: keyof typeof labels) => labels[key]

  const PAGE_SIZE = 8
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [tableSearch, setTableSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>("all")
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("all")

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  )
  const [showDropdown, setShowDropdown] = useState(false)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const statusLabels = {
    active: T("text_active"),
    declined: T("text_declined"),
    invited: T("text_invited"),
    pendingResponse: T("text_pending_response"),
  }

  const loadReviewers = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [allRes, pendingRes] = await Promise.all([
      getConferenceReviewers(conferenceId, { limit: 200 }),
      getConferenceReviewers(conferenceId, { limit: 1, status: "pending" }),
    ])

    if (allRes.error || !allRes.data) {
      setError(
        allRes.error ||
          t(
            "runtime.components.chair.conference-detail.conference-committee.text_failed_to_load_committee",
          ),
      )
      setReviewers([])
      setLoading(false)
      return
    }

    setReviewers(allRes.data.reviewers)
    setPendingCount(pendingRes.data?.total || 0)
    setLoading(false)
  }, [conferenceId, t])

  useEffect(() => {
    void loadReviewers()
  }, [loadReviewers])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setShowDropdown(true)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)

    if (!value.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    searchDebounce.current = setTimeout(async () => {
      try {
        const { data } = await apiFetch<{
          data?: {
            users?: { id: number; email: string; first_name?: string; last_name?: string }[]
          }
        }>(`/api/v1/users/search?q=${encodeURIComponent(value.trim())}&limit=10`)
        const users = data?.data?.users || []
        setSearchResults(
          users.map((u) => ({
            id: Number(u.id),
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
          })),
        )
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  const handleSelectUser = (user: SelectedUser) => {
    if (!selectedUsers.find((entry) => entry.email.toLowerCase() === user.email.toLowerCase())) {
      setSelectedUsers((previous) => [...previous, user])
    }
    setSearchQuery("")
    setSearchResults([])
    setShowDropdown(false)
  }

  const handleAddDirectEmail = () => {
    const email = searchQuery.trim().toLowerCase()
    if (!email || !email.includes("@")) return
    handleSelectUser({ email })
  }

  const handleRemoveSelected = (email: string) => {
    setSelectedUsers((previous) => previous.filter((entry) => entry.email !== email))
  }

  const handleInvite = async () => {
    if (!selectedUsers.length) return

    setInviting(true)
    setInviteMsg(null)

    const toInvite: { user_id: number }[] = []
    const unresolvedEmails: string[] = []

    for (const user of selectedUsers) {
      if (user.id != null) {
        toInvite.push({ user_id: user.id })
        continue
      }

      try {
        const { data } = await apiFetch<{ data?: { users?: { id: number; email: string }[] } }>(
          `/api/v1/users/search?q=${encodeURIComponent(user.email)}&limit=5`,
        )
        const users = data?.data?.users || []
        const match = users.find((entry) => entry.email.toLowerCase() === user.email.toLowerCase())

        if (match) {
          toInvite.push({ user_id: Number(match.id) })
        } else {
          unresolvedEmails.push(user.email)
        }
      } catch {
        unresolvedEmails.push(user.email)
      }
    }

    if (toInvite.length === 0) {
      setInviting(false)
      setInviteMsg({ type: "error", text: T("text_invite_error") })
      return
    }

    const response = await inviteReviewers(conferenceId, toInvite)
    setInviting(false)

    if (response.error) {
      setInviteMsg({ type: "error", text: T("text_invite_error") })
      return
    }

    const backendFailed = response.data?.failed?.length ?? 0
    if (backendFailed > 0 || unresolvedEmails.length > 0) {
      setInviteMsg({ type: "error", text: T("text_invite_error") })
    } else {
      setInviteMsg({ type: "success", text: T("text_invite_success") })
    }

    setSelectedUsers(unresolvedEmails.map((email) => ({ email })))
    void loadReviewers()
  }

  const handleRemoveReviewer = async (reviewerId: number) => {
    await removeReviewer(conferenceId, String(reviewerId))
    void loadReviewers()
  }

  const acceptedCount = reviewers.filter((reviewer) => reviewer.status === "accepted").length

  const filteredReviewers = useMemo(() => {
    return reviewers.filter((reviewer) => {
      const email = reviewer.email || `user-${reviewer.user_id}@unknown.local`
      const name = deriveNameFromEmail(email, reviewer.user_id)
      const matchesSearch =
        !tableSearch.trim() ||
        name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        email.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (reviewer.domain || []).some((domain) =>
          domain.toLowerCase().includes(tableSearch.toLowerCase()),
        )
      const matchesRole = roleFilter === "all" || roleFilter === "reviewer"
      const matchesStatus = statusFilter === "all" || reviewer.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [reviewers, roleFilter, statusFilter, tableSearch])

  const totalPages = Math.max(1, Math.ceil(filteredReviewers.length / PAGE_SIZE))
  const paginatedReviewers = filteredReviewers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [tableSearch, roleFilter, statusFilter])

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 5) {
      for (let index = 1; index <= totalPages; index += 1) pages.push(index)
      return pages
    }

    pages.push(1)
    if (currentPage <= 3) {
      for (let index = 2; index <= 4; index += 1) pages.push(index)
      pages.push("ellipsis")
      pages.push(totalPages)
      return pages
    }

    if (currentPage >= totalPages - 2) {
      pages.push("ellipsis")
      for (let index = totalPages - 3; index <= totalPages; index += 1) pages.push(index)
      return pages
    }

    pages.push("ellipsis")
    for (let index = currentPage - 1; index <= currentPage + 1; index += 1) pages.push(index)
    pages.push("ellipsis")
    pages.push(totalPages)
    return pages
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] dark:text-white tracking-tight">
            {T("text_committee_members")}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{T("text_committee_subtitle")}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-slate-500">{T("text_loading_committee")}</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label={T("text_total_members")}
              value={reviewers.length}
              icon="group"
              iconBgClass="bg-slate-50"
              iconTextClass="text-[#1B3C53]"
            />
            <StatCard
              label={T("text_reviewers")}
              value={acceptedCount}
              icon="rate_review"
              iconBgClass="bg-blue-50"
              iconTextClass="text-blue-700"
            />
            <StatCard
              label={T("text_area_chairs")}
              value={0}
              icon="manage_accounts"
              iconBgClass="bg-purple-50"
              iconTextClass="text-purple-700"
            />
            <StatCard
              label={T("text_pending_invites")}
              value={pendingCount}
              icon="pending_actions"
              iconBgClass="bg-yellow-50"
              iconTextClass="text-yellow-700"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between gap-3">
              <div className="flex flex-col md:flex-row gap-3 flex-1">
                <div className="relative flex-1 md:max-w-sm">
                  <Icon
                    name="search"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(event) => setTableSearch(event.target.value)}
                    placeholder={T("placeholder_search_by_name_email_affiliation")}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-[11px] focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value as MemberRoleFilter)}
                    className="bg-white border border-slate-200 text-slate-700 text-[11px] rounded-md py-2 px-2.5 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] shadow-sm min-w-[110px] outline-none"
                  >
                    <option value="all">{T("text_all_roles")}</option>
                    <option value="reviewer">{T("text_reviewer")}</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as MemberStatusFilter)}
                    className="bg-white border border-slate-200 text-slate-700 text-[11px] rounded-md py-2 px-2.5 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] shadow-sm min-w-[110px] outline-none"
                  >
                    <option value="all">{T("text_all_statuses")}</option>
                    <option value="accepted">{T("text_active")}</option>
                    <option value="pending">{T("text_invited")}</option>
                    <option value="rejected">{T("text_declined")}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-medium text-[11px] rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Icon name="upload_file" />
                  {T("text_import_csv")}
                </button>
                <button
                  type="button"
                  className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-medium text-[11px] rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Icon name="download" />
                  {T("text_export")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDropdown(true)}
                  className="px-3 py-2 bg-[#1B3C53] text-white font-medium text-[11px] rounded-md hover:bg-[#234C6A] transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Icon name="person_add" />
                  {T("text_add_member")}
                </button>
              </div>
            </div>

            <div className="px-4 py-4 border-b border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex flex-col lg:flex-row gap-2 items-start">
                <div className="relative flex-1 w-full" ref={dropdownRef}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => handleSearch(event.target.value)}
                    onFocus={() => searchQuery && setShowDropdown(true)}
                    placeholder={T("text_search_by_email")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
                  />
                  {showDropdown && (searchQuery || searching) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-50">
                      {searching ? (
                        <div className="flex items-center justify-center p-3 gap-2">
                          <Icon name="sync" className="animate-spin text-[#1B3C53]" size={14} />
                          <span className="text-xs text-slate-500">{T("text_searching")}</span>
                        </div>
                      ) : (
                        <div className="p-1">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                handleSelectUser(user)
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-100 transition-colors text-left"
                            >
                              <div className="size-7 rounded-full bg-[#1B3C53]/10 flex items-center justify-center text-[#1B3C53] font-bold text-[10px]">
                                {user.first_name?.[0] || user.email[0].toUpperCase()}
                                {user.last_name?.[0] || ""}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#141414] truncate">
                                  {user.email}
                                </p>
                                {(user.first_name || user.last_name) && (
                                  <p className="text-[10px] text-slate-500 truncate">
                                    {`${user.first_name || ""} ${user.last_name || ""}`.trim()}
                                  </p>
                                )}
                              </div>
                              <Icon name="person_add" className="text-slate-400" />
                            </button>
                          ))}
                          {searchResults.length === 0 && (
                            <div className="px-3 py-2 text-xs text-slate-400">
                              {T("text_no_users_found")}
                            </div>
                          )}
                          {searchQuery.includes("@") && (
                            <button
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                handleAddDirectEmail()
                              }}
                              className="w-full flex items-center gap-1.5 px-3 py-2 rounded hover:bg-[#1B3C53]/5 text-[#1B3C53] font-medium text-xs border-t border-slate-100 transition-colors"
                            >
                              <Icon name="person_add" size={12} />
                              {t(
                                "runtime.components.chair.conference-detail.conference-committee.text_add_directly_with_query",
                                { query: searchQuery.trim() },
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={!selectedUsers.length || inviting}
                  className="h-9 px-4 bg-[#1B3C53] hover:bg-[#234C6A] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[11px] flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Icon name={inviting ? "hourglass_empty" : "send"} size={14} />
                  {T("text_invite_selected")}
                </button>
              </div>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedUsers.map((user) => (
                    <span
                      key={user.email}
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full",
                        user.id != null
                          ? "bg-[#1B3C53]/10 text-[#1B3C53]"
                          : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {user.id == null && <Icon name="warning" size={10} />}
                      {user.email}
                      <button
                        type="button"
                        onClick={() => handleRemoveSelected(user.email)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {inviteMsg && (
                <div
                  className={cn(
                    "rounded-md px-3 py-2 text-xs font-medium",
                    inviteMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200",
                  )}
                >
                  {inviteMsg.text}
                </div>
              )}
            </div>

            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200 tracking-widest">
                  <tr>
                    <th className="px-4 py-2.5 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-[#1B3C53] focus:ring-[#1B3C53] h-3.5 w-3.5"
                        aria-label={T("aria_label_select_all_committee_members")}
                      />
                    </th>
                    <th className="px-4 py-2.5">{T("text_member")}</th>
                    <th className="px-4 py-2.5">{T("text_role")}</th>
                    <th className="px-4 py-2.5">{T("text_primary_track")}</th>
                    <th className="px-4 py-2.5">{T("text_assignments")}</th>
                    <th className="px-4 py-2.5">{T("text_status")}</th>
                    <th className="px-4 py-2.5 text-right">{T("text_actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px]">
                  {paginatedReviewers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                        {T("text_no_committee_members_found")}
                      </td>
                    </tr>
                  ) : (
                    paginatedReviewers.map((reviewer) => {
                      const email = reviewer.email || `user-${reviewer.user_id}@unknown.local`
                      const name = deriveNameFromEmail(email, reviewer.user_id)
                      const primaryTrack = reviewer.domain?.[0] || T("text_general_track")

                      return (
                        <tr
                          key={reviewer.id ?? reviewer.user_id}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-[#1B3C53] focus:ring-[#1B3C53] h-3.5 w-3.5"
                              aria-label={t(
                                "runtime.components.chair.conference-detail.conference-committee.aria_label_select_member",
                                { name },
                              )}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <MemberAvatar email={email} name={name} />
                              <div>
                                <div className="font-bold text-[#1B3C53] text-[12px]">{name}</div>
                                <div className="text-[10px] text-slate-500">{email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <RoleBadge label={T("text_reviewer")} />
                          </td>
                          <td className="px-4 py-3 text-slate-600">{primaryTrack}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] text-slate-400 italic">
                              {T("text_not_available")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusIndicator status={reviewer.status} labels={statusLabels} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <button
                                type="button"
                                className="p-1 text-slate-400 hover:text-[#1B3C53] hover:bg-slate-100 rounded transition-colors"
                                title={T("title_edit_member")}
                              >
                                <Icon name="edit" size={18} />
                              </button>
                              {reviewer.id != null && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReviewer(reviewer.id!)}
                                  title={T("text_remove_reviewer")}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Icon name="delete" size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredReviewers.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  {t(
                    "runtime.components.chair.conference-detail.conference-committee.text_showing_range",
                    {
                      from: Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredReviewers.length),
                      to: Math.min(currentPage * PAGE_SIZE, filteredReviewers.length),
                      total: filteredReviewers.length.toLocaleString(),
                    },
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {T("text_previous")}
                  </button>
                  {getPageNumbers().map((page, index) =>
                    page === "ellipsis" ? (
                      <span key={`ellipsis-${index}`} className="px-1.5 text-slate-400 text-[10px]">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "px-2.5 py-1 rounded text-[10px]",
                          currentPage === page
                            ? "bg-[#1B3C53] text-white hover:bg-[#234C6A]"
                            : "border border-slate-200 text-slate-500 hover:bg-slate-50",
                        )}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {T("text_next")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
