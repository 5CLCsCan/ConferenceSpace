"use client"

import * as React from "react"
import { Plus, MessageSquare, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatConversation } from "./types"
import { typography, spacing, iconSizes } from "@/lib/typography"

interface ConversationListProps {
  conversations: ChatConversation[]
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
}

export function ConversationList({
  conversations,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)

  const handleDelete = React.useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    // TODO: Implement delete functionality
    console.log("Delete conversation", id)
  }, [])

  return (
    <div className="flex flex-col h-full relative">
      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className={`p-2 pb-20`}>
          {conversations.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground`}
            >
              <MessageSquare
                className={`${iconSizes.lg} mb-4 opacity-50`}
                style={{ width: "3rem", height: "3rem" }}
              />
              <p className={typography.body}>No conversations yet</p>
              <p className={`${typography.bodySmall} mt-1`}>Start a new conversation to get help</p>
            </div>
          ) : (
            <div className={spacing.tight}>
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    `group relative flex items-start ${spacing.gap.md} ${spacing.padding.card} rounded-lg cursor-pointer transition-colors`,
                    "hover:bg-accent",
                  )}
                  onMouseEnter={() => setHoveredId(conversation.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`${typography.body} ${typography.medium} truncate`}>
                      {conversation.title}
                    </p>
                    <p className={`${typography.bodySmall} text-muted-foreground mt-1`}>
                      {conversation.messages.length} message
                      {conversation.messages.length !== 1 ? "s" : ""}
                    </p>
                    <p className={`${typography.bodySmall} text-muted-foreground mt-0.5`}>
                      {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                    </p>
                  </div>
                  {hoveredId === conversation.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(e, conversation.id)}
                      aria-label="Delete conversation"
                    >
                      <Trash2 className={iconSizes.xs} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Floating New Conversation Button */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center px-4">
        <Button
          onClick={onNewConversation}
          className="w-[60%] shadow-lg rounded-full h-10"
          size="lg"
        >
          <Plus className={`${iconSizes.md} mr-2`} />
          New Conversation
        </Button>
      </div>
    </div>
  )
}
