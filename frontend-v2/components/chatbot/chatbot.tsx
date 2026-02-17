"use client"

import * as React from "react"
import { MessageCircle, X, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChatView } from "./chat-view"
import { ConversationList } from "./conversation-list"
import { useChatbot } from "./chatbot-provider"
import type { ChatConversation, ChatMessage } from "./types"
import { typography } from "@/lib/typography"

type ChatViewState = "closed" | "conversation-list" | "chat"

const MIN_WIDTH = 320 // 20rem
const MAX_WIDTH = 800 // 50rem

const CONVERSATIONS_STORAGE_KEY = "chatbot-conversations"

// Load conversations from localStorage
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

// Save conversations to localStorage
function saveConversationsToStorage(conversations: ChatConversation[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations))
  } catch {
    // Ignore storage errors
  }
}

// Load conversations from useChat's localStorage (ai-chat-* keys)
function loadConversationsFromChatStorage(): ChatConversation[] {
  if (typeof window === "undefined") return []

  const conversations: ChatConversation[] = []

  try {
    // Scan localStorage for ai-chat-* keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("ai-chat-")) {
        const conversationId = key.replace("ai-chat-", "")
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            const messages = JSON.parse(stored)
            if (Array.isArray(messages) && messages.length > 0) {
              // Get first user message for title
              const firstUserMessage = messages.find((m: any) => m.role === "user")
              let title = "New Conversation"

              if (firstUserMessage) {
                // Try to extract text from parts array (UIMessage format)
                if (firstUserMessage.parts && Array.isArray(firstUserMessage.parts)) {
                  const textPart = firstUserMessage.parts.find((p: any) => p.type === "text")
                  if (textPart?.text) {
                    title = textPart.text.slice(0, 50)
                  }
                }
                // Fallback: try direct text property
                else if (firstUserMessage.text) {
                  title = firstUserMessage.text.slice(0, 50)
                }
                // Fallback: try content property
                else if (firstUserMessage.content) {
                  title = String(firstUserMessage.content).slice(0, 50)
                }
              }

              // Get timestamps
              const createdAt = firstUserMessage?.createdAt
                ? new Date(firstUserMessage.createdAt)
                : messages[0]?.createdAt
                  ? new Date(messages[0].createdAt)
                  : new Date()
              const lastMessage = messages[messages.length - 1]
              const updatedAt = lastMessage?.createdAt
                ? new Date(lastMessage.createdAt)
                : new Date()

              conversations.push({
                id: conversationId,
                title,
                messages: [], // Messages are stored separately by useChat
                createdAt,
                updatedAt,
              })
            }
          } catch {
            // Skip invalid entries
          }
        }
      }
    }
  } catch {
    // Ignore errors
  }

  // Sort by updatedAt descending
  return conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export function Chatbot() {
  const { isOpen, setIsOpen, width, setWidth } = useChatbot()
  const [isResizing, setIsResizing] = React.useState(false)
  const sidebarRef = React.useRef<HTMLDivElement>(null)
  const [viewState, setViewState] = React.useState<ChatViewState>("closed")
  const [conversations, setConversations] = React.useState<ChatConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(null)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [isWindowAnimating, setIsWindowAnimating] = React.useState(false)
  const [swipeDirection, setSwipeDirection] = React.useState<"forward" | "back" | null>(null)

  // Load conversations on mount
  React.useEffect(() => {
    const fromChat = loadConversationsFromChatStorage()
    const stored = loadConversationsFromStorage()

    // Merge and deduplicate, prioritizing conversations with actual messages
    const merged = new Map<string, ChatConversation>()

    // First, add all conversations from chat storage (these have messages)
    fromChat.forEach((conv) => {
      merged.set(conv.id, conv)
    })

    // Then, add stored conversations only if they don't exist or if they have better metadata
    stored.forEach((conv) => {
      const existing = merged.get(conv.id)
      if (!existing) {
        // Only add if there are messages in localStorage
        if (typeof window !== "undefined") {
          try {
            const messages = localStorage.getItem(`ai-chat-${conv.id}`)
            if (messages) {
              const parsed = JSON.parse(messages)
              if (Array.isArray(parsed) && parsed.length > 0) {
                merged.set(conv.id, conv)
              }
            }
          } catch {
            // Skip invalid entries
          }
        }
      } else {
        // Update with stored metadata (title, etc.) but keep the structure from chat storage
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

  // Save conversations to storage whenever they change
  // Only save metadata, not messages (messages are handled by useChat)
  React.useEffect(() => {
    if (conversations.length > 0 && typeof window !== "undefined") {
      // Only save conversations that have actual messages in localStorage
      const conversationsWithMessages = conversations.filter((conv) => {
        try {
          const messages = localStorage.getItem(`ai-chat-${conv.id}`)
          if (messages) {
            const parsed = JSON.parse(messages)
            return Array.isArray(parsed) && parsed.length > 0
          }
        } catch {
          // Skip invalid entries
        }
        return false
      })

      if (conversationsWithMessages.length > 0) {
        // Save only metadata (without messages array)
        const metadata = conversationsWithMessages.map((conv) => ({
          id: conv.id,
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          messages: [], // Always empty - messages are stored separately by useChat
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
    // Trigger animation after a brief delay to allow DOM update
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
    // Small delay to ensure initial position is set
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
    // Small delay to ensure initial position is set
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
    // Small delay to ensure initial position is set
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
      // Remove from conversations state
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))

      // Remove from localStorage
      if (typeof window !== "undefined") {
        // Remove messages from localStorage
        localStorage.removeItem(`ai-chat-${conversationId}`)

        // Update conversations storage
        const stored = loadConversationsFromStorage()
        const updated = stored.filter((conv) => conv.id !== conversationId)
        saveConversationsToStorage(updated)
      }

      // If deleted conversation was current, go back to list
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

      // Update conversation title if it's a new conversation
      // The title will be updated by the periodic sync based on actual messages
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === currentConversationId)

        // If conversation doesn't exist, create it
        if (!existing) {
          return [
            {
              id: currentConversationId,
              title: message.slice(0, 50) || "New Conversation",
              messages: [], // Messages are stored separately by useChat
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            ...prev,
          ]
        }

        // Update existing conversation
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

  // Sync conversations with stored messages periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      const fromChat = loadConversationsFromChatStorage()
      setConversations((prev) => {
        // Merge with existing, keeping titles from stored conversations
        const merged = new Map<string, ChatConversation>()

        // First, add all existing conversations
        prev.forEach((conv) => {
          merged.set(conv.id, conv)
        })

        // Update with latest from chat storage (these have actual messages)
        fromChat.forEach((conv) => {
          const existing = merged.get(conv.id)
          if (existing) {
            // Update timestamp but keep title
            merged.set(conv.id, {
              ...existing,
              updatedAt: conv.updatedAt,
            })
          } else {
            // New conversation with messages
            merged.set(conv.id, conv)
          }
        })

        const toRemove: string[] = []
        merged.forEach((conv, id) => {
          if (id === currentConversationId) {
            return
          }
          if (typeof window !== "undefined") {
            try {
              const messages = localStorage.getItem(`ai-chat-${id}`)
              if (!messages) {
                toRemove.push(id)
              } else {
                const parsed = JSON.parse(messages)
                if (!Array.isArray(parsed) || parsed.length === 0) {
                  toRemove.push(id)
                }
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
    }, 2000) // Check every 2 seconds for more responsive updates

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

    const handleMouseUp = () => {
      setIsResizing(false)
    }

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

  return (
    <>
      {/* Floating Icon Button */}
      <Button
        onClick={handleOpen}
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          isOpen && "scale-0 opacity-0 pointer-events-none",
          !isOpen && "scale-100 opacity-100",
        )}
        aria-label="Open chatbot"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "h-screen bg-card shadow-lg overflow-hidden flex-shrink-0 flex flex-col relative",
          "transition-all duration-300 ease-out",
          isOpen
            ? isWindowAnimating
              ? "w-0 opacity-0 border-l-0"
              : "opacity-100 border-l"
            : "w-0 opacity-0 border-l-0",
          isResizing && "transition-none",
        )}
        style={{
          width: isOpen && !isWindowAnimating ? `${width}px` : undefined,
        }}
      >
        {/* Resize Handle */}
        {isOpen && !isWindowAnimating && (
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize z-10",
              "hover:bg-primary/20 transition-colors",
              "group",
            )}
            aria-label="Resize sidebar"
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-5 border-b bg-muted/50 flex-shrink-0 h-[7vh] shadow-sm">
          {viewState === "conversation-list" ? (
            <h2 className={`${typography.h4} ${typography.semibold}`}>Conversations</h2>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMinimize}
              className="h-8 w-8"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
            aria-label="Close chatbot"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content with swipe animation */}
        <div className="relative flex-1 overflow-hidden">
          {/* Conversation List View */}
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
