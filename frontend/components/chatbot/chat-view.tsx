"use client"

import * as React from "react"
import { Send, Paperclip, X, GraduationCap } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatConversation, ChatMessage, ChatAttachment } from "./types"
import { typography, spacing, iconSizes } from "@/lib/typography"

interface ChatViewProps {
  conversation: ChatConversation
  onSendMessage: (message: string, attachments?: ChatAttachment[]) => void
}

export function ChatView({ conversation, onSendMessage }: ChatViewProps) {
  const [message, setMessage] = React.useState("")
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([])
  const [isTyping, setIsTyping] = React.useState(false)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const scrollToBottom = React.useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]')
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [conversation.messages, scrollToBottom])

  const handleFileSelect = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments: ChatAttachment[] = files.map((file) => ({
      id: `att-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      file,
    }))
    setAttachments((prev) => [...prev, ...newAttachments])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleRemoveAttachment = React.useCallback((id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
  }, [])

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!message.trim() && attachments.length === 0) return

      onSendMessage(message, attachments.length > 0 ? attachments : undefined)
      setMessage("")
      setAttachments([])

      // Simulate typing indicator
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        // TODO: Add assistant response
      }, 1500)
    },
    [message, attachments, onSendMessage],
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
    },
    [handleSubmit],
  )

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className={`flex-1 ${spacing.padding.card}`}>
        <div className={spacing.subsection}>
          {conversation.messages.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground`}>
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                <GraduationCap className={`${iconSizes.lg} text-white`} />
              </div>
              <p className={`${typography.body} ${typography.medium}`}>Start a conversation</p>
              <p className={`${typography.bodySmall} mt-1`}>Ask me anything about the conference system</p>
            </div>
          ) : (
            conversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    `flex flex-col ${spacing.gap.tight} max-w-[80%]`,
                    msg.role === "user" && "items-end",
                  )}
                >
                  <div
                    className={cn(
                      `rounded-lg px-4 py-2 ${typography.body}`,
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className={`mt-2 ${spacing.tight}`}>
                        {msg.attachments.map((att) => (
                          <div
                            key={att.id}
                            className={`${typography.bodySmall} opacity-80 flex items-center ${spacing.gap.tight}`}
                          >
                            <Paperclip className={iconSizes.xs} />
                            {att.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className={`${typography.bodySmall} text-muted-foreground px-1`}>
                    {format(msg.timestamp, "HH:mm")}
                  </p>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className={`bg-muted rounded-lg px-4 py-2`}>
                <div className={`flex ${spacing.gap.tight}`}>
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Floating Input Area */}
      <div className={spacing.padding.card}>
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className={`mb-2 flex flex-wrap ${spacing.gap.sm}`}>
            {attachments.map((att) => (
              <div
                key={att.id}
                className={`flex items-center ${spacing.gap.sm} bg-background border rounded-md px-2 py-1 ${typography.bodySmall}`}
              >
                <Paperclip className={iconSizes.xs} />
                <span className="max-w-[150px] truncate">{att.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={() => handleRemoveAttachment(att.id)}
                  aria-label="Remove attachment"
                >
                  <X className={iconSizes.xs} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Floating Rounded Input Box */}
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-start gap-2 rounded-2xl border bg-background shadow-lg p-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              aria-label="Attach files"
            />
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
              rows={1}
            />
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 rounded-lg hover:bg-muted"
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg",
                  message.trim() || attachments.length > 0
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
                disabled={!message.trim() && attachments.length === 0}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

