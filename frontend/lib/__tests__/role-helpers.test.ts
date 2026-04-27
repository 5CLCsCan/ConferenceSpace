import { describe, it, expect } from "vitest"
import { isReadOnlyRole } from "../role-helpers"

describe("isReadOnlyRole", () => {
  it("returns true for pc role", () => {
    expect(isReadOnlyRole("pc")).toBe(true)
  })

  it("returns false for chair role", () => {
    expect(isReadOnlyRole("chair")).toBe(false)
  })

  it("returns false for author role", () => {
    expect(isReadOnlyRole("author")).toBe(false)
  })

  it("returns false for reviewer role", () => {
    expect(isReadOnlyRole("reviewer")).toBe(false)
  })

  it("returns false for admin role", () => {
    expect(isReadOnlyRole("admin")).toBe(false)
  })

  it("returns false for null", () => {
    expect(isReadOnlyRole(null)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isReadOnlyRole(undefined)).toBe(false)
  })
})
