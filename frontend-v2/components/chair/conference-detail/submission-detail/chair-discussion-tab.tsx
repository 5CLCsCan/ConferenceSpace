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

// Chair-specific current user configuration
const CHAIR_CURRENT_USER: Participant = {
  id: "chair-1",
  displayName: "Dr. Sarah Smith",
  role: "area_chair",
  realName: "Dr. Sarah Smith",
  avatar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA5iIJaVXGl0D1HRG3ULOT9C9PhH3RzOrp1kkDzHq0PPgJZA7JRRy8rzybBj0yFIbH5x3p1874q8ycWP2t2BVTvpiek9xtcV-_Qis1U-RgxUhh7KhKGqL35gKl8yCY5bslazmwRf3jQgFnlXqMOH_EOto3_Xmr4XznnGPFh0PVfLTEfGDK3tjF5LIS0hSWBTiEWnh6QbDfdZ1BjLYSoVjXYvNLLHkgb9M9Qcgn7K-SqRhiTfnd5rJ6HkUFewGdO61rtUSkm5rtu",
  isCurrentUser: true,
}

// Chair settings - chairs can see everything and moderate
const CHAIR_SETTINGS: ConferenceSettings = {
  ...MOCK_SETTINGS,
  reviewMode: "double_blind", // Chair can still see identities regardless
}

/**
 * ChairDiscussionTab - Chair-specific wrapper for the shared DiscussionPanel
 *
 * This component provides the chair perspective for paper discussions.
 * Chairs have elevated privileges:
 * - Can see all visibility levels (committee, reviewers, authors)
 * - Can moderate discussions (pin, resolve, flag threads)
 * - Can post with any visibility level
 * - Can see reviewer identities in double-blind reviews
 */
export function ChairDiscussionTab() {
  const [threads, setThreads] = useState(MOCK_THREADS)
  const [settings] = useState(CHAIR_SETTINGS)
  const [currentUser] = useState(CHAIR_CURRENT_USER)

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
      // Chair can see and post to all visibility levels
      availableVisibilities={["committee", "reviewers", "authors"]}
    />
  )
}
