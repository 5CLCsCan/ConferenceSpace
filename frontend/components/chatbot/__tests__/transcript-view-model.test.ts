import { describe, expect, it } from "vitest"
import type { UIMessage } from "ai"

import { buildTranscriptTurns } from "../transcript-view-model"

describe("buildTranscriptTurns", () => {
  it("keeps assistant text and tool activity inside the same assistant turn", () => {
    const messages = [
      {
        id: "user-1",
        role: "user",
        parts: [{ type: "text", text: "Fill this form for me." }],
      },
      {
        id: "assistant-1",
        role: "assistant",
        parts: [
          { type: "text", text: "I can do that." },
          {
            type: "tool-performAction",
            toolCallId: "call-1",
            state: "input-available",
            input: { action: "click" },
          },
        ],
      },
      {
        id: "tool-1",
        role: "tool",
        parts: [
          {
            type: "tool-performAction",
            toolCallId: "call-1",
            state: "output-available",
            output: { success: true },
          },
        ],
      },
      {
        id: "assistant-2",
        role: "assistant",
        parts: [{ type: "text", text: "Done." }],
      },
    ] satisfies UIMessage[]

    const turns = buildTranscriptTurns(messages)

    expect(turns).toHaveLength(2)
    expect(turns[0]).toMatchObject({ kind: "user-turn", messageId: "user-1" })
    expect(turns[1]).toMatchObject({ kind: "assistant-turn" })
    expect(turns[1].items.map((item) => item.kind)).toEqual(["text", "tool", "text"])
  })

  it("folds persisted tool-role messages into the preceding assistant turn", () => {
    const messages = [
      {
        id: "assistant-1",
        role: "assistant",
        parts: [
          {
            type: "tool-getPageContext",
            toolCallId: "call-2",
            state: "input-available",
            input: {},
          },
        ],
      },
      {
        id: "tool-2",
        role: "tool",
        parts: [
          {
            type: "tool-getPageContext",
            toolCallId: "call-2",
            state: "output-available",
            output: { children: [] },
          },
        ],
      },
    ] satisfies UIMessage[]

    const turns = buildTranscriptTurns(messages)

    expect(turns).toHaveLength(1)
    expect(turns[0]).toMatchObject({ kind: "assistant-turn" })
    expect(turns[0].items.map((item) => item.kind)).toEqual(["tool"])
  })

  it("preserves orphaned tool messages as a fallback activity turn", () => {
    const messages = [
      {
        id: "tool-3",
        role: "tool",
        parts: [
          {
            type: "tool-performAction",
            toolCallId: "call-3",
            state: "output-error",
            errorText: "Execution failed",
          },
        ],
      },
    ] satisfies UIMessage[]

    const turns = buildTranscriptTurns(messages)

    expect(turns).toHaveLength(1)
    expect(turns[0]).toMatchObject({ kind: "assistant-turn", isOrphanActivity: true })
    expect(turns[0].items).toHaveLength(1)
    expect(turns[0].items[0]).toMatchObject({
      kind: "tool",
      toolName: "performAction",
      state: "output-error",
    })
  })
})
