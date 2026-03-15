"use client"

import type React from "react"
import { useMemo, useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"

type PasswordRuleKey = "length" | "lower" | "upper" | "number" | "special"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      router.replace(ROUTES.FORGOT_PASSWORD)
    }
  }, [token, router])

  const passwordChecks = useMemo(
    () =>
      ({
        length: newPassword.length >= 8,
        lower: /[a-z]/.test(newPassword),
        upper: /[A-Z]/.test(newPassword),
        number: /\d/.test(newPassword),
        special: /[^A-Za-z0-9]/.test(newPassword),
      }) satisfies Record<PasswordRuleKey, boolean>,
    [newPassword],
  )

  const passwordRuleOrder: PasswordRuleKey[] = ["length", "lower", "upper", "number", "special"]
  const passwordStrength = passwordRuleOrder.filter((r) => passwordChecks[r]).length

  const ruleLabels: Record<PasswordRuleKey, string> = {
    length: "At least 8 characters",
    lower: "Lowercase letter",
    upper: "Uppercase letter",
    number: "Number",
    special: "Special character",
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (!passwordRuleOrder.every((r) => passwordChecks[r])) {
      setError("Password does not meet all requirements.")
      return
    }

    setIsLoading(true)
    try {
      await authApi.resetPassword(token, newPassword)
      router.push(`${ROUTES.LOGIN}?reset=1`)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Something went wrong. Please try again.")
      }
      setIsLoading(false)
    }
  }

  if (!token) return null

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
            <p className="auth-brand-label">ConferenceSpace</p>
            <h1 className="auth-brand-headline">Set a new password</h1>
            <p className="auth-brand-sub">Choose a strong password to secure your account.</p>
          </div>
          <div className="auth-brand-features">
            {[
              { icon: "security", text: "Secure token verified" },
              { icon: "lock", text: "Set your new password" },
              { icon: "check_circle", text: "Access restored" },
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
          <div className="auth-form-header">
            <h2 className="auth-form-title">New password</h2>
            <p className="auth-form-desc">Enter and confirm your new password below.</p>
          </div>

          {error && (
            <div className="auth-notice auth-notice--error">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                error
              </span>
              <span>{error}</span>
              {(error.includes("expired") ||
                error.includes("invalid") ||
                error.includes("used")) && (
                <Link
                  href={ROUTES.FORGOT_PASSWORD}
                  className="auth-switch-link"
                  style={{ marginLeft: "4px" }}
                >
                  Request a new link
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-fields">
            <div className="auth-strength-bars">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="auth-strength-bar"
                  style={{
                    background:
                      i < passwordStrength
                        ? ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"][
                            passwordStrength - 1
                          ]
                        : "#e5e7eb",
                  }}
                />
              ))}
            </div>

            <div className="auth-field">
              <label htmlFor="newPassword" className="auth-label">
                New password
              </label>
              <div className="auth-input-wrap">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="auth-input"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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

            <div className="auth-field">
              <label htmlFor="confirmPassword" className="auth-label">
                Confirm password
              </label>
              <div className="auth-input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="auth-input"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="auth-eye-btn"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="auth-password-rules">
              {passwordRuleOrder.map((rule) => (
                <span
                  key={rule}
                  className={`auth-rule ${passwordChecks[rule] ? "auth-rule--met" : ""}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>
                    {passwordChecks[rule] ? "check" : "circle"}
                  </span>
                  {ruleLabels[rule]}
                </span>
              ))}
            </div>

            <button type="submit" disabled={isLoading} className="auth-submit-btn">
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Resetting…</span>
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>

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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
