import * as React from "react"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import type { UIMessage } from "ai"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Chatbot } from "../chatbot"
import { ChatbotProvider } from "../chatbot-provider"

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}))

vi.mock("../chat-view", () => ({
  ChatView: ({
    conversation,
    onMessagesChange,
    onConversationSynced,
  }: {
    conversation: { title: string; messages: UIMessage[] }
    onMessagesChange?: (messages: UIMessage[]) => void
    onConversationSynced?: () => void
  }) => {
    const [mountedMessages] = React.useState(conversation.messages)
    const transcriptText = mountedMessages
      .flatMap((message) => message.parts)
      .find((part) => part.type === "text" && "text" in part)

    return (
      <div data-testid="chat-view">
        <span>{conversation.title}</span>
        {transcriptText ? <span>{transcriptText.text}</span> : null}
        <button
          type="button"
          onClick={() => {
            onMessagesChange?.([
              {
                id: "msg-1",
                role: "user",
                parts: [{ type: "text", text: "Large tool-backed message" }],
              },
            ] satisfies UIMessage[])
            onConversationSynced?.()
          }}
        >
          sync conversation
        </button>
      </div>
    )
  },
}))

vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const listConversations = vi.fn()
const getConversationHistory = vi.fn()
const deleteConversation = vi.fn()

vi.mock("@/lib/chatbot/conversations", () => ({
  listConversations: (...args: unknown[]) => listConversations(...args),
  getConversationHistory: (...args: unknown[]) => getConversationHistory(...args),
  deleteConversation: (...args: unknown[]) => deleteConversation(...args),
}))

describe("Chatbot shell", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    listConversations.mockReset()
    getConversationHistory.mockReset()
    deleteConversation.mockReset()

    listConversations.mockResolvedValue({
      conversations: [
        {
          id: "conv-2",
          title: "Latest conversation",
          messages: [],
          createdAt: new Date("2026-04-01T01:00:00Z"),
          updatedAt: new Date("2026-04-01T02:00:00Z"),
          status: "active",
        },
        {
          id: "conv-1",
          title: "Older conversation",
          messages: [],
          createdAt: new Date("2026-04-01T00:00:00Z"),
          updatedAt: new Date("2026-04-01T01:00:00Z"),
          status: "active",
        },
      ],
      nextCursor: null,
    })

    getConversationHistory.mockImplementation(async (id: string) => ({
      id,
      title: id === "conv-2" ? "Latest conversation" : "Older conversation",
      messages:
        id === "conv-2"
          ? ([
              {
                id: "assistant-1",
                role: "assistant",
                parts: [{ type: "text", text: "Recovered transcript" }],
              },
            ] satisfies UIMessage[])
          : [],
      createdAt: new Date("2026-04-01T01:00:00Z"),
      updatedAt: new Date("2026-04-01T02:00:00Z"),
      status: "active",
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("opens into a chat-first sidebar instead of a separate conversation-list screen", async () => {
    const { container } = render(
      <ChatbotProvider>
        <Chatbot />
      </ChatbotProvider>,
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "runtime.components.chatbot.chatbot.aria_label_open_assistant",
      }),
    )

    await waitFor(() => expect(listConversations).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId("chat-view")).toBeInTheDocument())

    const header = container.querySelector(".chatbot-header")
    expect(header).not.toBeNull()
    expect(within(header as HTMLElement).getByText("New Conversation")).toBeInTheDocument()
    expect(within(screen.getByTestId("chat-view")).getByText("New Conversation")).toBeInTheDocument()
    expect(getConversationHistory).not.toHaveBeenCalled()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "runtime.components.chatbot.chatbot.aria_label_recent_chats" }),
    ).toBeInTheDocument()
  })

  it("uses a compact single-row header instead of a labeled two-line heading block", async () => {
    const { container } = render(
      <ChatbotProvider>
        <Chatbot />
      </ChatbotProvider>,
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "runtime.components.chatbot.chatbot.aria_label_open_assistant",
      }),
    )

    await waitFor(() => expect(listConversations).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId("chat-view")).toBeInTheDocument())

    const header = container.querySelector(".chatbot-header")
    expect(header).not.toBeNull()
    expect(
      within(header as HTMLElement).queryByText(
        "runtime.components.chatbot.chatbot.text_recent_conversations",
      ),
    ).not.toBeInTheDocument()
  })

  it("does not refetch current conversation history immediately after local messages were synced", async () => {
    render(
      <ChatbotProvider>
        <Chatbot />
      </ChatbotProvider>,
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "runtime.components.chatbot.chatbot.aria_label_open_assistant",
      }),
    )

    await waitFor(() => expect(listConversations).toHaveBeenCalledTimes(1))
    expect(getConversationHistory).not.toHaveBeenCalled()

    fireEvent.click(
      screen.getByRole("button", {
        name: "runtime.components.chatbot.chatbot.aria_label_recent_chats",
      }),
    )
    fireEvent.click(screen.getByRole("button", { name: /Latest conversation/i }))

    await waitFor(() => expect(getConversationHistory).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole("button", { name: "sync conversation" }))

    await waitFor(() => expect(listConversations).toHaveBeenCalledTimes(2))
    expect(getConversationHistory).toHaveBeenCalledTimes(1)
  })

  it("hydrates the selected conversation transcript after loading remote history", async () => {
    render(
      <ChatbotProvider>
        <Chatbot />
      </ChatbotProvider>,
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "runtime.components.chatbot.chatbot.aria_label_open_assistant",
      }),
    )

    await waitFor(() => expect(listConversations).toHaveBeenCalledTimes(1))

    fireEvent.click(
      screen.getByRole("button", {
        name: "runtime.components.chatbot.chatbot.aria_label_recent_chats",
      }),
    )
    fireEvent.click(screen.getByRole("button", { name: /Latest conversation/i }))

    await waitFor(() => expect(getConversationHistory).toHaveBeenCalledWith("conv-2"))
    await waitFor(() =>
      expect(within(screen.getByTestId("chat-view")).getByText("Recovered transcript")).toBeInTheDocument(),
    )
  })
})
