"use client"

import React, { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { sessionManager } from "@/lib/session-manager"
import type { User, UserRole } from "@/lib/types"
import {
  acceptInvitation,
  validateInvitationToken,
  type InvitationPrefill,
} from "@/lib/api/invitation-accept"
import { ROUTES } from "@/lib/routes"

// Inline user normalization — mirrors auth-context.tsx's normalizeUser
function normalizeApiUser(apiUser: Record<string, unknown>): User {
  const firstName = (apiUser.first_name as string) ?? ""
  const lastName = (apiUser.last_name as string) ?? ""
  const fullName = `${firstName} ${lastName}`.trim() || (apiUser.email as string) || "User"
  return {
    id: String(apiUser.id ?? ""),
    name: fullName,
    email: (apiUser.email as string) ?? "",
    affiliation: "",
    roles: ["author"] as UserRole[],
    expertise: [],
    first_name: firstName || undefined,
    last_name: lastName || undefined,
  }
}

function roleToDashboard(role: string, conferenceId: number): string {
  switch (role) {
    case "reviewer":
      return ROUTES.REVIEWER.DASHBOARD
    case "pc":
    case "co_chair":
      return ROUTES.CHAIR.CONFERENCE_DETAIL(String(conferenceId))
    default:
      return ROUTES.CHAIR.CONFERENCE_DETAIL(String(conferenceId))
  }
}

function AcceptInvitationContent() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") ?? ""

  const [loading, setLoading] = useState(true)
  const [prefill, setPrefill] = useState<InvitationPrefill | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
    domain: [] as string[],
  })

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token.")
      setLoading(false)
      return
    }
    void (async () => {
      const { data, error: fetchError } = await validateInvitationToken(token)
      if (fetchError || !data) {
        setError(fetchError ?? "Invalid invitation")
      } else {
        setPrefill(data)
        const nameParts = (data.name ?? "").split(" ")
        const firstName = nameParts[0] ?? ""
        const lastName = nameParts.slice(1).join(" ")
        setForm((s) => ({
          ...s,
          firstName,
          lastName,
          email: data.email ?? "",
          domain: data.fields_of_study ?? [],
        }))
      }
      setLoading(false)
    })()
  }, [token])

  const passwordValid = useMemo(
    () => form.password.length >= 8 && form.password === form.confirm,
    [form.password, form.confirm],
  )

  const [domainInput, setDomainInput] = useState("")

  const handleRemoveDomain = (d: string) =>
    setForm((s) => ({ ...s, domain: s.domain.filter((x) => x !== d) }))

  const handleAddDomain = () => {
    const trimmed = domainInput.trim()
    if (trimmed && !form.domain.includes(trimmed)) {
      setForm((s) => ({ ...s, domain: [...s.domain, trimmed] }))
    }
    setDomainInput("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prefill || !passwordValid) return
    setSubmitting(true)
    setError(null)

    const { data, error: acceptError } = await acceptInvitation({
      token,
      email: form.email,
      password: form.password,
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      domain: form.domain,
    })
    setSubmitting(false)

    if (acceptError || !data) {
      setError(acceptError ?? "Failed to accept invitation")
      return
    }

    // The Next.js proxy route (/api/v1/auth/accept-invitation) already set
    // the httpOnly auth cookies. Persist the user object in sessionManager
    // so the auth context picks it up immediately on navigation.
    const normalizedUser = normalizeApiUser(data.user as Record<string, unknown>)
    sessionManager.setUser(normalizedUser, true, true /* rememberMe */)

    // Trigger a storage event so AuthProvider.syncWithSessionManager fires
    // in all open tabs.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"))
    }

    router.push(roleToDashboard(data.role, data.conference_id))
  }

  if (loading) {
    return (
      <div className="auth-shell" style={{ justifyContent: "center", alignItems: "center" }}>
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error && !prefill) {
    return (
      <div className="auth-shell" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="auth-notice auth-notice--error" style={{ maxWidth: 480, margin: "auto" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            error
          </span>
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      {/* Left panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="auth-logo-mark">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "28px", color: "#ffffff" }}
            >
              school
            </span>
          </div>
          <div className="auth-brand-content">
            <p className="auth-brand-label">ConferenceSpace</p>
            <h1 className="auth-brand-headline">You've been invited!</h1>
            <p className="auth-brand-sub">
              Create your account to join <strong>{prefill?.conference.title}</strong> as a{" "}
              <strong>{prefill?.role}</strong>.
            </p>
          </div>
          {prefill && (
            <div className="auth-brand-features">
              <div className="auth-feature-row">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  person
                </span>
                <span>
                  Invited by{" "}
                  {prefill.invited_by.name || prefill.invited_by.email || "a conference chair"}
                </span>
              </div>
              {prefill.conference.acronym && (
                <div className="auth-feature-row">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    badge
                  </span>
                  <span>{prefill.conference.acronym}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="auth-brand-grid" aria-hidden="true" />
      </div>

      {/* Right panel - form */}
      <div className="auth-form-panel auth-form-panel--register">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create your account</h2>
            <p className="auth-form-desc">
              {prefill?.invited_by.name ? `${prefill.invited_by.name} ` : ""}invited you to join{" "}
              <strong>{prefill?.conference.title}</strong> as a <strong>{prefill?.role}</strong>.
            </p>
          </div>

          {error && (
            <div className="auth-notice auth-notice--error">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-fields">
            {/* Name row */}
            <div className="auth-field-row">
              <div className="auth-field">
                <label htmlFor="firstName" className="auth-label">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))}
                  required
                  disabled={submitting}
                  className="auth-input"
                  autoComplete="given-name"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="lastName" className="auth-label">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))}
                  required
                  disabled={submitting}
                  className="auth-input"
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                required
                disabled={submitting}
                className="auth-input"
                autoComplete="email"
              />
            </div>

            {/* Research domains (prefilled from fields_of_study, editable) */}
            <div className="auth-field">
              <label className="auth-label">Research domains</label>
              {form.domain.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginTop: "4px",
                  }}
                >
                  {form.domain.map((d) => (
                    <span
                      key={d}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "2px 10px",
                        borderRadius: "9999px",
                        fontSize: "12px",
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      {d}
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(d)}
                        disabled={submitting}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          lineHeight: 1,
                        }}
                        aria-label={`Remove ${d}`}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "12px", color: "#93c5fd" }}
                        >
                          close
                        </span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddDomain()
                    }
                  }}
                  placeholder="Type a domain and press Enter"
                  disabled={submitting}
                  className="auth-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddDomain}
                  disabled={submitting || !domainInput.trim()}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    border: "1px solid #d1d5db",
                    backgroundColor: domainInput.trim() ? "#f9fafb" : "#f3f4f6",
                    color: domainInput.trim() ? "#374151" : "#9ca3af",
                    cursor: domainInput.trim() ? "pointer" : "default",
                    whiteSpace: "nowrap",
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  required
                  minLength={8}
                  disabled={submitting}
                  className="auth-input"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="auth-eye-btn"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="auth-field">
              <label htmlFor="confirm" className="auth-label">
                Confirm password
              </label>
              <div className="auth-input-wrap">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={(e) => setForm((s) => ({ ...s, confirm: e.target.value }))}
                  required
                  disabled={submitting}
                  className="auth-input"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="auth-eye-btn"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    {showConfirm ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {form.confirm && form.password !== form.confirm && (
                <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!passwordValid || submitting || !form.firstName || !form.email}
              className="auth-submit"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Create account &amp; join conference
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell" style={{ justifyContent: "center", alignItems: "center" }}>
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  )
}
