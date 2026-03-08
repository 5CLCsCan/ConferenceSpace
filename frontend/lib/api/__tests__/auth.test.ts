import { describe, it, expect, vi, beforeEach } from "vitest"
import { authApi } from "../auth"
import * as clientModule from "../client"

vi.mock("../client", () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

const mockApiFetch = vi.mocked(clientModule.apiFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("authApi", () => {
  describe("forgotPassword", () => {
    it("calls POST /api/v1/auth/forgot-password with email", async () => {
      mockApiFetch.mockResolvedValueOnce({ data: { data: { message: "ok" } }, response: new Response() })
      await authApi.forgotPassword("test@example.com")
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/auth/forgot-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        }),
      )
    })

    it("returns token when present (dev mode)", async () => {
      mockApiFetch.mockResolvedValueOnce({
        data: { data: { message: "ok", token: "abc123" } },
        response: new Response(),
      })
      const result = await authApi.forgotPassword("test@example.com")
      expect(result.data?.data?.token).toBe("abc123")
    })

    it("returns no token in production mode", async () => {
      mockApiFetch.mockResolvedValueOnce({
        data: { data: { message: "If that email..." } },
        response: new Response(),
      })
      const result = await authApi.forgotPassword("test@example.com")
      expect(result.data?.data?.token).toBeUndefined()
    })
  })

  describe("resetPassword", () => {
    it("calls POST /api/v1/auth/reset-password with token and new_password", async () => {
      mockApiFetch.mockResolvedValueOnce({ data: { data: { message: "ok" } }, response: new Response() })
      await authApi.resetPassword("mytoken", "NewPass123!")
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/auth/reset-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: "mytoken", new_password: "NewPass123!" }),
        }),
      )
    })
  })

  describe("changePassword", () => {
    it("calls POST /api/v1/auth/change-password with current and new password", async () => {
      mockApiFetch.mockResolvedValueOnce({ data: { data: { message: "ok" } }, response: new Response() })
      await authApi.changePassword("OldPass123!", "NewPass456!")
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/auth/change-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ current_password: "OldPass123!", new_password: "NewPass456!" }),
        }),
      )
    })
  })

  describe("verifyEmail", () => {
    it("calls GET /api/v1/auth/verify-email with encoded token", async () => {
      mockApiFetch.mockResolvedValueOnce({ data: { data: { message: "ok" } }, response: new Response() })
      await authApi.verifyEmail("mytoken123")
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/auth/verify-email?token=mytoken123",
        expect.objectContaining({ method: "GET" }),
      )
    })

    it("encodes special characters in token", async () => {
      mockApiFetch.mockResolvedValueOnce({ data: { data: { message: "ok" } }, response: new Response() })
      await authApi.verifyEmail("token with spaces")
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/auth/verify-email?token=token%20with%20spaces",
        expect.anything(),
      )
    })
  })

  describe("resendVerification", () => {
    it("calls POST /api/v1/auth/resend-verification with email", async () => {
      mockApiFetch.mockResolvedValueOnce({ data: { data: { message: "ok" } }, response: new Response() })
      await authApi.resendVerification("test@example.com")
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/auth/resend-verification",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        }),
      )
    })
  })
})
