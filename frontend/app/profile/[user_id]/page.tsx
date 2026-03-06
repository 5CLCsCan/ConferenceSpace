"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { apiFetch, UnauthorizedError } from "@/lib/api/client"
import { userApi, type AcademicProfile } from "@/lib/api/user"
import { resolveUserEmail } from "@/lib/profile/resolve-user-email"
import type { User, ProfileFormData, UpdateProfileRequest } from "@/lib/types"
import { ProfileOnboardingModal } from "@/components/profile/profile-onboarding-modal"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, BookOpen, ExternalLink, Unlink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ROUTES } from "@/lib/routes"
import { useTranslation } from "@/lib/i18n/translation-context"

const EMPTY_FORM: ProfileFormData = {
  firstName: "",
  lastName: "",
  email: "",
  domain: [],
}

const normalizeDomains = (domains: unknown): string[] => {
  if (!Array.isArray(domains)) {
    return []
  }

  return domains
    .map((item) => (typeof item === "string" ? item.trim() : String(item || "").trim()))
    .filter((item) => item.length > 0)
}

export default function UserProfilePage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user: authUser, refreshUser, isAuthenticated } = useAuth()

  const userId = String(params.user_id || "")

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

  useEffect(() => {
    const timer = setTimeout(() => setAuthChecked(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push(ROUTES.LOGIN)
    }
  }, [authChecked, isAuthenticated, router])

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
        const user = data?.data

        if (!user) {
          setNotFound(true)
          setLoading(false)
          return
        }

        setProfile(user)

        const nextForm: ProfileFormData = {
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          email: user.email || "",
          domain: normalizeDomains(user.domain),
        }

        setFormData(nextForm)
        setInitialFormData({ ...nextForm, domain: [...nextForm.domain] })

        const shouldLoadAcademicProfile =
          resolved.mode === "me" || (authUser?.email && user.email === authUser.email)

        if (shouldLoadAcademicProfile) {
          try {
            const academic = await userApi.getAcademicProfile()
            setAcademicProfile(academic.data?.data ?? null)
          } catch {
            setAcademicProfile(null)
          }
        } else {
          setAcademicProfile(null)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [authChecked, isAuthenticated, authUser, userId])

  const isOwnProfile = useMemo(() => {
    if (!profile || !authUser?.email) {
      return false
    }
    return profile.email === authUser.email
  }, [profile, authUser])

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

      toast({ title: t("runtime.app.profile.user_id.page.prop_title_profile_updated"), description: t("runtime.app.profile.user_id.page.prop_description_your_profile_was_saved_successfully") })
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

  const refreshAcademicProfile = async () => {
    try {
      const academic = await userApi.getAcademicProfile()
      setAcademicProfile(academic.data?.data ?? null)
    } catch {
      setAcademicProfile(null)
    }
  }

  const handleOnboardingComplete = async (authorId?: string) => {
    if (!authorId) {
      return
    }
    await refreshAcademicProfile()
    await refreshUser()
  }

  const handleUnlinkAcademicProfile = async () => {
    if (!isOwnProfile || isUnlinking) {
      return
    }

    const confirmed = window.confirm(
      "Are you sure you want to unlink your academic profile? This will remove synced publication data.",
    )
    if (!confirmed) {
      return
    }

    try {
      setIsUnlinking(true)
      await userApi.unlinkAcademicProfile()
      await refreshAcademicProfile()
      await refreshUser()
      toast({
        title: t("runtime.app.profile.user_id.page.prop_title_academic_profile_unlinked"),
        description: t("runtime.app.profile.user_id.page.prop_description_your_semantic_scholar_profile_has_been"),
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

  if (!authChecked || !isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        </main>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-10">
          <div className="max-w-xl mx-auto bg-white border rounded-xl p-8 text-center space-y-4">
            <h1 className="text-2xl font-bold text-neutral-900">{t("runtime.app.profile.user_id.page.text_profile_not_found")}</h1>
            <p className="text-neutral-600">
              {t("runtime.app.profile.user_id.page.text_we_could_not_resolve_this_profile")}{" "}</p>
            <Button onClick={() => router.back()}>{t("runtime.app.profile.user_id.page.text_go_back")}</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            window.history.length > 1 ? router.back() : router.push(ROUTES.ROLE_SELECT)
          }
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("runtime.app.profile.user_id.page.text_back")}{" "}</Button>

        <Card className="py-6">
          <CardHeader>
            <CardTitle>{isOwnProfile ? "My Profile" : "User Profile"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">{t("runtime.app.profile.user_id.page.text_first_name")}</Label>
                <Input
                  id="first-name"
                  value={formData.firstName}
                  disabled={!isOwnProfile || saving}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-name">{t("runtime.app.profile.user_id.page.text_last_name")}</Label>
                <Input
                  id="last-name"
                  value={formData.lastName}
                  disabled={!isOwnProfile || saving}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-3 rounded-lg border bg-neutral-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-neutral-600" />
                  <span className="text-sm font-medium">{t("runtime.app.profile.user_id.page.text_academic_profile")}</span>
                </div>

                <div className="flex items-center gap-2">
                  {academicProfile?.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={academicProfile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t("runtime.app.profile.user_id.page.text_view")}{" "}</a>
                    </Button>
                  )}

                  {isOwnProfile && !academicProfile && (
                    <Button size="sm" onClick={() => setShowOnboarding(true)}>
                      {t("runtime.app.profile.user_id.page.text_connect")}{" "}</Button>
                  )}

                  {isOwnProfile && academicProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUnlinkAcademicProfile}
                      disabled={isUnlinking}
                    >
                      {isUnlinking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Unlink className="h-3.5 w-3.5" />
                      )}
                      {t("runtime.app.profile.user_id.page.text_unlink")}{" "}</Button>
                  )}
                </div>
              </div>

              {academicProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border bg-white p-2 text-center">
                      <p className="text-lg font-semibold">{academicProfile.hIndex}</p>
                      <p className="text-[10px] text-neutral-500 uppercase">{t("runtime.app.profile.user_id.page.text_h_index")}</p>
                    </div>
                    <div className="rounded-md border bg-white p-2 text-center">
                      <p className="text-lg font-semibold">{academicProfile.citationCount}</p>
                      <p className="text-[10px] text-neutral-500 uppercase">citations</p>
                    </div>
                    <div className="rounded-md border bg-white p-2 text-center">
                      <p className="text-lg font-semibold">{academicProfile.paperCount}</p>
                      <p className="text-[10px] text-neutral-500 uppercase">papers</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-neutral-600">{t("runtime.app.profile.user_id.page.text_synced_publications")}</p>
                    {academicProfile.papers?.length ? (
                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                        {academicProfile.papers.slice(0, 20).map((paper) => (
                          <div key={paper.paperId} className="rounded-md border bg-white p-3">
                            <p className="text-sm font-medium">{paper.title}</p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {paper.year || "N/A"} • {paper.citationCount || 0} citations
                              {paper.venue ? ` • ${paper.venue}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500">
                        {t("runtime.app.profile.user_id.page.text_profile_linked_but_no_publications_are")}{" "}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  {isOwnProfile
                    ? "Connect your Semantic Scholar profile to sync citations and publications."
                    : "No academic profile linked."}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label>{t("runtime.app.profile.user_id.page.text_domains")}</Label>

              {isOwnProfile && (
                <div className="flex gap-2">
                  <Input
                    value={domainInput}
                    disabled={saving}
                    onChange={(e) => setDomainInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
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
                    {t("runtime.app.profile.user_id.page.text_add")}{" "}</Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {formData.domain.length > 0 ? (
                  formData.domain.map((domain) => (
                    <Badge key={domain} variant="secondary" className="gap-2">
                      {domain}
                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={() => removeDomain(domain)}
                          disabled={saving}
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-neutral-500">{t("runtime.app.profile.user_id.page.text_no_domains_listed")}</span>
                )}
              </div>
            </div>

            {isOwnProfile && isDirty && (
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() =>
                    setFormData({ ...initialFormData, domain: [...initialFormData.domain] })
                  }
                  disabled={saving}
                >
                  {t("runtime.app.profile.user_id.page.text_reset")}{" "}</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {isOwnProfile && (
        <ProfileOnboardingModal
          isOpen={showOnboarding}
          onOpenChange={setShowOnboarding}
          userName={`${formData.firstName} ${formData.lastName}`.trim() || profile.email}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  )
}
