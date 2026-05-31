"use client"

import { useCallback, useEffect, useState } from "react"
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
import { useTranslation } from "@/lib/i18n/translation-context"
import { trackUsageEvent } from "@/lib/usage-events"

const DECLINE_CATEGORIES = [
  { id: "not_my_expertise", labelKey: "text_not_my_expertise" },
  { id: "too_busy", labelKey: "text_too_busy" },
  { id: "schedule_conflict", labelKey: "text_schedule_conflict" },
  { id: "conflict_of_interest", labelKey: "text_conflict_of_interest" },
  { id: "other", labelKey: "text_other" },
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
  const { t } = useTranslation()
  const T = useCallback(
    (key: string, values?: Record<string, string | number>) =>
      t(`runtime.components.reviewer.invitation-dialog.${key}`, values),
    [t],
  )
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
        setError(error || T("text_failed_to_load_invitation"))
        setState("error")
        return
      }
      setInvitation(data)
      setState("pending")
    })
    return () => {
      cancelled = true
    }
  }, [T, open, assignmentId, user?.email])

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
    trackUsageEvent("review_invitation_accepted", {
      role: "reviewer",
      entityType: "assignment",
      entityId: assignmentId,
    })
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
    trackUsageEvent("review_invitation_declined", {
      role: "reviewer",
      entityType: "assignment",
      entityId: assignmentId,
      metadata: { declineCategory: selectedCategory },
    })
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
            {invitation?.conference_name ?? T("text_review_invitation")}
          </p>
          <DialogTitle className="text-sm font-bold text-[#1B3C53]">
            {T("text_review_invitation")}
          </DialogTitle>
          <DialogDescription className="sr-only">{T("text_dialog_description")}</DialogDescription>
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
              <p className="text-xs font-semibold text-red-700 mb-1">{T("text_failed_to_load")}</p>
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
                    {T("text_paper")}
                  </p>
                  <p className="text-xs font-bold text-[#1B3C53]">{invitation.paper_title}</p>
                </div>
                {invitation.paper_abstract && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {T("text_abstract")}
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
                  {T("text_why_match")}
                </p>

                {invitation.evidence &&
                (invitation.evidence.matched_keywords.length > 0 || scorePercent != null) ? (
                  <div className="flex flex-col gap-3">
                    {scorePercent != null && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-slate-500">
                            {T("text_match_score")}
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
                          {T("text_matched_keywords")}
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
                      {T("text_you_currently_have")}{" "}
                      <span className="font-semibold text-slate-600">
                        {invitation.evidence.assignment_count} paper
                        {invitation.evidence.assignment_count !== 1 ? "s" : ""}
                      </span>{" "}
                      {T("text_assigned_in_this_conference")}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500">{T("text_selected_by_committee")}</p>
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
                    {T("text_accept_assignment")}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-[10px] font-semibold h-8 px-4 border-slate-200 text-slate-600 hover:text-slate-900"
                    onClick={() => setState("declining")}
                    disabled={isSubmitting}
                  >
                    {T("text_decline")}
                  </Button>
                </div>
              )}

              {/* Decline form */}
              {state === "declining" && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col gap-3">
                  <p className="text-[10px] font-bold text-slate-700">
                    {T("text_tell_us_why_optional")}
                  </p>
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
                        {T(cat.labelKey)}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder={T("placeholder_additional_comments")}
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
                      {T("text_confirm_decline")}
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
                      {T("text_cancel")}
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
