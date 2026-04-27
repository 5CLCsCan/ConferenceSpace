"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { useTranslation } from "@/lib/i18n/translation-context"

type ForgotPasswordStep = "email" | "sent"

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [step, setStep] = useState<ForgotPasswordStep>("email")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await authApi.forgotPassword(email.trim())
      const token = result.data?.data?.token

      if (token) {
        // Dev mode: token returned directly — skip email, go straight to reset
        router.push(`${ROUTES.RESET_PASSWORD}?token=${encodeURIComponent(token)}`)
        return
      }

      // Production: email sent
      setStep("sent")
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setResendSuccess(false)
    try {
      await authApi.forgotPassword(email.trim())
      setResendSuccess(true)
    } catch {
      // silently ignore
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="auth-logo-mark">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "28px", color: "#ffffff" }}
            >
              lock_reset
            </span>
          </div>
          <div className="auth-brand-content">
            <p className="auth-brand-label">{t("runtime.app.forgot-password.page.text_conferencespace")}</p>
            <h1 className="auth-brand-headline">{t("runtime.app.forgot-password.page.text_reset_your_password")}</h1>
            <p className="auth-brand-sub">{t("runtime.app.forgot-password.page.text_we_apos_ll_send_a_secure")}</p>
          </div>
          <div className="auth-brand-features">
            {[
              { icon: "mail", text: t("runtime.app.forgot-password.page.prop_text_enter_your_email_address") },
              { icon: "verified", text: t("runtime.app.forgot-password.page.prop_text_receive_a_secure_reset_link") },
              { icon: "lock", text: t("runtime.app.forgot-password.page.prop_text_set_a_new_password") },
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

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          {step === "email" && (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">{t("runtime.app.forgot-password.page.text_forgot_password")}</h2>
                <p className="auth-form-desc">
                  {t("runtime.app.forgot-password.page.text_enter_your_email_and_we_apos")}{" "}</p>
              </div>

              {error && (
                <div className="auth-notice auth-notice--error">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    error
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="auth-form-fields">
                <div className="auth-field">
                  <label htmlFor="email" className="auth-label">
                    {t("runtime.app.forgot-password.page.text_email")}{" "}</label>
                  <input
                    id="email"
                    type="email"
                    placeholder={t("runtime.app.forgot-password.page.placeholder_ada_lovelace_example_com")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="auth-input"
                    autoComplete="email"
                  />
                </div>
                <button type="submit" disabled={isLoading} className="auth-submit-btn">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{t("runtime.app.forgot-password.page.text_sending")}</span>
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>
            </>
          )}

          {step === "sent" && (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">{t("runtime.app.forgot-password.page.text_check_your_email")}</h2>
                <p className="auth-form-desc">
                  {t("runtime.app.forgot-password.page.text_we_sent_a_password_reset_link")}{" "}<strong>{email}</strong>{t("runtime.app.forgot-password.page.text_check_your_inbox_and_follow_the")}{" "}</p>
              </div>

              {resendSuccess && (
                <div className="auth-notice auth-notice--success">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    check_circle
                  </span>
                  <span>{t("runtime.app.forgot-password.page.text_reset_link_resent")}</span>
                </div>
              )}

              <div className="auth-form-fields">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="auth-submit-btn"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{t("runtime.app.forgot-password.page.text_resending")}</span>
                    </>
                  ) : (
                    "Resend link"
                  )}
                </button>
              </div>
            </>
          )}

          <p className="auth-switch-text">
            {t("runtime.app.forgot-password.page.text_remember_it")}{" "}
            <Link href={ROUTES.LOGIN} className="auth-switch-link">
              {t("runtime.app.forgot-password.page.text_sign_in")}{" "}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
