"use client"

import { useState, useRef } from "react"
import type { ThreadCardProps } from "../types"
import { StatusBadge, CategoryTag, VisibilityIndicator } from "./badges"
import { MessageItem } from "./message-item"
import { useTranslation } from "@/lib/i18n/translation-context"
import { deleteMessage, uploadAttachment } from "@/lib/api/discussions"

export function ThreadCard({
  thread,
  reviewMode,
  currentUser,
  onToggleCollapse,
  onReply,
  readOnly = false,
}: ThreadCardProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(!thread.isCollapsed)
  const [replyText, setReplyText] = useState("")
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [quotedMessage, setQuotedMessage] = useState<{
    id: string
    author: string
    content: string
  } | null>(null)
  const [localMessages, setLocalMessages] = useState(thread.messages)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [pendingAttachments, setPendingAttachments] = useState<
    Array<{ name: string; url: string }>
  >([])
  const [isUploading, setIsUploading] = useState(false)

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
    onToggleCollapse?.()
  }

  const handleReply = () => {
    if ((replyText.trim() || pendingAttachments.length > 0) && onReply) {
      const quotePrefix = quotedMessage
        ? `> ${quotedMessage.author}: ${quotedMessage.content}\n\n`
        : ""
      const attachmentSuffix =
        pendingAttachments.length > 0
          ? "\n" + pendingAttachments.map((a) => `[📎 ${a.name}](${a.url})`).join("\n")
          : ""
      onReply(quotePrefix + replyText.trim() + attachmentSuffix)
      setReplyText("")
      setQuotedMessage(null)
      setShowReplyBox(false)
      setPendingAttachments([])
    }
  }

  const handleQuote = (messageId: string) => {
    const msg = localMessages.find((m) => m.id === messageId)
    if (!msg) return
    // If this message is itself a quoted reply, only quote the reply body (strip leading > Author: ...\n\n)
    const nestedQuoteMatch = msg.content.match(/^> [^\n]+\n\n([\s\S]*)$/)
    const contentToQuote = nestedQuoteMatch ? nestedQuoteMatch[1].trim() : msg.content
    setQuotedMessage({
      id: msg.id,
      author: msg.author.isCurrentUser ? "You" : msg.author.displayName,
      content: contentToQuote,
    })
    setReplyText("")
    setShowReplyBox(true)
  }

  const insertAtCursor = (insertion: string) => {
    const ta = textareaRef.current
    if (!ta) {
      setReplyText((prev) => prev + insertion)
      return
    }
    const start = ta.selectionStart ?? replyText.length
    const end = ta.selectionEnd ?? replyText.length
    const before = replyText.slice(0, start)
    const after = replyText.slice(end)
    setReplyText(before + insertion + after)
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + insertion.length
      ta.focus()
    }, 0)
  }

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadAttachment(Number(thread.id), formData)
      const proxyUrl = `/api/backend${result.url}`
      setPendingAttachments((prev) => [...prev, { name: result.filename, url: proxyUrl }])
    } catch {
      // silent – could wire up a toast here
    } finally {
      setIsUploading(false)
    }
  }

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return
    const display = linkText.trim() || linkUrl.trim()
    insertAtCursor(`[${display}](${linkUrl.trim()})`)
    setLinkUrl("")
    setLinkText("")
    setShowLinkInput(false)
  }

  const handleDelete = (messageId: string) => {
    // Optimistic update
    setLocalMessages((prev) => prev.filter((m) => m.id !== messageId))
    deleteMessage(Number(thread.id), Number(messageId)).catch(() => {
      // Rollback on failure
      setLocalMessages(thread.messages)
    })
  }

  // Collapsed minimal view
  if (thread.isCollapsed && !isExpanded) {
    return (
      <div
        onClick={handleToggle}
        className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg cursor-pointer transition-all hover:shadow-sm group"
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={thread.status} />
          <div className="min-w-0">
            <h4 className="text-[12px] font-bold text-slate-600 truncate group-hover:text-[#141414]">
              {thread.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-slate-400">
                {thread.messageCount} {thread.messageCount === 1 ? "message" : "messages"}
              </span>
              <span className="text-[9px] text-slate-400">-</span>
              <span className="text-[9px] text-slate-400">{thread.lastActivity}</span>
            </div>
          </div>
        </div>
        <span
          className="material-symbols-outlined text-slate-400 group-hover:text-[#1B3C53]"
          style={{
            fontSize: "16px",
            width: "16px",
            height: "16px",
            maxWidth: "16px",
            maxHeight: "16px",
            minWidth: "16px",
            minHeight: "16px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: "none",
            boxSizing: "border-box",
          }}
        >
          expand_more
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Thread Header */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={thread.status} />
              <h3 className="text-sm font-bold text-[#141414] tracking-tight">{thread.title}</h3>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <CategoryTag category={thread.category} />
              <VisibilityIndicator visibility={thread.visibility} />
              {thread.linkedSection && (
                <span className="text-[9px] text-slate-400 flex items-center gap-1">
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "16px",
                      width: "16px",
                      height: "16px",
                      maxWidth: "16px",
                      maxHeight: "16px",
                      minWidth: "16px",
                      minHeight: "16px",
                      lineHeight: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transform: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    link
                  </span>
                  {thread.linkedSection}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>{thread.lastActivity}</span>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded hover:bg-slate-200 transition-colors"
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "16px",
                  width: "16px",
                  height: "16px",
                  maxWidth: "16px",
                  maxHeight: "16px",
                  minWidth: "16px",
                  minHeight: "16px",
                  lineHeight: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: "none",
                  boxSizing: "border-box",
                }}
              >
                unfold_less
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="px-4 py-4 space-y-4">
        {localMessages.map((message, idx) => (
          <MessageItem
            key={message.id}
            message={message}
            isFirst={idx === 0}
            reviewMode={reviewMode}
            onQuote={!readOnly ? handleQuote : undefined}
            onDelete={!readOnly ? handleDelete : undefined}
          />
        ))}
      </div>

      {/* Reply Section */}
      {!readOnly && (
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100">
          {showReplyBox ? (
            <div className="space-y-2">
              {/* Quoted message preview */}
              {quotedMessage && (
                <div className="flex items-start gap-2 pl-3 border-l-4 border-[#1B3C53]/40 bg-[#1B3C53]/5 rounded-r-lg py-2 pr-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[#1B3C53] mb-0.5">
                      {quotedMessage.author}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {quotedMessage.content}
                    </p>
                  </div>
                  <button
                    onClick={() => setQuotedMessage(null)}
                    className="shrink-0 p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                      close
                    </span>
                  </button>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t(
                  "runtime.components.shared.discussion.components.thread-card.placeholder_write_a_reply",
                )}
                className="w-full px-3 py-2 text-xs text-slate-700 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B3C53] focus:ring-1 focus:ring-[#1B3C53]/20 resize-none"
                rows={3}
                autoFocus
              />
              {/* Pending file attachments */}
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pendingAttachments.map((att, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1B3C53]/10 border border-[#1B3C53]/20 rounded text-[10px] font-medium text-[#1B3C53]"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                        attach_file
                      </span>
                      {att.name}
                      <button
                        type="button"
                        onClick={() =>
                          setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="ml-0.5 text-[#1B3C53]/60 hover:text-[#1B3C53] leading-none"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>
                          close
                        </span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileAttach}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isUploading ? "Uploading…" : "Attach file"}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "16px",
                        width: "16px",
                        height: "16px",
                        maxWidth: "16px",
                        maxHeight: "16px",
                        minWidth: "16px",
                        minHeight: "16px",
                        lineHeight: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transform: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      attach_file
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkInput((v) => !v)
                      setLinkUrl("")
                      setLinkText("")
                    }}
                    className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${
                      showLinkInput
                        ? "text-[#1B3C53] bg-slate-200"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    title="Insert link"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "16px",
                        width: "16px",
                        height: "16px",
                        maxWidth: "16px",
                        maxHeight: "16px",
                        minWidth: "16px",
                        minHeight: "16px",
                        lineHeight: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transform: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      link
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowReplyBox(false)
                      setReplyText("")
                      setQuotedMessage(null)
                      setShowLinkInput(false)
                      setPendingAttachments([])
                    }}
                    className="h-7 px-3 text-[11px] font-medium text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    {t(
                      "runtime.components.shared.discussion.components.thread-card.text_cancel",
                    )}{" "}
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() && pendingAttachments.length === 0}
                    className="h-7 px-3 bg-[#1B3C53] hover:bg-[#234C6A] disabled:bg-slate-300 text-white text-[11px] font-medium rounded-md transition-colors disabled:cursor-not-allowed"
                  >
                    {t(
                      "runtime.components.shared.discussion.components.thread-card.text_reply",
                    )}{" "}
                  </button>
                </div>
              </div>
              {/* Link input panel */}
              {showLinkInput && (
                <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                  <span
                    className="material-symbols-outlined text-slate-400 shrink-0"
                    style={{ fontSize: "14px" }}
                  >
                    link
                  </span>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
                    placeholder="https://..."
                    className="flex-1 text-xs text-slate-700 placeholder-slate-400 bg-transparent outline-none border-r border-slate-200 pr-2 mr-1"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
                    placeholder="Display text (optional)"
                    className="flex-1 text-xs text-slate-700 placeholder-slate-400 bg-transparent outline-none"
                  />
                  <button
                    onClick={handleInsertLink}
                    disabled={!linkUrl.trim()}
                    className="shrink-0 h-6 px-2 bg-[#1B3C53] disabled:bg-slate-300 text-white text-[10px] font-medium rounded transition-colors"
                  >
                    Insert
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowReplyBox(true)}
              className="flex items-center gap-2 text-[11px] font-medium text-[#1B3C53] hover:text-[#234C6A] transition-colors"
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "16px",
                  width: "16px",
                  height: "16px",
                  maxWidth: "16px",
                  maxHeight: "16px",
                  minWidth: "16px",
                  minHeight: "16px",
                  lineHeight: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: "none",
                  boxSizing: "border-box",
                }}
              >
                reply
              </span>
              {t(
                "runtime.components.shared.discussion.components.thread-card.text_reply_to_thread",
              )}{" "}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
