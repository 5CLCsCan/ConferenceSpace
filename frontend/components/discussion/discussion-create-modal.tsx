"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createThread } from "@/lib/api/discussions"
import { toast } from "@/hooks/use-toast"

interface DiscussionCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conferenceId: number
  submissionId: number
  onCreated: () => void
}

export function DiscussionCreateModal({
  open,
  onOpenChange,
  conferenceId,
  submissionId,
  onCreated,
}: DiscussionCreateModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both a title and message",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createThread(conferenceId, submissionId, {
        title: title.trim(),
        content: content.trim(),
      })

      toast({
        title: "Thread Created",
        description: "Your discussion thread has been created",
      })

      // Reset form
      setTitle("")
      setContent("")
      onCreated()
    } catch (error) {
      console.error("Failed to create thread:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create thread",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start New Discussion</DialogTitle>
          <DialogDescription>
            Create a discussion thread with the author about this submission.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Question about methodology"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                placeholder="Write your question or comment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
              {isSubmitting ? "Creating..." : "Create Thread"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
