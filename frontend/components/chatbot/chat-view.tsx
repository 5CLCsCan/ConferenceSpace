"use client"

import * as React from "react"
import { Paperclip, X, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useChat } from "@ai-sdk/react"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai"
import { Streamdown } from "streamdown"
import type { ChatConversation, ChatAttachment } from "./types"
import { capturePageContext } from "@/lib/chatbot/page-context"
import { executeAction, type ActionType, type ActionParams } from "@/lib/chatbot/action-executor"

interface ChatViewProps {
  conversation: ChatConversation
  onSendMessage?: (message: string, attachments?: ChatAttachment[]) => void
}

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

function getToolDisplayName(toolName: string): string {
  const aliases: Record<string, string> = {
    getPageContext: "Get Page Context",
    performAction: "Perform Action",
  }
  return aliases[toolName] || toolName
}

// Tool call collapsible block
function ToolBlock({
  label,
  statusIcon,
  statusColor,
  isError,
  isLoading,
  open = false,
  children,
}: {
  label: string
  statusIcon?: string
  statusColor?: string
  isError?: boolean
  isLoading?: boolean
  open?: boolean
  children?: React.ReactNode
}) {
  return (
    <details
      className={cn(
        "mt-2 rounded-md border text-[10px]",
        isError
          ? "border-red-200 dark:border-red-800/50 bg-red-50/60 dark:bg-red-950/20"
          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50",
      )}
      open={open}
    >
      <summary
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer select-none list-none",
          "font-medium tracking-wide text-[10px] uppercase",
          isError ? "text-red-500" : "text-[#456882] dark:text-slate-400",
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "11px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
          >
            {isError ? "error" : "settings"}
          </span>
        )}
        {label}
        {statusIcon && <span className={cn("ml-auto font-bold", statusColor)}>{statusIcon}</span>}
      </summary>
      {children && (
        <div className="px-2.5 pb-2.5 space-y-1.5 border-t border-slate-200 dark:border-slate-700 mt-0 pt-2">
          {children}
        </div>
      )}
    </details>
  )
}

function ToolField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}

function ToolPre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 whitespace-pre-wrap break-words overflow-wrap-anywhere max-h-36 overflow-auto leading-relaxed">
      {children}
    </pre>
  )
}

export function ChatView({ conversation, onSendMessage }: ChatViewProps) {
  const [input, setInput] = React.useState("")
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([])
  const [mode, setMode] = React.useState<"agentic" | "standard">("agentic")
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const refMapRef = React.useRef<Map<string, Element>>(new Map())

  const initialMessages = React.useMemo(
    () => loadMessagesFromStorage(conversation.id),
    [conversation.id],
  )

  const { messages, sendMessage, status, addToolOutput } = useChat({
    id: conversation.id,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === "getPageContext") {
        try {
          const { tree, refMap } = capturePageContext()
          refMapRef.current = refMap
          addToolOutput({ tool: "getPageContext", toolCallId: toolCall.toolCallId, output: tree })
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
          addToolOutput({ tool: "performAction", toolCallId: toolCall.toolCallId, output: result })
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
      if (viewport) viewport.scrollTop = viewport.scrollHeight
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
    if (fileInputRef.current) fileInputRef.current.value = ""
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
      if (onSendMessage) onSendMessage(input, attachments.length > 0 ? attachments : undefined)
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

  const isLastStreaming = (msg: UIMessage, i: number) =>
    status === "streaming" &&
    msg.role === "assistant" &&
    msg.id === messages[messages.length - 1]?.id &&
    i === msg.parts.length - 1

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <div className="p-2 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#1B3C53]/8 dark:bg-slate-800 flex items-center justify-center mb-3">
                <span
                  className="material-symbols-outlined text-[#1B3C53] dark:text-slate-400"
                  style={{ fontSize: "20px", fontVariationSettings: '"FILL" 1, "wght" 400' }}
                >
                  school
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Start a conversation
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] leading-relaxed">
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
                    "flex flex-col gap-1 max-w-[82%]",
                    msg.role === "user" && "items-end",
                  )}
                >
                  {/* Message bubble */}
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2",
                      msg.role === "user"
                        ? "bg-[#1B3C53] text-white rounded-tr-sm"
                        : "text-[#141414] dark:text-slate-100",
                    )}
                  >
                    {msg.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <div
                              key={`${msg.id}-${i}`}
                              className={cn(
                                "chatbot-markdown",
                                msg.role === "user" &&
                                  "text-white [&_*]:text-white [&_code]:bg-white/15",
                              )}
                            >
                              <Streamdown isAnimating={isLastStreaming(msg, i)}>
                                {part.text}
                              </Streamdown>
                            </div>
                          )

                        case "reasoning":
                          return (
                            <details
                              key={`${msg.id}-${i}`}
                              className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-[10px]"
                              open={true}
                            >
                              <summary className="flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer select-none list-none font-medium tracking-wide text-[10px] uppercase text-[#456882] dark:text-slate-400">
                                <span
                                  className="material-symbols-outlined"
                                  style={{
                                    fontSize: "11px",
                                    fontVariationSettings: '"FILL" 0, "wght" 400',
                                  }}
                                >
                                  psychology
                                </span>
                                Reasoning
                              </summary>
                              <div className="px-2.5 pb-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div className="font-mono text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 whitespace-pre-wrap leading-relaxed chatbot-markdown">
                                  <Streamdown isAnimating={isLastStreaming(msg, i)}>
                                    {part.text}
                                  </Streamdown>
                                </div>
                              </div>
                            </details>
                          )

                        case "step-start":
                          return null

                        case "tool-getPageContext":
                        case "tool-performAction": {
                          const toolPart = part as any
                          const toolName = part.type.replace("tool-", "")
                          const hasError =
                            toolPart.state === "output-error" || toolPart.result?.success === false
                          const isSuccess = toolPart.result?.success === true

                          return (
                            <ToolBlock
                              key={`${msg.id}-${i}`}
                              label={`Tool: ${getToolDisplayName(toolName)}`}
                              isError={hasError}
                              statusIcon={hasError ? "[FAIL]" : isSuccess ? "[OK]" : undefined}
                              statusColor={hasError ? "text-red-500" : "text-green-600"}
                              open={false}
                            >
                              <ToolField label="Tool">
                                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                  {toolName}
                                </span>
                              </ToolField>
                              <ToolField label="Input">
                                <ToolPre>
                                  {JSON.stringify(toolPart.args || toolPart.input || {}, null, 2)}
                                </ToolPre>
                              </ToolField>
                              {toolPart.result && (
                                <ToolField label="Output">
                                  <ToolPre>{JSON.stringify(toolPart.result, null, 2)}</ToolPre>
                                </ToolField>
                              )}
                            </ToolBlock>
                          )
                        }

                        case "dynamic-tool": {
                          const toolPart = part
                          const toolName = toolPart.toolName
                          const toolInput = toolPart.input as any
                          const toolOutput = toolPart.output
                          const toolError = toolPart.errorText

                          if (
                            toolPart.state === "input-streaming" ||
                            toolPart.state === "input-available"
                          ) {
                            return (
                              <ToolBlock
                                key={`${msg.id}-${i}`}
                                label={`Tool: ${getToolDisplayName(toolName)}`}
                                isLoading
                                open={true}
                              >
                                <ToolField label="Tool">
                                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                    {toolName}
                                  </span>
                                </ToolField>
                                <ToolField label="Input">
                                  <ToolPre>{JSON.stringify(toolInput, null, 2)}</ToolPre>
                                </ToolField>
                                <p className="text-[10px] text-slate-400 italic">Executing...</p>
                              </ToolBlock>
                            )
                          }

                          if (toolPart.state === "output-available") {
                            const isPerformAction = toolName === "performAction"
                            const result = toolOutput as any
                            const isFailed = isPerformAction && result?.success === false
                            const summaryLabel = isPerformAction
                              ? `Tool: ${getToolDisplayName(toolName)}`
                              : `Tool: ${getToolDisplayName(toolName)}`

                            let resultDisplay: React.ReactNode = null
                            if (toolName === "getPageContext") {
                              const elementCount = result?.children?.length || 0
                              resultDisplay = (
                                <ToolField label={`Output (${elementCount} elements)`}>
                                  <ToolPre>
                                    {JSON.stringify(
                                      {
                                        elementCount,
                                        topLevelElements: result?.children
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
                                  </ToolPre>
                                </ToolField>
                              )
                            } else {
                              resultDisplay = (
                                <ToolField label="Output">
                                  <ToolPre>{JSON.stringify(toolOutput, null, 2)}</ToolPre>
                                </ToolField>
                              )
                            }

                            return (
                              <ToolBlock
                                key={`${msg.id}-${i}`}
                                label={summaryLabel}
                                isError={isFailed}
                                statusIcon={
                                  isPerformAction
                                    ? result?.success
                                      ? "[OK]"
                                      : "[FAIL]"
                                    : undefined
                                }
                                statusColor={result?.success ? "text-green-600" : "text-red-500"}
                                open={true}
                              >
                                <ToolField label="Tool">
                                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                    {toolName}
                                  </span>
                                </ToolField>
                                <ToolField label="Input">
                                  <ToolPre>{JSON.stringify(toolInput, null, 2)}</ToolPre>
                                </ToolField>
                                {resultDisplay}
                              </ToolBlock>
                            )
                          }

                          if (toolPart.state === "output-error") {
                            return (
                              <ToolBlock
                                key={`${msg.id}-${i}`}
                                label={`Tool: ${getToolDisplayName(toolName)}`}
                                isError
                                statusIcon="[ERROR]"
                                statusColor="text-red-500"
                                open={true}
                              >
                                <ToolField label="Tool">
                                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                    {toolName}
                                  </span>
                                </ToolField>
                                <ToolField label="Input">
                                  <ToolPre>{JSON.stringify(toolInput, null, 2)}</ToolPre>
                                </ToolField>
                                <ToolField label="Error">
                                  <span className="text-[10px] text-red-500 font-mono">
                                    {toolError}
                                  </span>
                                </ToolField>
                              </ToolBlock>
                            )
                          }

                          return null
                        }

                        default:
                          if (part.type.startsWith("tool-")) {
                            const toolName = part.type.replace("tool-", "")
                            const toolPart = part as any
                            const hasError =
                              toolPart.state === "output-error" ||
                              toolPart.result?.success === false

                            return (
                              <ToolBlock
                                key={`${msg.id}-${i}`}
                                label={`Tool: ${getToolDisplayName(toolName)}`}
                                isError={hasError}
                                open={false}
                              >
                                <ToolField label="Tool">
                                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                    {toolName}
                                  </span>
                                </ToolField>
                                <ToolField label="Input">
                                  <ToolPre>
                                    {JSON.stringify(toolPart.args || toolPart.input || {}, null, 2)}
                                  </ToolPre>
                                </ToolField>
                                {toolPart.result && (
                                  <ToolField label="Output">
                                    <ToolPre>{JSON.stringify(toolPart.result, null, 2)}</ToolPre>
                                  </ToolField>
                                )}
                              </ToolBlock>
                            )
                          }
                          return null
                      }
                    })}
                  </div>

                  {/* Timestamp */}
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 px-1">
                    {format(new Date(), "HH:mm")}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Thinking indicator */}
          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="px-3 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                thinking
                <span className="typing-dots">...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 p-3">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-[#1B3C53] dark:focus-within:border-slate-500 transition-colors overflow-hidden"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            aria-label="Attach files"
          />
          {/* Content area - entirely above utility */}
          <div className="px-2 pt-2 min-h-[45px]">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the assistant..."
              className="min-h-[25px] max-h-[200px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-[11px] text-[#141414] dark:text-slate-100 placeholder:text-slate-400 py-0 px-0"
              rows={2}
              spellCheck={false}
              disabled={status !== "ready"}
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-full px-2 py-0.5"
                  >
                    <span
                      className="material-symbols-outlined text-slate-400"
                      style={{ fontSize: "10px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
                    >
                      attach_file
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 max-w-[120px] truncate">
                      {att.name}
                    </span>
                    <button
                      type="button"
                      className="h-3.5 w-3.5 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleRemoveAttachment(att.id)}
                      aria-label="Remove attachment"
                    >
                      <X className="h-2.5 w-2.5 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Utility bar - selection left, file + send right */}
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <Select value={mode} onValueChange={(v) => setMode(v as "agentic" | "standard")}>
              <SelectTrigger
                size="xs"
                iconClassName="size-2.5 opacity-100 group-hover:text-slate-100 dark:group-hover:text-slate-200 transition-colors"
                className="h-6 w-auto min-w-0 gap-0.5 rounded-xl border-0 bg-slate-200 dark:bg-slate-800 shadow-none text-[9px] text-slate-500 dark:text-slate-400 hover:bg-slate-400 dark:hover:bg-slate-600 hover:text-slate-100 dark:hover:text-slate-200 transition-colors px-1.5"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agentic" className="text-[9px]">
                  Agentic
                </SelectItem>
                <SelectItem value="standard" className="text-[9px]">
                  Standard
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-5 w-5 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Attach file"
              >
                <span
                  className="material-symbols-outlined text-slate-500 dark:text-slate-400"
                  style={{ fontSize: "14px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
                >
                  attach_file
                </span>
              </button>
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || status !== "ready"}
                className={cn(
                  "h-5 w-5 flex items-center justify-center rounded-full border transition-all duration-200",
                  input.trim() || attachments.length > 0
                    ? "border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 "
                    : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed",
                )}
                aria-label="Send message"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "12px", fontVariationSettings: '"FILL" 1, "wght" 400' }}
                >
                  arrow_upward
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
