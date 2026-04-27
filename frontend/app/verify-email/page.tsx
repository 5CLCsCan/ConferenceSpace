"use client"

import type React from "react"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { useTranslation } from "@/lib/i18n/translation-context"

type VerifyState = "loading" | "success" | "error"

function VerifyEmailContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [state, setState] = useState<VerifyState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [resendEmail, setResendEmail] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setState("error")
      setErrorMessage("No verification token provided.")
      return
    }

    authApi
      .verifyEmail(token)
      .then(() => setState("success"))
      .catch((err) => {
        setState("error")
        setErrorMessage(err instanceof ApiError ? err.message : "Verification failed.")
      })
  }, [token])

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!resendEmail.trim()) return
    setResendLoading(true)
    try {
      await authApi.resendVerification(resendEmail.trim())
      setResendDone(true)
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
              mark_email_read
            </span>
          </div>
          <div className="auth-brand-content">
            <p className="auth-brand-label">{t("runtime.app.verify-email.page.text_conferencespace")}</p>
            <h1 className="auth-brand-headline">{t("runtime.app.verify-email.page.text_email_verification")}</h1>
            <p className="auth-brand-sub">{t("runtime.app.verify-email.page.text_confirming_your_identity_to_activate_your")}</p>
          </div>
          <div className="auth-brand-features">
            {[
              { icon: "mail", text: t("runtime.app.verify-email.page.prop_text_check_your_inbox") },
              { icon: "verified", text: t("runtime.app.verify-email.page.prop_text_click_the_verification_link") },
              { icon: "person", text: t("runtime.app.verify-email.page.prop_text_access_your_account") },
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
          {state === "loading" && (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">{t("runtime.app.verify-email.page.text_verifying_your_email")}</h2>
                <p className="auth-form-desc">{t("runtime.app.verify-email.page.text_please_wait_a_moment")}</p>
              </div>
              <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#1B3C53" }} />
              </div>
            </>
          )}

          {state === "success" && (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">{t("runtime.app.verify-email.page.text_email_verified")}</h2>
                <p className="auth-form-desc">
                  {t("runtime.app.verify-email.page.text_your_email_address_has_been_confirmed")}{" "}</p>
              </div>
              <div className="auth-notice auth-notice--success">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  check_circle
                </span>
                <span>{t("runtime.app.verify-email.page.text_verification_successful")}</span>
              </div>
              <div className="auth-form-fields">
                <Link
                  href={ROUTES.LOGIN}
                  className="auth-submit-btn"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                >
                  {t("runtime.app.verify-email.page.text_go_to_sign_in")}{" "}</Link>
              </div>
            </>
          )}

          {state === "error" && (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">{t("runtime.app.verify-email.page.text_verification_failed")}</h2>
                <p className="auth-form-desc">{t("runtime.app.verify-email.page.text_the_link_may_have_expired_or")}</p>
              </div>
              <div className="auth-notice auth-notice--error">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  error
                </span>
                <span>{errorMessage}</span>
              </div>
              {!resendDone ? (
                <form onSubmit={handleResend} className="auth-form-fields">
                  <div className="auth-field">
                    <label htmlFor="resendEmail" className="auth-label">
                      {t("runtime.app.verify-email.page.text_request_a_new_link")}{" "}</label>
                    <input
                      id="resendEmail"
                      type="email"
                      placeholder={t("runtime.app.verify-email.page.placeholder_your_email_com")}
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      required
                      disabled={resendLoading}
                      className="auth-input"
                      autoComplete="email"
                    />
                  </div>
                  <button type="submit" disabled={resendLoading} className="auth-submit-btn">
                    {resendLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>{t("runtime.app.verify-email.page.text_sending")}</span>
                      </>
                    ) : (
                      "Resend verification email"
                    )}
                  </button>
                </form>
              ) : (
                <div className="auth-notice auth-notice--success">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    check_circle
                  </span>
                  <span>{t("runtime.app.verify-email.page.text_new_verification_email_sent_check_your")}</span>
                </div>
              )}
            </>
          )}

          <p className="auth-switch-text">
            <Link href={ROUTES.LOGIN} className="auth-switch-link">
              {t("runtime.app.verify-email.page.text_back_to_sign_in")}{" "}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
