"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { apiFetch, UnauthorizedError } from "@/lib/api/client"
import { resolveUserEmail } from "@/lib/profile/resolve-user-email"
import type { User, ProfileFormData, UpdateProfileRequest } from "@/lib/types"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ROUTES } from "@/lib/routes"

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
        title: "Unable to save",
        description: "Missing profile id.",
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

      toast({ title: "Profile updated", description: "Your profile was saved successfully." })
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
        title: "Unable to save",
        description: "Please try again.",
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
            <h1 className="text-2xl font-bold text-neutral-900">Profile Not Found</h1>
            <p className="text-neutral-600">
              We could not resolve this profile id. Please return to the previous page.
            </p>
            <Button onClick={() => router.back()}>Go Back</Button>
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
          Back
        </Button>

        <Card className="py-6">
          <CardHeader>
            <CardTitle>{isOwnProfile ? "My Profile" : "User Profile"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  value={formData.firstName}
                  disabled={!isOwnProfile || saving}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  value={formData.lastName}
                  disabled={!isOwnProfile || saving}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled={!isOwnProfile || saving}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Domains</Label>

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
                    placeholder="Add a domain"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addDomain}
                    disabled={saving || !domainInput.trim()}
                  >
                    Add
                  </Button>
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
                  <span className="text-sm text-neutral-500">No domains listed</span>
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
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
