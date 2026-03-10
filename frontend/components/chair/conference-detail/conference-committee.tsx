"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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

// Selected entry may be a resolved user (with id) or a raw email (id absent)
interface SelectedUser {
  id?: number
  email: string
}

function deriveNameFromEmail(email: string, userId: number): string {
  const localPart = email.split("@")[0] || `User ${userId}`
  return localPart
    .split(/[._-]/g)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <h3 className="text-xl font-bold text-[#1B3C53]">{value.toLocaleString()}</h3>
    </div>
  )
}

export function ConferenceCommittee({ conferenceId, className }: ConferenceCommitteeProps) {
  const { t } = useTranslation()
  const T = (key: string) =>
    t(`runtime.components.chair.conference-detail.conference-committee.${key}`)

  const PAGE_SIZE = 8
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Invite state
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

  const loadReviewers = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [allRes, pendingRes] = await Promise.all([
      getConferenceReviewers(conferenceId, { limit: 200 }),
      getConferenceReviewers(conferenceId, { limit: 1, status: "pending" }),
    ])

    if (allRes.error || !allRes.data) {
      setError(allRes.error || "Failed to load committee")
      setReviewers([])
      setLoading(false)
      return
    }

    setReviewers(allRes.data.reviewers)
    setPendingCount(pendingRes.data?.total || 0)
    setLoading(false)
  }, [conferenceId])

  useEffect(() => {
    void loadReviewers()
  }, [loadReviewers])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    setShowDropdown(true)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (!q.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    searchDebounce.current = setTimeout(async () => {
      try {
        const { data } = await apiFetch<{ data?: { users?: { id: number; email: string; first_name?: string; last_name?: string }[] } }>(
          `/api/v1/users/search?q=${encodeURIComponent(q.trim())}&limit=10`,
        )
        const users = data?.data?.users || []
        setSearchResults(users.map((u) => ({ id: Number(u.id), email: u.email, first_name: u.first_name, last_name: u.last_name })))
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  const handleSelectUser = (user: SelectedUser) => {
    if (!selectedUsers.find((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
      setSelectedUsers((prev) => [...prev, user])
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
    setSelectedUsers((prev) => prev.filter((u) => u.email !== email))
  }

  const handleInvite = async () => {
    if (!selectedUsers.length) return
    setInviting(true)
    setInviteMsg(null)

    // Separate resolved users (have id) from email-only entries
    const toInvite: { user_id: number }[] = []
    const unresolvedEmails: string[] = []

    for (const user of selectedUsers) {
      if (user.id != null) {
        toInvite.push({ user_id: user.id })
      } else {
        // Try to resolve the typed email to a user_id
        try {
          const { data } = await apiFetch<{ data?: { users?: { id: number; email: string }[] } }>(
            `/api/v1/users/search?q=${encodeURIComponent(user.email)}&limit=5`,
          )
          const users = data?.data?.users || []
          const match = users.find((u) => u.email.toLowerCase() === user.email.toLowerCase())
          if (match) {
            toInvite.push({ user_id: Number(match.id) })
          } else {
            unresolvedEmails.push(user.email)
          }
        } catch {
          unresolvedEmails.push(user.email)
        }
      }
    }

    if (toInvite.length > 0) {
      const res = await inviteReviewers(conferenceId, toInvite)
      setInviting(false)
      if (res.error) {
        setInviteMsg({ type: "error", text: T("text_invite_error") })
        return
      }
      // Some may have failed on the backend side (already invited, etc.)
      const backendFailed = res.data?.failed?.length ?? 0
      if (backendFailed > 0 || unresolvedEmails.length > 0) {
        setInviteMsg({ type: "error", text: T("text_invite_error") })
      } else {
        setInviteMsg({ type: "success", text: T("text_invite_success") })
      }
      // Keep only the emails that had no user in system so the chair can see them
      setSelectedUsers(unresolvedEmails.map((e) => ({ email: e })))
      void loadReviewers()
    } else {
      // Nothing resolved — all emails were unregistered
      setInviting(false)
      setInviteMsg({ type: "error", text: T("text_invite_error") })
    }
  }

  const handleRemoveReviewer = async (reviewerId: number) => {
    await removeReviewer(conferenceId, String(reviewerId))
    void loadReviewers()
  }

  const statusBadge = (status?: string) => {
    if (status === "accepted")
      return (
        <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
          {T("text_accepted")}
        </span>
      )
    if (status === "rejected")
      return (
        <span className="text-[8px] font-bold uppercase tracking-widest text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
          {T("text_rejected")}
        </span>
      )
    return (
      <span className="text-[8px] font-bold uppercase tracking-widest text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
        {T("text_pending")}
      </span>
    )
  }

  const acceptedCount = reviewers.filter((r) => r.status === "accepted").length

  return (
    <div className={cn("space-y-5", className)}>
      {loading ? (
        <div className="text-xs text-slate-500">{T("text_loading_committee")}</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label={T("text_total_members")} value={reviewers.length} />
            <StatCard label={T("text_reviewers")} value={acceptedCount} />
            <StatCard label={T("text_area_chairs")} value={0} />
            <StatCard label={T("text_pending_invites")} value={pendingCount} />
          </div>

          {/* Invite Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-[#1B3C53]"
                style={{ fontSize: "16px" }}
              >
                person_add
              </span>
              <h3 className="text-sm font-bold text-[#1B3C53] tracking-tight">
                {T("text_invite_reviewers")}
              </h3>
            </div>

            <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
              {/* Search input + dropdown */}
              <div className="flex gap-2 items-start">
                <div className="relative flex-1" ref={dropdownRef}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery && setShowDropdown(true)}
                    placeholder={T("text_search_by_email")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
                  />
                  {showDropdown && (searchQuery || searching) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-50">
                      {searching ? (
                        <div className="flex items-center justify-center p-3 gap-2">
                          <span className="material-symbols-outlined animate-spin text-[#1B3C53] text-[14px]">sync</span>
                          <span className="text-xs text-slate-500">{T("text_searching")}</span>
                        </div>
                      ) : (
                        <div className="p-1">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                handleSelectUser(user)
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                            >
                              <div className="size-7 rounded-full bg-[#1B3C53]/10 flex items-center justify-center text-[#1B3C53] font-bold text-[10px]">
                                {user.first_name?.[0] || user.email[0].toUpperCase()}
                                {user.last_name?.[0] || ""}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#141414] dark:text-white truncate">
                                  {user.email}
                                </p>
                                {(user.first_name || user.last_name) && (
                                  <p className="text-[10px] text-slate-500 truncate">
                                    {`${user.first_name || ""} ${user.last_name || ""}`.trim()}
                                  </p>
                                )}
                              </div>
                              <span className="material-symbols-outlined text-slate-400 text-[16px]">person_add</span>
                            </button>
                          ))}
                          {searchResults.length === 0 && (
                            <div className="px-3 py-2 text-xs text-slate-400">
                              {T("text_no_users_found")}
                            </div>
                          )}
                          {/* Allow adding an unregistered email directly */}
                          {searchQuery.includes("@") && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                handleAddDirectEmail()
                              }}
                              className="w-full flex items-center gap-1.5 px-3 py-2 rounded hover:bg-[#1B3C53]/5 text-[#1B3C53] font-medium text-xs border-t border-slate-100 transition-colors"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>person_add</span>
                              {T("text_add_directly")}: &ldquo;{searchQuery.trim()}&rdquo;
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
                  className="h-9 px-4 bg-[#1B3C53] hover:bg-[#234C6A] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    {inviting ? "hourglass_empty" : "send"}
                  </span>
                  {T("text_invite_selected")}
                </button>
              </div>

              {/* Selected users chips */}
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
                      {user.id == null && (
                        <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>warning</span>
                      )}
                      {user.email}
                      <button
                        type="button"
                        onClick={() => handleRemoveSelected(user.email)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                          close
                        </span>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Feedback message */}
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
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#1B3C53] tracking-tight">
                {T("text_committee_members")}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200 tracking-widest">
                  <tr>
                    <th className="px-4 py-2.5">{T("text_name")}</th>
                    <th className="px-4 py-2.5">{T("text_email")}</th>
                    <th className="px-4 py-2.5">{T("text_role")}</th>
                    <th className="px-4 py-2.5">{T("text_domains")}</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {reviewers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-xs text-slate-500 text-center">
                        {T("text_no_committee_members_found")}
                      </td>
                    </tr>
                  ) : (
                    reviewers
                      .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                      .map((reviewer) => {
                        const email =
                          reviewer.email || `user-${reviewer.user_id}@unknown.local`
                        const name = deriveNameFromEmail(email, reviewer.user_id)
                        return (
                          <tr
                            key={reviewer.id ?? reviewer.user_id}
                            className="hover:bg-slate-50 transition-colors group"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-800">{name}</td>
                            <td className="px-4 py-3 text-slate-600">{email}</td>
                            <td className="px-4 py-3">{statusBadge(reviewer.status)}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {reviewer.domain?.length ? reviewer.domain.join(", ") : "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {reviewer.id != null && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReviewer(reviewer.id!)}
                                  title={T("text_remove_reviewer")}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500"
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "14px" }}
                                  >
                                    close
                                  </span>
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {reviewers.length > PAGE_SIZE &&
              (() => {
                const totalPages = Math.ceil(reviewers.length / PAGE_SIZE)
                const getPageNumbers = () => {
                  const pages: (number | "ellipsis")[] = []
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i)
                  } else {
                    pages.push(1)
                    if (currentPage <= 3) {
                      for (let i = 2; i <= 4; i++) pages.push(i)
                      pages.push("ellipsis")
                      pages.push(totalPages)
                    } else if (currentPage >= totalPages - 2) {
                      pages.push("ellipsis")
                      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
                    } else {
                      pages.push("ellipsis")
                      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
                      pages.push("ellipsis")
                      pages.push(totalPages)
                    }
                  }
                  return pages
                }
                return (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-500">
                      {T("text_showing")}{" "}
                      <span className="font-bold text-[#1B3C53]">
                        {Math.min((currentPage - 1) * PAGE_SIZE + 1, reviewers.length)}–
                        {Math.min(currentPage * PAGE_SIZE, reviewers.length)}
                      </span>{" "}
                      {T("text_of")}{" "}
                      <span className="font-bold text-[#1B3C53]">{reviewers.length}</span>{" "}
                      {T("text_members")}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-7 px-2.5 rounded border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      >
                        {T("text_previous")}
                      </button>
                      {getPageNumbers().map((page, idx) =>
                        page === "ellipsis" ? (
                          <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`h-7 min-w-[28px] rounded text-[11px] font-bold transition-colors ${
                              currentPage === page
                                ? "bg-[#1B3C53] text-white"
                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-7 px-2.5 rounded border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      >
                        {T("text_next")}
                      </button>
                    </div>
                  </div>
                )
              })()}
          </div>
        </>
      )}
    </div>
  )
}
