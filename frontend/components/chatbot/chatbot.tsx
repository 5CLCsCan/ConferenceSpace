"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import type { UIMessage } from "ai"
import { cn } from "@/lib/utils"
import { ChatView } from "./chat-view"
import { ConversationList } from "./conversation-list"
import { useChatbot } from "./chatbot-provider"
import type { ChatAttachment, ChatConversation } from "./types"
import {
  deleteConversation as deleteConversationRequest,
  getConversationHistory,
  listConversations,
} from "@/lib/chatbot/conversations"
import { useTranslation } from "@/lib/i18n/translation-context"

type ChatViewState = "closed" | "conversation-list" | "chat"

const MIN_WIDTH = 320
const MAX_WIDTH = 800
const DEFAULT_TITLE = "New Conversation"

function sortConversations(conversations: ChatConversation[]): ChatConversation[] {
  return [...conversations].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

function normalizeTitleFromUserInput(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim()
  if (!normalized) {
    return DEFAULT_TITLE
  }
  return normalized.slice(0, 80)
}

function toMessageSignature(messages: UIMessage[]): string {
  try {
    return JSON.stringify(messages)
  } catch {
    return String(messages.length)
  }
}

function resolveLastMessageTimestamp(messages: UIMessage[], fallback?: Date): Date {
  for (let idx = messages.length - 1; idx >= 0; idx--) {
    const message = messages[idx] as UIMessage & { createdAt?: string | Date }
    if (!message.createdAt) {
      continue
    }
    const date = new Date(message.createdAt)
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }
  return fallback ?? new Date()
}

function mergeConversationLists(
  previous: ChatConversation[],
  remote: ChatConversation[],
  currentConversationId: string | null,
): ChatConversation[] {
  const merged = new Map<string, ChatConversation>()
  const previousMap = new Map(previous.map((item) => [item.id, item]))

  for (const remoteConversation of remote) {
    const existing = previousMap.get(remoteConversation.id)
    merged.set(remoteConversation.id, {
      ...remoteConversation,
      messages:
        existing && existing.messages.length > 0
          ? existing.messages
          : remoteConversation.messages,
    })
  }

  for (const conversation of previous) {
    if (conversation.status === "local-draft" && !merged.has(conversation.id)) {
      merged.set(conversation.id, conversation)
    }
  }

  if (currentConversationId && !merged.has(currentConversationId)) {
    const current = previousMap.get(currentConversationId)
    if (current) {
      merged.set(currentConversationId, current)
    }
  }

  return sortConversations(Array.from(merged.values()))
}

export function Chatbot() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { isOpen, setIsOpen, width, setWidth } = useChatbot()
  const [isResizing, setIsResizing] = React.useState(false)
  const sidebarRef = React.useRef<HTMLDivElement>(null)
  const [viewState, setViewState] = React.useState<ChatViewState>("closed")
  const [conversations, setConversations] = React.useState<ChatConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(null)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [isWindowAnimating, setIsWindowAnimating] = React.useState(false)
  const [swipeDirection, setSwipeDirection] = React.useState<"forward" | "back" | null>(null)

  const shouldHideOnRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/"

  const refreshConversations = React.useCallback(async () => {
    try {
      const { conversations: remoteConversations } = await listConversations({ limit: 50 })
      setConversations((prev) =>
        mergeConversationLists(prev, remoteConversations, currentConversationId),
      )
    } catch (error) {
      console.error("chatbot.refreshConversations failed", error)
    }
  }, [currentConversationId])

  React.useEffect(() => {
    if (!isOpen) {
      return
    }
    void refreshConversations()
  }, [isOpen, refreshConversations])

  const currentConversation = React.useMemo(
    () => conversations.find((item) => item.id === currentConversationId) || null,
    [conversations, currentConversationId],
  )

  const handleOpen = React.useCallback(() => {
    setIsOpen(true)
    setViewState("conversation-list")
    setIsWindowAnimating(true)
    requestAnimationFrame(() => {
      setTimeout(() => setIsWindowAnimating(false), 50)
    })
    void refreshConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshConversations])

  const handleClose = React.useCallback(() => {
    setIsWindowAnimating(true)
    setTimeout(() => {
      setIsOpen(false)
      setViewState("closed")
      setIsWindowAnimating(false)
      setSwipeDirection(null)
    }, 300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMinimize = React.useCallback(() => {
    setSwipeDirection("back")
    setIsAnimating(true)
    setTimeout(() => {
      setViewState("conversation-list")
      setTimeout(() => {
        setIsAnimating(false)
        setSwipeDirection(null)
      }, 300)
    }, 10)
  }, [])

  const handleNewConversation = React.useCallback(() => {
    const newConversation: ChatConversation = {
      id: `conv-${Date.now()}`,
      title: DEFAULT_TITLE,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "local-draft",
    }
    setConversations((prev) => sortConversations([newConversation, ...prev]))
    setCurrentConversationId(newConversation.id)
    setSwipeDirection("forward")
    setIsAnimating(true)
    setTimeout(() => {
      setViewState("chat")
      setTimeout(() => {
        setIsAnimating(false)
        setSwipeDirection(null)
      }, 300)
    }, 10)
  }, [])

  const handleSelectConversation = React.useCallback(
    async (conversationId: string) => {
      const selected = conversations.find((item) => item.id === conversationId)
      if (!selected) {
        return
      }

      if (selected.status !== "local-draft") {
        try {
          const history = await getConversationHistory(conversationId)
          setConversations((prev) =>
            sortConversations(
              prev.map((item) => (item.id === conversationId ? history : item)),
            ),
          )
        } catch (error) {
          console.error("chatbot.getConversationHistory failed", error)
        }
      }

      setCurrentConversationId(conversationId)
      setSwipeDirection("forward")
      setIsAnimating(true)
      setTimeout(() => {
        setViewState("chat")
        setTimeout(() => {
          setIsAnimating(false)
          setSwipeDirection(null)
        }, 300)
      }, 10)
    },
    [conversations],
  )

  const handleDeleteConversation = React.useCallback(
    async (conversationId: string) => {
      try {
        await deleteConversationRequest(conversationId)
      } catch (error) {
        console.error("chatbot.deleteConversation failed", error)
      }

      setConversations((prev) => prev.filter((item) => item.id !== conversationId))
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null)
        setSwipeDirection("back")
        setIsAnimating(true)
        setTimeout(() => {
          setViewState("conversation-list")
          setTimeout(() => {
            setIsAnimating(false)
            setSwipeDirection(null)
          }, 300)
        }, 10)
      }
    },
    [currentConversationId],
  )

  const handleSendMessage = React.useCallback(
    (message: string, _attachments?: ChatAttachment[]) => {
      if (!currentConversationId) {
        return
      }
      setConversations((prev) =>
        sortConversations(
          prev.map((conversation) => {
            if (conversation.id !== currentConversationId) {
              return conversation
            }
            return {
              ...conversation,
              title:
                conversation.title === DEFAULT_TITLE
                  ? normalizeTitleFromUserInput(message)
                  : conversation.title,
              updatedAt: new Date(),
            }
          }),
        ),
      )
    },
    [currentConversationId],
  )

  const handleMessagesChange = React.useCallback((conversationId: string, messages: UIMessage[]) => {
    const nextSignature = toMessageSignature(messages)
    setConversations((prev) => {
      let changed = false
      const next = prev.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation
        }

        const previousSignature = toMessageSignature(conversation.messages)
        const nextUpdatedAt = resolveLastMessageTimestamp(messages, conversation.updatedAt)
        if (
          previousSignature === nextSignature &&
          conversation.updatedAt.getTime() === nextUpdatedAt.getTime()
        ) {
          return conversation
        }

        changed = true
        return {
          ...conversation,
          messages,
          updatedAt: nextUpdatedAt,
        }
      })

      return changed ? sortConversations(next) : prev
    })
  }, [])

  const handleConversationSynced = React.useCallback(() => {
    void refreshConversations()
  }, [refreshConversations])

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  React.useEffect(() => {
    if (!isResizing) return
    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return
      const newWidth = window.innerWidth - e.clientX
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))
      setWidth(clampedWidth)
    }
    const handleMouseUp = () => setIsResizing(false)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, setWidth])

  if (shouldHideOnRoute) return null

  return (
    <>
      <button
        onClick={handleOpen}
        data-chatbot-ui="true"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300",
          "bg-[#1B3C53] text-white hover:bg-[#234C6A] active:scale-95",
          "flex items-center justify-center border border-[#234C6A]/40",
          isOpen && "scale-0 opacity-0 pointer-events-none",
          !isOpen && "scale-100 opacity-100",
        )}
        aria-label={t("runtime.components.chatbot.chatbot.aria_label_open_assistant")}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "20px", fontVariationSettings: '"FILL" 1, "wght" 400' }}
        >
          chat
        </span>
      </button>

      <div
        ref={sidebarRef}
        data-chatbot-ui="true"
        className={cn(
          "h-screen bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700",
          "overflow-hidden flex-shrink-0 flex flex-col relative shadow-xl",
          "transition-all duration-300 ease-out",
          isOpen
            ? isWindowAnimating
              ? "w-0 opacity-0 border-l-0"
              : "opacity-100"
            : "w-0 opacity-0 border-l-0",
          isResizing && "transition-none",
        )}
        style={{ width: isOpen && !isWindowAnimating ? `${width}px` : undefined }}
      >
        {isOpen && !isWindowAnimating && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize z-10 hover:bg-[#1B3C53]/20 transition-colors group"
            aria-label={t("runtime.components.chatbot.chatbot.aria_label_resize_sidebar")}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-slate-300 dark:bg-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        <div className="flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0 h-12">
          <div className="flex items-center gap-2">
            {viewState === "conversation-list" ? (
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3C53] dark:text-slate-200">
                {t("runtime.components.chatbot.chatbot.text_recent_conversations")}{" "}</span>
            ) : (
              <button
                onClick={handleMinimize}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={t("runtime.components.chatbot.chatbot.aria_label_back_to_conversations")}
              >
                <span
                  className="material-symbols-outlined text-slate-500"
                  style={{ fontSize: "16px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
                >
                  chevron_left
                </span>
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={t("runtime.components.chatbot.chatbot.aria_label_close_assistant")}
          >
            <span
              className="material-symbols-outlined text-slate-400"
              style={{ fontSize: "14px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
            >
              close
            </span>
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-out",
              viewState === "conversation-list"
                ? "translate-x-0"
                : swipeDirection === "back" && isAnimating
                  ? "-translate-x-full"
                  : "-translate-x-full",
            )}
          >
            <ConversationList
              conversations={conversations}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          </div>

          {currentConversation && (
            <div
              className={cn(
                "absolute inset-0 transition-transform duration-300 ease-out",
                viewState === "chat"
                  ? "translate-x-0"
                  : swipeDirection === "forward" && isAnimating
                    ? "translate-x-full"
                    : "translate-x-full",
              )}
            >
              <ChatView
                key={currentConversation.id}
                conversation={currentConversation}
                onSendMessage={handleSendMessage}
                onMessagesChange={(messages) => handleMessagesChange(currentConversation.id, messages)}
                onConversationSynced={handleConversationSynced}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
