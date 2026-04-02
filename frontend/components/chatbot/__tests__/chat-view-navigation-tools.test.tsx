import { render } from "@testing-library/react"
import type { UIMessage } from "ai"
import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ChatView } from "../chat-view"

const { executeActions, capturePageContext } = vi.hoisted(() => ({
  executeActions: vi.fn(),
  capturePageContext: vi.fn(),
}))

const addToolOutput = vi.fn()
const sendMessage = vi.fn()
const mockPush = vi.fn()
const useChatMock = vi.fn()
const showNavigationMask = vi.fn()

let capturedOnToolCall:
  | ((args: {
      toolCall: { toolName: string; toolCallId: string; input: Record<string, unknown> }
    }) => Promise<void>)
  | undefined

vi.mock("@ai-sdk/react", () => ({
  useChat: (options: unknown) => useChatMock(options),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/role/chair",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    currentRole: "chair",
    switchRole: vi.fn(() => true),
  }),
}))

vi.mock("@/lib/chatbot/action-executor", () => ({
  executeActions,
}))

vi.mock("@/lib/chatbot/page-context", () => ({
  capturePageContext,
}))

vi.mock("../chatbot-provider", () => ({
  useChatbot: () => ({
    isOpen: true,
    setIsOpen: vi.fn(),
    width: 384,
    setWidth: vi.fn(),
    navigationMask: null,
    showNavigationMask,
    clearNavigationMask: vi.fn(),
  }),
}))

vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("ChatView navigation tools", () => {
  beforeEach(() => {
    addToolOutput.mockReset()
    sendMessage.mockReset()
    mockPush.mockReset()
    showNavigationMask.mockReset()
    executeActions.mockReset()
    capturePageContext.mockReset()
    capturedOnToolCall = undefined

    useChatMock.mockImplementation((options: { onToolCall?: typeof capturedOnToolCall }) => {
      capturedOnToolCall = options.onToolCall
      return {
        messages: [] satisfies UIMessage[],
        sendMessage,
        status: "ready",
        addToolOutput,
      }
    })

    capturePageContext.mockReturnValue({
      tree: { children: [] },
      refMap: new Map([["input-1", document.createElement("input")]]),
    })
  })

  it("returns a navigation snapshot for getCurrentNavigation", async () => {
    render(
      <ChatView
        conversation={{
          id: "conv-1",
          title: "Navigation test",
          messages: [],
          createdAt: new Date("2026-04-01T00:00:00Z"),
          updatedAt: new Date("2026-04-01T00:00:00Z"),
        }}
      />,
    )

    await capturedOnToolCall?.({
      toolCall: {
        toolName: "getCurrentNavigation",
        toolCallId: "call-nav-1",
        input: {},
      },
    })

    expect(addToolOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: "getCurrentNavigation",
        toolCallId: "call-nav-1",
        output: expect.objectContaining({
          pathname: "/role/chair",
          destinationId: "chair.dashboard",
          matchStatus: "matched",
        }),
      }),
    )
  })

  it("executes navigate and returns the structured result", async () => {
    render(
      <ChatView
        conversation={{
          id: "conv-1",
          title: "Navigation test",
          messages: [],
          createdAt: new Date("2026-04-01T00:00:00Z"),
          updatedAt: new Date("2026-04-01T00:00:00Z"),
        }}
      />,
    )

    await capturedOnToolCall?.({
      toolCall: {
        toolName: "navigate",
        toolCallId: "call-nav-2",
        input: {
          destinationId: "chair.conference.detail",
          params: { conferenceId: "conf-9" },
        },
      },
    })

    expect(showNavigationMask).toHaveBeenCalledWith({
      destinationLabel: "Chair Conference Detail",
      targetPath: "/role/chair/conferences/conf-9",
    })
    expect(mockPush).toHaveBeenCalledWith("/role/chair/conferences/conf-9")
    expect(addToolOutput).toHaveBeenCalledWith({
      tool: "navigate",
      toolCallId: "call-nav-2",
      output: {
        success: true,
        message: "Navigated to chair.conference.detail",
        destinationId: "chair.conference.detail",
        path: "/role/chair/conferences/conf-9",
      },
    })
  })

  it("executes performActions and returns aggregated output", async () => {
    executeActions.mockResolvedValue({
      success: true,
      completedCount: 2,
      message: "Executed 2 actions.",
      results: [
        { index: 0, action: "clear", success: true, message: "Cleared input-1", ref: "input-1" },
        { index: 1, action: "type", success: true, message: "Typed into input-1", ref: "input-1" },
      ],
    })

    render(
      <ChatView
        conversation={{
          id: "conv-1",
          title: "Action test",
          messages: [],
          createdAt: new Date("2026-04-01T00:00:00Z"),
          updatedAt: new Date("2026-04-01T00:00:00Z"),
        }}
      />,
    )

    await capturedOnToolCall?.({
      toolCall: {
        toolName: "getPageContext",
        toolCallId: "call-page-1",
        input: {},
      },
    })

    await capturedOnToolCall?.({
      toolCall: {
        toolName: "performActions",
        toolCallId: "call-actions-1",
        input: {
          actions: [
            { action: "clear", ref: "input-1" },
            { action: "type", ref: "input-1", text: "hello" },
          ],
        },
      },
    })

    expect(executeActions).toHaveBeenCalledWith(
      expect.any(Map),
      {
        actions: [
          { action: "clear", ref: "input-1" },
          { action: "type", ref: "input-1", text: "hello" },
        ],
      },
    )
    expect(addToolOutput).toHaveBeenCalledWith({
      tool: "performActions",
      toolCallId: "call-actions-1",
      output: {
        success: true,
        completedCount: 2,
        message: "Executed 2 actions.",
        results: [
          { index: 0, action: "clear", success: true, message: "Cleared input-1", ref: "input-1" },
          { index: 1, action: "type", success: true, message: "Typed into input-1", ref: "input-1" },
        ],
      },
    })
  })
})
