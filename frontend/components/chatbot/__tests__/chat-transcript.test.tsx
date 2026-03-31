import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { UIMessage } from "ai"

import { ChatTranscript } from "../chat-transcript"

describe("ChatTranscript", () => {
  it("renders user messages in a contained shell and assistant text directly on the canvas", () => {
    const messages = [
      {
        id: "user-1",
        role: "user",
        parts: [{ type: "text", text: "Help me fill the conference form." }],
      },
      {
        id: "assistant-1",
        role: "assistant",
        parts: [{ type: "text", text: "I can help with that." }],
      },
    ] satisfies UIMessage[]

    render(<ChatTranscript messages={messages} status="ready" />)

    const userTurn = screen.getByTestId("chat-user-turn")
    const assistantTurn = screen.getByTestId("chat-assistant-turn")

    expect(within(userTurn).getByText("Help me fill the conference form.")).toBeInTheDocument()
    expect(within(assistantTurn).getByText("I can help with that.")).toBeInTheDocument()
    expect(userTurn).toHaveAttribute("data-chat-turn", "user")
    expect(assistantTurn).toHaveAttribute("data-chat-turn", "assistant")
  })

  it("renders tool rows inside the same assistant turn", () => {
    const messages = [
      {
        id: "assistant-1",
        role: "assistant",
        parts: [
          { type: "text", text: "I am checking the page first." },
          {
            type: "tool-getPageContext",
            toolCallId: "call-1",
            state: "input-available",
            input: {},
          },
        ],
      },
      {
        id: "tool-1",
        role: "tool",
        parts: [
          {
            type: "tool-getPageContext",
            toolCallId: "call-1",
            state: "output-available",
            output: { children: [] },
          },
        ],
      },
    ] satisfies UIMessage[]

    render(<ChatTranscript messages={messages} status="ready" />)

    const assistantTurn = screen.getByTestId("chat-assistant-turn")
    expect(within(assistantTurn).getByText("I am checking the page first.")).toBeInTheDocument()
    expect(within(assistantTurn).getAllByText("Tool: Get Page Context")).toHaveLength(2)
  })
})
