import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ResetPasswordPage from "../page"
import * as authModule from "@/lib/api/auth"

const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? "testtoken123" : null),
  }),
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

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("renders New password heading and form fields", async () => {
    render(<ResetPasswordPage />)
    expect(await screen.findByRole("heading", { name: "New password" })).toBeInTheDocument()
    expect(screen.getByLabelText("New password")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument()
  })

  it("shows error when passwords do not match", async () => {
    render(<ResetPasswordPage />)
    await screen.findByRole("heading", { name: "New password" })

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "StrongP@ss1" },
    })
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "DifferentP@ss1" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }))

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument()
    })
  })

  it("shows error when password does not meet requirements", async () => {
    render(<ResetPasswordPage />)
    await screen.findByRole("heading", { name: "New password" })

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "short" },
    })
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "short" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }))

    await waitFor(() => {
      expect(screen.getByText("Password does not meet all requirements.")).toBeInTheDocument()
    })
  })

  it("calls router.push with /login?reset=1 on successful submit", async () => {
    mockAuthApi.resetPassword.mockResolvedValueOnce({
      data: { data: { message: "Password reset successful" } },
    })

    render(<ResetPasswordPage />)
    await screen.findByRole("heading", { name: "New password" })

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "StrongP@ss1" },
    })
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "StrongP@ss1" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }))

    await waitFor(() => {
      expect(mockAuthApi.resetPassword).toHaveBeenCalledWith("testtoken123", "StrongP@ss1")
      expect(mockPush).toHaveBeenCalledWith("/login?reset=1")
    })
  })

  it("shows error message on API error", async () => {
    const { ApiError } = await import("@/lib/api/client")
    mockAuthApi.resetPassword.mockRejectedValueOnce(
      new ApiError("Token expired or invalid", 400),
    )

    render(<ResetPasswordPage />)
    await screen.findByRole("heading", { name: "New password" })

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "StrongP@ss1" },
    })
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "StrongP@ss1" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }))

    await waitFor(() => {
      expect(screen.getByText("Token expired or invalid")).toBeInTheDocument()
    })
  })
})
