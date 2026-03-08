"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { computerScienceKeywords, searchKeywords } from "@/lib/data/domain-keywords"
import { Loader2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { t } = useTranslation()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [domains, setDomains] = useState<string[]>([])
  const [domainInput, setDomainInput] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const addDomainValue = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || domains.includes(trimmed)) return
    setDomains([...domains, trimmed])
  }

  const suggestions: string[] = useMemo(() => {
    const pool = domainInput.trim() ? searchKeywords(domainInput) : computerScienceKeywords
    return pool.filter((kw) => !domains.includes(kw)).slice(0, 18)
  }, [domainInput, domains])

  type PasswordRuleKey = "length" | "lower" | "upper" | "number" | "special"

  const passwordChecks = useMemo(
    () =>
      ({
        length: formData.password.length >= 8,
        lower: /[a-z]/.test(formData.password),
        upper: /[A-Z]/.test(formData.password),
        number: /\d/.test(formData.password),
        special: /[^A-Za-z0-9]/.test(formData.password),
      }) satisfies Record<PasswordRuleKey, boolean>,
    [formData.password],
  )

  const passwordRuleOrder: PasswordRuleKey[] = ["length", "lower", "upper", "number", "special"]
  const passwordStrength = passwordRuleOrder.filter((r) => passwordChecks[r]).length

  const handleAddDomain = () => {
    addDomainValue(domainInput)
    setDomainInput("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.register.errors.passwordMismatch"))
      return
    }
    if (!passwordRuleOrder.every((rule) => passwordChecks[rule])) {
      setError(t("auth.register.errors.passwordStrength"))
      return
    }
    if (domains.length === 0) {
      setError(t("auth.register.errors.domainsRequired"))
      return
    }

    setIsLoading(true)
    const result = await register({
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      domain: domains,
    })

    if (result.success) {
      router.push(`${ROUTES.LOGIN}?registered=1`)
    } else {
      setError(result.error || t("auth.register.errors.failed"))
      setIsLoading(false)
    }
  }

  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"]
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Excellent"]

  return (
    <div className="auth-shell">
      {/* Left panel - branding */}
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
            <p className="auth-brand-label">
              {t("runtime.app.register.page.text_conferencespace")}
            </p>
            <h1 className="auth-brand-headline">
              {t("runtime.app.register.page.text_join_the_academic_research_community")}
            </h1>
            <p className="auth-brand-sub">
              {t("runtime.app.register.page.text_create_your_scholar_account_to_submit")}{" "}
            </p>
          </div>
          <div className="auth-brand-features">
            {[
              {
                icon: "edit_document",
                text: t("runtime.app.register.page.prop_text_paper_submission_tracking"),
              },
              {
                icon: "rate_review",
                text: t("runtime.app.register.page.prop_text_structured_peer_review"),
              },
              {
                icon: "diversity_3",
                text: t("runtime.app.register.page.prop_text_conference_management"),
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
      <div className="auth-form-panel auth-form-panel--register">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <h2 className="auth-form-title">{t("common.actions.signUp")}</h2>
            <p className="auth-form-desc">{t("auth.register.subtitle")}</p>
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
                  {t("common.labels.firstName")}
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder={t("runtime.app.register.page.placeholder_ada")}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={isLoading}
                  className="auth-input"
                  autoComplete="given-name"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="lastName" className="auth-label">
                  {t("common.labels.lastName")}
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder={t("runtime.app.register.page.placeholder_lovelace")}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={isLoading}
                  className="auth-input"
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                {t("common.labels.email")}
              </label>
              <input
                id="email"
                type="email"
                placeholder={t("runtime.app.register.page.placeholder_ada_lovelace_example_com")}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
                className="auth-input"
                autoComplete="email"
              />
            </div>

            {/* Research domains */}
            <div className="auth-field">
              <label htmlFor="domain" className="auth-label">
                {t("common.labels.domains")}
              </label>
              <div className="auth-domain-input-row">
                <input
                  id="domain"
                  type="text"
                  placeholder={t("runtime.app.register.page.placeholder_machine_learning")}
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddDomain()
                    }
                  }}
                  disabled={isLoading}
                  className="auth-input"
                />
                <button
                  type="button"
                  onClick={handleAddDomain}
                  disabled={isLoading}
                  className="auth-domain-add-btn"
                  aria-label={t("runtime.app.register.page.aria_label_add_domain")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    add
                  </span>
                </button>
              </div>

              {domains.length > 0 && (
                <div className="auth-domain-tags">
                  {domains.map((item) => (
                    <span key={item} className="auth-domain-tag">
                      {item}
                      <button
                        type="button"
                        onClick={() => setDomains(domains.filter((d) => d !== item))}
                        className="auth-domain-tag-remove"
                        aria-label={`Remove ${item}`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>
                          close
                        </span>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="auth-suggestions">
                <p className="auth-suggestions-label">{t("auth.register.suggestions.title")}</p>
                <div className="auth-suggestions-grid">
                  {suggestions.length > 0 ? (
                    suggestions.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => addDomainValue(kw)}
                        disabled={isLoading}
                        className="auth-suggestion-chip"
                      >
                        {kw}
                      </button>
                    ))
                  ) : (
                    <span className="auth-suggestions-empty">
                      {t("auth.register.suggestions.empty")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">
                {t("common.labels.password")}
              </label>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="auth-input"
                  autoComplete="new-password"
                  aria-describedby="password-strength"
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

              {formData.password && (
                <div id="password-strength" className="auth-strength">
                  <div className="auth-strength-bars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="auth-strength-bar"
                        style={{
                          backgroundColor:
                            i <= passwordStrength
                              ? strengthColors[passwordStrength - 1]
                              : undefined,
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="auth-strength-label"
                    style={{
                      color:
                        passwordStrength > 0 ? strengthColors[passwordStrength - 1] : undefined,
                    }}
                  >
                    {strengthLabels[passwordStrength - 1] ?? ""}
                  </span>
                </div>
              )}

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
            </div>

            {/* Confirm password */}
            <div className="auth-field">
              <label htmlFor="confirmPassword" className="auth-label">
                {t("common.labels.confirmPassword")}
              </label>
              <div className="auth-input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  className="auth-input"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="auth-eye-btn"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="auth-field-error">
                  {t("runtime.app.register.page.text_passwords_do_not_match")}
                </p>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="auth-submit-btn">
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{t("runtime.app.register.page.text_creating_account")}</span>
                </>
              ) : (
                t("common.actions.signUp")
              )}
            </button>
          </form>

          <p className="auth-switch-text">
            {t("auth.register.haveAccount")}{" "}
            <Link href={ROUTES.LOGIN} className="auth-switch-link">
              {t("common.actions.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
