"use client"

import { useState } from "react"
import type { MessageItemProps } from "../types"
import { ROLE_STYLES } from "../config"
import { ParticipantAvatar } from "./participant-avatar"

export function MessageItem({ message, isFirst, onReact, onQuote }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false)

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
            {message.editedAt && <span className="text-[9px] text-slate-400 italic">(edited)</span>}
          </div>

          {/* Content */}
          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.attachments.map((att) => (
                <button
                  key={att.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">
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
                    <span className="material-symbols-outlined text-[12px]">thumb_up</span>
                  )}
                  {reaction.emoji === "thumbs_up" && (
                    <span className="material-symbols-outlined text-[12px] filled">thumb_up</span>
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
            title="React"
          >
            <span className="material-symbols-outlined text-[14px]">add_reaction</span>
          </button>
          <button
            onClick={() => onQuote?.(message.id)}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Quote"
          >
            <span className="material-symbols-outlined text-[14px]">format_quote</span>
          </button>
          <button
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="More"
          >
            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
          </button>
        </div>
      </div>
    </div>
  )
}
