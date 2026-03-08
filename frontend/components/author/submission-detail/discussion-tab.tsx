"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  DiscussionPanel,
  type CreateThreadData,
} from "@/components/shared/discussion"
import { useAuth } from "@/lib/auth-context"
import { createMessage, createThread, getMessages, getThreads } from "@/lib/api/discussions"
import { getConferenceById } from "@/lib/api/conferences"
import {
  buildCurrentUser,
  buildDiscussionSettings,
  buildDiscussionThreads,
  type DiscussionConfigAdapter,
} from "@/components/shared/discussion/api-adapter"

interface DiscussionTabProps {
  conferenceId: string
  submissionId: string
  onThreadCountChange?: (count: number) => void
}

function toNumericId(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }
  return parsed
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
export function DiscussionTab({ conferenceId, submissionId, onThreadCountChange }: DiscussionTabProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsedThreadIds, setCollapsedThreadIds] = useState<Record<string, boolean>>({})
  const [threads, setThreads] = useState<ReturnType<typeof buildDiscussionThreads>>([])
  const [discussionConfig, setDiscussionConfig] = useState<DiscussionConfigAdapter | undefined>(
    undefined,
  )

  const conferenceNumericId = useMemo(() => toNumericId(conferenceId), [conferenceId])
  const submissionNumericId = useMemo(() => toNumericId(submissionId), [submissionId])

  const currentUser = useMemo(
    () => buildCurrentUser("author", user?.email, user?.name),
    [user?.email, user?.name],
  )
  const settings = useMemo(() => buildDiscussionSettings("author", discussionConfig), [discussionConfig])

  const loadThreads = useCallback(async () => {
    if (!conferenceNumericId || !submissionNumericId) {
      setLoading(false)
      setError("Invalid discussion context")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const threadResponse = await getThreads(conferenceNumericId, submissionNumericId)
      const messageEntries = await Promise.all(
        threadResponse.threads.map(async (thread) => {
          const messagesResponse = await getMessages(thread.id)
          return [thread.id, messagesResponse.messages] as const
        }),
      )
      const messagesByThread = Object.fromEntries(messageEntries)
      const nextThreads = buildDiscussionThreads(
        "author",
        threadResponse.threads,
        messagesByThread,
        user?.email,
      )
      setThreads(nextThreads)
      onThreadCountChange?.(nextThreads.length)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load discussions")
    } finally {
      setLoading(false)
    }
  }, [conferenceNumericId, submissionNumericId, user?.email, onThreadCountChange])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  useEffect(() => {
    void getConferenceById(conferenceId).then((response) => {
      if (!response.data?.configurations) {
        return
      }
      setDiscussionConfig({
        review_type: response.data.configurations.review_type,
        discussion_settings: response.data.configurations.discussion_settings,
      })
    })
  }, [conferenceId])

  const threadsWithCollapseState = useMemo(
    () =>
      threads.map((thread) => ({
        ...thread,
        isCollapsed: !!collapsedThreadIds[thread.id],
      })),
    [threads, collapsedThreadIds],
  )

  const handleCreateThread = useCallback(
    async (data: CreateThreadData) => {
      if (!conferenceNumericId || !submissionNumericId) {
        return
      }
      await createThread(conferenceNumericId, submissionNumericId, {
        title: data.title,
        content: data.content,
      })
      await loadThreads()
    },
    [conferenceNumericId, submissionNumericId, loadThreads],
  )

  const handleReplyToThread = useCallback(
    async (threadId: string, content: string) => {
      const threadNumericId = toNumericId(threadId)
      if (!threadNumericId) {
        return
      }
      await createMessage(threadNumericId, { content })
      await loadThreads()
    },
    [loadThreads],
  )

  const handleToggleCollapse = useCallback((threadId: string) => {
    setCollapsedThreadIds((prev) => ({
      ...prev,
      [threadId]: !prev[threadId],
    }))
  }, [])

  if (loading) {
    return <div className="text-xs text-slate-500">Loading discussions...</div>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        Failed to load discussions: {error}
      </div>
    )
  }

  return (
    <DiscussionPanel
      threads={threadsWithCollapseState}
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
