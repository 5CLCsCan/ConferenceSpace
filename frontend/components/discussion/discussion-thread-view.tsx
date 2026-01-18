"use client"

import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Send } from "lucide-react"
import { getThread, getMessages, createMessage, type DiscussionMessage } from "@/lib/api/discussions"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface DiscussionThreadViewProps {
  threadId: number
  userRole: "reviewer" | "author" | "chair"
  onBack: () => void
}

export function DiscussionThreadView({ threadId, userRole, onBack }: DiscussionThreadViewProps) {
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: thread, error: threadError } = useSWR(
    [`thread-${threadId}`, threadId],
    () => getThread(threadId),
  )

  const { data: messagesData, error: messagesError, mutate: mutateMessages } = useSWR(
    [`messages-${threadId}`, threadId],
    () => getMessages(threadId),
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messagesData?.messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    // Chair can only view, not participate
    if (userRole === "chair") {
      toast({
        title: "View Only",
        description: "Chairs can view discussions but cannot participate",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      await createMessage(threadId, { content: newMessage.trim() })
      setNewMessage("")
      mutateMessages()
      toast({
        title: "Message Sent",
        description: "Your message has been added to the discussion",
      })
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (threadError || messagesError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to threads
        </Button>
        <div className="text-center py-8 text-muted-foreground">
          Failed to load discussion
        </div>
      </div>
    )
  }

  if (!thread || !messagesData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const messages = messagesData.messages || []
  const canSendMessage = userRole !== "chair"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h3 className="font-semibold">{thread.title}</h3>
          <p className="text-sm text-muted-foreground">
            Started {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isReviewer={message.author_email === thread.reviewer_email}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {canSendMessage && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                rows={2}
                className="resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !newMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!canSendMessage && (
            <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
              You are viewing this discussion as a chair (read-only)
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface MessageBubbleProps {
  message: DiscussionMessage
  isReviewer: boolean
}

function MessageBubble({ message, isReviewer }: MessageBubbleProps) {
  const authorName = message.author_first_name && message.author_last_name
    ? `${message.author_first_name} ${message.author_last_name}`
    : message.author_email || "User"

  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={cn("flex gap-3", isReviewer ? "flex-row" : "flex-row-reverse")}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className={isReviewer ? "bg-primary/10" : "bg-muted"}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex-1 max-w-[80%]", isReviewer ? "" : "text-right")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{authorName}</span>
          <span className="text-xs text-muted-foreground">
            {isReviewer ? "Reviewer" : "Author"}
          </span>
        </div>
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isReviewer ? "bg-primary/10" : "bg-muted",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
