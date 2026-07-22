"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DiscussionPanel, type CreateThreadData } from "@/components/shared/discussion"
import { useAuth } from "@/lib/auth-context"
import { createMessage, createThread, getMessages, getThreads } from "@/lib/api/discussions"
import { getConferenceById } from "@/lib/api/conferences"
import {
  buildCurrentUser,
  buildDiscussionSettings,
  buildDiscussionThreads,
  type DiscussionConfigAdapter,
} from "@/components/shared/discussion/api-adapter"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ChairDiscussionTabProps {
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
 * ChairDiscussionTab - Chair-specific wrapper for the shared DiscussionPanel
 *
 * This component provides the chair perspective for paper discussions.
 * Chairs have elevated privileges:
 * - Can see all visibility levels (committee, reviewers, authors)
 * - Can moderate discussions (pin, resolve, flag threads)
 * - Can post with any visibility level
 * - Can see reviewer identities in double-blind reviews
 */
export function ChairDiscussionTab({
  conferenceId,
  submissionId,
  onThreadCountChange,
}: ChairDiscussionTabProps) {
  const { t } = useTranslation()
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
    () => buildCurrentUser("chair", user?.email, user?.name),
    [user?.email, user?.name],
  )
  const settings = useMemo(
    () => buildDiscussionSettings("chair", discussionConfig),
    [discussionConfig],
  )

  useEffect(() => {
    if (!conferenceId) {
      return
    }

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

  const loadThreads = useCallback(async (showLoading = true) => {
    if (!conferenceNumericId || !submissionNumericId) {
      setLoading(false)
      setError("Invalid discussion context")
      return
    }

    if (showLoading) {
      setLoading(true)
    }
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
        "chair",
        threadResponse.threads,
        messagesByThread,
        user?.email,
      )
      setThreads(nextThreads)
      onThreadCountChange?.(nextThreads.length)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load discussions")
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [conferenceNumericId, submissionNumericId, user?.email, onThreadCountChange])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

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
        visibility: data.visibility,
      })
      await loadThreads(false)
    },
    [conferenceNumericId, submissionNumericId, loadThreads],
  )

  const handleReplyToThread = useCallback(
    async (threadId: string, content: string) => {
      const threadNumericId = toNumericId(threadId)
      if (!threadNumericId) {
        return
      }
      const message = await createMessage(threadNumericId, { content })
      setThreads((current) =>
        current.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                lastActivity: t("common.time.justNow"),
                messageCount: thread.messageCount + 1,
                messages: [
                  ...thread.messages,
                  {
                    id: String(message.id),
                    author: currentUser,
                    content: message.content,
                    timestamp: message.created_at,
                    relativeTime: t("common.time.justNow"),
                  },
                ],
              }
            : thread,
        ),
      )
      void loadThreads(false)
    },
    [currentUser, loadThreads],
  )

  const handleToggleCollapse = useCallback((threadId: string) => {
    setCollapsedThreadIds((prev) => ({
      ...prev,
      [threadId]: !prev[threadId],
    }))
  }, [])

  if (loading) {
    return (
      <div className="text-xs text-slate-500">
        {t(
          "runtime.components.chair.conference-detail.submission-detail.chair-discussion-tab.text_loading_discussions",
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {t(
          "runtime.components.chair.conference-detail.submission-detail.chair-discussion-tab.text_failed_to_load_discussions",
        )}{" "}
        {error}
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
      // Chair can see and post to all visibility levels
      availableVisibilities={["committee", "reviewers", "authors"]}
    />
  )
}
