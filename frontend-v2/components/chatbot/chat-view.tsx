"use client"

import * as React from "react"
import { Send, Paperclip, X, GraduationCap, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChat } from "@ai-sdk/react"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai"
import { Streamdown } from "streamdown"
import type { ChatConversation, ChatAttachment } from "./types"
import { typography, spacing, iconSizes } from "@/lib/typography"
import { capturePageContext } from "@/lib/chatbot/page-context"
import { executeAction, type ActionType, type ActionParams } from "@/lib/chatbot/action-executor"

interface ChatViewProps {
  conversation: ChatConversation
  onSendMessage?: (message: string, attachments?: ChatAttachment[]) => void
}

// Load messages from localStorage for a given conversation id
function loadMessagesFromStorage(conversationId: string): UIMessage[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(`ai-chat-${conversationId}`)
    if (!stored) return []

    const messages = JSON.parse(stored)
    return Array.isArray(messages) ? messages : []
  } catch {
    return []
  }
}

// Convert tool name to display alias
function getToolDisplayName(toolName: string): string {
  const aliases: Record<string, string> = {
    getPageContext: "Get Page Context",
    performAction: "Perform Action",
  }
  return aliases[toolName] || toolName
}

export function ChatView({ conversation, onSendMessage }: ChatViewProps) {
  const [input, setInput] = React.useState("")
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([])
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const refMapRef = React.useRef<Map<string, Element>>(new Map())

  // Load initial messages from localStorage
  const initialMessages = React.useMemo(
    () => loadMessagesFromStorage(conversation.id),
    [conversation.id],
  )

  const { messages, sendMessage, status, addToolOutput } = useChat({
    id: conversation.id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === "getPageContext") {
        try {
          const { tree, refMap } = capturePageContext()
          refMapRef.current = refMap

          addToolOutput({
            tool: "getPageContext",
            toolCallId: toolCall.toolCallId,
            output: tree,
          })
        } catch (error) {
          addToolOutput({
            tool: "getPageContext",
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText: error instanceof Error ? error.message : "Failed to capture page context",
          })
        }
      }
      if (toolCall.toolName === "performAction") {
        try {
          const result = await executeAction(
            (toolCall.input as any).action as ActionType,
            refMapRef.current,
            toolCall.input as ActionParams,
          )

          addToolOutput({
            tool: "performAction",
            toolCallId: toolCall.toolCallId,
            output: result,
          })
        } catch (error) {
          addToolOutput({
            tool: "performAction",
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText: error instanceof Error ? error.message : "Failed to execute action",
          })
        }
      }
    },
  })

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
  }, [messages, scrollToBottom])

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
      if (!input.trim() && attachments.length === 0) return

      sendMessage({ text: input })
      setInput("")
      setAttachments([])

      // Call legacy onSendMessage if provided (for backwards compatibility)
      if (onSendMessage) {
        onSendMessage(input, attachments.length > 0 ? attachments : undefined)
      }
    },
    [input, attachments, sendMessage, onSendMessage],
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className={`flex-1 overflow-hidden ${spacing.padding.card}`}>
        <div className={spacing.subsection}>
          {messages.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground`}
            >
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                <GraduationCap className={`${iconSizes.lg} text-white`} />
              </div>
              <p className={`${typography.body} ${typography.medium}`}>Start a conversation</p>
              <p className={`${typography.bodySmall} mt-1`}>
                Ask me anything about the conference system
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    `flex flex-col ${spacing.gap.sm} max-w-[80%]`,
                    msg.role === "user" && "items-end",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2",
                      typography.bodySmall,
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {msg.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <div key={`${msg.id}-${i}`} className="chatbot-markdown">
                              <Streamdown
                                isAnimating={
                                  status === "streaming" &&
                                  msg.role === "assistant" &&
                                  msg.id === messages[messages.length - 1]?.id &&
                                  i === msg.parts.length - 1
                                }
                              >
                                {part.text}
                              </Streamdown>
                            </div>
                          )
                        case "reasoning":
                          // Note: Some reasoning content may show "[REDACTED]" - this comes from the Grok model
                          // via OpenRouter and cannot be controlled on our end. This is provider-side behavior.
                          return (
                            <details
                              key={`${msg.id}-${i}`}
                              className="mt-2 text-xs opacity-70 border-t pt-2 border-border/50"
                              open={true}
                            >
                              <summary className="cursor-pointer hover:opacity-100 font-medium text-xs">
                                Show reasoning
                              </summary>
                              <div className="mt-2 whitespace-pre-wrap font-mono bg-muted/50 p-2 rounded chatbot-markdown">
                                <Streamdown
                                  isAnimating={
                                    status === "streaming" &&
                                    msg.role === "assistant" &&
                                    msg.id === messages[messages.length - 1]?.id &&
                                    i === msg.parts.length - 1
                                  }
                                >
                                  {part.text}
                                </Streamdown>
                              </div>
                            </details>
                          )
                        // Step indicator - hidden per user request
                        case "step-start":
                          return null
                        // Tool calls with specific tool names
                        case "tool-getPageContext":
                        case "tool-performAction": {
                          const toolPart = part as any
                          const hasError =
                            toolPart.state === "output-error" ||
                            (toolPart.result &&
                              typeof toolPart.result === "object" &&
                              toolPart.result.success === false)
                          const isSuccess =
                            toolPart.result &&
                            typeof toolPart.result === "object" &&
                            toolPart.result.success === true

                          return (
                            <details
                              key={`${msg.id}-${i}`}
                              className="mt-2 text-xs opacity-70 border-t pt-2 border-border/50"
                              open={false}
                            >
                              <summary className="cursor-pointer hover:opacity-100 font-medium text-xs text-primary">
                                Tool call: {getToolDisplayName(part.type.replace("tool-", ""))}
                              </summary>
                              <div
                                className={cn(
                                  "mt-2 font-mono p-3 rounded border break-words",
                                  "chatbot-markdown",
                                  hasError
                                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50"
                                    : "bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40",
                                )}
                              >
                                <div className="mb-2">
                                  <strong className="text-xs">Tool:</strong>
                                  <div className="mt-1 text-xs break-words">
                                    {part.type.replace("tool-", "")}
                                  </div>
                                </div>
                                <div className="mb-2">
                                  <strong className="text-xs">Input:</strong>
                                  <pre className="mt-1 text-xs whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                    {JSON.stringify(toolPart.args || toolPart.input || {}, null, 2)}
                                  </pre>
                                </div>
                                {toolPart.result && (
                                  <div>
                                    <strong className="text-xs">Output:</strong>
                                    <pre className="mt-1 text-xs max-h-40 overflow-auto whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                      {JSON.stringify(toolPart.result, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </details>
                          )
                        }
                        // Tool invocation UI - handle dynamic tools (legacy format)
                        case "dynamic-tool": {
                          const toolPart = part
                          const toolName = toolPart.toolName
                          const toolInput = toolPart.input as any
                          const toolOutput = toolPart.output
                          const toolError = toolPart.errorText

                          // Show loading state while tool is being called
                          if (
                            toolPart.state === "input-streaming" ||
                            toolPart.state === "input-available"
                          ) {
                            return (
                              <details
                                key={`${msg.id}-${i}`}
                                className="mt-2 text-xs opacity-70 border-t pt-2 border-border/50"
                                open={true}
                              >
                                <summary className="cursor-pointer hover:opacity-100 font-medium text-xs text-primary flex items-center gap-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Tool call: {getToolDisplayName(toolName)}</span>
                                </summary>
                                <div className="mt-2 font-mono p-3 rounded border bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40 chatbot-markdown break-words">
                                  <div className="mb-2">
                                    <strong className="text-xs">Tool:</strong>
                                    <div className="mt-1 text-xs break-words">{toolName}</div>
                                  </div>
                                  <div className="mb-2">
                                    <strong className="text-xs">Input:</strong>
                                    <pre className="mt-1 text-xs whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                      {JSON.stringify(toolInput, null, 2)}
                                    </pre>
                                  </div>
                                  <div className="text-muted-foreground italic text-xs">
                                    Executing...
                                  </div>
                                </div>
                              </details>
                            )
                          }

                          // Show result when available
                          if (toolPart.state === "output-available") {
                            let summaryText = `Tool call: ${getToolDisplayName(toolName)}`
                            let resultDisplay: React.ReactNode = null

                            if (toolName === "getPageContext") {
                              const output = toolOutput as any
                              const elementCount = output?.children?.length || 0
                              summaryText = `Tool call: ${getToolDisplayName(toolName)} (captured ${elementCount} elements)`
                              resultDisplay = (
                                <div>
                                  <strong className="text-xs">Output:</strong>
                                  <pre className="mt-1 text-xs max-h-40 overflow-auto whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                    {JSON.stringify(
                                      {
                                        elementCount,
                                        topLevelElements: output?.children
                                          ?.slice(0, 3)
                                          .map((c: any) => ({
                                            ref: c.ref,
                                            role: c.role,
                                            name: c.name,
                                          })),
                                      },
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </div>
                              )
                            } else if (toolName === "performAction") {
                              const result = toolOutput as {
                                success: boolean
                                message: string
                                verified?: boolean
                                previousValue?: string
                                currentValue?: string
                              }
                              summaryText = `Tool call: ${getToolDisplayName(toolName)} - ${result.success ? "✓ Success" : "✗ Failed"}`
                              resultDisplay = (
                                <div>
                                  <strong className="text-xs">Output:</strong>
                                  <pre className="mt-1 text-xs whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                    {JSON.stringify(
                                      {
                                        success: result.success,
                                        message: result.message,
                                        verified: result.verified,
                                        previousValue: result.previousValue,
                                        currentValue: result.currentValue,
                                      },
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </div>
                              )
                            } else {
                              summaryText = `Tool call: ${getToolDisplayName(toolName)}`
                              resultDisplay = (
                                <div>
                                  <strong className="text-xs">Output:</strong>
                                  <pre className="mt-1 text-xs max-h-40 overflow-auto whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                    {JSON.stringify(toolOutput, null, 2)}
                                  </pre>
                                </div>
                              )
                            }

                            return (
                              <details
                                key={`${msg.id}-${i}`}
                                className="mt-2 text-xs opacity-70 border-t pt-2 border-border/50"
                                open={true}
                              >
                                <summary className="cursor-pointer hover:opacity-100 font-medium text-xs text-primary">
                                  {summaryText}
                                </summary>
                                <div
                                  className={cn(
                                    "mt-2 font-mono p-3 rounded border chatbot-markdown break-words",
                                    toolName === "performAction" &&
                                      (toolOutput as any)?.success === false
                                      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50"
                                      : "bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40",
                                  )}
                                >
                                  <div className="mb-2">
                                    <strong className="text-xs">Tool:</strong>
                                    <div className="mt-1 text-xs break-words">{toolName}</div>
                                  </div>
                                  <div className="mb-2">
                                    <strong className="text-xs">Input:</strong>
                                    <pre className="mt-1 text-xs whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                      {JSON.stringify(toolInput, null, 2)}
                                    </pre>
                                  </div>
                                  {resultDisplay}
                                </div>
                              </details>
                            )
                          }

                          // Show error state
                          if (toolPart.state === "output-error") {
                            return (
                              <details
                                key={`${msg.id}-${i}`}
                                className="mt-2 text-xs opacity-70 border-t pt-2 border-border/50"
                                open={true}
                              >
                                <summary className="cursor-pointer hover:opacity-100 font-medium text-xs text-destructive">
                                  Tool call: {getToolDisplayName(toolName)} - ✗ Error
                                </summary>
                                <div className="mt-2 font-mono p-3 rounded border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 chatbot-markdown break-words">
                                  <div className="mb-2">
                                    <strong className="text-xs">Tool:</strong>
                                    <div className="mt-1 text-xs break-words">{toolName}</div>
                                  </div>
                                  <div className="mb-2">
                                    <strong className="text-xs">Input:</strong>
                                    <pre className="mt-1 text-xs whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                      {JSON.stringify(toolInput, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <strong className="text-xs">Error:</strong>
                                    <div className="mt-1 text-destructive text-xs break-words">
                                      {toolError}
                                    </div>
                                  </div>
                                </div>
                              </details>
                            )
                          }

                          return null
                        }
                        default:
                          // Handle any other tool-* types generically
                          if (part.type.startsWith("tool-")) {
                            const toolName = part.type.replace("tool-", "")
                            const toolPart = part as any
                            const hasError =
                              toolPart.state === "output-error" ||
                              (toolPart.result &&
                                typeof toolPart.result === "object" &&
                                toolPart.result.success === false)
                            const isSuccess =
                              toolPart.result &&
                              typeof toolPart.result === "object" &&
                              toolPart.result.success === true

                            return (
                              <details
                                key={`${msg.id}-${i}`}
                                className="mt-2 text-xs opacity-70 border-t pt-2 border-border/50"
                                open={false}
                              >
                                <summary className="cursor-pointer hover:opacity-100 font-medium text-xs text-primary">
                                  Tool call: {getToolDisplayName(toolName)}
                                </summary>
                                <div
                                  className={cn(
                                    "mt-2 font-mono p-3 rounded border chatbot-markdown break-words",
                                    hasError
                                      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50"
                                      : "bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40",
                                  )}
                                >
                                  <div className="mb-2">
                                    <strong className="text-xs">Tool:</strong>
                                    <div className="mt-1 text-xs break-words">{toolName}</div>
                                  </div>
                                  <div className="mb-2">
                                    <strong className="text-xs">Input:</strong>
                                    <pre className="mt-1 text-xs whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                      {JSON.stringify(
                                        toolPart.args || toolPart.input || {},
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </div>
                                  {toolPart.result && (
                                    <div>
                                      <strong className="text-xs">Output:</strong>
                                      <pre className="mt-1 text-xs max-h-40 overflow-auto whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                        {JSON.stringify(toolPart.result, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </details>
                            )
                          }

                          // Silently ignore other unhandled types
                          return null
                      }
                    })}
                  </div>
                  <p className={`${typography.bodySmall} text-muted-foreground px-1`}>
                    {format(new Date(), "HH:mm")}
                  </p>
                </div>
              </div>
            ))
          )}
          {status === "submitted" && (
            <div className="flex justify-start">
              <div className={`bg-muted rounded-lg px-4 py-2`}>
                <div className={`flex ${spacing.gap.sm}`}>
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
              rows={1}
              disabled={status !== "ready"}
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
                  input.trim() || attachments.length > 0
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
                disabled={(!input.trim() && attachments.length === 0) || status !== "ready"}
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
