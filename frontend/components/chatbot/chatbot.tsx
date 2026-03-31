"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import type { UIMessage } from "ai"
import { ChevronDown, History, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  const loadConversation = React.useCallback(async (conversationId: string) => {
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
  }, [setConversationsState, setCurrentConversationIdState])

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
          : mergedConversations[0]?.id ?? null

      if (nextConversationId) {
        setCurrentConversationIdState(nextConversationId)
        const selected = mergedConversations.find((item) => item.id === nextConversationId)
        if (selected && selected.status !== "local-draft" && selected.messages.length === 0) {
          try {
            const history = await getConversationHistory(nextConversationId)
            setConversationsState((previous) =>
              sortConversations(previous.map((item) => (item.id === nextConversationId ? history : item))),
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

  const handleMessagesChange = React.useCallback((conversationId: string, messages: UIMessage[]) => {
    setConversationsState((previous) => {
      let changed = false
      const next = previous.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation
        }

        const nextUpdatedAt = resolveLastMessageTimestamp(messages, conversation.updatedAt)
        if (conversation.messages === messages && conversation.updatedAt.getTime() === nextUpdatedAt.getTime()) {
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
  }, [setConversationsState])

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

        <div className="flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-4">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[9px] uppercase tracking-[0.22em] text-slate-400">
                  {t("runtime.components.chatbot.chatbot.text_recent_conversations")}
                </span>
                <span className="truncate text-[11px] font-semibold text-[#1B3C53]">
                  {currentConversation?.title ?? DEFAULT_TITLE}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-8 items-center gap-1.5 rounded-full border border-slate-200 px-2.5 text-[10px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-[#1B3C53]"
                    aria-label={t("runtime.components.chatbot.chatbot.aria_label_recent_chats")}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>{conversations.length}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[280px] rounded-xl border-slate-200 p-1.5 shadow-lg">
                  <div className="px-2 pb-1 pt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    {t("runtime.components.chatbot.chatbot.text_recent_conversations")}
                  </div>
                  <div className="space-y-0.5">
                    {conversations.map((conversation) => (
                      <DropdownMenuItem
                        key={conversation.id}
                        onSelect={() => {
                          void loadConversation(conversation.id)
                        }}
                        className={cn(
                          "rounded-lg px-2 py-2 data-[highlighted]:bg-slate-50",
                          currentConversationId === conversation.id && "bg-slate-50 text-[#1B3C53]",
                        )}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[10px] font-medium text-slate-700">
                            {conversation.title}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <button
            onClick={handleNewConversation}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-[#1B3C53]"
            aria-label={t("runtime.components.chatbot.conversation-list.text_new_conversation")}
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
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

        <div className="min-h-0 flex-1">
          {currentConversation ? (
            <ChatView
              key={currentConversation.id}
              conversation={currentConversation}
              onSendMessage={handleSendMessage}
              onMessagesChange={(messages) => handleMessagesChange(currentConversation.id, messages)}
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
