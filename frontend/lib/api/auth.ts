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
    apiFetch<{ data: { message: string } }>(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "GET",
    }),

  resendVerification: (email: string) =>
    apiFetch<{ data: ResendVerificationResponse }>("/api/v1/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
}
