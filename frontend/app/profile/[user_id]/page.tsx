"use client"

import { useParams, useRouter } from "next/navigation"
import { type ReactNode, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ProfileOnboardingModal } from "@/components/profile/profile-onboarding-modal"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNotifications } from "@/hooks/use-notifications"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { ApiError, UnauthorizedError, apiFetch } from "@/lib/api/client"
import { type AcademicPaper, type AcademicProfile, userApi } from "@/lib/api/user"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getSidebarMenuItems } from "@/lib/navigation"
import { resolveUserEmail } from "@/lib/profile/resolve-user-email"
import { getProfileGradient, getProfileInitials } from "@/lib/profile/presentation"
import { ROUTES } from "@/lib/routes"
import type { ProfileFormData, UpdateProfileRequest, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  Mail,
  Search,
  Unlink,
} from "lucide-react"

const EMPTY_FORM: ProfileFormData = {
  firstName: "",
  lastName: "",
  email: "",
  domain: [],
}

const INITIAL_VISIBLE_PAPERS = 8

type PaperSort = "newest" | "cited"

const normalizeDomains = (domains: unknown): string[] => {
  if (!Array.isArray(domains)) {
    return []
  }

  return domains
    .map((item) => (typeof item === "string" ? item.trim() : String(item || "").trim()))
    .filter((item) => item.length > 0)
}

function formatSyncedAt(value: string | undefined, locale: string) {
  if (!value) {
    return null
  }

  const parsed = new Date(value.replace(" ", "T"))
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatPublicationAuthors(authors: AcademicPaper["authors"], currentAuthorName?: string) {
  if (!authors?.length) {
    return null
  }

  const visibleAuthors = authors
    .map((author) => author.name)
    .filter(Boolean)
    .filter((name, index, list) => list.indexOf(name) === index)

  if (visibleAuthors.length === 0) {
    return null
  }

  const orderedAuthors =
    currentAuthorName && visibleAuthors.includes(currentAuthorName)
      ? [currentAuthorName, ...visibleAuthors.filter((name) => name !== currentAuthorName)]
      : visibleAuthors

  if (orderedAuthors.length <= 4) {
    return orderedAuthors.join(", ")
  }

  return `${orderedAuthors.slice(0, 4).join(", ")} +${orderedAuthors.length - 4}`
}

function ProfileIdentityAvatar({
  name,
  seed,
  className,
}: {
  name: string
  seed: string
  className?: string
}) {
  return (
    <Avatar className={cn("h-24 w-24 border border-white/60 shadow-lg", className)}>
      <AvatarFallback
        className="text-2xl font-semibold text-white"
        style={{ backgroundImage: getProfileGradient(seed) }}
      >
        {getProfileInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

function ProfileMetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <div className="text-slate-400">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  )
}

function AcademicStateCallout({
  tone = "neutral",
  icon,
  title,
  description,
  action,
}: {
  tone?: "neutral" | "info" | "danger"
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  const toneClass =
    tone === "info"
      ? "border-blue-200 bg-blue-50 text-blue-900"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-slate-200 bg-slate-50 text-slate-900"

  return (
    <div className={cn("rounded-2xl border px-4 py-4", toneClass)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-current">{icon}</div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-sm/6 opacity-90">{description}</p>
          </div>
        </div>
        {action}
      </div>
    </div>
  )
}

function PublicationCard({
  paper,
  authorName,
  locale,
  citationsLabel,
  authorsLabel,
  abstractLabel,
  unavailableLabel,
  viewLabel,
}: {
  paper: AcademicPaper
  authorName?: string
  locale: string
  citationsLabel: string
  authorsLabel: string
  abstractLabel: string
  unavailableLabel: string
  viewLabel: string
}) {
  const publicationAuthors = formatPublicationAuthors(paper.authors, authorName)
  const citationCount = paper.citationCount ?? 0
  const yearLabel = paper.year || unavailableLabel
  const venueLabel = paper.venue?.trim() || unavailableLabel

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-tight tracking-tight text-slate-950">
              {paper.title}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                {yearLabel}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                {citationCount.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}{" "}
                {citationsLabel.toLowerCase()}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                {venueLabel}
              </Badge>
            </div>
          </div>
        </div>

        {paper.url && (
          <Button variant="outline" size="sm" asChild className="self-start">
            <a href={paper.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {viewLabel}
            </a>
          </Button>
        )}
      </div>

      {publicationAuthors && (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          <span className="font-medium text-slate-900">{authorsLabel}: </span>
          {publicationAuthors}
        </p>
      )}

      {paper.abstract?.trim() && (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {abstractLabel}
          </p>
          <p className="mt-2 line-clamp-3 text-sm/6 text-slate-600">{paper.abstract}</p>
        </div>
      )}
    </article>
  )
}

export default function UserProfilePage() {
  const { locale, t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user: authUser, refreshUser, isAuthenticated, currentRole } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })

  const userId = String(params.user_id || "")
  const sidebarMenuItems = useMemo(
    () => getSidebarMenuItems(currentRole, unreadCount),
    [currentRole, unreadCount],
  )

  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [profile, setProfile] = useState<User | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>(EMPTY_FORM)
  const [initialFormData, setInitialFormData] = useState<ProfileFormData>(EMPTY_FORM)
  const [domainInput, setDomainInput] = useState("")
  const [academicProfile, setAcademicProfile] = useState<AcademicProfile | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [profileSyncStatus, setProfileSyncStatus] = useState<string | null>(null)
  const [profileSyncError, setProfileSyncError] = useState<string | null>(null)
  const [paperSort, setPaperSort] = useState<PaperSort>("newest")
  const [paperQuery, setPaperQuery] = useState("")
  const [visiblePaperCount, setVisiblePaperCount] = useState(INITIAL_VISIBLE_PAPERS)
  const deferredPaperQuery = useDeferredValue(paperQuery)

  useEffect(() => {
    const timer = window.setTimeout(() => setAuthChecked(true), 100)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push(ROUTES.LOGIN)
    }
  }, [authChecked, isAuthenticated, router])

  const isOwnProfile = useMemo(() => {
    if (!profile || !authUser?.email) {
      return false
    }

    return profile.email === authUser.email
  }, [profile, authUser])

  const refreshAcademicProfile = useCallback(async () => {
    if (!profile?.email) {
      return
    }

    try {
      const academic = isOwnProfile
        ? await userApi.getAcademicProfile()
        : await userApi.getAcademicProfileByEmail(profile.email)
      setAcademicProfile(academic.data?.data ?? null)
      setProfileSyncError(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setAcademicProfile(null)
        return
      }

      setAcademicProfile(null)
      if (profileSyncStatus === "failed") {
        setProfileSyncError(
          t("runtime.app.profile.user_id.page.text_previous_synchronization_failed_retry_linking"),
        )
      }
    }
  }, [isOwnProfile, profile?.email, profileSyncStatus, t])

  const refreshProfileSyncStatus = useCallback(async () => {
    if (!isOwnProfile) {
      return
    }

    try {
      const syncStatusResponse = await userApi.getProfileSyncStatus()
      const nextStatus = syncStatusResponse.data?.data?.profile_sync_status || null
      setProfileSyncStatus(nextStatus)

      if (nextStatus === "completed") {
        await refreshAcademicProfile()
        await refreshUser()
      }
    } catch {
      // Keep the latest known status if status refresh fails.
    }
  }, [isOwnProfile, refreshAcademicProfile, refreshUser])

  useEffect(() => {
    async function loadProfile() {
      if (!authChecked || !isAuthenticated || !authUser) {
        return
      }

      setLoading(true)
      setNotFound(false)

      const resolved = await resolveUserEmail(userId, String(authUser.id || ""))
      if (resolved.mode === "not_found") {
        setLoading(false)
        setNotFound(true)
        return
      }

      try {
        const endpoint =
          resolved.mode === "me" ? "/api/v1/users/me" : `/api/v1/users/${resolved.email}`

        const { data } = await apiFetch<{ data: User }>(endpoint)
        const nextProfile = data?.data

        if (!nextProfile) {
          setNotFound(true)
          setLoading(false)
          return
        }

        setProfile(nextProfile)
        setProfileSyncStatus(nextProfile.profile_sync_status || null)

        const nextForm: ProfileFormData = {
          firstName: nextProfile.first_name || "",
          lastName: nextProfile.last_name || "",
          email: nextProfile.email || "",
          domain: normalizeDomains(nextProfile.domain),
        }

        setFormData(nextForm)
        setInitialFormData({ ...nextForm, domain: [...nextForm.domain] })

        try {
          const academicResponse =
            resolved.mode === "me" || nextProfile.email === authUser.email
              ? await userApi.getAcademicProfile()
              : await userApi.getAcademicProfileByEmail(nextProfile.email)
          setAcademicProfile(academicResponse.data?.data ?? null)
          setProfileSyncError(null)
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) {
            setAcademicProfile(null)
          } else {
            setAcademicProfile(null)
          }
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [authChecked, isAuthenticated, authUser, userId])

  useEffect(() => {
    if (!isOwnProfile) {
      return
    }

    void userApi
      .getProfileSyncStatus()
      .then((response) => {
        setProfileSyncStatus(response.data?.data?.profile_sync_status || null)
      })
      .catch(() => undefined)
  }, [isOwnProfile])

  useEffect(() => {
    if (!isOwnProfile || profileSyncStatus !== "pending") {
      return
    }

    const interval = window.setInterval(() => {
      void refreshProfileSyncStatus()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [isOwnProfile, profileSyncStatus, refreshProfileSyncStatus])

  const isDirty = useMemo(() => {
    const sameDomains =
      formData.domain.length === initialFormData.domain.length &&
      formData.domain.every(
        (value, index) => value.trim() === (initialFormData.domain[index] || "").trim(),
      )

    return (
      formData.firstName.trim() !== initialFormData.firstName.trim() ||
      formData.lastName.trim() !== initialFormData.lastName.trim() ||
      formData.email.trim() !== initialFormData.email.trim() ||
      !sameDomains
    )
  }, [formData, initialFormData])

  useEffect(() => {
    setVisiblePaperCount(INITIAL_VISIBLE_PAPERS)
  }, [academicProfile?.papers, deferredPaperQuery, paperSort])

  const filteredPapers = useMemo(() => {
    if (!academicProfile?.papers?.length) {
      return []
    }

    const query = deferredPaperQuery.trim().toLowerCase()
    const papers = [...academicProfile.papers]

    if (paperSort === "cited") {
      papers.sort((left, right) => (right.citationCount || 0) - (left.citationCount || 0))
    } else {
      papers.sort((left, right) => {
        if ((right.year || 0) !== (left.year || 0)) {
          return (right.year || 0) - (left.year || 0)
        }
        return (right.citationCount || 0) - (left.citationCount || 0)
      })
    }

    if (!query) {
      return papers
    }

    return papers.filter((paper) => {
      const haystack = [
        paper.title,
        paper.abstract,
        paper.venue,
        ...(paper.authors?.map((author) => author.name) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [academicProfile?.papers, deferredPaperQuery, paperSort])

  const visiblePapers = useMemo(
    () => filteredPapers.slice(0, visiblePaperCount),
    [filteredPapers, visiblePaperCount],
  )

  const displayName = useMemo(() => {
    const userName = [formData.firstName, formData.lastName].filter(Boolean).join(" ").trim()
    return academicProfile?.name || userName || profile?.email || t("app.name")
  }, [academicProfile?.name, formData.firstName, formData.lastName, profile?.email, t])

  const affiliations = academicProfile?.affiliations?.filter(Boolean) || []
  const domains = normalizeDomains(formData.domain)
  const syncedAtLabel = formatSyncedAt(academicProfile?.syncedAt, locale)

  const syncBadge = useMemo(() => {
    if (!profileSyncStatus) {
      return null
    }

    if (profileSyncStatus === "pending") {
      return {
        className: "border-blue-200 bg-blue-50 text-blue-700",
        label: t("runtime.app.profile.user_id.page.text_sync_pending"),
      }
    }

    if (profileSyncStatus === "failed") {
      return {
        className: "border-rose-200 bg-rose-50 text-rose-700",
        label: t("runtime.app.profile.user_id.page.text_sync_failed"),
      }
    }

    if (profileSyncStatus === "completed") {
      return {
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        label: t("runtime.app.profile.user_id.page.text_sync_completed"),
      }
    }

    return {
      className: "border-slate-200 bg-slate-50 text-slate-700",
      label: profileSyncStatus,
    }
  }, [profileSyncStatus, t])

  const handleSave = async () => {
    if (!profile || !isOwnProfile) {
      return
    }

    const targetId = Number(profile.id)
    if (!Number.isFinite(targetId) || targetId <= 0) {
      toast({
        title: t("runtime.app.profile.user_id.page.prop_title_unable_to_save"),
        description: t("runtime.app.profile.user_id.page.prop_description_missing_profile_id"),
        variant: "destructive",
      })
      return
    }

    const payload: UpdateProfileRequest = {
      id: targetId,
      user: {
        id: targetId,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        domain: normalizeDomains(formData.domain),
      },
    }

    try {
      setSaving(true)
      await apiFetch(`/api/v1/users/${profile.email}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      toast({
        title: t("runtime.app.profile.user_id.page.prop_title_profile_updated"),
        description: t(
          "runtime.app.profile.user_id.page.prop_description_your_profile_was_saved_successfully",
        ),
      })
      await refreshUser()

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              first_name: payload.user.first_name,
              last_name: payload.user.last_name,
              email: payload.user.email,
              domain: payload.user.domain,
            }
          : prev,
      )

      setInitialFormData({ ...formData, domain: [...formData.domain] })
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        router.push(ROUTES.LOGIN)
        return
      }

      toast({
        title: t("runtime.app.profile.user_id.page.prop_title_unable_to_save"),
        description: t("runtime.app.profile.user_id.page.prop_description_please_try_again"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const addDomain = () => {
    const value = domainInput.trim()
    if (!value || formData.domain.includes(value)) {
      return
    }

    setFormData((prev) => ({ ...prev, domain: [...prev.domain, value] }))
    setDomainInput("")
  }

  const removeDomain = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      domain: prev.domain.filter((domain) => domain !== value),
    }))
  }

  const handleOnboardingComplete = async (authorId?: string) => {
    if (!authorId) {
      return
    }

    setProfileSyncStatus("pending")
    await refreshAcademicProfile()
    await refreshProfileSyncStatus()
    await refreshUser()
  }

  const handleUnlinkAcademicProfile = async () => {
    if (!isOwnProfile || isUnlinking) {
      return
    }

    if (profileSyncStatus === "pending") {
      toast({
        title: t("runtime.app.profile.user_id.page.prop_title_sync_in_progress"),
        description: t(
          "runtime.app.profile.user_id.page.prop_description_please_wait_for_profile_sync_to_complete_before_unlinking",
        ),
        variant: "destructive",
      })
      return
    }

    const confirmed = window.confirm(
      t(
        "runtime.app.profile.user_id.page.text_are_you_sure_you_want_to_unlink_your_academic_profile_this_will_remove_synced_publication_data",
      ),
    )
    if (!confirmed) {
      return
    }

    try {
      setIsUnlinking(true)
      await userApi.unlinkAcademicProfile()
      await refreshAcademicProfile()
      setProfileSyncStatus(null)
      setProfileSyncError(null)
      await refreshUser()
      toast({
        title: t("runtime.app.profile.user_id.page.prop_title_academic_profile_unlinked"),
        description: t(
          "runtime.app.profile.user_id.page.prop_description_your_semantic_scholar_profile_has_been",
        ),
      })
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        router.push(ROUTES.LOGIN)
        return
      }

      toast({
        title: t("runtime.app.profile.user_id.page.prop_title_unable_to_unlink"),
        description: t("runtime.app.profile.user_id.page.prop_description_please_try_again"),
        variant: "destructive",
      })
    } finally {
      setIsUnlinking(false)
    }
  }

  const renderShell = (content: ReactNode) => (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={sidebarMenuItems} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-6 md:py-8 w-full">
          {content}
        </div>
      </main>
    </div>
  )

  if (!authChecked || !isAuthenticated || loading) {
    return renderShell(
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>,
    )
  }

  if (notFound || !profile) {
    return renderShell(
      <div className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">
          {t("runtime.app.profile.user_id.page.text_profile_not_found")}
        </h1>
        <p className="mt-3 text-neutral-600">
          {t("runtime.app.profile.user_id.page.text_we_could_not_resolve_this_profile")}
        </p>
        <Button className="mt-6" onClick={() => router.back()}>
          {t("runtime.app.profile.user_id.page.text_go_back")}
        </Button>
      </div>,
    )
  }

  return renderShell(
    <>
      <div className="mx-auto max-w-6xl space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() =>
            window.history.length > 1 ? router.back() : router.push(ROUTES.ROLE_SELECT)
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("runtime.app.profile.user_id.page.text_back")}
        </Button>

        <Card className="overflow-hidden rounded-3xl border-slate-200 py-0 shadow-sm">
          <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_42%,#e2e8f0_100%)] px-6 py-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <ProfileIdentityAvatar
                  name={displayName}
                  seed={profile.email || academicProfile?.semanticScholarId || displayName}
                />

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                        {displayName}
                      </h1>
                      <Badge variant="secondary" className="rounded-full">
                        {isOwnProfile
                          ? t("runtime.app.profile.user_id.page.text_profile_owner")
                          : t("runtime.app.profile.user_id.page.text_public_profile")}
                      </Badge>
                      {academicProfile && (
                        <Badge variant="secondary" className="rounded-full">
                          {t("runtime.app.profile.user_id.page.text_academic_profile_linked")}
                        </Badge>
                      )}
                      {syncBadge && (
                        <Badge className={cn("rounded-full border", syncBadge.className)}>
                          {syncBadge.label}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {profile.email}
                      </span>
                      {affiliations[0] && (
                        <span className="inline-flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {affiliations[0]}
                        </span>
                      )}
                      {syncedAtLabel && (
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="h-4 w-4" />
                          {t("runtime.app.profile.user_id.page.text_last_synced")} {syncedAtLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {affiliations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {affiliations.slice(0, 4).map((affiliation) => (
                        <Badge key={affiliation} variant="secondary" className="rounded-full px-3">
                          {affiliation}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {t("runtime.app.profile.user_id.page.text_research_interests")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {domains.length > 0 ? (
                        domains.map((domain) => (
                          <Badge
                            key={domain}
                            variant="outline"
                            className="rounded-full border-slate-300 px-3 py-1 text-slate-700"
                          >
                            {domain}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">
                          {t("runtime.app.profile.user_id.page.text_no_research_interests_listed")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {academicProfile?.url && (
                  <Button variant="outline" asChild>
                    <a href={academicProfile.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t("runtime.app.profile.user_id.page.text_view_scholar_profile")}
                    </a>
                  </Button>
                )}

                {isOwnProfile && !academicProfile && (
                  <Button onClick={() => setShowOnboarding(true)} disabled={profileSyncStatus === "pending"}>
                    {t("runtime.app.profile.user_id.page.text_connect")}
                  </Button>
                )}

                {isOwnProfile && academicProfile && (
                  <Button
                    variant="outline"
                    onClick={handleUnlinkAcademicProfile}
                    disabled={isUnlinking || profileSyncStatus === "pending"}
                  >
                    {isUnlinking ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Unlink className="mr-2 h-4 w-4" />
                    )}
                    {t("runtime.app.profile.user_id.page.text_unlink")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <CardContent className="space-y-5 px-6 py-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ProfileMetricCard
                label={t("runtime.app.profile.user_id.page.text_h_index")}
                value={academicProfile?.hIndex ?? 0}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <ProfileMetricCard
                label={t("runtime.app.profile.user_id.page.text_citations")}
                value={academicProfile?.citationCount ?? 0}
                icon={<BookOpen className="h-4 w-4" />}
              />
              <ProfileMetricCard
                label={t("runtime.app.profile.user_id.page.text_papers")}
                value={academicProfile?.paperCount ?? academicProfile?.papers?.length ?? 0}
                icon={<BookOpen className="h-4 w-4" />}
              />
              <ProfileMetricCard
                label={t("runtime.app.profile.user_id.page.text_sync_freshness")}
                value={
                  syncedAtLabel || t("runtime.app.profile.user_id.page.text_not_synced_yet")
                }
                icon={<Clock3 className="h-4 w-4" />}
              />
            </div>

            {!academicProfile && profileSyncStatus === "pending" && (
              <AcademicStateCallout
                tone="info"
                icon={<Loader2 className="h-4 w-4 animate-spin" />}
                title={t("runtime.app.profile.user_id.page.text_profile_sync_in_progress")}
                description={t(
                  "runtime.app.profile.user_id.page.text_sync_in_progress_your_profile_metrics_and_publications_will_appear_when_it_completes",
                )}
              />
            )}

            {!academicProfile && profileSyncStatus === "failed" && (
              <AcademicStateCallout
                tone="danger"
                icon={<AlertCircle className="h-4 w-4" />}
                title={t("runtime.app.profile.user_id.page.text_sync_failed")}
                description={
                  profileSyncError ||
                  t(
                    "runtime.app.profile.user_id.page.text_profile_sync_failed_retry_linking_your_profile",
                  )
                }
                action={
                  isOwnProfile ? (
                    <Button size="sm" variant="outline" onClick={() => setShowOnboarding(true)}>
                      {t("runtime.app.profile.user_id.page.text_retry_sync")}
                    </Button>
                  ) : undefined
                }
              />
            )}

            {!academicProfile &&
              profileSyncStatus !== "pending" &&
              profileSyncStatus !== "failed" && (
              <AcademicStateCallout
                icon={<BookOpen className="h-4 w-4" />}
                title={
                  isOwnProfile
                    ? t("runtime.app.profile.user_id.page.text_build_your_academic_profile")
                    : t("runtime.app.profile.user_id.page.text_no_academic_profile_linked")
                }
                description={
                  isOwnProfile
                    ? t(
                        "runtime.app.profile.user_id.page.text_connect_your_semantic_scholar_profile_to_sync_citations_and_publications",
                      )
                    : t(
                        "runtime.app.profile.user_id.page.text_this_user_has_not_linked_an_academic_profile",
                      )
                }
                action={
                  isOwnProfile ? (
                    <Button size="sm" onClick={() => setShowOnboarding(true)}>
                      {t("runtime.app.profile.user_id.page.text_connect")}
                    </Button>
                  ) : undefined
                }
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 py-0 shadow-sm">
          <CardHeader className="border-b border-slate-200 py-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(18rem,1fr)_auto] xl:items-start xl:gap-6 2xl:items-center">
              <div className="min-w-0 space-y-2">
                <CardTitle className="max-w-3xl text-2xl leading-tight tracking-tight text-slate-950">
                  {t("runtime.app.profile.user_id.page.text_publications")}
                </CardTitle>
                <CardDescription>
                  {academicProfile?.papers?.length
                    ? t("runtime.app.profile.user_id.page.text_showing_publications_summary")
                        .replace("{visible}", String(visiblePapers.length))
                        .replace("{total}", String(filteredPapers.length))
                    : t("runtime.app.profile.user_id.page.text_publications_description")}
                </CardDescription>
              </div>

              {academicProfile?.papers?.length ? (
                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="flex w-full flex-col gap-3 md:flex-row md:items-center xl:w-auto xl:flex-nowrap">
                    <div className="relative min-w-0 flex-1 md:w-72 xl:w-80 xl:flex-none">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={paperQuery}
                      onChange={(event) => setPaperQuery(event.target.value)}
                      className="pl-9"
                      placeholder={t(
                        "runtime.app.profile.user_id.page.placeholder_search_publications",
                      )}
                    />
                    </div>
                    <div className="inline-flex w-full flex-wrap rounded-full border border-slate-200 bg-slate-50 p-1 sm:w-auto md:flex-nowrap">
                      <Button
                        type="button"
                        size="sm"
                        variant={paperSort === "newest" ? "secondary" : "ghost"}
                        className="rounded-full"
                        onClick={() => setPaperSort("newest")}
                      >
                        {t("runtime.app.profile.user_id.page.text_sort_newest")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={paperSort === "cited" ? "secondary" : "ghost"}
                        className="rounded-full"
                        onClick={() => setPaperSort("cited")}
                      >
                        {t("runtime.app.profile.user_id.page.text_sort_most_cited")}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-6 py-6">
            {visiblePapers.length > 0 ? (
              <>
                {visiblePapers.map((paper) => (
                  <PublicationCard
                    key={paper.paperId}
                    paper={paper}
                    authorName={academicProfile?.name}
                    locale={locale}
                    citationsLabel={t("runtime.app.profile.user_id.page.text_citations")}
                    authorsLabel={t("runtime.app.profile.user_id.page.text_authors")}
                    abstractLabel={t("runtime.app.profile.user_id.page.text_abstract")}
                    unavailableLabel={t("runtime.app.profile.user_id.page.text_not_available")}
                    viewLabel={t("runtime.app.profile.user_id.page.text_view")}
                  />
                ))}

                {filteredPapers.length > visiblePaperCount && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setVisiblePaperCount((current) => current + INITIAL_VISIBLE_PAPERS)
                      }
                    >
                      {t("runtime.app.profile.user_id.page.text_show_more_publications")}
                    </Button>
                  </div>
                )}
              </>
            ) : academicProfile?.papers?.length ? (
              <AcademicStateCallout
                icon={<Search className="h-4 w-4" />}
                title={t("runtime.app.profile.user_id.page.text_no_matching_publications")}
                description={t(
                  "runtime.app.profile.user_id.page.text_try_a_different_search_term_for_publications",
                )}
              />
            ) : academicProfile ? (
              <AcademicStateCallout
                icon={<BookOpen className="h-4 w-4" />}
                title={t("runtime.app.profile.user_id.page.text_no_publications_available")}
                description={t(
                  "runtime.app.profile.user_id.page.text_profile_linked_but_no_publications_are",
                )}
              />
            ) : (
              <AcademicStateCallout
                icon={<BookOpen className="h-4 w-4" />}
                title={t("runtime.app.profile.user_id.page.text_publications")}
                description={t("runtime.app.profile.user_id.page.text_publications_empty_state")}
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 py-0 shadow-sm">
          <CardHeader className="border-b border-slate-200 py-6">
            <div className="space-y-2">
              <CardTitle className="text-2xl tracking-tight text-slate-950">
                {t("runtime.app.profile.user_id.page.text_account_details")}
              </CardTitle>
              <CardDescription>
                {isOwnProfile
                  ? t(
                      "runtime.app.profile.user_id.page.text_manage_the_information_used_across_the_platform",
                    )
                  : t("runtime.app.profile.user_id.page.text_read_only_profile_information")}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-6 py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">
                  {t("runtime.app.profile.user_id.page.text_first_name")}
                </Label>
                <Input
                  id="first-name"
                  value={formData.firstName}
                  disabled={!isOwnProfile || saving}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, firstName: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-name">
                  {t("runtime.app.profile.user_id.page.text_last_name")}
                </Label>
                <Input
                  id="last-name"
                  value={formData.lastName}
                  disabled={!isOwnProfile || saving}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, lastName: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("runtime.app.profile.user_id.page.text_email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled={!isOwnProfile || saving}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>

            <div className="space-y-3">
              <Label>{t("runtime.app.profile.user_id.page.text_domains")}</Label>

              {isOwnProfile && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={domainInput}
                    disabled={saving}
                    onChange={(event) => setDomainInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        addDomain()
                      }
                    }}
                    placeholder={t("runtime.app.profile.user_id.page.placeholder_add_a_domain")}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addDomain}
                    disabled={saving || !domainInput.trim()}
                  >
                    {t("runtime.app.profile.user_id.page.text_add")}
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {domains.length > 0 ? (
                  domains.map((domain) => (
                    <Badge key={domain} variant="secondary" className="gap-2 rounded-full px-3">
                      {domain}
                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={() => removeDomain(domain)}
                          disabled={saving}
                          aria-label={`${t("runtime.app.profile.user_id.page.text_remove")} ${domain}`}
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    {t("runtime.app.profile.user_id.page.text_no_domains_listed")}
                  </span>
                )}
              </div>
            </div>

            {isOwnProfile && isDirty && (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() =>
                    setFormData({ ...initialFormData, domain: [...initialFormData.domain] })
                  }
                  disabled={saving}
                >
                  {t("runtime.app.profile.user_id.page.text_reset")}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving
                    ? t("runtime.app.profile.user_id.page.text_saving")
                    : t("runtime.app.profile.user_id.page.text_save")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isOwnProfile && (
        <ProfileOnboardingModal
          isOpen={showOnboarding}
          onOpenChange={setShowOnboarding}
          userName={`${formData.firstName} ${formData.lastName}`.trim() || profile.email}
          onComplete={handleOnboardingComplete}
        />
      )}
    </>,
  )
}
