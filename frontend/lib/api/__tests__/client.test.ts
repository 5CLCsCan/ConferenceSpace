import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiFetch } from "../client"

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      ),
    )
  })

  it("uses the same-origin backend proxy for authenticated and skipAuth requests", async () => {
    await apiFetch("/api/v1/example")
    await apiFetch("/api/v1/example", { skipAuth: true })

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/backend/api/v1/example",
      expect.objectContaining({ credentials: "include" }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/backend/api/v1/example",
      expect.objectContaining({
        credentials: "same-origin",
        headers: expect.any(Headers),
      }),
    )

    const skipAuthHeaders = vi.mocked(fetch).mock.calls[1][1]?.headers as Headers
    expect(skipAuthHeaders.get("X-Skip-Auth")).toBe("true")
  })
})
