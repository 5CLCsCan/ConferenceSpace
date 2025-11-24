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
  }, [])

  const handleClose = React.useCallback(() => {
    setIsWindowAnimating(true)
    setTimeout(() => {
      setIsOpen(false)
      setViewState("closed")
      setIsWindowAnimating(false)
      setSwipeDirection(null)
    }, 300)
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

  const handleSendMessage = React.useCallback(
    (message: string, attachments?: ChatMessage["attachments"]) => {
      if (!currentConversationId) return

      // Update conversation title if it's a new conversation
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? {
                ...conv,
                updatedAt: new Date(),
                title:
                  conv.title === "New Conversation" && conv.messages.length === 0
                    ? message.slice(0, 50)
                    : conv.title,
              }
            : conv,
        ),
      )
    },
    [currentConversationId],
  )

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
