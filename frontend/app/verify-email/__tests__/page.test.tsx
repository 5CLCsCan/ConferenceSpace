import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import * as authModule from "@/lib/api/auth"

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

// useSearchParams mock is set per test — we'll use a module-level variable
let tokenValue: string | null = "testtoken123"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? tokenValue : null),
  }),
}))

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tokenValue = "testtoken123"
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("calls authApi.verifyEmail on mount when token is present", async () => {
    mockAuthApi.verifyEmail.mockResolvedValueOnce({
      data: { data: { message: "Email verified" } },
    })

    // Dynamic import so each test gets a fresh render with current tokenValue
    const { default: VerifyEmailPage } = await import("../page")
    render(<VerifyEmailPage />)

    await waitFor(() => {
      expect(mockAuthApi.verifyEmail).toHaveBeenCalledWith("testtoken123")
    })
  })

  it("shows Email verified! heading on successful verification", async () => {
    mockAuthApi.verifyEmail.mockResolvedValueOnce({
      data: { data: { message: "Email verified" } },
    })

    const { default: VerifyEmailPage } = await import("../page")
    render(<VerifyEmailPage />)

    expect(await screen.findByText("Email verified!")).toBeInTheDocument()
  })

  it("shows Verification failed heading and error message on API error", async () => {
    const { ApiError } = await import("@/lib/api/client")
    mockAuthApi.verifyEmail.mockRejectedValueOnce(
      new ApiError("Token has expired", 400),
    )

    const { default: VerifyEmailPage } = await import("../page")
    render(<VerifyEmailPage />)

    expect(await screen.findByText("Verification failed")).toBeInTheDocument()
    expect(screen.getByText("Token has expired")).toBeInTheDocument()
  })

  it("shows error state with No verification token provided when no token", async () => {
    tokenValue = null

    const { default: VerifyEmailPage } = await import("../page")
    render(<VerifyEmailPage />)

    expect(await screen.findByText("Verification failed")).toBeInTheDocument()
    expect(screen.getByText("No verification token provided.")).toBeInTheDocument()
  })

  it("resend form submits to authApi.resendVerification", async () => {
    const { ApiError } = await import("@/lib/api/client")
    mockAuthApi.verifyEmail.mockRejectedValueOnce(
      new ApiError("Token has expired", 400),
    )
    mockAuthApi.resendVerification.mockResolvedValueOnce({
      data: { data: { message: "Resent" } },
    })

    const { default: VerifyEmailPage } = await import("../page")
    render(<VerifyEmailPage />)

    await screen.findByText("Verification failed")

    fireEvent.change(screen.getByLabelText("Request a new link"), {
      target: { value: "user@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }))

    await waitFor(() => {
      expect(mockAuthApi.resendVerification).toHaveBeenCalledWith("user@example.com")
    })
  })
})
