"use client"

import { useState } from "react"
import {
  DiscussionPanel,
  MOCK_SETTINGS,
  MOCK_CURRENT_USER,
  MOCK_THREADS,
  type DiscussionThread,
  type CreateThreadData,
} from "@/components/shared/discussion"

/**
 * DiscussionTab - Reviewer-specific wrapper for the shared DiscussionPanel
 *
 * This component provides the reviewer perspective for paper discussions.
 * It uses the shared DiscussionPanel with reviewer-specific configuration.
 *
 * For other roles:
 * - Chair: import and use DiscussionPanel with chair-specific currentUser/settings
 * - Author: import with readOnly=true during certain phases
 */
export function DiscussionTab() {
  const [threads, setThreads] = useState(MOCK_THREADS)
  const [settings] = useState(MOCK_SETTINGS)
  const [currentUser] = useState(MOCK_CURRENT_USER)

  const handleCreateThread = (data: CreateThreadData) => {
    const newThread: DiscussionThread = {
      ...data,
      status: "open", // Default status for new threads
      id: `thread-${Date.now()}`,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
      lastActivity: "Just now",
      messageCount: 1,
      messages: [
        {
          id: `msg-${Date.now()}`,
          author: currentUser,
          content: data.content,
          timestamp: new Date().toLocaleString(),
          relativeTime: "Just now",
        },
      ],
    }
    setThreads((prev) => [newThread, ...prev])
  }

  const handleReplyToThread = (threadId: string, content: string) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread
        return {
          ...thread,
          lastActivity: "Just now",
          messageCount: thread.messageCount + 1,
          messages: [
            ...thread.messages,
            {
              id: `msg-${Date.now()}`,
              author: currentUser,
              content,
              timestamp: new Date().toLocaleString(),
              relativeTime: "Just now",
            },
          ],
        }
      }),
    )
  }

  const handleToggleCollapse = (threadId: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId ? { ...thread, isCollapsed: !thread.isCollapsed } : thread,
      ),
    )
  }

  return (
    <DiscussionPanel
      threads={threads}
      settings={settings}
      currentUser={currentUser}
      onCreateThread={handleCreateThread}
      onReplyToThread={handleReplyToThread}
      onToggleThreadCollapse={handleToggleCollapse}
      // Reviewer-specific: can see committee, reviewers, authors visibility options
      availableVisibilities={["committee", "reviewers", "authors"]}
    />
  )
}
