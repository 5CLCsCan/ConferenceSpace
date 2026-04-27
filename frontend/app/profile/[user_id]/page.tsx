"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ProfileOnboardingModal } from "@/components/profile/profile-onboarding-modal"
import { ProfileAccountSection } from "@/components/profile/profile-account-section"
import { ProfileChangePasswordModal } from "@/components/profile/profile-change-password-modal"
import { ProfileEditDetailsModal } from "@/components/profile/profile-edit-details-modal"
import { ProfileHeroSection } from "@/components/profile/profile-hero-section"
import { ProfilePublicationsSection } from "@/components/profile/profile-publications-section"
import { useNotifications } from "@/hooks/use-notifications"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { ApiError, UnauthorizedError, apiFetch } from "@/lib/api/client"
import { type AcademicProfile, userApi } from "@/lib/api/user"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getSidebarMenuItems } from "@/lib/navigation"
import { resolveUserEmail } from "@/lib/profile/resolve-user-email"
import { ROUTES } from "@/lib/routes"
import type { ProfileFormData, UpdateProfileRequest, User } from "@/lib/types"

const EMPTY_FORM: ProfileFormData = { firstName: "", lastName: "", email: "", domain: [] }

const normalizeDomains = (domains: unknown): string[] => {
  if (!Array.isArray(domains)) return []
  return domains
    .map((item) => (typeof item === "string" ? item.trim() : String(item || "").trim()))
    .filter((item) => item.length > 0)
}

export default function UserProfilePage() {
  const { locale, t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user: authUser, refreshUser, logout, isAuthenticated, currentRole } = useAuth()
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
  const [academicProfile, setAcademicProfile] = useState<AcademicProfile | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showEditDetails, setShowEditDetails] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [profileSyncStatus, setProfileSyncStatus] = useState<string | null>(null)
  const [profileSyncError, setProfileSyncError] = useState<string | null>(null)

  const applyProfileState = useCallback((nextProfile: User) => {
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
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setAuthChecked(true), 100)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (authChecked && !isAuthenticated) router.push(ROUTES.LOGIN)
  }, [authChecked, isAuthenticated, router])

  const isOwnProfile = useMemo(
    () => !!profile && !!authUser?.email && profile.email === authUser.email,
    [profile, authUser],
  )

  const displayName = useMemo(() => {
    const name = [formData.firstName, formData.lastName].filter(Boolean).join(" ").trim()
    return academicProfile?.name || name || profile?.email || t("app.name")
  }, [academicProfile?.name, formData.firstName, formData.lastName, profile?.email, t])

  const domains = normalizeDomains(formData.domain)

  const syncBadge = useMemo(() => {
    if (!profileSyncStatus) return null
    if (profileSyncStatus === "pending")
      return {
        className: "border-blue-200 bg-blue-50 text-blue-700",
        label: t("runtime.app.profile.user_id.page.text_sync_pending"),
      }
    if (profileSyncStatus === "failed")
      return {
        className: "border-rose-200 bg-rose-50 text-rose-700",
        label: t("runtime.app.profile.user_id.page.text_sync_failed"),
      }
    if (profileSyncStatus === "completed")
      return {
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        label: t("runtime.app.profile.user_id.page.text_sync_completed"),
      }
    return { className: "border-slate-200 bg-slate-50 text-slate-700", label: profileSyncStatus }
  }, [profileSyncStatus, t])

  const refreshAcademicProfile = useCallback(async () => {
    if (!profile?.email) return
    try {
      const academic = isOwnProfile
        ? await userApi.getAcademicProfile()
        : await userApi.getAcademicProfileByEmail(profile.email)
      setAcademicProfile(academic.data?.data ?? null)
      setProfileSyncError(null)
    } catch (error) {
      setAcademicProfile(null)
      if (error instanceof ApiError && error.status !== 404 && profileSyncStatus === "failed") {
        setProfileSyncError(
          t("runtime.app.profile.user_id.page.text_previous_synchronization_failed_retry_linking"),
        )
      }
    }
  }, [isOwnProfile, profile?.email, profileSyncStatus, t])

  const refreshProfileRecord = useCallback(async () => {
    if (!authChecked || !isAuthenticated || !authUser) return

    const resolved = await resolveUserEmail(userId, String(authUser.id || ""))
    if (resolved.mode === "not_found") {
      setNotFound(true)
      return
    }

    const endpoint = resolved.mode === "me" ? "/api/v1/users/me" : `/api/v1/users/${resolved.email}`
    const { data } = await apiFetch<{ data: User }>(endpoint)
    const nextProfile = data?.data
    if (!nextProfile) return
    applyProfileState(nextProfile)
  }, [applyProfileState, authChecked, authUser, isAuthenticated, userId])

  const refreshProfileSyncStatus = useCallback(async () => {
    if (!isOwnProfile) return
    try {
      const res = await userApi.getProfileSyncStatus()
      const nextStatus = res.data?.data?.profile_sync_status || null
      setProfileSyncStatus(nextStatus)
      if (nextStatus === "completed") {
        await refreshProfileRecord()
        await refreshAcademicProfile()
        await refreshUser()
      }
    } catch {
      /* keep last known status */
    }
  }, [isOwnProfile, refreshAcademicProfile, refreshProfileRecord, refreshUser])

  useEffect(() => {
    async function loadProfile() {
      if (!authChecked || !isAuthenticated || !authUser) return
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
        applyProfileState(nextProfile)
        try {
          const academic =
            resolved.mode === "me" || nextProfile.email === authUser.email
              ? await userApi.getAcademicProfile()
              : await userApi.getAcademicProfileByEmail(nextProfile.email)
          setAcademicProfile(academic.data?.data ?? null)
        } catch (err) {
          if (!(err instanceof ApiError && err.status === 404)) setAcademicProfile(null)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    void loadProfile()
  }, [applyProfileState, authChecked, isAuthenticated, authUser, userId])

  useEffect(() => {
    if (!isOwnProfile) return
    void userApi
      .getProfileSyncStatus()
      .then((res) => setProfileSyncStatus(res.data?.data?.profile_sync_status || null))
      .catch(() => undefined)
  }, [isOwnProfile])

  useEffect(() => {
    if (!isOwnProfile || profileSyncStatus !== "pending") return
    const interval = window.setInterval(() => void refreshProfileSyncStatus(), 5000)
    return () => window.clearInterval(interval)
  }, [isOwnProfile, profileSyncStatus, refreshProfileSyncStatus])

  const handleSave = async (data: ProfileFormData) => {
    if (!profile || !isOwnProfile) return
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
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        email: data.email.trim(),
        domain: normalizeDomains(data.domain),
      },
    }
    try {
      setSaving(true)
      const previousEmail = profile.email
      const nextEmail = payload.user.email

      await apiFetch(`/api/v1/users/${profile.email}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      const emailChanged =
        previousEmail.trim().toLowerCase() !== nextEmail.trim().toLowerCase()

      if (emailChanged) {
        toast({
          title: t("runtime.app.profile.user_id.page.prop_title_profile_updated"),
          description: "Email updated. Please sign in again with your new email.",
        })

        logout()
        router.push(ROUTES.LOGIN)
        return
      }

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
      const savedForm = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        domain: normalizeDomains(data.domain),
      }
      setFormData(savedForm)
      setInitialFormData({ ...savedForm, domain: [...savedForm.domain] })
      setShowEditDetails(false)
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        router.push(ROUTES.LOGIN)
        return
      }

      if (error instanceof ApiError && error.message) {
        toast({
          title: t("runtime.app.profile.user_id.page.prop_title_unable_to_save"),
          description: error.message,
          variant: "destructive",
        })
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

  const handleUnlink = async () => {
    if (!isOwnProfile || isUnlinking) return
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
    if (
      !window.confirm(
        t(
          "runtime.app.profile.user_id.page.text_are_you_sure_you_want_to_unlink_your_academic_profile_this_will_remove_synced_publication_data",
        ),
      )
    )
      return
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
        title: t("runtime.app.profile.user_id.page.prop_title_unlink_failed"),
        description: t("runtime.app.profile.user_id.page.prop_description_please_try_again"),
        variant: "destructive",
      })
    } finally {
      setIsUnlinking(false)
    }
  }

  const handleOnboardingComplete = async (authorId?: string) => {
    if (!authorId) return
    setProfileSyncStatus("pending")
    await refreshAcademicProfile()
    await refreshProfileSyncStatus()
    await refreshUser()
  }

  function renderShell(children: React.ReactNode) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-slate-900">
        <DashboardSidebar menuItems={sidebarMenuItems} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">{children}</div>
        </main>
      </div>
    )
  }

  if (!authChecked || loading) {
    return renderShell(
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 border-[#1B3C53] border-t-transparent animate-spin" />
      </div>,
    )
  }

  if (notFound || !profile) {
    return renderShell(
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "24px" }}>
            person_off
          </span>
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white">
            {t("runtime.app.profile.user_id.page.text_profile_not_found")}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            {t(
              "runtime.app.profile.user_id.page.text_the_profile_you_are_looking_for_does_not_exist",
            )}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-[#1B3C53] transition-colors"
          onClick={() =>
            window.history.length > 1 ? router.back() : router.push(ROUTES.ROLE_SELECT)
          }
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
            chevron_left
          </span>
          {t("runtime.app.profile.user_id.page.text_go_back")}
        </button>
      </div>,
    )
  }

  return renderShell(
    <>
      <div className="mx-auto max-w-6xl space-y-5">
        <button
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-[#1B3C53] transition-colors -ml-1"
          onClick={() =>
            window.history.length > 1 ? router.back() : router.push(ROUTES.ROLE_SELECT)
          }
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
            chevron_left
          </span>
          {t("runtime.app.profile.user_id.page.text_back")}
        </button>

        <ProfileHeroSection
          profile={profile}
          academicProfile={academicProfile}
          displayName={displayName}
          domains={domains}
          isOwnProfile={isOwnProfile}
          profileSyncStatus={profileSyncStatus}
          profileSyncError={profileSyncError}
          syncBadge={syncBadge}
          locale={locale}
          isUnlinking={isUnlinking}
          onConnect={() => setShowOnboarding(true)}
          onUnlink={handleUnlink}
          t={t}
        />

        <ProfilePublicationsSection
          academicProfile={academicProfile}
          authorName={academicProfile?.name}
          locale={locale}
          t={t}
        />

        <ProfileAccountSection
          formData={formData}
          isOwnProfile={isOwnProfile}
          onEditDetails={() => setShowEditDetails(true)}
          onChangePassword={() => setShowChangePassword(true)}
          t={t}
        />
      </div>

      {isOwnProfile && showOnboarding && (
        <ProfileOnboardingModal
          isOpen={showOnboarding}
          onOpenChange={setShowOnboarding}
          userName={`${formData.firstName} ${formData.lastName}`.trim() || profile.email}
          onComplete={handleOnboardingComplete}
        />
      )}

      {isOwnProfile && showEditDetails && (
        <ProfileEditDetailsModal
          initialData={initialFormData}
          onSave={handleSave}
          onClose={() => setShowEditDetails(false)}
          saving={saving}
        />
      )}

      {isOwnProfile && showChangePassword && (
        <ProfileChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </>,
  )
}
