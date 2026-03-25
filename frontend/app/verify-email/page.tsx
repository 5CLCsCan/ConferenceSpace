"use client"

import type React from "react"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"

type VerifyState = "loading" | "success" | "error"

function VerifyEmailContent() {
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
            <p className="auth-brand-label">ConferenceSpace</p>
            <h1 className="auth-brand-headline">Email verification</h1>
            <p className="auth-brand-sub">Confirming your identity to activate your account.</p>
          </div>
          <div className="auth-brand-features">
            {[
              { icon: "mail", text: "Check your inbox" },
              { icon: "verified", text: "Click the verification link" },
              { icon: "person", text: "Access your account" },
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
                <h2 className="auth-form-title">Verifying your email…</h2>
                <p className="auth-form-desc">Please wait a moment.</p>
              </div>
              <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#1B3C53" }} />
              </div>
            </>
          )}

          {state === "success" && (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">Email verified!</h2>
                <p className="auth-form-desc">
                  Your email address has been confirmed. You can now sign in.
                </p>
              </div>
              <div className="auth-notice auth-notice--success">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  check_circle
                </span>
                <span>Verification successful.</span>
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
                  Go to sign in
                </Link>
              </div>
            </>
          )}

          {state === "error" && (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">Verification failed</h2>
                <p className="auth-form-desc">The link may have expired or already been used.</p>
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
                      Request a new link
                    </label>
                    <input
                      id="resendEmail"
                      type="email"
                      placeholder="your@email.com"
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
                        <span>Sending…</span>
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
                  <span>New verification email sent. Check your inbox.</span>
                </div>
              )}
            </>
          )}

          <p className="auth-switch-text">
            <Link href={ROUTES.LOGIN} className="auth-switch-link">
              Back to sign in
            </Link>
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
