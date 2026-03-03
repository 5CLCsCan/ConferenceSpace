"use client"

import * as React from "react"
import { ArrowLeft, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChatView } from "./chat-view"
import { ConversationList } from "./conversation-list"
import { useChatbot } from "./chatbot-provider"
import type { ChatConversation, ChatMessage } from "./types"

type ChatViewState = "closed" | "conversation-list" | "chat"

const MIN_WIDTH = 320
const MAX_WIDTH = 800
const CONVERSATIONS_STORAGE_KEY = "chatbot-conversations"

function loadConversationsFromStorage(): ChatConversation[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return parsed.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
    }))
  } catch {
    return []
  }
}

function saveConversationsToStorage(conversations: ChatConversation[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations))
  } catch {}
}

function loadConversationsFromChatStorage(): ChatConversation[] {
  if (typeof window === "undefined") return []
  const conversations: ChatConversation[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("ai-chat-")) {
        const conversationId = key.replace("ai-chat-", "")
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            const messages = JSON.parse(stored)
            if (Array.isArray(messages) && messages.length > 0) {
              const firstUserMessage = messages.find((m: any) => m.role === "user")
              let title = "New Conversation"
              if (firstUserMessage) {
                if (firstUserMessage.parts && Array.isArray(firstUserMessage.parts)) {
                  const textPart = firstUserMessage.parts.find((p: any) => p.type === "text")
                  if (textPart?.text) title = textPart.text.slice(0, 50)
                } else if (firstUserMessage.text) {
                  title = firstUserMessage.text.slice(0, 50)
                } else if (firstUserMessage.content) {
                  title = String(firstUserMessage.content).slice(0, 50)
                }
              }
              const createdAt = firstUserMessage?.createdAt
                ? new Date(firstUserMessage.createdAt)
                : messages[0]?.createdAt
                  ? new Date(messages[0].createdAt)
                  : new Date()
              const lastMessage = messages[messages.length - 1]
              const updatedAt = lastMessage?.createdAt
                ? new Date(lastMessage.createdAt)
                : new Date()
              conversations.push({ id: conversationId, title, messages: [], createdAt, updatedAt })
            }
          } catch {}
        }
      }
    }
  } catch {}
  return conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export function Chatbot() {
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

  const shouldHideOnRoute = pathname === "/login" || pathname === "/register"

  React.useEffect(() => {
    const fromChat = loadConversationsFromChatStorage()
    const stored = loadConversationsFromStorage()
    const merged = new Map<string, ChatConversation>()
    fromChat.forEach((conv) => merged.set(conv.id, conv))
    stored.forEach((conv) => {
      const existing = merged.get(conv.id)
      if (!existing) {
        if (typeof window !== "undefined") {
          try {
            const messages = localStorage.getItem(`ai-chat-${conv.id}`)
            if (messages) {
              const parsed = JSON.parse(messages)
              if (Array.isArray(parsed) && parsed.length > 0) merged.set(conv.id, conv)
            }
          } catch {}
        }
      } else {
        merged.set(conv.id, {
          ...existing,
          title: conv.title !== "New Conversation" ? conv.title : existing.title,
        })
      }
    })
    const unique = Array.from(merged.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    )
    setConversations(unique)
  }, [])

  React.useEffect(() => {
    if (conversations.length > 0 && typeof window !== "undefined") {
      const conversationsWithMessages = conversations.filter((conv) => {
        try {
          const messages = localStorage.getItem(`ai-chat-${conv.id}`)
          if (messages) {
            const parsed = JSON.parse(messages)
            return Array.isArray(parsed) && parsed.length > 0
          }
        } catch {}
        return false
      })
      if (conversationsWithMessages.length > 0) {
        const metadata = conversationsWithMessages.map((conv) => ({
          id: conv.id,
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          messages: [],
        }))
        saveConversationsToStorage(metadata)
      }
    }
  }, [conversations])

  const currentConversation = React.useMemo(
    () => conversations.find((c) => c.id === currentConversationId) || null,
    [conversations, currentConversationId],
  )

  const handleOpen = React.useCallback(() => {
    setIsOpen(true)
    setViewState("conversation-list")
    setIsWindowAnimating(true)
    requestAnimationFrame(() => {
      setTimeout(() => setIsWindowAnimating(false), 50)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setConversations((prev) => [newConversation, ...prev])
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

  const handleSelectConversation = React.useCallback((conversationId: string) => {
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
  }, [])

  const handleDeleteConversation = React.useCallback(
    (conversationId: string) => {
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
      if (typeof window !== "undefined") {
        localStorage.removeItem(`ai-chat-${conversationId}`)
        const stored = loadConversationsFromStorage()
        const updated = stored.filter((conv) => conv.id !== conversationId)
        saveConversationsToStorage(updated)
      }
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
    (message: string, attachments?: ChatMessage["attachments"]) => {
      if (!currentConversationId) return
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === currentConversationId)
        if (!existing) {
          return [
            {
              id: currentConversationId,
              title: message.slice(0, 50) || "New Conversation",
              messages: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            ...prev,
          ]
        }
        return prev.map((conv) =>
          conv.id === currentConversationId
            ? {
                ...conv,
                updatedAt: new Date(),
                title: conv.title === "New Conversation" ? message.slice(0, 50) : conv.title,
              }
            : conv,
        )
      })
    },
    [currentConversationId],
  )

  React.useEffect(() => {
    const interval = setInterval(() => {
      const fromChat = loadConversationsFromChatStorage()
      setConversations((prev) => {
        const merged = new Map<string, ChatConversation>()
        prev.forEach((conv) => merged.set(conv.id, conv))
        fromChat.forEach((conv) => {
          const existing = merged.get(conv.id)
          if (existing) {
            merged.set(conv.id, { ...existing, updatedAt: conv.updatedAt })
          } else {
            merged.set(conv.id, conv)
          }
        })
        const toRemove: string[] = []
        merged.forEach((conv, id) => {
          if (id === currentConversationId) return
          if (typeof window !== "undefined") {
            try {
              const messages = localStorage.getItem(`ai-chat-${id}`)
              if (!messages) {
                toRemove.push(id)
              } else {
                const parsed = JSON.parse(messages)
                if (!Array.isArray(parsed) || parsed.length === 0) toRemove.push(id)
              }
            } catch {
              toRemove.push(id)
            }
          }
        })
        toRemove.forEach((id) => merged.delete(id))
        return Array.from(merged.values()).sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
        )
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [currentConversationId])

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
      {/* FAB trigger */}
      <button
        onClick={handleOpen}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300",
          "bg-[#1B3C53] text-white hover:bg-[#234C6A] active:scale-95",
          "flex items-center justify-center border border-[#234C6A]/40",
          isOpen && "scale-0 opacity-0 pointer-events-none",
          !isOpen && "scale-100 opacity-100",
        )}
        aria-label="Open assistant"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "20px", fontVariationSettings: '"FILL" 1, "wght" 400' }}
        >
          chat
        </span>
      </button>

      {/* Chat panel */}
      <div
        ref={sidebarRef}
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
        {/* Resize handle */}
        {isOpen && !isWindowAnimating && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize z-10 hover:bg-[#1B3C53]/20 transition-colors group"
            aria-label="Resize sidebar"
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-slate-300 dark:bg-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0 h-12">
          <div className="flex items-center gap-2">
            {viewState === "conversation-list" ? (
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3C53] dark:text-slate-200">
                Recent Conversations
              </span>
            ) : (
              <button
                onClick={handleMinimize}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Back to conversations"
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
            aria-label="Close assistant"
          >
            <span
              className="material-symbols-outlined text-slate-400"
              style={{ fontSize: "14px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
            >
              close
            </span>
          </button>
        </div>

        {/* Content with swipe animation */}
        <div className="relative flex-1 overflow-hidden">
          {/* Conversation List */}
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

          {/* Chat View */}
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
              <ChatView conversation={currentConversation} onSendMessage={handleSendMessage} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
