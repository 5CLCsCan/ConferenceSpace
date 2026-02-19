"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Plus, Clock } from "lucide-react"
import { getThreads, type DiscussionThread } from "@/lib/api/discussions"
import { formatDistanceToNow } from "date-fns"
import { DiscussionCreateModal } from "./discussion-create-modal"
import { DiscussionThreadView } from "./discussion-thread-view"

interface DiscussionThreadListProps {
  conferenceId: number
  submissionId: number
  canCreateThread: boolean // Only reviewers can create threads
  userRole: "reviewer" | "author" | "chair"
}

export function DiscussionThreadList({
  conferenceId,
  submissionId,
  canCreateThread,
  userRole,
}: DiscussionThreadListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null)

  const { data, error, isLoading, mutate } = useSWR(
    [`discussions-${conferenceId}-${submissionId}`, conferenceId, submissionId],
    () => getThreads(conferenceId, submissionId),
  )

  const handleThreadCreated = () => {
    setShowCreateModal(false)
    mutate()
  }

  const handleBackToList = () => {
    setSelectedThreadId(null)
    mutate() // Refresh to get updated message counts
  }

  if (selectedThreadId) {
    return (
      <DiscussionThreadView
        threadId={selectedThreadId}
        userRole={userRole}
        onBack={handleBackToList}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">Failed to load discussions</div>
    )
  }

  const threads = data?.threads || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Discussion Threads</h3>
        {canCreateThread && (
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        )}
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {canCreateThread
                ? "No discussions yet. Start a new thread to discuss with the author."
                : "No discussions yet. Reviewers will start discussions here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onClick={() => setSelectedThreadId(thread.id)}
            />
          ))}
        </div>
      )}

      <DiscussionCreateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        conferenceId={conferenceId}
        submissionId={submissionId}
        onCreated={handleThreadCreated}
      />
    </div>
  )
}

interface ThreadCardProps {
  thread: DiscussionThread
  onClick: () => void
}

function ThreadCard({ thread, onClick }: ThreadCardProps) {
  const reviewerName = thread.reviewer_first_name && thread.reviewer_last_name
    ? `${thread.reviewer_first_name} ${thread.reviewer_last_name}`
    : thread.reviewer_email || "Reviewer"

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{thread.title}</CardTitle>
            <p className="text-sm text-muted-foreground">Started by {reviewerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {thread.message_count}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
          </span>
          {thread.last_message_at && (
            <span>
              Last message {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}
