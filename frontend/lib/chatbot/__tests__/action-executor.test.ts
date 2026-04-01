import { describe, expect, it } from "vitest"

import { normalizeActionInvocation } from "@/lib/chatbot/action-executor"

describe("normalizeActionInvocation", () => {
  it("unwraps performAction payloads that incorrectly nest values under properties", () => {
    const normalized = normalizeActionInvocation(undefined, {
      properties: {
        action: "click",
        ref: "btn-78",
      },
    })

    expect(normalized).toEqual({
      action: "click",
      params: {
        ref: "btn-78",
        text: undefined,
        key: undefined,
        value: undefined,
      },
    })
  })
})
