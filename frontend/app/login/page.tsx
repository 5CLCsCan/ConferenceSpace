"use client"

import type React from "react"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ROUTES } from "@/lib/routes"
import { Loader2 } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registrationIndicator = searchParams.get("registered")
  const resetIndicator = searchParams.get("reset")
  const { login, isAuthenticated } = useAuth()
  const { t } = useTranslation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showRegistrationMessage, setShowRegistrationMessage] = useState(
    registrationIndicator === "1",
  )
  const [showResetMessage, setShowResetMessage] = useState(resetIndicator === "1")
  const isCredentialError = error === t("auth.login.errors.invalidCredentials")

  useEffect(() => {
    if (isAuthenticated) router.push(ROUTES.ROLE_SELECT)
  }, [isAuthenticated, router])

  useEffect(() => {
    if (registrationIndicator === "1") setShowRegistrationMessage(true)
  }, [registrationIndicator])

  useEffect(() => {
    if (resetIndicator === "1") setShowResetMessage(true)
  }, [resetIndicator])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const result = await login(email.trim(), password, { rememberMe })
    if (result.success) {
      router.push(ROUTES.ROLE_SELECT)
    } else {
      setError(result.error || t("auth.login.errors.failed"))
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      {/* Left panel - branding */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <Link href={ROUTES.HOME} className="auth-logo-mark hover:opacity-80 transition-opacity">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "28px", color: "#ffffff" }}
            >
              school
            </span>
          </Link>
          <div className="auth-brand-content">
            <p className="auth-brand-label">{t("runtime.app.login.page.text_conferencespace")}</p>
            <h1 className="auth-brand-headline">
              {t(
                "runtime.app.login.page.text_the_scholarly_platform_for_academic_conferences",
              )}{" "}
            </h1>
            <p className="auth-brand-sub">
              {t("runtime.app.login.page.text_submit_research_coordinate_reviews_and_chair")}{" "}
            </p>
          </div>
          <div className="auth-brand-features">
            {[
              {
                icon: "edit_document",
                text: t("runtime.app.login.page.prop_text_paper_submission_tracking"),
              },
              {
                icon: "rate_review",
                text: t("runtime.app.login.page.prop_text_structured_peer_review"),
              },
              {
                icon: "diversity_3",
                text: t("runtime.app.login.page.prop_text_conference_management"),
              },
            ].map(({ icon, text }) => (
              <div key={text} className="auth-feature-row">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  {icon}
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-brand-grid" aria-hidden="true" />
      </div>

      {/* Right panel - form */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <h2 className="auth-form-title">{t("auth.login.title")}</h2>
            <p className="auth-form-desc">{t("auth.login.subtitle")}</p>
          </div>

          {showRegistrationMessage && (
            <div className="auth-notice auth-notice--success">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                check_circle
              </span>
              <span>
                {t("auth.login.registrationComplete")} — {t("auth.login.registrationDetails")}
              </span>
            </div>
          )}

          {showResetMessage && (
            <div className="auth-notice auth-notice--success">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                check_circle
              </span>
              <span>{t("auth.login.resetSuccess")}</span>
            </div>
          )}

          {error && (
            <div className="auth-notice auth-notice--error">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                error
              </span>
              <span>
                {error}
                {isCredentialError ? (
                  <>
                    {" "}
                    {t("auth.login.errors.invalidCredentialsHint")}{" "}
                    <Link href={ROUTES.FORGOT_PASSWORD} className="auth-password-link">
                      {t("auth.login.forgotPassword")}
                    </Link>
                  </>
                ) : null}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-fields">
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                {t("common.labels.email")}
              </label>
              <input
                id="email"
                type="email"
                placeholder={t("runtime.app.login.page.placeholder_ada_lovelace_example_com")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="auth-input"
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="password" className="auth-label">
                  {t("common.labels.password")}
                </label>
                <Link href={ROUTES.FORGOT_PASSWORD} className="auth-password-link">
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="auth-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="auth-eye-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <label htmlFor="rememberMe" className="auth-check-row">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="auth-check-input"
              />
              <span className="auth-check-label">{t("auth.login.rememberMe")}</span>
            </label>

            <button type="submit" disabled={isLoading} className="auth-submit-btn">
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{t("runtime.app.login.page.text_signing_in")}</span>
                </>
              ) : (
                t("common.actions.signIn")
              )}
            </button>
          </form>

          <p className="auth-switch-text">
            {t("auth.login.noAccount")}{" "}
            <Link href={ROUTES.REGISTER} className="auth-switch-link">
              {t("common.actions.signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell-loading">
          <Loader2 className="h-5 w-5 animate-spin text-[#1B3C53]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
