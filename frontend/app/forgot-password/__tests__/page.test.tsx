import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ForgotPasswordPage from "../page"
import * as authModule from "@/lib/api/auth"

const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({ get: (_key: string) => null }),
}))

vi.mock("@/lib/api/client", () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  },
  apiFetch: vi.fn(),
}))

vi.mock("@/lib/api/auth", () => ({
  authApi: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    changePassword: vi.fn(),
  },
}))

const mockAuthApi = authModule.authApi as {
  forgotPassword: ReturnType<typeof vi.fn>
  resetPassword: ReturnType<typeof vi.fn>
  verifyEmail: ReturnType<typeof vi.fn>
  resendVerification: ReturnType<typeof vi.fn>
  changePassword: ReturnType<typeof vi.fn>
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("renders email input and Send reset link button", () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeInTheDocument()
  })

  it("shows Check your email step when API returns no token", async () => {
    mockAuthApi.forgotPassword.mockResolvedValueOnce({
      data: { data: { message: "Email sent" } },
    })

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }))

    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeInTheDocument()
    })
  })

  it("calls router.push with reset-password token when API returns a token", async () => {
    mockAuthApi.forgotPassword.mockResolvedValueOnce({
      data: { data: { message: "Dev mode", token: "devtoken123" } },
    })

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }))

    await waitFor(() => {
      expect(mockAuthApi.forgotPassword).toHaveBeenCalledWith("test@example.com")
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/reset-password?token="))
    })
  })

  it("shows error message on API error", async () => {
    const { ApiError } = await import("@/lib/api/client")
    mockAuthApi.forgotPassword.mockRejectedValueOnce(new ApiError("User not found", 404))

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "notfound@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }))

    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeInTheDocument()
    })
  })

  it("shows generic error message on non-ApiError", async () => {
    mockAuthApi.forgotPassword.mockRejectedValueOnce(new Error("network error"))

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }))

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument()
    })
  })

  it("shows Resend link button in the sent step", async () => {
    mockAuthApi.forgotPassword.mockResolvedValueOnce({
      data: { data: { message: "Email sent" } },
    })

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Resend link" })).toBeInTheDocument()
    })
  })
})
