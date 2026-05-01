"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getInvitation, respondToInvitation, type InvitationData } from "@/lib/api/suggestions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const DECLINE_CATEGORIES = [
  { id: "not_my_expertise", label: "Not my expertise" },
  { id: "too_busy", label: "Too busy" },
  { id: "schedule_conflict", label: "Schedule conflict" },
  { id: "conflict_of_interest", label: "Conflict of interest" },
  { id: "other", label: "Other" },
]

type DialogState = "loading" | "pending" | "declining" | "error"

interface InvitationDialogProps {
  assignmentId: number | null
  open: boolean
  onClose: () => void
  onResponded: (assignmentId: number, newStatus: "accepted" | "declined") => void
}

export function InvitationDialog({
  assignmentId,
  open,
  onClose,
  onResponded,
}: InvitationDialogProps) {
  const { user } = useAuth()
  const [state, setState] = useState<DialogState>("loading")
  const [submittingAction, setSubmittingAction] = useState<"accept" | "decline" | null>(null)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")

  // Reset and fetch whenever dialog opens for a new assignment
  useEffect(() => {
    if (!open || !assignmentId || !user?.email) return
    setState("loading")
    setInvitation(null)
    setError(null)
    setSelectedCategory(null)
    setDeclineReason("")
    setSubmittingAction(null)

    let cancelled = false
    getInvitation(user.email, assignmentId).then(({ data, error }) => {
      if (cancelled) return
      if (error || !data) {
        setError(error || "Failed to load invitation")
        setState("error")
        return
      }
      setInvitation(data)
      setState("pending")
    })
    return () => {
      cancelled = true
    }
  }, [open, assignmentId, user?.email])

  // Note: we deliberately keep `state` as "pending"/"declining" during submit so the
  // buttons stay visible (just disabled). Per-button spinner is keyed off `submittingAction`.
  const handleAccept = async () => {
    if (!user?.email || !assignmentId) return
    setSubmittingAction("accept")
    const { error } = await respondToInvitation(user.email, assignmentId, { action: "accept" })
    setSubmittingAction(null)
    if (error) {
      setError(error)
      return
    }
    onResponded(assignmentId, "accepted")
    onClose()
  }

  const handleDecline = async () => {
    if (!user?.email || !assignmentId) return
    setSubmittingAction("decline")
    const { error } = await respondToInvitation(user.email, assignmentId, {
      action: "decline",
      decline_category: selectedCategory ?? undefined,
      decline_reason: declineReason.trim() || undefined,
    })
    setSubmittingAction(null)
    if (error) {
      setError(error)
      return
    }
    onResponded(assignmentId, "declined")
    onClose()
  }

  const scorePercent =
    invitation?.evidence?.score != null ? Math.round(invitation.evidence.score * 100) : null
  const isSubmitting = submittingAction !== null

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isSubmitting) return
        if (!isOpen) onClose()
      }}
    >
      <DialogContent
        className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto p-0 gap-0"
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {invitation?.conference_name ?? "Review Invitation"}
          </p>
          <DialogTitle className="text-sm font-bold text-[#1B3C53]">
            Review Invitation
          </DialogTitle>
          <DialogDescription className="sr-only">
            Paper review invitation details and response
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-5">
          {/* Loading */}
          {state === "loading" && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-5 animate-spin text-slate-400" />
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700 mb-1">Failed to load</p>
              <p className="text-[10px] text-red-500">{error}</p>
            </div>
          )}

          {/* Content */}
          {(state === "pending" || state === "declining") && invitation && (
            <>
              {/* Paper card */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Paper
                  </p>
                  <p className="text-xs font-bold text-[#1B3C53]">{invitation.paper_title}</p>
                </div>
                {invitation.paper_abstract && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Abstract
                    </p>
                    <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-4">
                      {invitation.paper_abstract}
                    </p>
                  </div>
                )}
              </div>

              {/* Evidence card */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Why you&apos;re a great match
                </p>

                {invitation.evidence &&
                (invitation.evidence.matched_keywords.length > 0 || scorePercent != null) ? (
                  <div className="flex flex-col gap-3">
                    {scorePercent != null && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-slate-500">
                            Match Score
                          </span>
                          <span className="text-[10px] font-bold text-green-700">
                            {scorePercent}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all"
                            style={{ width: `${scorePercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {invitation.evidence.matched_keywords.length > 0 && (
                      <div>
                        <p className="text-[10px] font-medium text-slate-500 mb-1.5">
                          Matched Keywords
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {invitation.evidence.matched_keywords.map((kw) => (
                            <span
                              key={kw}
                              className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 border border-green-200"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400">
                      You currently have{" "}
                      <span className="font-semibold text-slate-600">
                        {invitation.evidence.assignment_count} paper
                        {invitation.evidence.assignment_count !== 1 ? "s" : ""}
                      </span>{" "}
                      assigned in this conference.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500">
                    You were selected by the program committee based on your expertise and research
                    background.
                  </p>
                )}
              </div>

              {/* Inline error after failed submit */}
              {error && (state === "pending" || state === "declining") && (
                <p className="text-[10px] text-red-600 font-medium">{error}</p>
              )}

              {/* Accept / Decline buttons */}
              {state === "pending" && (
                <div className="flex gap-2">
                  <Button
                    className="bg-[#1B3C53] text-white hover:bg-[#234C6A] text-[10px] font-semibold h-8 px-4"
                    onClick={handleAccept}
                    disabled={isSubmitting}
                  >
                    {submittingAction === "accept" && (
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    )}
                    Accept Assignment
                  </Button>
                  <Button
                    variant="outline"
                    className="text-[10px] font-semibold h-8 px-4 border-slate-200 text-slate-600 hover:text-slate-900"
                    onClick={() => setState("declining")}
                    disabled={isSubmitting}
                  >
                    Decline
                  </Button>
                </div>
              )}

              {/* Decline form */}
              {state === "declining" && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col gap-3">
                  <p className="text-[10px] font-bold text-slate-700">Tell us why (optional)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DECLINE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                        }
                        className={`rounded-full border text-[10px] px-3 py-1 transition-colors cursor-pointer ${
                          selectedCategory === cat.id
                            ? "bg-[#1B3C53] text-white border-[#1B3C53]"
                            : "border-slate-200 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Additional comments (optional)..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[10px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1B3C53] resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="bg-[#1B3C53] text-white hover:bg-[#234C6A] text-[10px] font-semibold h-8 px-4"
                      onClick={handleDecline}
                      disabled={isSubmitting}
                    >
                      {submittingAction === "decline" && (
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      )}
                      Confirm Decline
                    </Button>
                    <Button
                      variant="outline"
                      className="text-[10px] font-semibold h-8 px-4 border-slate-200 text-slate-600"
                      onClick={() => {
                        setState("pending")
                        setError(null)
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
