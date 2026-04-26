import { fireEvent, render, screen, within } from "@testing-library/react"
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

  it("renders uploaded file cards outside and above the user message bubble", () => {
    const messages = [
      {
        id: "user-1",
        role: "user",
        parts: [
          {
            type: "file",
            filename: "paper.pdf",
            mediaType: "application/pdf",
            url: "data:application/pdf;base64,JVBERi0x",
          },
          { type: "text", text: "Summarize this paper." },
        ],
      },
    ] satisfies UIMessage[]

    render(<ChatTranscript messages={messages} status="ready" />)

    const userTurn = screen.getByTestId("chat-user-turn")
    const fileCard = screen.getByTestId("chat-user-file-card")
    const fileIconBadge = within(fileCard).getByTestId("chat-user-file-icon-badge")
    const fileIcon = within(fileCard).getByTestId("chat-user-file-icon")
    expect(fileCard).toHaveTextContent("paper.pdf")
    expect(fileCard).toHaveTextContent("PDF")
    expect(fileIcon).toHaveTextContent("picture_as_pdf")
    expect(fileIconBadge).toHaveClass("grid", "h-6", "w-6", "place-items-center", "bg-red-50")
    expect(fileIcon).toHaveClass(
      "block",
      "h-[18px]",
      "w-[18px]",
      "text-[18px]",
      "leading-[18px]",
      "text-red-600",
    )
    expect(userTurn).not.toContainElement(fileCard)
    expect(within(userTurn).getByText("Summarize this paper.")).toBeInTheDocument()
  })

  it("opens sent file cards in a preview modal", () => {
    const messages = [
      {
        id: "user-1",
        role: "user",
        parts: [
          {
            type: "file",
            filename: "paper.pdf",
            mediaType: "application/pdf",
            url: "data:application/pdf;base64,JVBERi0x",
          },
          { type: "text", text: "Summarize this paper." },
        ],
      },
    ] satisfies UIMessage[]

    render(<ChatTranscript messages={messages} status="ready" />)

    fireEvent.click(screen.getByTestId("chat-user-file-card"))

    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("paper.pdf")).toBeInTheDocument()
    expect(within(dialog).getByTitle("paper.pdf")).toHaveAttribute(
      "src",
      "data:application/pdf;base64,JVBERi0x",
    )
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
    expect(within(assistantTurn).getAllByText("Tool: Get Page Context")).toHaveLength(1)
  })

  it("renders reasoning inside a user-facing Thoughts block", () => {
    const messages = [
      {
        id: "assistant-1",
        role: "assistant",
        parts: [
          {
            type: "reasoning",
            text: "I should inspect the submission context first.",
            state: "streaming",
          },
          { type: "text", text: "I can help with that." },
        ],
      },
    ] satisfies UIMessage[]

    render(<ChatTranscript messages={messages} status="streaming" />)

    const assistantTurn = screen.getByTestId("chat-assistant-turn")
    expect(within(assistantTurn).getByText("Thoughts")).toBeInTheDocument()
    expect(
      within(assistantTurn).getByText("I should inspect the submission context first."),
    ).toBeInTheDocument()
  })
})
