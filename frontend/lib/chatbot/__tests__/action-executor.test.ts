import { describe, expect, it } from "vitest"

import {
  executeActions,
  normalizeActionInvocation,
  normalizeBatchActionInvocation,
} from "@/lib/chatbot/action-executor"

describe("normalizeActionInvocation", () => {
  it("unwraps nested single-step action values under properties", () => {
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

describe("normalizeBatchActionInvocation", () => {
  it("unwraps performActions payloads that incorrectly nest actions under properties", () => {
    const normalized = normalizeBatchActionInvocation({
      properties: {
        actions: [{ action: "click", ref: "btn-78" }],
      },
    })

    expect(normalized).toEqual({
      actions: [{ action: "click", ref: "btn-78" }],
    })
  })
})

describe("executeActions", () => {
  it("executes a clear then type sequence", async () => {
    const input = document.createElement("input")
    input.value = "before"
    document.body.appendChild(input)

    const refMap = new Map<string, Element>([["input-1", input]])

    const result = await executeActions(refMap, {
      actions: [
        { action: "clear", ref: "input-1" },
        { action: "type", ref: "input-1", text: "after" },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.completedCount).toBe(2)
    expect(result.results).toHaveLength(2)
    expect(result.abortedAt).toBeUndefined()
    expect(input.value).toBe("after")
  })

  it("aborts on the first failing step", async () => {
    const input = document.createElement("input")
    document.body.appendChild(input)

    const refMap = new Map<string, Element>([["input-1", input]])

    const result = await executeActions(refMap, {
      actions: [
        { action: "type", ref: "input-1" },
        { action: "clear", ref: "input-1" },
      ],
    })

    expect(result.success).toBe(false)
    expect(result.completedCount).toBe(0)
    expect(result.abortedAt).toBe(0)
    expect(result.results).toHaveLength(1)
    expect(result.results[0]).toMatchObject({
      action: "type",
      success: false,
    })
  })

  it("aborts when a later referenced element is disconnected", async () => {
    const first = document.createElement("button")
    const second = document.createElement("input")
    document.body.append(first, second)

    const refMap = new Map<string, Element>([
      ["btn-1", first],
      ["input-2", second],
    ])

    first.addEventListener("click", () => {
      second.remove()
    })

    const result = await executeActions(refMap, {
      actions: [
        { action: "click", ref: "btn-1" },
        { action: "type", ref: "input-2", text: "after" },
      ],
    })

    expect(result.success).toBe(false)
    expect(result.completedCount).toBe(1)
    expect(result.abortedAt).toBe(1)
    expect(result.results).toHaveLength(2)
    expect(result.results[1]).toMatchObject({
      action: "type",
      success: false,
      stale: true,
    })
  })
})
