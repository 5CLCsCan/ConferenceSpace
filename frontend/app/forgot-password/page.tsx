"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"

type ForgotPasswordStep = "email" | "sent"

export default function ForgotPasswordPage() {
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
            <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#ffffff" }}>
              lock_reset
            </span>
          </div>
          <div className="auth-brand-content">
            <p className="auth-brand-label">ConferenceSpace</p>
            <h1 className="auth-brand-headline">Reset your password</h1>
            <p className="auth-brand-sub">We&apos;ll send a secure link to your inbox.</p>
          </div>
          <div className="auth-brand-features">
            {[
              { icon: "mail", text: "Enter your email address" },
              { icon: "verified", text: "Receive a secure reset link" },
              { icon: "lock", text: "Set a new password" },
            ].map(({ icon, text }) => (
              <div key={text} className="auth-feature-row">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{icon}</span>
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
                <h2 className="auth-form-title">Forgot password?</h2>
                <p className="auth-form-desc">Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              {error && (
                <div className="auth-notice auth-notice--error">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="auth-form-fields">
                <div className="auth-field">
                  <label htmlFor="email" className="auth-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="ada.lovelace@example.com"
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
                    <><Loader2 className="h-3 w-3 animate-spin" /><span>Sending…</span></>
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
                <h2 className="auth-form-title">Check your email</h2>
                <p className="auth-form-desc">
                  We sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link.
                </p>
              </div>

              {resendSuccess && (
                <div className="auth-notice auth-notice--success">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check_circle</span>
                  <span>Reset link resent.</span>
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
                    <><Loader2 className="h-3 w-3 animate-spin" /><span>Resending…</span></>
                  ) : (
                    "Resend link"
                  )}
                </button>
              </div>
            </>
          )}

          <p className="auth-switch-text">
            Remember it?{" "}
            <Link href={ROUTES.LOGIN} className="auth-switch-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
