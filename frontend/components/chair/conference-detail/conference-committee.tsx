"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  getConferenceById,
  getConferenceReviewers,
  inviteReviewers,
  removeReviewer,
  updateConference,
} from "@/lib/api/conferences"
import type { Conference, Reviewer } from "@/lib/api/conferences"
import { apiFetch } from "@/lib/api/client"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import { isReadOnlyRole } from "@/lib/role-helpers"
import type { User } from "@/lib/api/user"
import { userApi } from "@/lib/api/user"

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

interface CommitteeMember {
  email: string
  name: string
  role: "chair" | "co_chair" | "pc" | "reviewer"
  domain?: string[]
  reviewerId?: number
  invitationStatus?: string
}

type MemberRoleFilter = "all" | "chair" | "co_chair" | "pc" | "reviewer"
type AddMemberRole = "pc" | "reviewer"

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

function RoleBadge({ label, role }: { label: string; role?: "chair" | "co_chair" | "pc" | "reviewer" }) {
  const colorClass =
    role === "chair"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : role === "co_chair"
        ? "bg-purple-50 text-purple-700 border-purple-100"
        : role === "reviewer"
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : "bg-blue-50 text-blue-700 border-blue-100"
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium border",
        colorClass,
      )}
    >
      {label}
    </span>
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
  const { currentRole } = useAuth()
  const readOnly = isReadOnlyRole(currentRole)
  const labels = {
    text_actions: t("runtime.components.chair.conference-detail.conference-committee.text_actions"),
    text_add_member: t(
      "runtime.components.chair.conference-detail.conference-committee.text_add_member",
    ),
    text_all_roles: t(
      "runtime.components.chair.conference-detail.conference-committee.text_all_roles",
    ),
    text_chair: t(
      "runtime.components.chair.conference-detail.conference-committee.text_chair",
    ),
    text_co_chair: t(
      "runtime.components.chair.conference-detail.conference-committee.text_co_chair",
    ),
    text_committee_members: t(
      "runtime.components.chair.conference-detail.conference-committee.text_committee_members",
    ),
    text_committee_subtitle: t(
      "runtime.components.chair.conference-detail.conference-committee.text_committee_subtitle",
    ),
    text_export: t("runtime.components.chair.conference-detail.conference-committee.text_export"),
    text_failed_to_load_committee: t(
      "runtime.components.chair.conference-detail.conference-committee.text_failed_to_load_committee",
    ),
    text_import_csv: t(
      "runtime.components.chair.conference-detail.conference-committee.text_import_csv",
    ),
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
    text_pc_members: t(
      "runtime.components.chair.conference-detail.conference-committee.text_pc_members",
    ),
    text_previous: t(
      "runtime.components.chair.conference-detail.conference-committee.text_previous",
    ),
    text_domain: t(
      "runtime.components.chair.conference-detail.conference-committee.text_domain",
    ),
    text_remove_member: t(
      "runtime.components.chair.conference-detail.conference-committee.text_remove_member",
    ),
    text_pc: t(
      "runtime.components.chair.conference-detail.conference-committee.text_pc",
    ),
    text_role: t("runtime.components.chair.conference-detail.conference-committee.text_role"),
    text_search_by_email: t(
      "runtime.components.chair.conference-detail.conference-committee.text_search_by_email",
    ),
    text_searching: t(
      "runtime.components.chair.conference-detail.conference-committee.text_searching",
    ),
    text_total_members: t(
      "runtime.components.chair.conference-detail.conference-committee.text_total_members",
    ),
    text_chairs: t(
      "runtime.components.chair.conference-detail.conference-committee.text_chairs",
    ),
    placeholder_search_by_name_email_affiliation: t(
      "runtime.components.chair.conference-detail.conference-committee.placeholder_search_by_name_email_affiliation",
    ),
    aria_label_select_all_committee_members: t(
      "runtime.components.chair.conference-detail.conference-committee.aria_label_select_all_committee_members",
    ),
    text_showing_range: "text_showing_range",
  } as const

  const T = (key: keyof typeof labels) => labels[key]

  const PAGE_SIZE = 8
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conference, setConference] = useState<Conference | null>(null)
  const [conferenceReviewers, setConferenceReviewers] = useState<Reviewer[]>([])
  const [resolvedUsers, setResolvedUsers] = useState<Map<string, User>>(new Map())
  const [currentPage, setCurrentPage] = useState(1)
  const [tableSearch, setTableSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>("all")
  const [memberRoleToAdd, setMemberRoleToAdd] = useState<AddMemberRole>("pc")

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

  const loadCommittee = useCallback(async () => {
    setLoading(true)
    setError(null)

    const confRes = await getConferenceById(conferenceId)
    if (confRes.error || !confRes.data) {
      setError(
        confRes.error ||
          t(
            "runtime.components.chair.conference-detail.conference-committee.text_failed_to_load_committee",
          ),
      )
      setConference(null)
      setLoading(false)
      return
    }

    setConference(confRes.data)

    const reviewerRes = await getConferenceReviewers(conferenceId, { limit: 200, offset: 0 })
    const reviewers = reviewerRes.data?.reviewers ?? []
    setConferenceReviewers(reviewers)

    const reviewerEmails = reviewers
      .map((reviewerItem) => reviewerItem.email?.trim().toLowerCase())
      .filter(Boolean) as string[]

    const allEmails = [
      confRes.data.chair,
      ...(confRes.data.co_chairs ?? []),
      ...(confRes.data.pc_members ?? []),
      ...reviewerEmails,
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
  }, [conferenceId, t])

  useEffect(() => {
    void loadCommittee()
  }, [loadCommittee])

  const committeeMembers = useMemo((): CommitteeMember[] => {
    if (!conference) return []
    const members: CommitteeMember[] = []

    if (conference.chair) {
      const u = resolvedUsers.get(conference.chair)
      members.push({
        email: conference.chair,
        name: u ? `${u.first_name} ${u.last_name}`.trim() || conference.chair : conference.chair,
        role: "chair",
        domain: u?.domain,
      })
    }

    for (const co of conference.co_chairs ?? []) {
      const u = resolvedUsers.get(co)
      members.push({
        email: co,
        name: u ? `${u.first_name} ${u.last_name}`.trim() || co : co,
        role: "co_chair",
        domain: u?.domain,
      })
    }

    for (const pc of conference.pc_members ?? []) {
      const u = resolvedUsers.get(pc)
      members.push({
        email: pc,
        name: u ? `${u.first_name} ${u.last_name}`.trim() || pc : pc,
        role: "pc",
        domain: u?.domain,
      })
    }

    for (const reviewerItem of conferenceReviewers) {
      const reviewerEmail = (reviewerItem.email || "").trim().toLowerCase()
      if (!reviewerEmail) {
        continue
      }

      const user = resolvedUsers.get(reviewerEmail)
      const reviewerName =
        user && (user.first_name || user.last_name)
          ? `${user.first_name} ${user.last_name}`.trim()
          : `${reviewerItem.first_name || ""} ${reviewerItem.last_name || ""}`.trim()

      members.push({
        email: reviewerEmail,
        name: reviewerName || reviewerEmail,
        role: "reviewer",
        domain: reviewerItem.domain,
        reviewerId: reviewerItem.id,
        invitationStatus: reviewerItem.status,
      })
    }

    return members
  }, [conference, conferenceReviewers, resolvedUsers])

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

  const resolveUserId = async (selectedUser: SelectedUser): Promise<number | null> => {
    if (typeof selectedUser.id === "number" && selectedUser.id > 0) {
      return selectedUser.id
    }

    try {
      const response = await userApi.getByEmail(selectedUser.email)
      const userId = response.data?.data?.id
      return typeof userId === "number" && userId > 0 ? userId : null
    } catch {
      return null
    }
  }

  const handleAddMembers = async () => {
    if (!selectedUsers.length || !conference) return

    setInviting(true)
    setInviteMsg(null)

    if (memberRoleToAdd === "pc") {
      const newEmails = selectedUsers.map((u) => u.email.toLowerCase())
      const existingPC = conference.pc_members ?? []
      const merged = [...new Set([...existingPC, ...newEmails])]

      const response = await updateConference(conferenceId, { pc_members: merged })
      setInviting(false)

      if (response.error) {
        setInviteMsg({ type: "error", text: T("text_invite_error") })
        return
      }

      setInviteMsg({ type: "success", text: T("text_invite_success") })
      setSelectedUsers([])
      void loadCommittee()
      return
    }

    const resolvedIds: number[] = []
    let unresolvedCount = 0
    for (const selectedUser of selectedUsers) {
      const userId = await resolveUserId(selectedUser)
      if (userId == null) {
        unresolvedCount += 1
      } else {
        resolvedIds.push(userId)
      }
    }

    if (resolvedIds.length === 0) {
      setInviting(false)
      setInviteMsg({
        type: "error",
        text: "Cannot invite reviewer: selected users are missing valid user IDs.",
      })
      return
    }

    const response = await inviteReviewers(
      conferenceId,
      resolvedIds.map((userId) => ({ user_id: userId })),
    )
    setInviting(false)

    if (response.error || !response.data) {
      setInviteMsg({ type: "error", text: response.error || T("text_invite_error") })
      return
    }

    const failedCount = (response.data.failed || []).length + unresolvedCount
    const successCount = (response.data.success || []).length
    if (successCount > 0 && failedCount === 0) {
      setInviteMsg({ type: "success", text: `Invited ${successCount} reviewer(s).` })
    } else if (successCount > 0) {
      setInviteMsg({
        type: "success",
        text: `Invited ${successCount} reviewer(s). ${failedCount} invite(s) failed or skipped.`,
      })
    } else {
      setInviteMsg({ type: "error", text: "No reviewer was invited." })
    }

    setSelectedUsers([])
    void loadCommittee()
  }

  const handleRemovePCMember = async (email: string) => {
    if (!conference) return
    const updated = (conference.pc_members ?? []).filter(
      (e) => e.toLowerCase() !== email.toLowerCase(),
    )
    await updateConference(conferenceId, { pc_members: updated })
    void loadCommittee()
  }

  const handleRemoveReviewer = async (reviewerId: number) => {
    const response = await removeReviewer(conferenceId, String(reviewerId))
    if (response.error) {
      setInviteMsg({ type: "error", text: response.error || T("text_invite_error") })
      return
    }
    setInviteMsg({ type: "success", text: "Reviewer removed." })
    void loadCommittee()
  }

  const getRoleLabel = (role: "chair" | "co_chair" | "pc" | "reviewer") => {
    if (role === "chair") return T("text_chair")
    if (role === "co_chair") return T("text_co_chair")
    if (role === "reviewer") return "Reviewer"
    return T("text_pc")
  }

  const chairCount = committeeMembers.filter((m) => m.role === "chair" || m.role === "co_chair").length
  const pcCount = committeeMembers.filter((m) => m.role === "pc").length
  const reviewerCount = committeeMembers.filter((m) => m.role === "reviewer").length

  const filteredMembers = useMemo(() => {
    return committeeMembers.filter((member) => {
      const matchesSearch =
        !tableSearch.trim() ||
        member.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        member.email.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (member.domain || []).some((d) => d.toLowerCase().includes(tableSearch.toLowerCase()))
      const matchesRole = roleFilter === "all" || member.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [committeeMembers, roleFilter, tableSearch])

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE))
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [tableSearch, roleFilter])

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
              value={committeeMembers.length}
              icon="group"
              iconBgClass="bg-slate-50"
              iconTextClass="text-[#1B3C53]"
            />
            <StatCard
              label={T("text_chairs")}
              value={chairCount}
              icon="manage_accounts"
              iconBgClass="bg-amber-50"
              iconTextClass="text-amber-700"
            />
            <StatCard
              label={T("text_pc_members")}
              value={pcCount}
              icon="groups"
              iconBgClass="bg-blue-50"
              iconTextClass="text-blue-700"
            />
            <StatCard
              label="Reviewers"
              value={reviewerCount}
              icon="rate_review"
              iconBgClass="bg-emerald-50"
              iconTextClass="text-emerald-700"
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
                    <option value="chair">{T("text_chair")}</option>
                    <option value="co_chair">{T("text_co_chair")}</option>
                    <option value="pc">{T("text_pc")}</option>
                    <option value="reviewer">Reviewer</option>
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
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setShowDropdown(true)}
                    className="px-3 py-2 bg-[#1B3C53] text-white font-medium text-[11px] rounded-md hover:bg-[#234C6A] transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Icon name="person_add" />
                    {T("text_add_member")}
                  </button>
                )}
              </div>
            </div>

            {!readOnly && <div className="px-4 py-4 border-b border-slate-200 bg-slate-50/60 space-y-3">
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

                <select
                  value={memberRoleToAdd}
                  onChange={(event) => setMemberRoleToAdd(event.target.value as AddMemberRole)}
                  className="h-9 px-2.5 bg-white border border-slate-300 text-slate-700 text-[11px] rounded-lg focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] outline-none"
                >
                  <option value="pc">Program Committee</option>
                  <option value="reviewer">Reviewer</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddMembers}
                  disabled={!selectedUsers.length || inviting}
                  className="h-9 px-4 bg-[#1B3C53] hover:bg-[#234C6A] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[11px] flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Icon name={inviting ? "hourglass_empty" : "person_add"} size={14} />
                  {memberRoleToAdd === "reviewer" ? "Invite Reviewer" : T("text_add_member")}
                </button>
              </div>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedUsers.map((user) => (
                    <span
                      key={user.email}
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full",
                        user.id != null || memberRoleToAdd !== "reviewer"
                          ? "bg-[#1B3C53]/10 text-[#1B3C53]"
                          : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {user.id == null && memberRoleToAdd === "reviewer" && (
                        <Icon name="warning" size={10} />
                      )}
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
            </div>}

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
                    <th className="px-4 py-2.5">{T("text_domain")}</th>
                    <th className="px-4 py-2.5 text-right">{T("text_actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px]">
                  {paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-500">
                        {T("text_no_committee_members_found")}
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((member) => (
                      <tr
                        key={`${member.role}-${member.email}-${member.reviewerId ?? "0"}`}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-[#1B3C53] focus:ring-[#1B3C53] h-3.5 w-3.5"
                            aria-label={t(
                              "runtime.components.chair.conference-detail.conference-committee.aria_label_select_member",
                              { name: member.name },
                            )}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <MemberAvatar email={member.email} name={member.name} />
                            <div>
                              <div className="font-bold text-[#1B3C53] text-[12px]">{member.name}</div>
                              <div className="text-[10px] text-slate-500">{member.email}</div>
                              {member.role === "reviewer" && member.invitationStatus && (
                                <div className="text-[10px] text-emerald-700 capitalize">
                                  invitation: {member.invitationStatus}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge label={getRoleLabel(member.role)} role={member.role} />
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-[11px]">
                          {member.domain?.join(", ") || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            {member.role === "pc" && !readOnly && (
                              <button
                                type="button"
                                onClick={() => handleRemovePCMember(member.email)}
                                title={T("text_remove_member")}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Icon name="delete" size={18} />
                              </button>
                            )}
                            {member.role === "reviewer" && member.reviewerId && !readOnly && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (member.reviewerId != null) {
                                    void handleRemoveReviewer(member.reviewerId)
                                  }
                                }}
                                title={T("text_remove_member")}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Icon name="delete" size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredMembers.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  {t(
                    "runtime.components.chair.conference-detail.conference-committee.text_showing_range",
                    {
                      from: Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredMembers.length),
                      to: Math.min(currentPage * PAGE_SIZE, filteredMembers.length),
                      total: filteredMembers.length.toLocaleString(),
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
