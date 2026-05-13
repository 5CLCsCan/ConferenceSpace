"use client"

import * as React from "react"
import { Square, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai"
import { useChat } from "@ai-sdk/react"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { executeActions, type BatchActionInvocationInput } from "@/lib/chatbot/action-executor"
import {
  getCurrentNavigationSnapshot,
  navigateToDestination,
} from "@/lib/chatbot/navigation-executor"
import { capturePageContext } from "@/lib/chatbot/page-context"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

import { useChatbot } from "./chatbot-provider"
import { ChatTranscript } from "./chat-transcript"
import { FilePreviewDialog, type PreviewableFile } from "./file-preview-dialog"
import type { ChatAttachment, ChatConversation } from "./types"

interface ChatViewProps {
  conversation: ChatConversation
  onSendMessage?: (message: string, attachments?: ChatAttachment[]) => void
  onMessagesChange?: (messages: UIMessage[]) => void
  onConversationSynced?: () => void
}

export function ChatView({
  conversation,
  onSendMessage,
  onMessagesChange,
  onConversationSynced,
}: ChatViewProps) {
  const { t } = useTranslation()
  const { currentRole, switchRole } = useAuth()
  const { showNavigationMask } = useChatbot()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [input, setInput] = React.useState("")
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([])
  const [previewFile, setPreviewFile] = React.useState<PreviewableFile | null>(null)
  const [isDraggingFiles, setIsDraggingFiles] = React.useState(false)
  const [mode, setMode] = React.useState<"agentic" | "standard">("agentic")
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const refMapRef = React.useRef<Map<string, Element>>(new Map())
  const previousStatusRef = React.useRef<string>("ready")
  const lastEmittedMessagesRef = React.useRef<UIMessage[] | null>(null)
  const attachmentUrlsRef = React.useRef<Set<string>>(new Set())

  const { messages, sendMessage, status, stop, addToolOutput } = useChat({
    id: conversation.id,
    messages: conversation.messages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === "getCurrentNavigation") {
        try {
          const snapshot = getCurrentNavigationSnapshot({
            href: typeof window !== "undefined" ? window.location.href : pathname,
            pathname,
            searchParams: new URLSearchParams(searchParams.toString()),
          })
          addToolOutput({
            tool: "getCurrentNavigation",
            toolCallId: toolCall.toolCallId,
            output: snapshot,
          })
        } catch (error) {
          addToolOutput({
            tool: "getCurrentNavigation",
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText:
              error instanceof Error ? error.message : "Failed to resolve current navigation",
          })
        }
      }

      if (toolCall.toolName === "navigate") {
        try {
          const input = toolCall.input as {
            destinationId?: string
            params?: Record<string, string>
          }
          const result = navigateToDestination({
            currentRole,
            destinationId: String(input.destinationId || ""),
            params: input.params && typeof input.params === "object" ? input.params : {},
            push: router.push,
            activateRole: switchRole,
            onBeforePush: ({ destinationLabel, path }) => {
              showNavigationMask({
                destinationLabel,
                targetPath: path,
              })
            },
          })
          addToolOutput({ tool: "navigate", toolCallId: toolCall.toolCallId, output: result })
        } catch (error) {
          addToolOutput({
            tool: "navigate",
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText: error instanceof Error ? error.message : "Failed to navigate",
          })
        }
      }

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

      if (toolCall.toolName === "performActions") {
        try {
          const result = await executeActions(
            refMapRef.current,
            toolCall.input as BatchActionInvocationInput,
          )
          addToolOutput({ tool: "performActions", toolCallId: toolCall.toolCallId, output: result })
        } catch (error) {
          addToolOutput({
            tool: "performActions",
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText: error instanceof Error ? error.message : "Failed to execute actions",
          })
        }
      }
    },
  })

  const scrollToBottom = React.useCallback(() => {
    if (!scrollAreaRef.current) {
      return
    }

    const viewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]')
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, status, scrollToBottom])

  React.useEffect(() => {
    if (!onMessagesChange) {
      return
    }
    if (lastEmittedMessagesRef.current === messages) {
      return
    }

    lastEmittedMessagesRef.current = messages
    onMessagesChange(messages)
  }, [messages, onMessagesChange])

  React.useEffect(() => {
    const previousStatus = previousStatusRef.current
    if (
      onConversationSynced &&
      status === "ready" &&
      (previousStatus === "submitted" || previousStatus === "streaming")
    ) {
      onConversationSynced()
    }
    previousStatusRef.current = status
  }, [status, onConversationSynced])

  const addFiles = React.useCallback((files: File[]) => {
    const nextAttachments: ChatAttachment[] = files.map((file) => ({
      id: `att-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      file,
    }))

    nextAttachments.forEach((attachment) => {
      if (attachment.url) {
        attachmentUrlsRef.current.add(attachment.url)
      }
    })
    setAttachments((previous) => [...previous, ...nextAttachments])
  }, [])

  const handleFileSelect = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(event.target.files || []))
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [addFiles],
  )

  const handleRemoveAttachment = React.useCallback((id: string) => {
    setAttachments((previous) => {
      const attachment = previous.find((item) => item.id === id)
      if (attachment?.url) {
        URL.revokeObjectURL(attachment.url)
        attachmentUrlsRef.current.delete(attachment.url)
      }
      return previous.filter((item) => item.id !== id)
    })
  }, [])

  const handleComposerDragOver = React.useCallback((event: React.DragEvent<HTMLFormElement>) => {
    if (!hasDraggedFiles(event)) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
    setIsDraggingFiles(true)
  }, [])

  const handleComposerDragLeave = React.useCallback((event: React.DragEvent<HTMLFormElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return
    }
    setIsDraggingFiles(false)
  }, [])

  const handleComposerDrop = React.useCallback(
    (event: React.DragEvent<HTMLFormElement>) => {
      if (!hasDraggedFiles(event)) {
        return
      }
      event.preventDefault()
      setIsDraggingFiles(false)
      addFiles(Array.from(event.dataTransfer.files || []))
    },
    [addFiles],
  )

  React.useEffect(() => {
    const attachmentUrls = attachmentUrlsRef.current
    return () => {
      attachmentUrls.forEach((url) => {
        URL.revokeObjectURL(url)
      })
      attachmentUrls.clear()
    }
  }, [])

  const toFilePart = React.useCallback(async (attachment: ChatAttachment) => {
    if (!attachment.file) {
      return null
    }
    return {
      type: "file" as const,
      filename: attachment.name,
      mediaType: attachment.type || "application/octet-stream",
      url: await readFileAsDataUrl(attachment.file),
    }
  }, [])

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (!input.trim() && attachments.length === 0) {
        return
      }

      const files = (await Promise.all(attachments.map(toFilePart))).filter(
        (file): file is NonNullable<typeof file> => file !== null,
      )
      sendMessage(files.length > 0 ? { text: input, files } : { text: input })
      attachments.forEach((attachment) => {
        if (attachment.url) {
          URL.revokeObjectURL(attachment.url)
          attachmentUrlsRef.current.delete(attachment.url)
        }
      })
      setInput("")
      setAttachments([])
      setPreviewFile(null)
      onSendMessage?.(input, attachments.length > 0 ? attachments : undefined)
    },
    [attachments, input, onSendMessage, sendMessage, toFilePart],
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        handleSubmit(event)
      }
    },
    [handleSubmit],
  )

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <div className="space-y-4 px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center py-4">
              <div className="w-full max-w-[288px] rounded-xl border border-slate-200 bg-white px-5 py-5 text-center shadow-sm">
                <div
                  className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[#1B3C53]"
                  aria-hidden
                >
                  <span
                    className="material-symbols-outlined text-[18px] leading-none"
                    style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}
                  >
                    chat_bubble
                  </span>
                </div>
                <p className="text-xs font-semibold tracking-tight text-slate-800">
                  {t("runtime.components.chatbot.chat-view.text_start_a_conversation")}
                </p>
                <p className="mx-auto mt-2 max-w-[240px] text-[10px] leading-relaxed text-slate-500">
                  {t(
                    "runtime.components.chatbot.chat-view.text_ask_me_anything_about_the_conference",
                  )}
                </p>
              </div>
            </div>
          ) : (
            <ChatTranscript messages={messages} status={status} />
          )}

          {status === "submitted" && (
            <div className="text-[11px] text-slate-500">
              thinking
              <span className="typing-dots">...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="space-y-1.5 bg-white px-4 py-3">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 shadow-sm"
              >
                <span
                  className="material-symbols-outlined text-slate-400"
                  style={{ fontSize: "10px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
                >
                  attach_file
                </span>
                <button
                  type="button"
                  data-testid="chat-pending-attachment-preview"
                  className="max-w-[160px] truncate text-left text-[10px] text-slate-600 transition-colors hover:text-[#1B3C53]"
                  onClick={() =>
                    setPreviewFile({
                      filename: attachment.name,
                      mediaType: attachment.type,
                      url: attachment.url,
                    })
                  }
                >
                  {attachment.name}
                </button>
                <button
                  type="button"
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors hover:bg-slate-200"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  aria-label={t(
                    "runtime.components.chatbot.chat-view.aria_label_remove_attachment",
                  )}
                >
                  <X className="h-2.5 w-2.5 text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        )}
        <form
          data-testid="chat-composer-form"
          onSubmit={handleSubmit}
          onDragOver={handleComposerDragOver}
          onDragLeave={handleComposerDragLeave}
          onDrop={handleComposerDrop}
          className={`relative overflow-hidden rounded-xl border bg-slate-50 transition-colors focus-within:border-[#1B3C53] ${
            isDraggingFiles ? "border-[#1B3C53] bg-[#1B3C53]/5" : "border-slate-200"
          }`}
        >
          {isDraggingFiles && (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-white/80 backdrop-blur-[1px]">
              <div className="flex items-center gap-1.5 rounded-full border border-[#1B3C53]/20 bg-white px-3 py-1 text-[10px] font-semibold text-[#1B3C53] shadow-sm">
                <span
                  className="material-symbols-outlined text-[14px] leading-none"
                  aria-hidden
                  style={{ fontVariationSettings: '"FILL" 0, "wght" 500' }}
                >
                  upload_file
                </span>
                {t("runtime.components.chatbot.chat-view.text_drop_to_add_file")}
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            aria-label={t("runtime.components.chatbot.chat-view.aria_label_attach_files")}
          />

          <div className="min-h-[48px] px-2 pt-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("runtime.components.chatbot.chat-view.placeholder_ask_the_assistant")}
              className="min-h-[28px] w-full resize-none border-0 bg-transparent px-0 py-0 text-[10px] md:text-[10px] text-[#141414] shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={2}
              spellCheck={false}
              disabled={status !== "ready"}
              style={{ fontSize: "10px" }}
            />
          </div>

          <div className="flex items-center justify-between px-2 pb-[6px] pt-[6px]">
            <Select
              value={mode}
              onValueChange={(value) => setMode(value as "agentic" | "standard")}
            >
              <SelectTrigger
                size="xs"
                iconClassName="size-[10px] opacity-100 transition-colors group-hover:text-slate-100"
                className="h-[20px] w-auto min-w-0 gap-0.5 rounded-xl border-0 bg-slate-200 px-1.5 text-[8px] text-slate-500 shadow-none transition-colors hover:bg-slate-400 hover:text-slate-100"
              >
                <SelectValue className="text-[10px]" />
              </SelectTrigger>
              <SelectContent
                className="rounded-xl border border-slate-200 bg-slate-100 p-0 text-slate-600 shadow-sm [&_[data-slot=select-item]]:mb-1 [&_[data-slot=select-item]:last-child]:mb-0"
                position="popper"
              >
                <SelectItem
                  value="agentic"
                  className="rounded-lg py-0.5 pl-2 pr-7 text-[9px] text-slate-600 focus:bg-slate-200 focus:text-slate-700 data-[highlighted]:bg-slate-200 data-[highlighted]:text-slate-700 data-[state=checked]:bg-slate-200 data-[state=checked]:text-slate-700 [&_svg]:size-3 [&_svg]:text-slate-500"
                >
                  {t("runtime.components.chatbot.chat-view.text_agentic")}
                </SelectItem>
                <SelectItem
                  value="standard"
                  className="rounded-lg py-0.5 pl-2 pr-7 text-[9px] text-slate-600 focus:bg-slate-200 focus:text-slate-700 data-[highlighted]:bg-slate-200 data-[highlighted]:text-slate-700 data-[state=checked]:bg-slate-200 data-[state=checked]:text-slate-700 [&_svg]:size-3 [&_svg]:text-slate-500"
                >
                  {t("runtime.components.chatbot.chat-view.text_standard")}
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              {status === "ready" && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                  aria-label={t("runtime.components.chatbot.chat-view.aria_label_attach_file")}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "12px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
                  >
                    attach_file
                  </span>
                </button>
              )}
              {status !== "ready" ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-all hover:bg-red-600"
                  aria-label={t(
                    "runtime.components.chatbot.chat-view.aria_label_cancel_generation",
                  )}
                >
                  <Square className="h-2.5 w-2.5 fill-white" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && attachments.length === 0}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B3C53] text-white transition-all hover:bg-[#234C6A] disabled:cursor-not-allowed disabled:bg-slate-300"
                  aria-label={t("runtime.components.chatbot.chat-view.aria_label_send_message")}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "10px", fontVariationSettings: '"FILL" 1, "wght" 400' }}
                  >
                    arrow_upward
                  </span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      <FilePreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </div>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(reader.error || new Error("Failed to read attachment"))
    reader.readAsDataURL(file)
  })
}

function hasDraggedFiles(event: React.DragEvent<HTMLElement>): boolean {
  return (
    Array.from(event.dataTransfer.types || []).includes("Files") ||
    event.dataTransfer.files.length > 0
  )
}
