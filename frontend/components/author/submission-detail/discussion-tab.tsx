"use client"

import { useState } from "react"
import {
  DiscussionPanel,
  MOCK_SETTINGS,
  MOCK_THREADS,
  type DiscussionThread,
  type CreateThreadData,
  type Participant,
  type ConferenceSettings,
} from "@/components/shared/discussion"

// Author-specific current user configuration
const AUTHOR_CURRENT_USER: Participant = {
  id: "author-1",
  displayName: "Author",
  role: "author",
  realName: "John Doe",
  isCurrentUser: true,
}

// Author settings - authors can only see author-visible content
const AUTHOR_SETTINGS: ConferenceSettings = {
  ...MOCK_SETTINGS,
  reviewMode: "double_blind", // Author sees anonymous reviewers
}

/**
 * DiscussionTab - Author-specific wrapper for the shared DiscussionPanel
 *
 * This component provides the author perspective for paper discussions.
 * Authors have limited privileges:
 * - Can only see threads visible to authors
 * - Can respond to reviewer/chair questions
 * - Cannot see committee-only discussions
 * - Cannot see reviewer identities in double-blind reviews
 */
export function DiscussionTab() {
  const [threads, setThreads] = useState(
    // Filter to only show threads visible to authors
    MOCK_THREADS.filter((t) => t.visibility === "authors"),
  )
  const [settings] = useState(AUTHOR_SETTINGS)
  const [currentUser] = useState(AUTHOR_CURRENT_USER)

  const handleCreateThread = (data: CreateThreadData) => {
    const newThread: DiscussionThread = {
      ...data,
      status: "open",
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
      // Authors can only post to author-visible threads
      availableVisibilities={["authors"]}
    />
  )
}
