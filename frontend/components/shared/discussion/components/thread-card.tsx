"use client"

import { useState } from "react"
import type { ThreadCardProps } from "../types"
import { StatusBadge, CategoryTag, VisibilityIndicator } from "./badges"
import { MessageItem } from "./message-item"
import { useTranslation } from "@/lib/i18n/translation-context"

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

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
    onToggleCollapse?.()
  }

  const handleReply = () => {
    if (replyText.trim() && onReply) {
      onReply(replyText.trim())
      setReplyText("")
      setShowReplyBox(false)
    }
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
        {thread.messages.map((message, idx) => (
          <MessageItem
            key={message.id}
            message={message}
            isFirst={idx === 0}
            reviewMode={reviewMode}
          />
        ))}
      </div>

      {/* Reply Section */}
      {!readOnly && (
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100">
          {showReplyBox ? (
            <div className="space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t("runtime.components.shared.discussion.components.thread-card.placeholder_write_a_reply")}
                className="w-full px-3 py-2 text-xs text-slate-700 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B3C53] focus:ring-1 focus:ring-[#1B3C53]/20 resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
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
                  <button className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
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
                    }}
                    className="h-7 px-3 text-[11px] font-medium text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    {t("runtime.components.shared.discussion.components.thread-card.text_cancel")}{" "}</button>
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim()}
                    className="h-7 px-3 bg-[#1B3C53] hover:bg-[#234C6A] disabled:bg-slate-300 text-white text-[11px] font-medium rounded-md transition-colors disabled:cursor-not-allowed"
                  >
                    {t("runtime.components.shared.discussion.components.thread-card.text_reply")}{" "}</button>
                </div>
              </div>
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
              {t("runtime.components.shared.discussion.components.thread-card.text_reply_to_thread")}{" "}</button>
          )}
        </div>
      )}
    </div>
  )
}
