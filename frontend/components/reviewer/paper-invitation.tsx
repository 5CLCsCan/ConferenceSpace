"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSWRConfig } from "swr"
import { useAuth } from "@/lib/auth-context"
import { getInvitation, respondToInvitation, type InvitationData } from "@/lib/api/suggestions"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/translation-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ArrowLeft, Loader2 } from "lucide-react"
import { InvitationSubmissionPreview } from "./invitation-submission-preview"
import { trackUsageEvent } from "@/lib/usage-events"

const DECLINE_CATEGORIES = [
  { id: "not_my_expertise", labelKey: "text_not_my_expertise" },
  { id: "too_busy", labelKey: "text_too_busy" },
  { id: "schedule_conflict", labelKey: "text_schedule_conflict" },
  { id: "conflict_of_interest", labelKey: "text_conflict_of_interest" },
  { id: "other", labelKey: "text_other" },
]

type PageState = "loading" | "pending" | "declining" | "error"

export function PaperInvitation() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()
  const T = useCallback(
    (key: string, values?: Record<string, string | number>) =>
      t(`runtime.components.reviewer.paper-invitation.${key}`, values),
    [t],
  )
  const { mutate } = useSWRConfig()

  const assignmentId = Number(params?.assignmentId)

  const [state, setState] = useState<PageState>("loading")
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user?.email || !assignmentId) return

    getInvitation(user.email, assignmentId).then(({ data, error }) => {
      if (error || !data) {
        setError(error || T("text_failed_to_load_invitation"))
        setState("error")
        return
      }
      setInvitation(data)
      if (data.status === "accepted" || data.status === "declined") {
        router.back()
        return
      }
      setState("pending")
    })
  }, [T, router, user?.email, assignmentId])

  const handleAccept = async () => {
    if (!user?.email) return
    setIsSubmitting(true)
    const { data, error } = await respondToInvitation(user.email, assignmentId, {
      action: "accept",
    })
    setIsSubmitting(false)
    if (error || !data) {
      setError(error || T("text_failed_to_accept"))
      return
    }
    trackUsageEvent("review_invitation_accepted", {
      role: "reviewer",
      entityType: "assignment",
      entityId: assignmentId,
    })
    await mutate((key) => Array.isArray(key) && key[0] === "conference-papers")
    toast({
      title: T("text_assignment_accepted"),
      description: T("text_assignment_accepted_description", {
        title: invitation?.paper_title ?? "",
      }),
    })
    router.back()
  }

  const handleDecline = async () => {
    if (!user?.email) return
    setIsSubmitting(true)
    const { data, error } = await respondToInvitation(user.email, assignmentId, {
      action: "decline",
      decline_category: selectedCategory ?? undefined,
      decline_reason: declineReason.trim() || undefined,
    })
    setIsSubmitting(false)
    if (error || !data) {
      setError(error || T("text_failed_to_decline"))
      return
    }
    trackUsageEvent("review_invitation_declined", {
      role: "reviewer",
      entityType: "assignment",
      entityId: assignmentId,
      metadata: { declineCategory: selectedCategory },
    })
    await mutate((key) => Array.isArray(key) && key[0] === "conference-papers")
    toast({
      title: T("text_assignment_declined"),
      description: T("text_assignment_declined_description", {
        title: invitation?.paper_title ?? "",
      }),
    })
    router.back()
  }

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="py-8 px-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 max-w-xl">
          <p className="text-sm font-semibold text-red-700 mb-1">
            {T("text_failed_to_load_invitation")}
          </p>
          <p className="text-xs text-red-500">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" /> {T("text_go_back")}
          </button>
        </div>
      </div>
    )
  }

  const closeDeclineDialog = () => {
    if (isSubmitting) return
    setSelectedCategory(null)
    setDeclineReason("")
    setState("pending")
  }

  return (
    <>
      {(state === "pending" || state === "declining") && invitation && (
        <InvitationSubmissionPreview
          invitation={invitation}
          isSubmitting={isSubmitting}
          onBack={() => router.back()}
          onAccept={handleAccept}
          onDeny={() => setState("declining")}
        />
      )}

      <Dialog
        open={state === "declining"}
        onOpenChange={(open) => {
          if (!open) closeDeclineDialog()
        }}
      >
        <DialogContent className="sm:max-w-[480px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-sm font-bold text-[#1B3C53]">
              {T("text_decline_assignment")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {T("text_select_decline_reason")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-6 py-5">
            <p className="text-xs font-bold text-slate-700">{T("text_tell_us_why_optional")}</p>

            <div className="flex flex-wrap gap-2">
              {DECLINE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1B3C53] resize-none"
            />

            {error && state === "declining" && (
              <p className="text-[10px] text-red-600 font-medium">{error}</p>
            )}

            <div className="flex gap-2">
              <Button
                className="bg-[#1B3C53] text-white hover:bg-[#234C6A] text-xs font-semibold h-9 px-5"
                onClick={handleDecline}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                {T("text_confirm_decline")}
              </Button>
              <Button
                variant="outline"
                className="text-xs font-semibold h-9 px-4 border-slate-200 text-slate-600"
                onClick={closeDeclineDialog}
                disabled={isSubmitting}
              >
                {T("text_cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
