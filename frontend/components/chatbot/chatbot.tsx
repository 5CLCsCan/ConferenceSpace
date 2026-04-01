"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import type { UIMessage } from "ai"
import { History, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { getConversationHistory, listConversations } from "@/lib/chatbot/conversations"
import { useTranslation } from "@/lib/i18n/translation-context"

import { useChatbot } from "./chatbot-provider"
import { ChatView } from "./chat-view"
import type { ChatAttachment, ChatConversation } from "./types"

const MIN_WIDTH = 320
const MAX_WIDTH = 800
const DEFAULT_TITLE = "New Conversation"

function sortConversations(conversations: ChatConversation[]): ChatConversation[] {
  return [...conversations].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function normalizeTitleFromUserInput(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim()
  if (!normalized) {
    return DEFAULT_TITLE
  }
  return normalized.slice(0, 80)
}

function resolveLastMessageTimestamp(messages: UIMessage[], fallback?: Date): Date {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as UIMessage & { createdAt?: string | Date }
    if (!message.createdAt) {
      continue
    }
    const parsed = new Date(message.createdAt)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
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
        existing && existing.messages.length > 0 ? existing.messages : remoteConversation.messages,
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

function createDraftConversation(): ChatConversation {
  return {
    id: `conv-${Date.now()}`,
    title: DEFAULT_TITLE,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "local-draft",
  }
}

export function Chatbot() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { isOpen, setIsOpen, width, setWidth } = useChatbot()
  const sidebarRef = React.useRef<HTMLDivElement>(null)
  const conversationsRef = React.useRef<ChatConversation[]>([])
  const currentConversationIdRef = React.useRef<string | null>(null)
  const [isResizing, setIsResizing] = React.useState(false)
  const [conversations, setConversations] = React.useState<ChatConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(null)
  const [isWindowAnimating, setIsWindowAnimating] = React.useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)

  const shouldHideOnRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/"

  const currentConversation = React.useMemo(
    () => conversations.find((item) => item.id === currentConversationId) || null,
    [conversations, currentConversationId],
  )

  const setConversationsState = React.useCallback(
    (updater: (previous: ChatConversation[]) => ChatConversation[]) => {
      setConversations((previous) => {
        const next = updater(previous)
        conversationsRef.current = next
        return next
      })
    },
    [],
  )

  const setCurrentConversationIdState = React.useCallback((nextConversationId: string | null) => {
    currentConversationIdRef.current = nextConversationId
    setCurrentConversationId(nextConversationId)
  }, [])

  const ensureDraftConversation = React.useCallback(() => {
    const draft = createDraftConversation()
    setConversationsState((previous) => sortConversations([draft, ...previous]))
    setCurrentConversationIdState(draft.id)
    return draft
  }, [setConversationsState, setCurrentConversationIdState])

  const loadConversation = React.useCallback(
    async (conversationId: string) => {
      const selected = conversationsRef.current.find((item) => item.id === conversationId)
      if (!selected) {
        return
      }

      setCurrentConversationIdState(conversationId)

      if (selected.status === "local-draft" || selected.messages.length > 0) {
        return
      }

      try {
        const history = await getConversationHistory(conversationId)
        setConversationsState((previous) =>
          sortConversations(previous.map((item) => (item.id === conversationId ? history : item))),
        )
      } catch (error) {
        console.error("chatbot.getConversationHistory failed", error)
      }
    },
    [setConversationsState, setCurrentConversationIdState],
  )

  const refreshConversations = React.useCallback(async () => {
    try {
      const { conversations: remoteConversations } = await listConversations({ limit: 50 })
      const mergedConversations = mergeConversationLists(
        conversationsRef.current,
        remoteConversations,
        currentConversationIdRef.current,
      )
      conversationsRef.current = mergedConversations
      setConversations(mergedConversations)

      const nextConversationId =
        currentConversationIdRef.current &&
        mergedConversations.some((item) => item.id === currentConversationIdRef.current)
          ? currentConversationIdRef.current
          : (mergedConversations[0]?.id ?? null)

      if (nextConversationId) {
        setCurrentConversationIdState(nextConversationId)
        const selected = mergedConversations.find((item) => item.id === nextConversationId)
        if (selected && selected.status !== "local-draft" && selected.messages.length === 0) {
          try {
            const history = await getConversationHistory(nextConversationId)
            setConversationsState((previous) =>
              sortConversations(
                previous.map((item) => (item.id === nextConversationId ? history : item)),
              ),
            )
          } catch (error) {
            console.error("chatbot.getConversationHistory failed", error)
          }
        }
        return
      }

      ensureDraftConversation()
    } catch (error) {
      console.error("chatbot.refreshConversations failed", error)
      if (!currentConversationIdRef.current && conversationsRef.current.length === 0) {
        ensureDraftConversation()
      }
    }
  }, [ensureDraftConversation, setConversationsState, setCurrentConversationIdState])

  React.useEffect(() => {
    if (!isOpen) {
      return
    }
    void refreshConversations()
  }, [isOpen, refreshConversations])

  const handleOpen = React.useCallback(() => {
    setIsOpen(true)
    setIsWindowAnimating(true)
    requestAnimationFrame(() => {
      setTimeout(() => setIsWindowAnimating(false), 50)
    })
  }, [setIsOpen])

  const handleClose = React.useCallback(() => {
    setIsWindowAnimating(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsWindowAnimating(false)
    }, 250)
  }, [setIsOpen])

  const handleNewConversation = React.useCallback(() => {
    ensureDraftConversation()
  }, [ensureDraftConversation])

  const handleSendMessage = React.useCallback(
    (message: string, _attachments?: ChatAttachment[]) => {
      if (!currentConversationId) {
        return
      }

      setConversationsState((previous) =>
        sortConversations(
          previous.map((conversation) => {
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
    [currentConversationId, setConversationsState],
  )

  const handleMessagesChange = React.useCallback(
    (conversationId: string, messages: UIMessage[]) => {
      setConversationsState((previous) => {
        let changed = false
        const next = previous.map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation
          }

          const nextUpdatedAt = resolveLastMessageTimestamp(messages, conversation.updatedAt)
          if (
            conversation.messages === messages &&
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

        return changed ? sortConversations(next) : previous
      })
    },
    [setConversationsState],
  )

  const handleConversationSynced = React.useCallback(() => {
    void refreshConversations()
  }, [refreshConversations])

  const handleMouseDown = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setIsResizing(true)
  }, [])

  React.useEffect(() => {
    if (!isResizing) {
      return
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!sidebarRef.current) {
        return
      }

      const nextWidth = window.innerWidth - event.clientX
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, nextWidth))
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

  if (shouldHideOnRoute) {
    return null
  }

  return (
    <>
      <button
        onClick={handleOpen}
        data-chatbot-ui="true"
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[#234C6A]/40 bg-[#1B3C53] text-white shadow-lg transition-all duration-300 hover:bg-[#234C6A] active:scale-95",
          isOpen ? "pointer-events-none scale-0 opacity-0" : "scale-100 opacity-100",
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
          "relative flex h-screen flex-shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white shadow-xl transition-all duration-300 ease-out",
          isOpen
            ? isWindowAnimating
              ? "w-0 border-l-0 opacity-0"
              : "opacity-100"
            : "w-0 border-l-0 opacity-0",
          isResizing && "transition-none",
        )}
        style={{ width: isOpen && !isWindowAnimating ? `${width}px` : undefined }}
      >
        {isOpen && !isWindowAnimating && (
          <div
            onMouseDown={handleMouseDown}
            className="group absolute left-0 top-0 bottom-0 z-10 w-1 cursor-ew-resize transition-colors hover:bg-[#1B3C53]/20"
            aria-label={t("runtime.components.chatbot.chatbot.aria_label_resize_sidebar")}
          >
            <div className="absolute left-1/2 top-1/2 h-12 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}

        <div
          className="chatbot-header relative flex h-14 items-center gap-1.5 border-b border-slate-200 px-3"
          style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" }}
        >
          <div className="relative flex min-w-0 flex-1 items-center gap-2.5">
            {/* AI identity mark */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1B3C53]/[0.07]">
              <span
                className="material-symbols-outlined text-[#1B3C53]"
                style={{ fontSize: "15px", fontVariationSettings: '"FILL" 1, "wght" 300' }}
              >
                neurology
              </span>
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[11px] font-bold leading-tight tracking-tight text-slate-800">
                {currentConversation?.title ?? DEFAULT_TITLE}
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Conference Agent
              </span>
            </div>
          </div>

          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-all",
                isHistoryOpen
                  ? "bg-slate-100 text-slate-700"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
              )}
              aria-label={t("runtime.components.chatbot.chatbot.aria_label_recent_chats")}
            >
              <History className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleNewConversation}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              aria-label={t("runtime.components.chatbot.conversation-list.text_new_conversation")}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              aria-label={t("runtime.components.chatbot.chatbot.aria_label_close_assistant")}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "14px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
              >
                close
              </span>
            </button>
          </div>
        </div>

        {/* Dismiss backdrop – only blocks pointer events, no visual effect */}
        {isHistoryOpen && (
          <div
            className="absolute inset-x-0 bottom-0 z-10"
            style={{ top: "56px" }}
            onClick={() => setIsHistoryOpen(false)}
          />
        )}

        {/* History panel – always in DOM so max-height transition is smooth */}
        <div
          className="absolute left-0 right-0 z-20"
          style={{
            top: "56px",
            maxHeight: isHistoryOpen ? "400px" : "0px",
            transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: isHistoryOpen ? "auto" : "none",
            overflow: "hidden",
            borderRadius: "0 0 16px 16px",
            background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 40%)",
            boxShadow: isHistoryOpen ? "0 8px 24px rgba(0,0,0,0.08), 0 1px 0 #e2e8f0" : "none",
          }}
        >
          <div className="mx-3 border-t border-slate-100" />

          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {t("runtime.components.chatbot.chatbot.text_recent_conversations")}
            </span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold tabular-nums text-slate-500">
              {conversations.length}
            </span>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "320px" }}>
            {conversations.length === 0 ? (
              <div className="px-4 pb-4 text-[10px] text-slate-400">No conversations yet.</div>
            ) : (
              <div className="space-y-px px-2 pb-4">
                {conversations.map((conversation) => {
                  const isActive = currentConversationId === conversation.id
                  const lastMessage = conversation.messages[conversation.messages.length - 1]
                  const preview = lastMessage
                    ? (() => {
                        const textPart = lastMessage.parts?.find((p) => p.type === "text")
                        return textPart && "text" in textPart
                          ? (textPart.text as string).slice(0, 80)
                          : ""
                      })()
                    : null
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => {
                        void loadConversation(conversation.id)
                        setIsHistoryOpen(false)
                      }}
                      className={cn(
                        "group w-full rounded-lg px-3 py-2 text-left transition-all duration-150",
                        isActive ? "bg-[#1B3C53]/[0.07]" : "hover:bg-slate-50",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-[11px] font-semibold leading-tight transition-colors",
                            isActive
                              ? "text-[#1B3C53]"
                              : "text-slate-700 group-hover:text-slate-900",
                          )}
                        >
                          {conversation.title}
                        </span>
                        <span className="shrink-0 text-[9px] tabular-nums text-slate-400">
                          {formatRelativeTime(conversation.updatedAt)}
                        </span>
                      </div>
                      {preview ? (
                        <p className="mt-0.5 truncate text-[10px] leading-relaxed text-slate-400">
                          {preview}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[10px] italic text-slate-300">No messages yet</p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          {currentConversation ? (
            <ChatView
              key={currentConversation.id}
              conversation={currentConversation}
              onSendMessage={handleSendMessage}
              onMessagesChange={(messages) =>
                handleMessagesChange(currentConversation.id, messages)
              }
              onConversationSynced={handleConversationSynced}
            />
          ) : (
            <div className="flex h-full items-center px-4">
              <p className="text-[10px] text-slate-400">Loading conversation...</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
