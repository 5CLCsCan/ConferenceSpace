# Auth UI Design

**Date:** 2026-03-08
**Status:** Approved

## Overview

Wire the existing fake `/forgot-password` to the real backend and add three missing pieces: `/reset-password` (token link destination from email), `/verify-email` (token verification page), and a change-password card on the profile page.

## Dev vs Production Behaviour

| Flow               | Dev (no email server)                                                        | Production                                                  |
| ------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Forgot password    | API returns token in response → auto-redirect to `/reset-password?token=xxx` | API returns generic message → show "check your email" state |
| Email verification | `POST /auth/resend-verification` returns token → show direct verify link     | User receives email → lands on `/verify-email?token=xxx`    |
| Reset password     | Same `/reset-password` page, token comes from URL                            | Same                                                        |

The frontend detects dev mode by checking if the API response includes a `token` field.

---

## Pages

### 1. `/forgot-password` — Rewrite

**Current state:** Multi-step fake UI — no API calls, auto-skips step 2, does `router.push('/login?reset=1')` on submit.

**New behaviour:**

- **Step 1 (email input):** Submit calls `POST /auth/forgot-password`
  - If response includes `token` (dev mode) → immediately redirect to `/reset-password?token=xxx`
  - If no token (prod) → transition to step 2 (success state)
- **Step 2 (success state):** "Check your email" message with a resend link. Remove the fake verification code input entirely.

Brand panel: keep existing `lock_reset` icon and features.

### 2. `/reset-password` — New page

- Reads `?token` from URL query param on mount
- If no token → redirect to `/forgot-password`
- Shows: new password + confirm password fields (same password strength bars + rules as register)
- On submit: `POST /auth/reset-password { token, new_password }`
- On success: redirect to `/login?reset=1`
- On error (expired/invalid token): show error notice with link back to `/forgot-password`

Brand panel: `lock_reset` icon, features: "Secure token", "New password", "Access restored".

### 3. `/verify-email` — New page

- Reads `?token` from URL query param
- On mount: auto-calls `GET /auth/verify-email?token=xxx` (no user action needed)
- **Loading state:** spinner + "Verifying your email..."
- **Success state:** checkmark + "Email verified! You can now sign in." + "Go to login" button
- **Error state:** error icon + message + "Request a new link" button (calls resend-verification)

Brand panel: `mark_email_read` icon.

### 4. `/profile/[user_id]` — Add Security Card

Add a new `Card` component below the existing profile cards:

```
Card: Security
├── CardHeader: "Security" + subtitle "Change your account password"
└── CardContent:
    ├── Current password input (password type, show/hide toggle)
    ├── New password input + password strength bars
    ├── Confirm password input
    └── Save button (uses existing useToast for success/error — no redirect)
```

Uses existing shadcn `Card`, `Button`, `Input`, `Label` components already imported on that page.

---

## API Layer

### New file: `lib/api/auth.ts`

```ts
export const authApi = {
  forgotPassword(email: string)
    // POST /auth/forgot-password
    // Returns { message: string, token?: string }

  resetPassword(token: string, newPassword: string)
    // POST /auth/reset-password

  changePassword(currentPassword: string, newPassword: string)
    // POST /auth/change-password (uses proxy — sends JWT cookie)

  verifyEmail(token: string)
    // GET /auth/verify-email?token=xxx

  resendVerification(email: string)
    // POST /auth/resend-verification
    // Returns { message: string, token?: string }
}
```

### Routes additions (`lib/routes.ts`)

```ts
RESET_PASSWORD: "/reset-password",
VERIFY_EMAIL: "/verify-email",
```

---

## Styling

All auth pages follow the existing Scholar-Compact design system:

- Split `.auth-shell` layout — brand panel left (navy `#1B3C53`), form right (white)
- CSS classes: `.auth-field`, `.auth-label`, `.auth-input`, `.auth-submit-btn`, `.auth-notice--error`, `.auth-notice--success`, `.auth-eye-btn`
- Material Symbols Outlined icons
- Password strength: 5-bar indicator + rule chips (same as register page)
- `--ui-scale: 1.25` scaling via CSS variables

Profile change-password card uses shadcn components to match the rest of the profile page.

---

## Files to Create/Modify

| File                             | Action                    |
| -------------------------------- | ------------------------- |
| `app/forgot-password/page.tsx`   | Rewrite                   |
| `app/reset-password/page.tsx`    | Create                    |
| `app/verify-email/page.tsx`      | Create                    |
| `app/profile/[user_id]/page.tsx` | Add security card section |
| `lib/api/auth.ts`                | Create                    |
| `lib/routes.ts`                  | Add 2 routes              |
