# Auth UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the fake `/forgot-password` to real APIs, add `/reset-password` and `/verify-email` pages, and add a change-password card to the profile page.

**Architecture:** New `lib/api/auth.ts` handles all auth API calls. Pages detect dev mode by checking if the API response includes a `token` field — if yes, skip the "check your email" step and redirect immediately. All new auth pages reuse the existing `.auth-shell` split-panel CSS layout. Change-password lives in the existing profile page using shadcn `Card`.

**Tech Stack:** Next.js 15 App Router, TypeScript, existing `.auth-*` CSS classes, shadcn/ui `Card`/`Button`/`Input`, `lucide-react` Loader2, Material Symbols Outlined icons, `useToast` hook

---

## Reference Files — Read Before Starting

- `app/login/page.tsx` — `.auth-shell` layout structure to copy
- `app/forgot-password/page.tsx` — existing page to rewrite (contains password strength logic to reuse)
- `app/profile/[user_id]/page.tsx` — profile page to add security card to
- `lib/api/user.ts` — pattern for API module
- `lib/api/client.ts` — `apiFetch` usage (use proxy path `/api/v1/...` for auth requests)
- `lib/routes.ts` — add new routes here
- `.steerings/insights.md` — color palette, typography conventions
- `.steerings/sizings.md` — sizing conventions

---

## Task 1: Add Auth API Module

**Files:**

- Create: `lib/api/auth.ts`

**Step 1: Create the file**

```typescript
import { apiFetch } from "./client"

export interface ForgotPasswordResponse {
  message: string
  token?: string // present only in dev/test mode
}

export interface ResendVerificationResponse {
  message: string
  token?: string // present only in dev/test mode
}

export const authApi = {
  forgotPassword: (email: string) =>
    apiFetch<{ data: ForgotPasswordResponse }>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiFetch<{ data: { message: string } }>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ data: { message: string } }>("/api/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),

  verifyEmail: (token: string) =>
    apiFetch<{ data: { message: string } }>(
      `/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
      {
        method: "GET",
      },
    ),

  resendVerification: (email: string) =>
    apiFetch<{ data: ResendVerificationResponse }>("/api/v1/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd /path/to/frontend && npm run build 2>&1 | head -30
```

Expected: no TypeScript errors in `lib/api/auth.ts`

---

## Task 2: Add Routes

**Files:**

- Modify: `lib/routes.ts`

**Step 1: Add two new routes to `BASE_ROUTES`**

After `FORGOT_PASSWORD: "/forgot-password"`, add:

```typescript
RESET_PASSWORD: "/reset-password",
VERIFY_EMAIL: "/verify-email",
```

**Step 2: Verify no TypeScript errors**

```bash
npm run build 2>&1 | grep -E "routes|error" | head -10
```

---

## Task 3: Rewrite `/forgot-password`

**Files:**

- Modify: `app/forgot-password/page.tsx`

**Step 1: Replace the entire file content**

The new flow has only 2 steps: `"email"` and `"sent"`.

- Step `"email"`: email input form → calls `authApi.forgotPassword(email)`
  - If response includes `token` → redirect to `/reset-password?token=TOKEN` (dev mode — skip email step)
  - If no token → go to step `"sent"`
- Step `"sent"`: "Check your email" success screen + resend link

Remove: fake verification code input, countdown timer, 3-step flow.
Keep: password brand panel with `lock_reset` icon and existing feature rows.

```tsx
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
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "28px", color: "#ffffff" }}
            >
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
                <h2 className="auth-form-title">Forgot password?</h2>
                <p className="auth-form-desc">
                  Enter your email and we&apos;ll send you a reset link.
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

              <form onSubmit={handleEmailSubmit} className="auth-form-fields">
                <div className="auth-field">
                  <label htmlFor="email" className="auth-label">
                    Email
                  </label>
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
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Sending…</span>
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
                <h2 className="auth-form-title">Check your email</h2>
                <p className="auth-form-desc">
                  We sent a password reset link to <strong>{email}</strong>. Check your inbox and
                  follow the link.
                </p>
              </div>

              {resendSuccess && (
                <div className="auth-notice auth-notice--success">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    check_circle
                  </span>
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
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Resending…</span>
                    </>
                  ) : (
                    "Resend link"
                  )}
                </button>
              </div>
            </>
          )}

          <p className="auth-switch-text">
            Remember it?{" "}
            <Link href={ROUTES.LOGIN} className="auth-switch-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify the page loads in browser**

Start dev server: `npm run dev`
Visit `http://localhost:3000/forgot-password` — should show email form.

---

## Task 4: Create `/reset-password` Page

**Files:**

- Create: `app/reset-password/page.tsx`

**Step 1: Create directory and file**

```bash
mkdir -p app/reset-password
```

**Step 2: Write the page**

Reads `?token` from URL. If missing → redirect to `/forgot-password`. Shows new password + confirm + strength bars. On submit calls `authApi.resetPassword`. On success → `/login?reset=1`. On error → shows error with link back.

```tsx
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
            {/* Password strength bar */}
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
```

**Step 3: Verify in browser**

Visit `http://localhost:3000/reset-password` (no token) → should redirect to `/forgot-password`.
Visit `http://localhost:3000/reset-password?token=abc` → should show password form.

---

## Task 5: Create `/verify-email` Page

**Files:**

- Create: `app/verify-email/page.tsx`

**Step 1: Create directory and file**

```bash
mkdir -p app/verify-email
```

**Step 2: Write the page**

No form. Reads `?token`, auto-calls API on mount, shows loading → success/error state.

```tsx
"use client"

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
```

**Step 3: Verify in browser**

Visit `http://localhost:3000/verify-email?token=badtoken` → should show loading then error state.

---

## Task 6: Add Change-Password Card to Profile Page

**Files:**

- Modify: `app/profile/[user_id]/page.tsx`

**Step 1: Add state variables for change-password**

After the existing state declarations (near line 58), add:

```tsx
// Change password state
const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" })
const [pwLoading, setPwLoading] = useState(false)
const [pwError, setPwError] = useState("")
const [pwSuccess, setPwSuccess] = useState(false)
const [showPwCurrent, setShowPwCurrent] = useState(false)
const [showPwNext, setShowPwNext] = useState(false)
```

**Step 2: Add import for `authApi`**

At the top of the file, add:

```tsx
import { authApi } from "@/lib/api/auth"
```

**Step 3: Add password strength logic**

After the existing `isOwnProfile` and `isDirty` memos, add:

```tsx
type PwRuleKey = "length" | "lower" | "upper" | "number" | "special"
const pwRuleOrder: PwRuleKey[] = ["length", "lower", "upper", "number", "special"]
const pwChecks = useMemo(
  () => ({
    length: pwForm.next.length >= 8,
    lower: /[a-z]/.test(pwForm.next),
    upper: /[A-Z]/.test(pwForm.next),
    number: /\d/.test(pwForm.next),
    special: /[^A-Za-z0-9]/.test(pwForm.next),
  }),
  [pwForm.next],
)
const pwStrength = pwRuleOrder.filter((r) => pwChecks[r]).length
const pwRuleLabels: Record<PwRuleKey, string> = {
  length: "At least 8 characters",
  lower: "Lowercase letter",
  upper: "Uppercase letter",
  number: "Number",
  special: "Special character",
}
```

**Step 4: Add `handleChangePassword` handler**

After `handleSave`, add:

```tsx
const handleChangePassword = async () => {
  setPwError("")
  setPwSuccess(false)

  if (pwForm.next !== pwForm.confirm) {
    setPwError("Passwords do not match.")
    return
  }
  if (!pwRuleOrder.every((r) => pwChecks[r])) {
    setPwError("New password does not meet all requirements.")
    return
  }

  setPwLoading(true)
  try {
    await authApi.changePassword(pwForm.current, pwForm.next)
    setPwSuccess(true)
    setPwForm({ current: "", next: "", confirm: "" })
    toast({ title: "Password changed", description: "Your password was updated successfully." })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to change password."
    setPwError(msg)
  } finally {
    setPwLoading(false)
  }
}
```

**Step 5: Add `Eye` icon import**

In the existing lucide-react import line, add `Eye` and `EyeOff`:

```tsx
import { Loader2, ArrowLeft, BookOpen, ExternalLink, Unlink, Eye, EyeOff } from "lucide-react"
```

**Step 6: Add Security Card to JSX**

Find where the existing cards end in the JSX (look for the last `</Card>` before the closing `</div>` of the main content). After it, add the Security card — but **only when `isOwnProfile` is true**:

```tsx
{
  isOwnProfile && (
    <Card>
      <CardHeader>
        <CardTitle style={{ fontSize: "14px", fontWeight: 700, color: "#1B3C53" }}>
          Security
        </CardTitle>
        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
          Change your account password
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}>
          {/* Current password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <Label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#374151",
              }}
            >
              Current password
            </Label>
            <div style={{ position: "relative" }}>
              <Input
                type={showPwCurrent ? "text" : "password"}
                placeholder="••••••••"
                value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                disabled={pwLoading}
                style={{ height: "34px", fontSize: "12px", paddingRight: "36px" }}
              />
              <button
                type="button"
                onClick={() => setShowPwCurrent((v) => !v)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  padding: 0,
                }}
                tabIndex={-1}
              >
                {showPwCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* New password + strength */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <Label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#374151",
              }}
            >
              New password
            </Label>
            {/* Strength bars */}
            <div style={{ display: "flex", gap: "3px", marginBottom: "4px" }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "3px",
                    flex: 1,
                    borderRadius: "2px",
                    background:
                      i < pwStrength
                        ? ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"][pwStrength - 1]
                        : "#e5e7eb",
                    transition: "background 0.15s",
                  }}
                />
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <Input
                type={showPwNext ? "text" : "password"}
                placeholder="••••••••"
                value={pwForm.next}
                onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                disabled={pwLoading}
                style={{ height: "34px", fontSize: "12px", paddingRight: "36px" }}
              />
              <button
                type="button"
                onClick={() => setShowPwNext((v) => !v)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  padding: 0,
                }}
                tabIndex={-1}
              >
                {showPwNext ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {/* Password rules */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
              {pwRuleOrder.map((rule) => (
                <span
                  key={rule}
                  style={{
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    color: pwChecks[rule] ? "#16a34a" : "#9ca3af",
                    transition: "color 0.15s",
                  }}
                >
                  {pwChecks[rule] ? (
                    <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>
                      check
                    </span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>
                      circle
                    </span>
                  )}
                  {pwRuleLabels[rule]}
                </span>
              ))}
            </div>
          </div>

          {/* Confirm password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <Label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#374151",
              }}
            >
              Confirm new password
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              disabled={pwLoading}
              style={{ height: "34px", fontSize: "12px" }}
            />
          </div>

          {pwError && <p style={{ fontSize: "11px", color: "#ef4444" }}>{pwError}</p>}

          <Button
            onClick={handleChangePassword}
            disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm}
            size="sm"
            style={{
              height: "32px",
              fontSize: "11px",
              fontWeight: 600,
              background: "#1B3C53",
              color: "#fff",
              alignSelf: "flex-start",
            }}
          >
            {pwLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Saving…
              </>
            ) : (
              "Change password"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 7: Verify in browser**

Visit `/profile/[your-user-id]` while logged in → scroll down → Security card should appear with password form.

---

## Task 7: Final Verification

**Step 1: TypeScript build check**

```bash
cd /path/to/frontend && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` with no TypeScript errors

**Step 2: Lint check**

```bash
npm run lint 2>&1 | tail -20
```

Expected: no errors (warnings OK)

**Step 3: Manual smoke test — forgot password flow (dev mode)**

1. Go to `/forgot-password`
2. Enter a registered email → click "Send reset link"
3. Should auto-redirect to `/reset-password?token=xxx` (dev mode)
4. Enter new password meeting all rules → click "Reset password"
5. Should redirect to `/login?reset=1` with success banner

**Step 4: Manual smoke test — verify email**

1. Call `POST /api/v1/auth/resend-verification` with your email (use curl or Postman)
2. Copy the `token` from the response
3. Visit `/verify-email?token=THE_TOKEN`
4. Should show loading → success state

**Step 5: Manual smoke test — change password**

1. Go to `/profile/[your-id]` while logged in
2. Scroll to Security card
3. Enter current password + new password
4. Click "Change password" → toast should appear
