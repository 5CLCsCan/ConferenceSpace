"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useTranslation } from "@/lib/i18n/translation-context"

type ForgotPasswordStep = "email" | "verify" | "reset"
type PasswordRuleKey = "length" | "lower" | "upper" | "number" | "special"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t } = useTranslation()

  const [step, setStep] = useState<ForgotPasswordStep>("email")
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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

  useEffect(() => {
    if (step !== "verify") {
      return
    }

    setSecondsRemaining(5)
    const intervalId = window.setInterval(() => {
      setSecondsRemaining((currentSeconds) => {
        if (currentSeconds <= 1) {
          window.clearInterval(intervalId)
          setStep("reset")
          return 0
        }
        return currentSeconds - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [step])

  const handleEmailSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (!email.trim()) {
      setError(t("auth.forgotPassword.errors.emailRequired"))
      return
    }

    setStep("verify")
  }

  const handleResetSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError(t("auth.register.errors.passwordMismatch"))
      return
    }

    if (!passwordRuleOrder.every((rule) => passwordChecks[rule])) {
      setError(t("auth.register.errors.passwordStrength"))
      return
    }

    setIsLoading(true)
    router.push(`${ROUTES.LOGIN}?reset=1`)
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
            <p className="auth-brand-label">CONFERENCESPACE</p>
            <h1 className="auth-brand-headline">{t("auth.forgotPassword.brandTitle")}</h1>
            <p className="auth-brand-sub">{t("auth.forgotPassword.brandSubtitle")}</p>
          </div>
          <div className="auth-brand-features">
            {[
              { icon: "mail", text: t("auth.forgotPassword.features.email") },
              { icon: "verified", text: t("auth.forgotPassword.features.verify") },
              { icon: "lock", text: t("auth.forgotPassword.features.reset") },
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
            <h2 className="auth-form-title">{t(`auth.forgotPassword.steps.${step}.title`)}</h2>
            <p className="auth-form-desc">{t(`auth.forgotPassword.steps.${step}.subtitle`)}</p>
          </div>

          {error && (
            <div className="auth-notice auth-notice--error">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="auth-form-fields">
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">
                  {t("common.labels.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ada.lovelace@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isLoading}
                  className="auth-input"
                  autoComplete="email"
                />
              </div>

              <button type="submit" disabled={isLoading} className="auth-submit-btn">
                {t("common.actions.continue")}
              </button>
            </form>
          )}

          {step === "verify" && (
            <div className="auth-form-fields">
              <div className="auth-field">
                <label htmlFor="verificationCode" className="auth-label">
                  {t("auth.forgotPassword.verification.label")}
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  className="auth-input"
                  autoComplete="one-time-code"
                />
              </div>

              <div className="auth-stage-note">
                {t("auth.forgotPassword.verification.autoSkip", { seconds: secondsRemaining })}
              </div>
            </div>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetSubmit} className="auth-form-fields">
              <div className="auth-field">
                <label htmlFor="newPassword" className="auth-label">
                  {t("auth.forgotPassword.reset.newPassword")}
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    disabled={isLoading}
                    className="auth-input"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
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
                  {t("common.labels.confirmPassword")}
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    disabled={isLoading}
                    className="auth-input"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
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
                    {t(`auth.register.passwordHints.rules.${rule}`)}
                  </span>
                ))}
              </div>

              <button type="submit" disabled={isLoading} className="auth-submit-btn">
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{t("auth.forgotPassword.reset.submitting")}</span>
                  </>
                ) : (
                  t("auth.forgotPassword.reset.submit")
                )}
              </button>
            </form>
          )}

          <p className="auth-switch-text">
            {t("auth.forgotPassword.backToLogin")}{" "}
            <Link href={ROUTES.LOGIN} className="auth-switch-link">
              {t("common.actions.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
