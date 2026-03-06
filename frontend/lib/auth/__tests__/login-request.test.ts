import { describe, expect, it } from "vitest"
import { extractLoginRequestPayload, resolveAuthCookieMaxAge } from "@/lib/auth/login-request"

describe("login-request helpers", () => {
  it("strips rememberMe before forwarding payload to backend", () => {
    const { rememberMe, backendPayload } = extractLoginRequestPayload({
      email: "user@example.com",
      password: "Secret123!",
      rememberMe: true,
    })

    expect(rememberMe).toBe(true)
    expect(backendPayload).toEqual({
      email: "user@example.com",
      password: "Secret123!",
    })
  })

  it("defaults rememberMe to false when missing", () => {
    const { rememberMe, backendPayload } = extractLoginRequestPayload({
      email: "user@example.com",
      password: "Secret123!",
    })

    expect(rememberMe).toBe(false)
    expect(backendPayload).toEqual({
      email: "user@example.com",
      password: "Secret123!",
    })
  })

  it("returns cookie maxAge only when rememberMe is enabled", () => {
    expect(resolveAuthCookieMaxAge(true, 3600)).toBe(3600)
    expect(resolveAuthCookieMaxAge(false, 3600)).toBeUndefined()
  })
})
