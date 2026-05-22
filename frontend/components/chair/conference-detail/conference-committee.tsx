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
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import { isReadOnlyRole } from "@/lib/role-helpers"
import type { User } from "@/lib/api/user"
import { searchUsersForConference, userApi } from "@/lib/api/user"
import { semanticScholarApi, type Author } from "@/lib/api/semantic-scholar"
import {
  createExternalInvitations,
  listExternalInvitations,
  deleteExternalInvitation,
  type ExternalInvitation,
} from "@/lib/api/external-invitations"
import { PlatformBadge } from "./platform-badge"
import { ProfileLinkIconButton, getProfileLink } from "./profile-link"
import { ReviewerSuggestions } from "./reviewer-suggestions"

interface ConferenceCommitteeProps {
  conferenceId: string
  className?: string
}

interface UserSearchResult {
  id: number
  email: string
  first_name?: string
  last_name?: string
  domain?: string[]
  matched_fields?: string[]
  score?: number
}

interface SelectedUser {
  id?: number
  email?: string
  first_name?: string
  last_name?: string
  domain?: string[]
  matched_fields?: string[]
  score?: number
  is_external?: boolean
  scholar_id?: string
  name?: string
  affiliation?: string
  profile_url?: string
  // Snapshot of the author's Semantic Scholar domains at the moment of
  // selection. Stored on the chip so handleAddMembers can persist it with
  // the invitation — the S2 search cache may roll before we submit, and
  // we don't want the Domain column to show "—" for freshly-invited
  // external authors.
  fields_of_study?: string[]
}

interface CommitteeMember {
  email: string
  name: string
  role: "chair" | "co_chair" | "pc" | "reviewer"
  domain?: string[]
  reviewerId?: number
  invitationStatus?: string
  is_external?: boolean
  externalInvitationId?: number
  affiliation?: string
  scholar_id?: string
  invitationUrl?: string
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

function RoleBadge({
  label,
  role,
}: {
  label: string
  role?: "chair" | "co_chair" | "pc" | "reviewer"
}) {
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
    text_chair: t("runtime.components.chair.conference-detail.conference-committee.text_chair"),
    text_co_chair: t(
      "runtime.components.chair.conference-detail.conference-committee.text_co_chair",
    ),
    text_committee_members: t(
      "runtime.components.chair.conference-detail.conference-committee.text_committee_members",
    ),
    text_committee_subtitle: t(
      "runtime.components.chair.conference-detail.conference-committee.text_committee_subtitle",
    ),
    text_failed_to_load_committee: t(
      "runtime.components.chair.conference-detail.conference-committee.text_failed_to_load_committee",
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
    text_domain: t("runtime.components.chair.conference-detail.conference-committee.text_domain"),
    text_remove_member: t(
      "runtime.components.chair.conference-detail.conference-committee.text_remove_member",
    ),
    text_pc: t("runtime.components.chair.conference-detail.conference-committee.text_pc"),
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
    text_current_members: t(
      "runtime.components.chair.conference-detail.conference-committee.text_current_members",
    ),
    text_suggested_reviewers: t(
      "runtime.components.chair.conference-detail.conference-committee.text_suggested_reviewers",
    ),
    text_chairs: t("runtime.components.chair.conference-detail.conference-committee.text_chairs"),
    placeholder_search_by_name_email_affiliation: t(
      "runtime.components.chair.conference-detail.conference-committee.placeholder_search_by_name_email_affiliation",
    ),
    text_match_evidence_label: t(
      "runtime.components.chair.conference-detail.conference-committee.text_match_evidence_label",
    ),
    text_match_evidence_chip_tooltip: t(
      "runtime.components.chair.conference-detail.conference-committee.text_match_evidence_chip_tooltip",
    ),
    text_showing_range: "text_showing_range",
    text_invitation_link: t(
      "runtime.components.chair.conference-detail.conference-committee.text_invitation_link",
    ),
    text_invitation_link_copied: t(
      "runtime.components.chair.conference-detail.conference-committee.text_invitation_link_copied",
    ),
    text_invitation_link_tooltip: t(
      "runtime.components.chair.conference-detail.conference-committee.text_invitation_link_tooltip",
    ),
    text_invitation_status: "text_invitation_status",
    text_on_platform: t(
      "runtime.components.chair.conference-detail.conference-committee.text_on_platform",
    ),
    text_not_on_platform: t(
      "runtime.components.chair.conference-detail.conference-committee.text_not_on_platform",
    ),
    text_reviewer: t(
      "runtime.components.chair.conference-detail.conference-committee.text_reviewer",
    ),
    text_program_committee: t(
      "runtime.components.chair.conference-detail.conference-committee.text_program_committee",
    ),
    text_invite_reviewer: t(
      "runtime.components.chair.conference-detail.conference-committee.text_invite_reviewer",
    ),
    text_semantic_scholar: t(
      "runtime.components.chair.conference-detail.conference-committee.text_semantic_scholar",
    ),
    title_view_profile: t(
      "runtime.components.chair.conference-detail.conference-committee.title_view_profile",
    ),
    title_open_semantic_scholar_profile: t(
      "runtime.components.chair.conference-detail.conference-committee.title_open_semantic_scholar_profile",
    ),
    aria_label_view_profile_for: "aria_label_view_profile_for",
    aria_label_open_semantic_scholar_profile_for: "aria_label_open_semantic_scholar_profile_for",
  } as const

  const T = (key: keyof typeof labels) => labels[key]

  const PAGE_SIZE = 8
  const [loading, setLoading] = useState(true)
  const hasLoadedOnce = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [conference, setConference] = useState<Conference | null>(null)
  const [conferenceReviewers, setConferenceReviewers] = useState<Reviewer[]>([])
  const [resolvedUsers, setResolvedUsers] = useState<Map<string, User>>(new Map())
  const [currentPage, setCurrentPage] = useState(1)
  const [tableSearch, setTableSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>("all")
  const [memberRoleToAdd, setMemberRoleToAdd] = useState<AddMemberRole>("pc")
  const [activeSubTab, setActiveSubTab] = useState<"members" | "suggestions">("members")

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])
  const [inviting, setInviting] = useState(false)
  const [copiedMemberId, setCopiedMemberId] = useState<number | null>(null)
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  )
  const [showDropdown, setShowDropdown] = useState(false)
  const [externalSearchResults, setExternalSearchResults] = useState<Author[]>([])
  const [externalInvitations, setExternalInvitations] = useState<ExternalInvitation[]>([])
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadCommittee = useCallback(async () => {
    // Only toggle the full-page `loading` flag on the very first fetch.
    // Subsequent refreshes (triggered by invites, removals, cross-tab actions)
    // update state in place so the table and invite UI stay visible — without
    // this the whole panel blanks to "Loading committee..." every time a chair
    // invites someone, which makes the update feel like it didn't happen.
    const isInitialLoad = !hasLoadedOnce.current
    if (isInitialLoad) setLoading(true)
    setError(null)

    const confRes = await getConferenceById(conferenceId)
    if (confRes.error || !confRes.data) {
      setError(
        confRes.error ||
          t(
            "runtime.components.chair.conference-detail.conference-committee.text_failed_to_load_committee",
          ),
      )
      if (isInitialLoad) {
        setConference(null)
        setLoading(false)
      }
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

    // Fetch external invitations (non-platform invitees) to display alongside
    // platform members in the committee table.
    const extRes = await listExternalInvitations(conferenceId, { limit: 200 })
    setExternalInvitations(extRes.data?.invitations ?? [])

    hasLoadedOnce.current = true
    if (isInitialLoad) setLoading(false)
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

    // Merge external invitations (Semantic Scholar invitees) into the table.
    // fields_of_study (captured at invite time from S2) populates the Domain
    // column the same way user.domain does for platform members.
    for (const ext of externalInvitations) {
      // Accepted invitations have already become real platform members —
      // skip them here so they don't show a duplicate "External · Accepted" row.
      if (ext.status === "accepted") continue
      members.push({
        email: ext.email ?? "",
        name: ext.name,
        role: (ext.role as "pc" | "reviewer") ?? "reviewer",
        is_external: true,
        externalInvitationId: ext.id,
        affiliation: ext.affiliation,
        scholar_id: ext.scholar_id,
        invitationStatus: ext.status,
        domain: ext.fields_of_study,
        invitationUrl: ext.invitation_url,
      })
    }

    return members
  }, [conference, conferenceReviewers, resolvedUsers, externalInvitations])

  // Emails (lowercased) of users who should NOT appear in the search dropdown:
  // anyone already on the committee, plus anyone already chipped in selectedUsers.
  const excludedSearchEmails = useMemo(() => {
    const set = new Set<string>()
    for (const m of committeeMembers) {
      if (m.email) set.add(m.email.trim().toLowerCase())
    }
    for (const s of selectedUsers) {
      if (s.email) set.add(s.email.trim().toLowerCase())
    }
    return set
  }, [committeeMembers, selectedUsers])

  // Conference-domain set used to color chips in the search dropdown when the
  // backend hasn't returned `matched_fields` (e.g. annotation gracefully degraded).
  const conferenceTopicSet = useMemo(() => {
    const set = new Set<string>()
    for (const d of conference?.domain ?? []) {
      const norm = String(d).trim().toLowerCase()
      if (norm) set.add(norm)
    }
    return set
  }, [conference?.domain])

  // Search results minus already-on-committee / already-staged users.
  const visibleSearchResults = useMemo(
    () => searchResults.filter((u) => !excludedSearchEmails.has(u.email.trim().toLowerCase())),
    [searchResults, excludedSearchEmails],
  )

  // Semantic Scholar results filtered: remove those already staged as a
  // selected external user and those already invited to this conference.
  // Primary dedup against platform users is handled server-side in the
  // reviewer suggestion service; here we only guard against local duplicates.
  const visibleExternalResults = useMemo(() => {
    const selectedScholarIds = new Set(
      selectedUsers.filter((u) => u.scholar_id).map((u) => u.scholar_id!),
    )
    const invitedScholarIds = new Set(
      externalInvitations.filter((inv) => inv.scholar_id).map((inv) => inv.scholar_id!),
    )
    return externalSearchResults.filter((author) => {
      if (selectedScholarIds.has(author.authorId)) return false
      if (invitedScholarIds.has(author.authorId)) return false
      return true
    })
  }, [externalSearchResults, selectedUsers, externalInvitations])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // When the role-to-add changes, re-issue the active search so the dropdown
  // either gains or loses match-evidence chips/labels without forcing the
  // chair to retype.
  useEffect(() => {
    if (!searchQuery.trim()) return
    handleSearch(searchQuery)
    // We intentionally only depend on the role here; including handleSearch /
    // searchQuery would loop because handleSearch updates searchQuery via
    // setSearchQuery(value).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberRoleToAdd])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setShowDropdown(true)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)

    if (!value.trim()) {
      setSearchResults([])
      setExternalSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    // Only ask the backend to compute conference-match annotations when the
    // chair is adding a *reviewer*. For chair / co-chair / PC roles the topic
    // overlap is irrelevant, so we omit `conference_id` and the dropdown shows
    // a plain name/email result with no chips, label, or tooltip.
    const wantsMatchEvidence = memberRoleToAdd === "reviewer"
    searchDebounce.current = setTimeout(async () => {
      // Fire both searches in parallel. Semantic Scholar failures must not
      // block platform results (and vice versa) — swallow errors per promise.
      const platformPromise = searchUsersForConference(
        value.trim(),
        wantsMatchEvidence ? conferenceId : null,
        10,
      )
        .then(({ data }) => data?.users ?? [])
        .catch(
          () =>
            [] as Array<{
              id: number | string
              email: string
              first_name?: string
              last_name?: string
              domain?: string[]
              matched_fields?: string[]
              score?: number
            }>,
        )

      const scholarPromise = semanticScholarApi
        .searchAuthors(value.trim(), 5)
        .then((res) => res.data ?? [])
        .catch(() => [] as Author[])

      const [platformUsers, scholarAuthors] = await Promise.all([platformPromise, scholarPromise])

      setSearchResults(
        platformUsers.map((u) => ({
          id: Number(u.id),
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          domain: u.domain,
          matched_fields: u.matched_fields,
          score: u.score,
        })),
      )
      setExternalSearchResults(scholarAuthors)
      setSearching(false)
    }, 300)
  }

  const handleSelectUser = (user: SelectedUser) => {
    const userEmail = user.email?.toLowerCase() ?? ""
    if (
      userEmail &&
      !selectedUsers.find((entry) => (entry.email ?? "").toLowerCase() === userEmail)
    ) {
      setSelectedUsers((previous) => [...previous, user])
    }
    setSearchQuery("")
    setSearchResults([])
    setExternalSearchResults([])
    setShowDropdown(false)
  }

  const handleSelectExternalUser = (author: Author) => {
    const scholarId = author.authorId
    if (selectedUsers.find((u) => u.scholar_id === scholarId)) return

    setSelectedUsers((prev) => [
      ...prev,
      {
        is_external: true,
        scholar_id: scholarId,
        name: author.name,
        affiliation: author.affiliations?.[0] ?? "",
        profile_url: `https://www.semanticscholar.org/author/${encodeURIComponent(scholarId)}`,
        fields_of_study: author.fieldsOfStudy ?? [],
      },
    ])
    setSearchQuery("")
    setSearchResults([])
    setExternalSearchResults([])
    setShowDropdown(false)
  }

  const handleAddDirectEmail = () => {
    const email = searchQuery.trim().toLowerCase()
    if (!email || !email.includes("@")) return
    handleSelectUser({ email })
  }

  const handleRemoveSelected = (key: string) => {
    setSelectedUsers((previous) =>
      previous.filter((entry) => {
        if (entry.is_external) {
          return entry.scholar_id !== key
        }
        return entry.email !== key
      }),
    )
  }

  const resolveUserId = async (selectedUser: SelectedUser): Promise<number | null> => {
    if (typeof selectedUser.id === "number" && selectedUser.id > 0) {
      return selectedUser.id
    }

    const email = selectedUser.email
    if (!email) return null

    try {
      const response = await userApi.getByEmail(email)
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

    const platformUsers = selectedUsers.filter((u) => !u.is_external)
    const externalUsers = selectedUsers.filter((u) => u.is_external)

    let platformSuccess = 0
    let platformFailed = 0
    let externalSuccess = 0
    let externalFailed = 0

    // --- Platform users (existing flow) ---
    if (platformUsers.length > 0) {
      if (memberRoleToAdd === "pc") {
        const newEmails = platformUsers.map((u) => (u.email ?? "").toLowerCase()).filter(Boolean)
        const existingPC = conference.pc_members ?? []
        const merged = [...new Set([...existingPC, ...newEmails])]
        const response = await updateConference(conferenceId, { pc_members: merged })
        if (response.error) {
          platformFailed += platformUsers.length
        } else {
          platformSuccess += platformUsers.length
        }
      } else {
        // Reviewer flow
        const resolvedIds: number[] = []
        let unresolvedCount = 0
        for (const u of platformUsers) {
          const userId = await resolveUserId(u)
          if (userId == null) {
            unresolvedCount += 1
          } else {
            resolvedIds.push(userId)
          }
        }
        if (resolvedIds.length > 0) {
          const response = await inviteReviewers(
            conferenceId,
            resolvedIds.map((userId) => ({ user_id: userId })),
          )
          if (!response.error && response.data) {
            platformSuccess += (response.data.success || []).length
            platformFailed += (response.data.failed || []).length + unresolvedCount
          } else {
            platformFailed += resolvedIds.length + unresolvedCount
          }
        } else {
          platformFailed += unresolvedCount
        }
      }
    }

    // --- External users (Semantic Scholar) ---
    if (externalUsers.length > 0) {
      const response = await createExternalInvitations(
        conferenceId,
        externalUsers.map((u) => ({
          role: memberRoleToAdd,
          scholar_id: u.scholar_id ?? "",
          name: u.name ?? "",
          email: u.email ?? "",
          affiliation: u.affiliation ?? "",
          profile_url: u.profile_url ?? "",
          fields_of_study: u.fields_of_study ?? [],
        })),
      )
      if (!response.error && response.data) {
        // Guard against a backend that ever omits an empty list (see
        // ExternalInvitationBatchCreateResponse — `omitempty` on `failed`
        // used to trigger a runtime TypeError here when every item
        // succeeded).
        externalSuccess += response.data.success?.length ?? 0
        externalFailed += response.data.failed?.length ?? 0
      } else {
        externalFailed += externalUsers.length
      }
    }

    setInviting(false)

    const totalSuccess = platformSuccess + externalSuccess
    const totalFailed = platformFailed + externalFailed

    if (totalSuccess > 0 && totalFailed === 0) {
      setInviteMsg({ type: "success", text: `Invited ${totalSuccess} member(s).` })
    } else if (totalSuccess > 0) {
      setInviteMsg({
        type: "success",
        text: `Invited ${totalSuccess} member(s). ${totalFailed} failed or skipped.`,
      })
    } else {
      setInviteMsg({ type: "error", text: "No members were invited." })
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

  const chairCount = committeeMembers.filter(
    (m) => m.role === "chair" || m.role === "co_chair",
  ).length
  const pcCount = committeeMembers.filter((m) => m.role === "pc").length
  const reviewerCount = committeeMembers.filter((m) => m.role === "reviewer").length

  const filteredMembers = useMemo(() => {
    return committeeMembers.filter((member) => {
      const needle = tableSearch.toLowerCase()
      const matchesSearch =
        !tableSearch.trim() ||
        member.name.toLowerCase().includes(needle) ||
        (member.email ?? "").toLowerCase().includes(needle) ||
        (member.affiliation ?? "").toLowerCase().includes(needle) ||
        (member.domain || []).some((d) => d.toLowerCase().includes(needle))
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

          {!readOnly && (
            <div className="flex gap-0 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveSubTab("members")}
                className={cn(
                  "px-4 py-2.5 text-[12px] border-b-2 inline-flex items-center gap-2 transition-colors",
                  activeSubTab === "members"
                    ? "text-[#1B3C53] border-[#1B3C53] font-medium"
                    : "text-slate-500 border-transparent hover:text-slate-700",
                )}
              >
                <Icon name="group" size={14} />
                {T("text_current_members")}
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    activeSubTab === "members"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {committeeMembers.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("suggestions")}
                className={cn(
                  "px-4 py-2.5 text-[12px] border-b-2 inline-flex items-center gap-2 transition-colors",
                  activeSubTab === "suggestions"
                    ? "text-[#1B3C53] border-[#1B3C53] font-medium"
                    : "text-slate-500 border-transparent hover:text-slate-700",
                )}
              >
                <Icon name="auto_awesome" size={14} />
                {T("text_suggested_reviewers")}
              </button>
            </div>
          )}

          {activeSubTab === "suggestions" && !readOnly ? (
            <ReviewerSuggestions
              conferenceId={conferenceId}
              onInviteSuccess={() => void loadCommittee()}
            />
          ) : (
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
                      <option value="reviewer">{T("text_reviewer")}</option>
                    </select>
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDropdown(true)}
                      className="px-3 py-2 bg-[#1B3C53] text-white font-medium text-[11px] rounded-md hover:bg-[#234C6A] transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Icon name="person_add" />
                      {T("text_add_member")}
                    </button>
                  </div>
                )}
              </div>

              {!readOnly && (
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
                              {/*
                            Topic-match evidence is only meaningful for the
                            "reviewer" role; for chair / co-chair / PC additions
                            we render plain (grey) chips with no label or
                            tooltip, matching the gating on the API call above.
                          */}
                              {visibleSearchResults.map((user) => {
                                const evidenceEnabled = memberRoleToAdd === "reviewer"
                                // `matched_fields === undefined` means the server did not annotate
                                // this row (e.g. no conference_id was supplied or annotation degraded).
                                // In that case we silently fall back to local conference-domain
                                // matching for chip color, but we do NOT show the explanatory label —
                                // we only assert "this is a match" when the backend confirmed it.
                                // When evidence is disabled (non-reviewer role), treat the user as
                                // un-annotated so the chip-render path can't claim any match.
                                const serverAnnotated =
                                  evidenceEnabled && user.matched_fields !== undefined
                                const matchedSet = evidenceEnabled
                                  ? new Set(
                                      (user.matched_fields ?? []).map((f) =>
                                        f.trim().toLowerCase(),
                                      ),
                                    )
                                  : new Set<string>()
                                const hasServerMatch = serverAnnotated && matchedSet.size > 0
                                const profileLink = getProfileLink({
                                  on_platform: true,
                                  email: user.email,
                                  platform_user_id: user.id,
                                })
                                return (
                                  <div
                                    key={user.id}
                                    className="group w-full flex items-start gap-3 px-3 py-2 rounded hover:bg-slate-100 transition-colors"
                                  >
                                    <button
                                      type="button"
                                      onMouseDown={(event) => {
                                        event.preventDefault()
                                        handleSelectUser(user)
                                      }}
                                      className="flex items-start gap-3 flex-1 min-w-0 text-left"
                                    >
                                      <div className="size-7 rounded-full bg-[#1B3C53]/10 flex items-center justify-center text-[#1B3C53] font-bold text-[10px] flex-shrink-0 mt-0.5">
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
                                        {user.domain && user.domain.length > 0 && (
                                          <div className="mt-1.5">
                                            {hasServerMatch && (
                                              <p
                                                data-testid="match-evidence-label"
                                                className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 mb-1"
                                              >
                                                <span aria-hidden="true">✓</span>
                                                {T("text_match_evidence_label")}
                                              </p>
                                            )}
                                            <div className="flex flex-wrap gap-1">
                                              {user.domain.map((field) => {
                                                const norm = field.trim().toLowerCase()
                                                const serverMatched = matchedSet.has(norm)
                                                // Prefer server-provided matched_fields; fall back to
                                                // local conference-domain set if backend omitted it.
                                                // Both paths are gated on evidenceEnabled (reviewer role).
                                                const matched =
                                                  evidenceEnabled &&
                                                  (serverMatched ||
                                                    (!serverAnnotated &&
                                                      conferenceTopicSet.has(norm)))
                                                return (
                                                  <span
                                                    key={field}
                                                    title={
                                                      serverMatched
                                                        ? T("text_match_evidence_chip_tooltip")
                                                        : undefined
                                                    }
                                                    className={cn(
                                                      "text-[10px] px-2 py-0.5 rounded-full border",
                                                      matched
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-medium"
                                                        : "bg-slate-50 text-slate-500 border-slate-200",
                                                    )}
                                                  >
                                                    {matched && <span className="mr-0.5">✓</span>}
                                                    {field}
                                                  </span>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </button>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <ProfileLinkIconButton
                                        link={profileLink}
                                        title={T("title_view_profile")}
                                        ariaLabel={t(
                                          "runtime.components.chair.conference-detail.conference-committee.aria_label_view_profile_for",
                                          { name: user.email },
                                        )}
                                      />
                                      <Icon name="person_add" className="text-slate-400" />
                                    </div>
                                  </div>
                                )
                              })}
                              {/* Semantic Scholar results */}
                              {visibleExternalResults.length > 0 && (
                                <>
                                  {visibleSearchResults.length > 0 && (
                                    <div className="border-t border-slate-100 mx-3 my-1" />
                                  )}
                                  <div className="px-3 py-1">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                                      {T("text_semantic_scholar")}
                                    </span>
                                  </div>
                                  {visibleExternalResults.map((author) => {
                                    const profileLink = getProfileLink({
                                      is_external: true,
                                      scholar_id: author.authorId,
                                    })
                                    // Semantic Scholar domain chips: like platform
                                    // search, we color a chip green when its topic
                                    // overlaps the conference's domain set. S2
                                    // never returns `matched_fields`, so we always
                                    // fall back to local conference-topic matching
                                    // (never claim server-side "match evidence").
                                    const scholarFields = author.fieldsOfStudy ?? []
                                    // Cap to 4 to keep the dropdown compact.
                                    const visibleFields = scholarFields.slice(0, 4)
                                    const overflowCount =
                                      scholarFields.length - visibleFields.length
                                    return (
                                      <div
                                        key={`scholar-${author.authorId}`}
                                        className="w-full flex items-start gap-3 px-3 py-2 rounded hover:bg-slate-100 transition-colors"
                                      >
                                        <button
                                          type="button"
                                          onMouseDown={(event) => {
                                            event.preventDefault()
                                            handleSelectExternalUser(author)
                                          }}
                                          className="flex items-start gap-3 flex-1 min-w-0 text-left"
                                        >
                                          <div className="size-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-[10px] flex-shrink-0 mt-0.5">
                                            {author.name?.[0]?.toUpperCase() || "?"}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <p className="text-xs font-medium text-[#141414] truncate">
                                                {author.name}
                                              </p>
                                              <PlatformBadge
                                                onPlatform={false}
                                                T={(key) => T(key as keyof typeof labels)}
                                              />
                                            </div>
                                            {author.affiliations?.[0] && (
                                              <p className="text-[10px] text-slate-500 truncate">
                                                {author.affiliations[0]}
                                              </p>
                                            )}
                                            {visibleFields.length > 0 && (
                                              <div className="mt-1.5 flex flex-wrap gap-1">
                                                {visibleFields.map((field) => {
                                                  const norm = field.trim().toLowerCase()
                                                  const matched =
                                                    memberRoleToAdd === "reviewer" &&
                                                    conferenceTopicSet.has(norm)
                                                  return (
                                                    <span
                                                      key={field}
                                                      className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full border",
                                                        matched
                                                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-medium"
                                                          : "bg-slate-50 text-slate-500 border-slate-200",
                                                      )}
                                                    >
                                                      {matched && <span className="mr-0.5">✓</span>}
                                                      {field}
                                                    </span>
                                                  )
                                                })}
                                                {overflowCount > 0 && (
                                                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-500 border-slate-200">
                                                    +{overflowCount}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </button>
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <ProfileLinkIconButton
                                            link={profileLink}
                                            title={T("title_open_semantic_scholar_profile")}
                                            ariaLabel={t(
                                              "runtime.components.chair.conference-detail.conference-committee.aria_label_open_semantic_scholar_profile_for",
                                              { name: author.name },
                                            )}
                                          />
                                          <Icon name="person_add" className="text-slate-400" />
                                        </div>
                                      </div>
                                    )
                                  })}
                                </>
                              )}
                              {visibleSearchResults.length === 0 &&
                                visibleExternalResults.length === 0 && (
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
                      <option value="pc">{T("text_program_committee")}</option>
                      <option value="reviewer">{T("text_reviewer")}</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAddMembers}
                      disabled={!selectedUsers.length || inviting}
                      className="h-9 px-4 bg-[#1B3C53] hover:bg-[#234C6A] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[11px] flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Icon name={inviting ? "hourglass_empty" : "person_add"} size={14} />
                      {memberRoleToAdd === "reviewer"
                        ? T("text_invite_reviewer")
                        : T("text_add_member")}
                    </button>
                  </div>

                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUsers.map((user) => {
                        const chipKey = user.is_external
                          ? `ext-${user.scholar_id}`
                          : user.email || `user-${user.id ?? ""}`
                        const chipText = user.is_external
                          ? user.name || "External"
                          : user.email || ""
                        const removeKey = user.is_external
                          ? (user.scholar_id ?? "")
                          : (user.email ?? "")
                        return (
                          <span
                            key={chipKey}
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full",
                              user.is_external
                                ? "bg-amber-100 text-amber-700"
                                : user.id != null || memberRoleToAdd !== "reviewer"
                                  ? "bg-[#1B3C53]/10 text-[#1B3C53]"
                                  : "bg-amber-100 text-amber-700",
                            )}
                          >
                            {!user.is_external &&
                              user.id == null &&
                              memberRoleToAdd === "reviewer" && <Icon name="warning" size={10} />}
                            {user.is_external && <Icon name="mail" size={10} />}
                            {chipText}
                            <button
                              type="button"
                              onClick={() => handleRemoveSelected(removeKey)}
                              className="hover:text-red-500 transition-colors"
                            >
                              <Icon name="close" size={12} />
                            </button>
                          </span>
                        )
                      })}
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
              )}

              <div className="overflow-x-auto flex-grow">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200 tracking-widest">
                    <tr>
                      <th className="px-4 py-2.5">{T("text_member")}</th>
                      <th className="px-4 py-2.5">{T("text_role")}</th>
                      <th className="px-4 py-2.5">{T("text_domain")}</th>
                      <th className="px-4 py-2.5 text-right">{T("text_actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10px]">
                    {paginatedMembers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-500">
                          {T("text_no_committee_members_found")}
                        </td>
                      </tr>
                    ) : (
                      paginatedMembers.map((member) => (
                        <tr
                          key={`${member.role}-${member.email || member.scholar_id || member.name}-${member.reviewerId ?? member.externalInvitationId ?? "0"}`}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <MemberAvatar
                                email={member.email || member.name}
                                name={member.name}
                              />
                              <div>
                                <div className="font-bold text-[#1B3C53] text-[12px]">
                                  {member.name}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {member.email || member.affiliation || "—"}
                                </div>
                                {member.is_external && (
                                  <div className="mt-1">
                                    <PlatformBadge
                                      onPlatform={false}
                                      T={(key) => T(key as keyof typeof labels)}
                                    />
                                  </div>
                                )}
                                {member.invitationStatus &&
                                member.invitationUrl &&
                                member.invitationStatus === "pending" ? (
                                  <button
                                    type="button"
                                    title={T("text_invitation_link_tooltip")}
                                    onClick={() => {
                                      if (
                                        member.invitationUrl &&
                                        member.externalInvitationId != null
                                      ) {
                                        void navigator.clipboard.writeText(member.invitationUrl)
                                        setCopiedMemberId(member.externalInvitationId)
                                        setTimeout(() => setCopiedMemberId(null), 2000)
                                      }
                                    }}
                                    className="mt-1 flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5 transition-colors cursor-pointer"
                                  >
                                    <Icon
                                      name={
                                        copiedMemberId === member.externalInvitationId
                                          ? "check"
                                          : "content_copy"
                                      }
                                      size={10}
                                    />
                                    {copiedMemberId === member.externalInvitationId
                                      ? T("text_invitation_link_copied")
                                      : T("text_invitation_link")}
                                  </button>
                                ) : member.invitationStatus ? (
                                  <div className="text-[10px] text-emerald-700 capitalize">
                                    {t(
                                      "runtime.components.chair.conference-detail.conference-committee.text_invitation_status",
                                      { status: member.invitationStatus },
                                    )}
                                  </div>
                                ) : null}
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
                              <ProfileLinkIconButton
                                link={getProfileLink({
                                  is_external: member.is_external,
                                  email: member.email || null,
                                  scholar_id: member.scholar_id || null,
                                })}
                                title={
                                  member.is_external
                                    ? "Open Semantic Scholar profile"
                                    : "View profile"
                                }
                                ariaLabel={
                                  member.is_external
                                    ? `Open Semantic Scholar profile for ${member.name}`
                                    : `View profile for ${member.name}`
                                }
                              />
                              {member.role === "pc" && !member.is_external && !readOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePCMember(member.email)}
                                  title={T("text_remove_member")}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Icon name="delete" size={18} />
                                </button>
                              )}
                              {member.role === "reviewer" &&
                                !member.is_external &&
                                member.reviewerId &&
                                !readOnly && (
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
                              {member.is_external && member.externalInvitationId && !readOnly && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (member.externalInvitationId != null) {
                                      await deleteExternalInvitation(
                                        conferenceId,
                                        member.externalInvitationId,
                                      )
                                      void loadCommittee()
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
                        <span
                          key={`ellipsis-${index}`}
                          className="px-1.5 text-slate-400 text-[10px]"
                        >
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
          )}
        </>
      )}
    </div>
  )
}
