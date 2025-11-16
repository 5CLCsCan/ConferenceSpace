"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/translation-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { apiFetch, UnauthorizedError } from "@/lib/api/client"
import { User, ProfileFormData, UpdateProfileRequest } from "@/lib/types"
import { DashboardHeader } from "@/components/dashboard-header"
import { Loader2, Save, X, User as UserIcon, Mail, Shield, ArrowLeft } from "lucide-react"
import { typography, spacing, iconSizes } from "@/lib/typography"

const EMPTY_FORM: ProfileFormData = {
  firstName: "",
  lastName: "",
  email: "",
  domain: [],
}

const validateProfileForm = (data: ProfileFormData): { valid: boolean; error?: string } => {
  if (!data.firstName.trim() || !data.lastName.trim()) {
    return { valid: false, error: "First name and last name are required" }
  }
  if (!data.email.trim() || !data.email.includes("@")) {
    return { valid: false, error: "Please enter a valid email address" }
  }
  return { valid: true }
}

const normalizeDomains = (domains: any[] | undefined): string[] => {
  return Array.isArray(domains)
    ? domains
        .map((item) => (typeof item === "string" ? item.trim() : String(item || "").trim()))
        .filter((item) => item.length > 0)
    : []
}

const formatTimestamp = (value?: string): string => {
  if (!value) return ""
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
  } catch {
    return ""
  }
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const { user: authUser, refreshUser } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>(EMPTY_FORM)
  const [initialFormData, setInitialFormData] = useState<ProfileFormData>(EMPTY_FORM)
  const [domainInput, setDomainInput] = useState("")
  const [userId, setUserId] = useState<number | null>(null)

  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data: response } = await apiFetch<{ data: User }>("/api/v1/users/me")

      if (!response?.data) {
        throw new Error("Missing user data in response")
      }

      setUser(response.data)

      const resolvedId = Number(response.data.id ?? authUser?.id ?? 0)
      setUserId(Number.isFinite(resolvedId) && resolvedId > 0 ? resolvedId : null)

      const domain = normalizeDomains(response.data.domain)
      const newFormData: ProfileFormData = {
        firstName: response.data.first_name || "",
        lastName: response.data.last_name || "",
        email: response.data.email || "",
        domain,
      }
      
      setFormData(newFormData)
      setInitialFormData({ ...newFormData, domain: [...domain] })
    } catch (error) {
      toast({
        title: t("profile.error.fetchFailed"),
        description: t("profile.error.fetchDescription"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [authUser?.id, toast, t])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  const handleSave = async () => {
    const validation = validateProfileForm(formData)
    if (!validation.valid) {
      toast({
        title: t("profile.error.validationFailed"),
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    const targetId = userId ?? Number(user?.id ?? authUser?.id ?? 0)
    if (!Number.isFinite(targetId) || targetId <= 0) {
      toast({
        title: t("profile.error.updateFailed"),
        description: t("profile.error.missingId"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      const updateData: UpdateProfileRequest = {
        id: targetId,
        user: {
          id: targetId,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          domain: normalizeDomains(formData.domain),
        },
      }

      await apiFetch(`/api/v1/users/${user?.id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      })

      toast({
        title: t("profile.success.updated"),
        description: t("profile.success.updatedDescription"),
      })

      if (refreshUser) await refreshUser()
      await fetchUserProfile()
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        toast({
          title: t("profile.error.unauthorized"),
          description: t("profile.error.unauthorizedDescription"),
          variant: "destructive",
        })
        router.push("/login")
        return
      }
      
      toast({
        title: t("profile.error.updateFailed"),
        description: error?.message || error?.body?.error || "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddDomain = () => {
    const trimmedDomain = domainInput.trim()
    if (trimmedDomain && !formData.domain.includes(trimmedDomain)) {
      setFormData((prev) => ({
        ...prev,
        domain: [...prev.domain, trimmedDomain],
      }))
      setDomainInput("")
    }
  }

  const handleRemoveDomain = (domainToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      domain: prev.domain.filter((d) => d !== domainToRemove),
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddDomain()
    }
  }

  const isDirty = useMemo(() => {
    const trim = (value: string) => value.trim()
    const arraysEqual = (a: string[], b: string[]) =>
      a.length === b.length && a.every((value, index) => trim(value) === trim(b[index] ?? ""))

    return (
      trim(formData.firstName) !== trim(initialFormData.firstName) ||
      trim(formData.lastName) !== trim(initialFormData.lastName) ||
      trim(formData.email) !== trim(initialFormData.email) ||
      !arraysEqual(formData.domain, initialFormData.domain)
    )
  }, [formData, initialFormData])
  const handleResetChanges = () => {
    setFormData({ ...initialFormData, domain: [...initialFormData.domain] })
    setDomainInput("")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardHeader role={authUser?.roles?.[0] as any || "author"} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardHeader role={authUser?.roles?.[0] as any || "author"} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">{t("profile.error.notFound")}</p>
            <Button onClick={() => router.push("/dashboard")}>{t("common.actions.goBack")}</Button>
          </div>
        </main>
      </div>
    )
  }

  const fullName = `${formData.firstName || user?.first_name || ""} ${formData.lastName || user?.last_name || ""}`.trim() || "User"
  const email = formData.email || user?.email || "No email"
  const roles = user?.roles?.length ? user.roles : authUser?.roles || []
  const displayRoles = roles.filter((role) => role.toLowerCase() !== "author")
  const joinedAt = formatTimestamp(user?.created_at)
  const lastUpdated = formatTimestamp(user?.updated_at)

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader role={authUser?.roles?.[0] as any || "author"} />
      <main className="container mx-auto px-4 py-8">
        <div className={spacing.section}>
          <div className="flex items-center justify-between">
            <div className={spacing.item}>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className={iconSizes.sm} />
                  {t("common.actions.back")}
                </Button>
              </div>
              <h1 className={`${typography.h1} text-neutral-900`}>{t("profile.title")}</h1>
              <p className={`${typography.body} text-neutral-600 max-w-2xl`}>{t("profile.description")}</p>
            </div>
          </div>

          <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-background to-background shadow-sm">
            <CardContent className={`${spacing.section} p-6`}>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className={`flex items-center ${spacing.gap.md}`}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <UserIcon className="h-8 w-8" />
                  </div>
                  <div className={spacing.tight}>
                    <h2 className={`${typography.h2} text-neutral-900`}>{fullName}</h2>
                    <div className={`flex items-center ${spacing.gap.sm} ${typography.body} text-neutral-600`}>
                      <Mail className={iconSizes.sm} />
                      <span>{email}</span>
                    </div>
                  </div>
                </div>
                {displayRoles.length > 0 && (
                  <div className={`flex flex-wrap ${spacing.gap.sm}`}>
                    {displayRoles.map((role) => (
                      <Badge key={role} variant="secondary" className={`flex items-center ${spacing.gap.sm} border border-primary/30 bg-white/80 px-3 py-1 ${typography.bodySmall} ${typography.semibold} uppercase tracking-wide`}>
                        <Shield className={iconSizes.xs} />
                        {role}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="bg-primary/20" />

              <div className={`flex flex-wrap items-center ${spacing.gap.md} ${typography.bodySmall} text-neutral-600`}>
                {joinedAt && (
                  <span className="rounded-full border border-primary/10 bg-white px-3 py-1">
                    {t("profile.highlights.joined", { date: joinedAt })}
                  </span>
                )}
                {lastUpdated && (
                  <span className="rounded-full border border-primary/10 bg-white px-3 py-1">
                    {t("profile.highlights.updated", { date: lastUpdated })}
                  </span>
                )}
                <span className="rounded-full border border-primary/10 bg-white px-3 py-1">
                  {formData.domain.length > 0
                    ? t("profile.highlights.domainsCount", { count: formData.domain.length })
                    : t("profile.highlights.domainsNone")}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader className="border-b pb-4">
                <CardTitle className={typography.h4}>{t("profile.sections.personalInfo")}</CardTitle>
                <CardDescription className={typography.body}>{t("profile.sections.personalInfoDescription")}</CardDescription>
              </CardHeader>
              <CardContent className={`${spacing.section} pt-6`}>
                <div className={`grid ${spacing.gap.md} sm:grid-cols-2`}>
                  <div className={spacing.item}>
                    <Label htmlFor="firstName" className={typography.label}>
                      {t("common.labels.firstName")}
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder={t("profile.placeholders.firstName")}
                      disabled={isSaving}
                    />
                  </div>
                  <div className={spacing.item}>
                    <Label htmlFor="lastName" className={typography.label}>
                      {t("common.labels.lastName")}
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder={t("profile.placeholders.lastName")}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className={spacing.item}>
                  <Label htmlFor="email" className={typography.label}>
                    {t("common.labels.email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t("profile.placeholders.email")}
                    disabled={isSaving}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader className="border-b pb-4">
                <CardTitle className={typography.h4}>{t("profile.sections.expertise")}</CardTitle>
                <CardDescription className={typography.body}>{t("profile.sections.expertiseDescription")}</CardDescription>
              </CardHeader>
              <CardContent className={`${spacing.section} pt-6`}>
                <div className={spacing.item}>
                  <Label htmlFor="domain" className={typography.label}>
                    {t("common.labels.domains")}
                  </Label>
                  <div className={`flex flex-col ${spacing.gap.sm} sm:flex-row`}>
                    <Input
                      id="domain"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t("profile.placeholders.domain")}
                      disabled={isSaving}
                    />
                    <Button
                      type="button"
                      onClick={handleAddDomain}
                      variant="secondary"
                      disabled={isSaving || !domainInput.trim()}
                    >
                      {t("common.actions.add")}
                    </Button>
                  </div>
                </div>

                {formData.domain.length > 0 ? (
                  <div className={`flex flex-wrap ${spacing.gap.sm}`}>
                    {formData.domain.map((domain, index) => (
                      <Badge key={index} variant="secondary" className={`${spacing.gap.sm} bg-primary/10 pr-1 text-primary`}>
                        {domain}
                        <button
                          type="button"
                          onClick={() => handleRemoveDomain(domain)}
                          className="ml-1 rounded-full p-0.5 text-primary transition-colors hover:bg-primary/10"
                          disabled={isSaving}
                        >
                          <X className={iconSizes.xs} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className={`${typography.body} text-neutral-600`}>{t("profile.highlights.domainsHint")}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {isDirty && (
            <div className={`sticky bottom-4 z-10 flex flex-col items-stretch ${spacing.gap.md} rounded-2xl border border-primary/20 bg-white/90 px-6 py-4 shadow-sm backdrop-blur lg:flex-row lg:justify-end`}>
              <Button
                variant="outline"
                onClick={handleResetChanges}
                disabled={isSaving}
              >
                {t("common.actions.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="lg:min-w-[140px]">
                {isSaving ? (
                  <>
                    <Loader2 className={`${iconSizes.sm} mr-2 animate-spin`} />
                    {t("common.actions.saving")}
                  </>
                ) : (
                  <>
                    <Save className={`${iconSizes.sm} mr-2`} />
                    {t("common.actions.save")}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
