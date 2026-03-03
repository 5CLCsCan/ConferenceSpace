"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatConversation } from "./types"

interface ConversationListProps {
  conversations: ChatConversation[]
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
}

export function ConversationList({
  conversations,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationListProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)

  const handleDelete = React.useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      onDeleteConversation(id)
    },
    [onDeleteConversation],
  )

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <ScrollArea className="flex-1">
        <div className="p-2 pb-20">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <span
                  className="material-symbols-outlined text-slate-400"
                  style={{ fontSize: "18px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
                >
                  forum
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                No conversations yet
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                Start a new conversation to get help
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150",
                    "hover:bg-slate-50 dark:hover:bg-slate-800/60",
                  )}
                  onMouseEnter={() => setHoveredId(conversation.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1B3C53]/8 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <span
                      className="material-symbols-outlined text-[#456882] dark:text-slate-400"
                      style={{ fontSize: "13px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
                    >
                      chat_bubble
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#141414] dark:text-slate-100 truncate leading-[1.3]">
                      {conversation.title}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                    </p>
                  </div>

                  {hoveredId === conversation.id && (
                    <button
                      className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleDelete(e, conversation.id)}
                      aria-label="Delete conversation"
                    >
                      <span
                        className="material-symbols-outlined text-slate-400 hover:text-red-500"
                        style={{ fontSize: "12px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
                      >
                        delete
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* New Conversation CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pt-8">
        <button
          onClick={onNewConversation}
          className={cn(
            "w-full h-9 rounded-[8px] flex items-center justify-center gap-2",
            "bg-[#1B3C53] text-white hover:bg-[#234C6A] active:scale-[0.98]",
            "text-[11px] font-semibold uppercase tracking-wider transition-all duration-200",
            "border border-[#234C6A]/60",
          )}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "14px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
          >
            add
          </span>
          New Conversation
        </button>
      </div>
    </div>
  )
}
