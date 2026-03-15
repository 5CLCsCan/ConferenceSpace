"use client"

import React, { useState, useRef, useEffect } from "react"
import type { MessageItemProps } from "../types"
import { ROLE_STYLES } from "../config"
import { ParticipantAvatar } from "./participant-avatar"
import { useTranslation } from "@/lib/i18n/translation-context"

function renderTextWithLinks(text: string): React.ReactNode[] {
  const linkPattern = /\[([^\]]+)\]\(((?:https?:\/\/|\/api\/)[^)]+)\)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`} className="whitespace-pre-wrap">
          {text.slice(lastIndex, match.index)}
        </span>,
      )
    }
    const [, label, url] = match
    const isFile = label.startsWith("\uD83D\uDCCE ")
    if (isFile) {
      parts.push(
        <a
          key={`f-${match.index}`}
          href={url}
          download
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] font-medium text-slate-700 transition-colors no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
            attach_file
          </span>
          {label.replace(/^\uD83D\uDCCE\s*/, "")}
        </a>,
      )
    } else {
      parts.push(
        <a
          key={`l-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1B3C53] underline underline-offset-2 hover:text-[#234C6A] break-words"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
        </a>,
      )
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`t-${lastIndex}`} className="whitespace-pre-wrap">
        {text.slice(lastIndex)}
      </span>,
    )
  }

  return parts
}

export function MessageItem({ message, isFirst, onReact, onQuote, onDelete }: MessageItemProps) {
  const { t } = useTranslation()
  const [showActions, setShowActions] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMoreMenu) return
    function handleClick(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showMoreMenu])

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).catch(() => {})
    setShowMoreMenu(false)
  }

  return (
    <div
      className={`group relative ${isFirst ? "" : "pt-4 border-t border-slate-100"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        <ParticipantAvatar participant={message.author} size="md" />

        <div className="flex-1 min-w-0">
          {/* Author info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-[12px] text-[#141414]">
              {message.author.isCurrentUser ? "You" : message.author.displayName}
            </span>
            {message.author.role !== "system" && (
              <span
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  ROLE_STYLES[message.author.role].bg
                } ${ROLE_STYLES[message.author.role].text}`}
              >
                {ROLE_STYLES[message.author.role].label}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-medium">{message.relativeTime}</span>
            {message.editedAt && (
              <span className="text-[9px] text-slate-400 italic">
                {t("runtime.components.shared.discussion.components.message-item.text_edited")}
              </span>
            )}
          </div>

          {/* Content — parse leading quote block if present */}
          {(() => {
            const quoteMatch = message.content.match(/^> ([^:]+): ([^\n]+)\n\n([\s\S]*)$/)
            if (quoteMatch) {
              const [, quotedAuthor, quotedContent, replyBody] = quoteMatch
              return (
                <div className="space-y-2">
                  <div className="flex items-start gap-0 pl-3 border-l-4 border-slate-300 bg-slate-50 rounded-r py-1.5 pr-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 mb-0.5">{quotedAuthor}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed italic">
                        {quotedContent}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed">
                    {renderTextWithLinks(replyBody)}
                  </div>
                </div>
              )
            }
            return (
              <div className="text-xs text-slate-700 leading-relaxed">
                {renderTextWithLinks(message.content)}
              </div>
            )
          })()}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.attachments.map((att) => (
                <button
                  key={att.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-600 transition-colors"
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
                    {att.type === "equation" ? "function" : "article"}
                  </span>
                  {att.label}
                  {att.reference && <span className="text-slate-400">({att.reference})</span>}
                </button>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {message.reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  onClick={() => onReact?.(message.id, reaction.emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    reaction.reacted
                      ? "bg-[#1B3C53]/10 text-[#1B3C53] border border-[#1B3C53]/20"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {reaction.emoji === "agree" && (
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
                      thumb_up
                    </span>
                  )}
                  {reaction.emoji === "thumbs_up" && (
                    <span
                      className="material-symbols-outlined filled"
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
                      thumb_up
                    </span>
                  )}
                  {reaction.count}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hover Actions */}
        <div
          className={`flex items-start gap-1 transition-opacity ${
            showActions ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={() => onReact?.(message.id, "thumbs_up")}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title={t("runtime.components.shared.discussion.components.message-item.title_react")}
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
              add_reaction
            </span>
          </button>
          <button
            onClick={() => onQuote?.(message.id)}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title={t("runtime.components.shared.discussion.components.message-item.title_quote")}
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
              format_quote
            </span>
          </button>
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className={`p-1 rounded hover:bg-slate-100 transition-colors ${showMoreMenu ? "text-slate-600 bg-slate-100" : "text-slate-400 hover:text-slate-600"}`}
              title={t("runtime.components.shared.discussion.components.message-item.title_more")}
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
                more_horiz
              </span>
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    content_copy
                  </span>
                  Copy text
                </button>
                {message.author.isCurrentUser && (
                  <button
                    onClick={() => {
                      onDelete?.(message.id)
                      setShowMoreMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                      delete
                    </span>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
