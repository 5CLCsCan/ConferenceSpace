"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getReviewerSuggestions, type ReviewerSuggestion } from "@/lib/api/reviewer-suggestions"
import { inviteReviewers } from "@/lib/api/conferences"
import { ROUTES } from "@/lib/routes"

const SEMANTIC_SCHOLAR_AUTHOR_URL = "https://www.semanticscholar.org/author"

type ProfileLinkInfo = { href: string; external: boolean }

function getSuggestionProfileLink(s: ReviewerSuggestion): ProfileLinkInfo | null {
  if (s.on_platform) {
    // ROUTES.PROFILE expects an email (resolveUserEmail only handles "me",
    // the current user's id, or email-like strings). Fall back to the numeric
    // id only if email is somehow missing — it won't resolve today, but keeps
    // behaviour defensive rather than crashing.
    if (s.email) {
      return { href: ROUTES.PROFILE(s.email), external: false }
    }
    if (s.platform_user_id) {
      return { href: ROUTES.PROFILE(String(s.platform_user_id)), external: false }
    }
  }
  if (s.scholar_id) {
    return {
      href: `${SEMANTIC_SCHOLAR_AUTHOR_URL}/${encodeURIComponent(s.scholar_id)}`,
      external: true,
    }
  }
  return null
}

function ProfileLink({
  link,
  className,
  children,
  title,
  ariaLabel,
}: {
  link: ProfileLinkInfo | null
  className?: string
  children: ReactNode
  title?: string
  ariaLabel?: string
}) {
  if (!link) return <span className={className}>{children}</span>
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={title}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    )
  }
  return (
    <Link href={link.href} className={className} title={title} aria-label={ariaLabel}>
      {children}
    </Link>
  )
}

interface ReviewerSuggestionsProps {
  conferenceId: string
}

type PlatformFilter = "all" | "platform" | "external"
type SortOption = "highest_match" | "most_publications"

type SuggestionCacheEntry = {
  suggestions: ReviewerSuggestion[]
  invited: string[]
  removed: string[]
  filter: PlatformFilter
  sortBy: SortOption
  topNInput: string
}

// Module-level, in-memory cache keyed by conferenceId. Survives component
// unmount/remount within the same page session, so switching sub-tabs
// (members ↔ suggestions) does not throw away a completed fetch or the
// user's local decisions (invited / removed / filter / sort).
const suggestionCache = new Map<string, SuggestionCacheEntry>()

// Test helper: clear all cached suggestion state. Exported for Vitest use.
export function __resetReviewerSuggestionCache(): void {
  suggestionCache.clear()
}

function SuggestionIcon({
  name,
  size = 16,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        lineHeight: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {name}
    </span>
  )
}

const LOADING_HINT_KEYS = [
  "text_step_analyzing_topics",
  "text_step_scanning_publications",
  "text_step_matching_expertise",
  "text_step_scoring_candidates",
  "text_step_finalizing",
] as const

function SuggestionSkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3.5 border-b border-slate-100 last:border-b-0 animate-pulse">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full flex-shrink-0 bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 bg-slate-200 rounded w-32" />
            <div className="h-3 bg-slate-100 rounded-full w-20" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 bg-slate-100 rounded w-24" />
            <div className="h-2 bg-slate-100 rounded w-32" />
          </div>
          <div className="flex gap-1.5 pt-0.5">
            <div className="h-3 bg-slate-100 rounded-full w-14" />
            <div className="h-3 bg-slate-100 rounded-full w-20" />
            <div className="h-3 bg-slate-100 rounded-full w-16" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center min-w-[60px] gap-1">
        <div className="h-4 w-8 bg-slate-200 rounded" />
        <div className="h-1 w-[56px] bg-slate-100 rounded-full" />
        <div className="h-2 w-10 bg-slate-100 rounded" />
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-6 w-16 bg-slate-200 rounded-md" />
        <div className="h-6 w-6 bg-slate-100 rounded" />
      </div>
    </div>
  )
}

function LoadingSuggestions({ T }: { T: (key: string) => string }) {
  const [hintIndex, setHintIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((i) => (i + 1) % LOADING_HINT_KEYS.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-full bg-[#1B3C53]/5 flex items-center justify-center flex-shrink-0 text-[#1B3C53]">
            <SuggestionIcon name="progress_activity" size={16} className="animate-spin" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-[#1B3C53] flex items-center gap-1.5">
              <SuggestionIcon name="auto_awesome" size={14} />
              {T("text_generating_suggestions")}
              <span className="inline-flex items-end gap-[2px] ml-0.5" aria-hidden="true">
                <span className="w-[3px] h-[3px] rounded-full bg-[#1B3C53] animate-pulse [animation-delay:0ms]" />
                <span className="w-[3px] h-[3px] rounded-full bg-[#1B3C53] animate-pulse [animation-delay:200ms]" />
                <span className="w-[3px] h-[3px] rounded-full bg-[#1B3C53] animate-pulse [animation-delay:400ms]" />
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {T("text_generating_suggestions_hint")}
            </p>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
          {T("text_loading_suggestions")}
        </span>
      </div>

      <div className="px-4 pt-2.5 pb-2.5 border-b border-slate-100 bg-white">
        <div
          className="h-[3px] w-full rounded-full bg-slate-100 overflow-hidden relative"
          aria-hidden="true"
        >
          <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-transparent via-[#1B3C53]/60 to-transparent animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
          <SuggestionIcon name="auto_awesome" size={12} className="text-[#456882]" />
          <span className="truncate">{T(LOADING_HINT_KEYS[hintIndex])}...</span>
        </div>
      </div>

      {[0, 1, 2].map((i) => (
        <SuggestionSkeletonRow key={i} />
      ))}
    </div>
  )
}

function SuggestionAvatar({ name, onPlatform }: { name: string; onPlatform: boolean }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")

  return (
    <div
      className={cn(
        "w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white",
        onPlatform ? "bg-blue-700" : "bg-slate-700",
      )}
    >
      {initials || "?"}
    </div>
  )
}

function PlatformBadge({ onPlatform, T }: { onPlatform: boolean; T: (key: string) => string }) {
  if (onPlatform) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
        <SuggestionIcon name="verified_user" size={11} />
        {T("text_on_platform")}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
      <SuggestionIcon name="mail" size={11} />
      {T("text_not_on_platform")}
    </span>
  )
}

function MatchScore({ score, T }: { score: number; T: (key: string) => string }) {
  const colorClass = score >= 80 ? "text-emerald-700" : "text-amber-700"
  const barColor = score >= 80 ? "bg-emerald-600" : "bg-amber-600"

  return (
    <div className="flex flex-col items-center min-w-[60px]">
      <div className={cn("text-lg font-bold tabular-nums", colorClass)}>{score}</div>
      <div className="w-[56px] h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${score}%` }} />
      </div>
      <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">
        {T("text_match")}
      </div>
    </div>
  )
}

function FieldChips({ fields, matchedFields }: { fields: string[]; matchedFields: string[] }) {
  const matchedSet = new Set(matchedFields.map((f) => f.toLowerCase()))
  return (
    <div className="flex gap-1.5 flex-wrap mt-1.5">
      {fields.map((field) => {
        const isMatched = matchedSet.has(field.toLowerCase())
        return (
          <span
            key={field}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border",
              isMatched
                ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-medium"
                : "bg-slate-50 text-slate-500 border-slate-200",
            )}
          >
            {isMatched && <span className="mr-0.5">✓</span>}
            {field}
          </span>
        )
      })}
    </div>
  )
}

function SuggestionRow({
  suggestion,
  invited,
  onInvite,
  onRemove,
  T,
}: {
  suggestion: ReviewerSuggestion
  invited: boolean
  onInvite: (s: ReviewerSuggestion) => void
  onRemove: (s: ReviewerSuggestion) => void
  T: (key: string) => string
}) {
  const profileLink = getSuggestionProfileLink(suggestion)
  const linkTitle = profileLink
    ? profileLink.external
      ? T("text_open_scholar_profile")
      : T("text_view_profile")
    : undefined

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <ProfileLink
          link={profileLink}
          title={linkTitle}
          ariaLabel={linkTitle ? `${linkTitle}: ${suggestion.name}` : undefined}
          className={cn(
            "flex-shrink-0 rounded-full outline-none",
            profileLink &&
              "hover:ring-2 hover:ring-slate-200 focus-visible:ring-2 focus-visible:ring-[#1B3C53] focus-visible:ring-offset-1 transition-shadow",
          )}
        >
          <SuggestionAvatar name={suggestion.name} onPlatform={suggestion.on_platform} />
        </ProfileLink>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ProfileLink
              link={profileLink}
              title={linkTitle}
              className={cn(
                "group inline-flex items-center gap-1 min-w-0 rounded outline-none",
                profileLink &&
                  "focus-visible:ring-2 focus-visible:ring-[#1B3C53] focus-visible:ring-offset-1",
              )}
            >
              <span
                className={cn(
                  "text-[13px] font-medium text-[#1B3C53] truncate",
                  profileLink && "group-hover:underline underline-offset-2 decoration-slate-300",
                )}
              >
                {suggestion.name}
              </span>
              {profileLink?.external && (
                <SuggestionIcon
                  name="open_in_new"
                  size={12}
                  className="text-slate-400 group-hover:text-[#456882] transition-colors"
                />
              )}
            </ProfileLink>
            <PlatformBadge onPlatform={suggestion.on_platform} T={T} />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
            {suggestion.affiliation && <span>{suggestion.affiliation}</span>}
            {suggestion.affiliation && suggestion.email && (
              <span className="w-[3px] h-[3px] rounded-full bg-slate-300" />
            )}
            {suggestion.email && <span className="font-mono text-[10px]">{suggestion.email}</span>}
          </div>
          <FieldChips fields={suggestion.fields} matchedFields={suggestion.matched_fields} />
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5">
            <span className="flex items-center gap-1">
              <SuggestionIcon name="menu_book" size={11} />
              {suggestion.publications} {T("text_pubs")}
            </span>
            {suggestion.past_reviews != null && (
              <>
                <span className="w-[3px] h-[3px] rounded-full bg-slate-300" />
                <span className="flex items-center gap-1">
                  <SuggestionIcon name="workspace_premium" size={11} />
                  {suggestion.past_reviews} {T("text_prior_reviews")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <MatchScore score={suggestion.score} T={T} />

      <div className="flex items-center gap-1.5">
        {invited ? (
          <button
            disabled
            className="px-2.5 py-1.5 text-[11px] font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1"
          >
            <SuggestionIcon name="check" size={13} />
            {T("text_invited")}
          </button>
        ) : suggestion.on_platform ? (
          <button
            onClick={() => onInvite(suggestion)}
            className="px-2.5 py-1.5 text-[11px] font-medium rounded-md bg-[#1B3C53] text-white hover:bg-[#234C6A] transition-colors flex items-center gap-1"
          >
            <SuggestionIcon name="mail" size={13} />
            {T("text_invite")}
          </button>
        ) : (
          <button
            disabled
            title={T("text_not_on_platform_tooltip")}
            className="px-2.5 py-1.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-400 border border-slate-200 flex items-center gap-1 cursor-not-allowed"
          >
            <SuggestionIcon name="mail" size={13} />
            {T("text_invite")}
          </button>
        )}
        <button
          onClick={() => onRemove(suggestion)}
          title={T("text_remove_member")}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <SuggestionIcon name="close" size={14} />
        </button>
      </div>
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-[12px] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <SuggestionIcon name="check_circle" size={16} />
      {message}
    </div>
  )
}

export function ReviewerSuggestions({ conferenceId }: ReviewerSuggestionsProps) {
  const { t } = useTranslation()
  const translationMap = useMemo(
    () => ({
      text_invite: t("runtime.components.chair.conference-detail.conference-committee.text_invite"),
      text_not_on_platform_tooltip: t(
        "runtime.components.chair.conference-detail.conference-committee.text_not_on_platform_tooltip",
      ),
      text_remove_member: t(
        "runtime.components.chair.conference-detail.conference-committee.text_remove_member",
      ),
      text_loading_suggestions: t(
        "runtime.components.chair.conference-detail.conference-committee.text_loading_suggestions",
      ),
      text_generating_suggestions: t(
        "runtime.components.chair.conference-detail.conference-committee.text_generating_suggestions",
      ),
      text_generating_suggestions_hint: t(
        "runtime.components.chair.conference-detail.conference-committee.text_generating_suggestions_hint",
      ),
      text_step_analyzing_topics: t(
        "runtime.components.chair.conference-detail.conference-committee.text_step_analyzing_topics",
      ),
      text_step_scanning_publications: t(
        "runtime.components.chair.conference-detail.conference-committee.text_step_scanning_publications",
      ),
      text_step_matching_expertise: t(
        "runtime.components.chair.conference-detail.conference-committee.text_step_matching_expertise",
      ),
      text_step_scoring_candidates: t(
        "runtime.components.chair.conference-detail.conference-committee.text_step_scoring_candidates",
      ),
      text_step_finalizing: t(
        "runtime.components.chair.conference-detail.conference-committee.text_step_finalizing",
      ),
      text_invitation_sent: t(
        "runtime.components.chair.conference-detail.conference-committee.text_invitation_sent",
      ),
      text_removed_suggestion: t(
        "runtime.components.chair.conference-detail.conference-committee.text_removed_suggestion",
      ),
      text_invitations_sent: t(
        "runtime.components.chair.conference-detail.conference-committee.text_invitations_sent",
      ),
      text_top_n_label: t(
        "runtime.components.chair.conference-detail.conference-committee.text_top_n_label",
      ),
      text_start: t("runtime.components.chair.conference-detail.conference-committee.text_start"),
      text_re_run: t("runtime.components.chair.conference-detail.conference-committee.text_re_run"),
      text_top_n_invalid: t(
        "runtime.components.chair.conference-detail.conference-committee.text_top_n_invalid",
      ),
      text_pick_count_title: t(
        "runtime.components.chair.conference-detail.conference-committee.text_pick_count_title",
      ),
      text_pick_count_hint: t(
        "runtime.components.chair.conference-detail.conference-committee.text_pick_count_hint",
      ),
      text_match_evidence_label: t(
        "runtime.components.chair.conference-detail.conference-committee.text_match_evidence_label",
      ),
      text_match_evidence_chip_tooltip: t(
        "runtime.components.chair.conference-detail.conference-committee.text_match_evidence_chip_tooltip",
      ),
      text_view_profile: t(
        "runtime.components.chair.conference-detail.conference-committee.text_view_profile",
      ),
      text_open_scholar_profile: t(
        "runtime.components.chair.conference-detail.conference-committee.text_open_scholar_profile",
      ),
      text_all: t("runtime.components.chair.conference-detail.conference-committee.text_all"),
      text_on_platform: t(
        "runtime.components.chair.conference-detail.conference-committee.text_on_platform",
      ),
      text_not_on_platform: t(
        "runtime.components.chair.conference-detail.conference-committee.text_not_on_platform",
      ),
      text_highest_match: t(
        "runtime.components.chair.conference-detail.conference-committee.text_highest_match",
      ),
      text_most_publications: t(
        "runtime.components.chair.conference-detail.conference-committee.text_most_publications",
      ),
      text_refresh: t(
        "runtime.components.chair.conference-detail.conference-committee.text_refresh",
      ),
      text_pubs: t("runtime.components.chair.conference-detail.conference-committee.text_pubs"),
      text_prior_reviews: t(
        "runtime.components.chair.conference-detail.conference-committee.text_prior_reviews",
      ),
      text_match: t("runtime.components.chair.conference-detail.conference-committee.text_match"),
      text_all_caught_up: t(
        "runtime.components.chair.conference-detail.conference-committee.text_all_caught_up",
      ),
      text_all_suggestions_actioned: t(
        "runtime.components.chair.conference-detail.conference-committee.text_all_suggestions_actioned",
      ),
      text_no_suggestions_filter: t(
        "runtime.components.chair.conference-detail.conference-committee.text_no_suggestions_filter",
      ),
      text_try_another_filter: t(
        "runtime.components.chair.conference-detail.conference-committee.text_try_another_filter",
      ),
      text_matches: t(
        "runtime.components.chair.conference-detail.conference-committee.text_matches",
      ),
      text_top_n_placeholder: t(
        "runtime.components.chair.conference-detail.conference-committee.text_top_n_placeholder",
      ),
      text_invited: t(
        "runtime.components.chair.conference-detail.conference-committee.text_invited",
      ),
      text_invite_all: t(
        "runtime.components.chair.conference-detail.conference-committee.text_invite_all",
      ),
      text_suggested_reviewers: t(
        "runtime.components.chair.conference-detail.conference-committee.text_suggested_reviewers",
      ),
      text_suggested_reviewers_subtitle: t(
        "runtime.components.chair.conference-detail.conference-committee.text_suggested_reviewers_subtitle",
      ),
    }),
    [t],
  )
  const T = useCallback(
    (key: string) => translationMap[key as keyof typeof translationMap] ?? key,
    [translationMap],
  )

  const DEFAULT_TOP_N = 20

  // Hydrate from the module-level cache so switching sub-tabs doesn't throw
  // away a completed fetch. We only treat the cache as "rehydrate the result
  // view" when it actually has suggestions — otherwise the user gets the
  // picker back (keeping their topN input if they typed one).
  const cached = suggestionCache.get(conferenceId)
  const hasCachedResults = !!cached && cached.suggestions.length > 0

  const [suggestions, setSuggestions] = useState<ReviewerSuggestion[]>(
    () => cached?.suggestions ?? [],
  )
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(hasCachedResults)
  const [topNInput, setTopNInput] = useState<string>(
    () => cached?.topNInput ?? String(DEFAULT_TOP_N),
  )
  const [invited, setInvited] = useState<Set<string>>(() => new Set(cached?.invited ?? []))
  const [removed, setRemoved] = useState<Set<string>>(() => new Set(cached?.removed ?? []))
  const [filter, setFilter] = useState<PlatformFilter>(() => cached?.filter ?? "all")
  const [sortBy, setSortBy] = useState<SortOption>(() => cached?.sortBy ?? "highest_match")
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([])

  // Sync local state back to the cache whenever something worth keeping
  // changes. We only write after a fetch has actually produced results so we
  // don't cache a half-started "hasStarted=true, suggestions=[]" shell.
  useEffect(() => {
    if (suggestions.length === 0) return
    suggestionCache.set(conferenceId, {
      suggestions,
      invited: Array.from(invited),
      removed: Array.from(removed),
      filter,
      sortBy,
      topNInput,
    })
  }, [conferenceId, suggestions, invited, removed, filter, sortBy, topNInput])

  const parsedTopN = useMemo(() => {
    const trimmed = topNInput.trim()
    if (trimmed === "") return null
    const n = Number(trimmed)
    if (!Number.isInteger(n) || n < 1) return null
    return n
  }, [topNInput])

  const showToast = useCallback((message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 2400)
  }, [])

  const fetchSuggestions = useCallback(
    async (limit: number) => {
      setLoading(true)
      const result = await getReviewerSuggestions(conferenceId, limit)
      if (result.data) {
        setSuggestions(result.data.suggestions || [])
      }
      setLoading(false)
    },
    [conferenceId],
  )

  const handleStart = useCallback(() => {
    if (parsedTopN === null) return
    setHasStarted(true)
    setRemoved(new Set())
    setInvited(new Set())
    void fetchSuggestions(parsedTopN)
  }, [parsedTopN, fetchSuggestions])

  const visible = useMemo(
    () => suggestions.filter((s) => !removed.has(s.id)),
    [suggestions, removed],
  )

  const filtered = useMemo(() => {
    let result = [...visible]
    if (filter === "platform") result = result.filter((s) => s.on_platform)
    if (filter === "external") result = result.filter((s) => !s.on_platform)

    if (sortBy === "most_publications") {
      result = result.sort((a, b) => b.publications - a.publications)
    } else {
      result = result.sort((a, b) => b.score - a.score)
    }

    return result
  }, [visible, filter, sortBy])

  const handleInvite = useCallback(
    async (suggestion: ReviewerSuggestion) => {
      if (!suggestion.platform_user_id) return

      const response = await inviteReviewers(conferenceId, [
        { user_id: suggestion.platform_user_id },
      ])

      if (!response.error) {
        setInvited((prev) => new Set([...prev, suggestion.id]))
        showToast(
          t(
            "runtime.components.chair.conference-detail.conference-committee.text_invitation_sent",
            { name: suggestion.name },
          ),
        )
      }
    },
    [conferenceId, showToast, t],
  )

  const handleRemove = useCallback(
    (suggestion: ReviewerSuggestion) => {
      setRemoved((prev) => new Set([...prev, suggestion.id]))
      showToast(
        t(
          "runtime.components.chair.conference-detail.conference-committee.text_removed_suggestion",
          { name: suggestion.name },
        ),
      )
    },
    [showToast, t],
  )

  const handleInviteAll = useCallback(async () => {
    const toInvite = filtered.filter(
      (s) => s.on_platform && !invited.has(s.id) && s.platform_user_id,
    )
    if (toInvite.length === 0) return

    const response = await inviteReviewers(
      conferenceId,
      toInvite.map((s) => ({ user_id: s.platform_user_id! })),
    )

    if (!response.error) {
      setInvited((prev) => new Set([...prev, ...toInvite.map((s) => s.id)]))
      showToast(
        t("runtime.components.chair.conference-detail.conference-committee.text_invitations_sent", {
          count: String(toInvite.length),
        }),
      )
    }
  }, [conferenceId, filtered, invited, showToast, t])

  const platformCount = visible.filter((s) => s.on_platform && !invited.has(s.id)).length
  const externalCount = visible.filter((s) => !s.on_platform && !invited.has(s.id)).length
  const allCount = visible.filter((s) => !invited.has(s.id)).length
  const invitableCount = filtered.filter((s) => s.on_platform && !invited.has(s.id)).length

  if (loading) {
    return <LoadingSuggestions T={T} />
  }

  const startDisabled = parsedTopN === null
  const startLabel = hasStarted ? T("text_re_run") : T("text_start")
  const startIcon = hasStarted ? "refresh" : "play_arrow"

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <SuggestionIcon name="auto_awesome" size={16} />
              <h3 className="text-[13px] font-semibold text-[#1B3C53]">
                {T("text_suggested_reviewers")}
              </h3>
              {hasStarted && (
                <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {allCount} {T("text_matches")}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {T("text_suggested_reviewers_subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="reviewer-suggestion-top-n"
                className="text-[11px] text-slate-600 font-medium"
              >
                {T("text_top_n_label")}
              </label>
              <input
                id="reviewer-suggestion-top-n"
                type="number"
                min={1}
                inputMode="numeric"
                value={topNInput}
                placeholder={T("text_top_n_placeholder")}
                onChange={(e) => setTopNInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !startDisabled) handleStart()
                }}
                aria-invalid={startDisabled}
                aria-describedby={startDisabled ? "reviewer-suggestion-top-n-error" : undefined}
                className={cn(
                  "w-16 h-7 px-2 text-[11px] text-center border rounded-md focus:ring-1 focus:ring-[#1B3C53] outline-none tabular-nums",
                  startDisabled ? "border-red-300 text-red-700" : "border-slate-200 text-slate-700",
                )}
              />
              <button
                onClick={handleStart}
                disabled={startDisabled}
                className="px-2.5 py-1.5 text-[11px] font-medium rounded-md bg-[#1B3C53] text-white hover:bg-[#234C6A] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <SuggestionIcon name={startIcon} size={13} />
                {startLabel}
              </button>
              {startDisabled && (
                <span id="reviewer-suggestion-top-n-error" className="text-[10px] text-red-600">
                  {T("text_top_n_invalid")}
                </span>
              )}
            </div>
            {hasStarted && (
              <>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <div className="flex gap-1.5 items-center">
                  {(["all", "platform", "external"] as PlatformFilter[]).map((f) => {
                    const count =
                      f === "all" ? allCount : f === "platform" ? platformCount : externalCount
                    const label =
                      f === "all"
                        ? T("text_all")
                        : f === "platform"
                          ? T("text_on_platform")
                          : T("text_not_on_platform")
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] border transition-colors",
                          filter === f
                            ? "bg-[#1B3C53] text-white border-[#1B3C53]"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        {label} ({count})
                      </button>
                    )
                  })}
                </div>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-7 px-2 bg-white border border-slate-200 text-slate-600 text-[11px] rounded-md focus:ring-1 focus:ring-[#1B3C53] outline-none"
                >
                  <option value="highest_match">{T("text_highest_match")}</option>
                  <option value="most_publications">{T("text_most_publications")}</option>
                </select>
                <button
                  onClick={handleInviteAll}
                  disabled={invitableCount === 0}
                  className="px-2.5 py-1.5 text-[11px] font-medium rounded-md bg-[#1B3C53] text-white hover:bg-[#234C6A] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <SuggestionIcon name="mail" size={13} />
                  {T("text_invite_all")} ({invitableCount})
                </button>
              </>
            )}
          </div>
        </div>

        {!hasStarted ? (
          <div className="py-12 text-center px-6">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1B3C53]/5 text-[#1B3C53] mb-3">
              <SuggestionIcon name="auto_awesome" size={24} />
            </span>
            <p className="text-[14px] font-semibold text-[#1B3C53]">{T("text_pick_count_title")}</p>
            <p className="text-[12px] text-slate-500 mt-1">{T("text_pick_count_hint")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] font-medium text-[#1B3C53]">
              {allCount === 0 ? T("text_all_caught_up") : T("text_no_suggestions_filter")}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {allCount === 0 ? T("text_all_suggestions_actioned") : T("text_try_another_filter")}
            </p>
          </div>
        ) : (
          filtered.map((suggestion) => (
            <SuggestionRow
              key={suggestion.id}
              suggestion={suggestion}
              invited={invited.has(suggestion.id)}
              onInvite={handleInvite}
              onRemove={handleRemove}
              T={T}
            />
          ))
        )}
      </div>

      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} />
      ))}
    </>
  )
}
