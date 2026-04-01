import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { UIMessage } from "ai"
import { beforeEach, describe, expect, it, vi } from "vitest"

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
    conversation: { title: string }
    onMessagesChange?: (messages: UIMessage[]) => void
    onConversationSynced?: () => void
  }) => (
    <div data-testid="chat-view">
      <span>{conversation.title}</span>
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
  ),
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
      messages: [],
      createdAt: new Date("2026-04-01T01:00:00Z"),
      updatedAt: new Date("2026-04-01T02:00:00Z"),
      status: "active",
    }))
  })

  it("opens into a chat-first sidebar instead of a separate conversation-list screen", async () => {
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

    await waitFor(() => expect(listConversations).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId("chat-view")).toBeInTheDocument())

    expect(screen.getAllByText("Latest conversation")).toHaveLength(2)
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "runtime.components.chatbot.chatbot.aria_label_recent_chats" }),
    ).toBeInTheDocument()
  })

  it("uses a compact single-row header instead of a labeled two-line heading block", async () => {
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

    await waitFor(() => expect(listConversations).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId("chat-view")).toBeInTheDocument())

    expect(
      screen.queryByText("runtime.components.chatbot.chatbot.text_recent_conversations"),
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
    await waitFor(() => expect(getConversationHistory).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole("button", { name: "sync conversation" }))

    await waitFor(() => expect(listConversations).toHaveBeenCalledTimes(2))
    expect(getConversationHistory).toHaveBeenCalledTimes(1)
  })
})
