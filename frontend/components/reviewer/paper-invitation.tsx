"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getInvitation, respondToInvitation, type InvitationData } from "@/lib/api/suggestions"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from "lucide-react"
import { InvitationSubmissionPreview } from "./invitation-submission-preview"

const DECLINE_CATEGORIES = [
  { id: "not_my_expertise", label: "Not my expertise" },
  { id: "too_busy", label: "Too busy" },
  { id: "schedule_conflict", label: "Schedule conflict" },
  { id: "conflict_of_interest", label: "Conflict of interest" },
  { id: "other", label: "Other" },
]

type PageState =
  | "loading"
  | "pending"
  | "accepting"
  | "declining"
  | "accepted"
  | "declined"
  | "error"

export function PaperInvitation() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

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
        setError(error || "Failed to load invitation")
        setState("error")
        return
      }
      setInvitation(data)
      if (data.status === "accepted") {
        setState("accepted")
      } else if (data.status === "declined") {
        setState("declined")
      } else {
        setState("pending")
      }
    })
  }, [user?.email, assignmentId])

  const handleAccept = async () => {
    if (!user?.email) return
    setIsSubmitting(true)
    const { data, error } = await respondToInvitation(user.email, assignmentId, {
      action: "accept",
    })
    setIsSubmitting(false)
    if (error || !data) {
      setError(error || "Failed to accept")
      return
    }
    setState("accepted")
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
      setError(error || "Failed to decline")
      return
    }
    setState("declined")
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
          <p className="text-sm font-semibold text-red-700 mb-1">Failed to load invitation</p>
          <p className="text-xs text-red-500">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" /> Go back
          </button>
        </div>
      </div>
    )
  }

  if (state === "accepted") {
    return (
      <div className="py-8 px-12 max-w-xl">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="size-6 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">Assignment accepted</p>
              <p className="text-xs text-green-600 mt-0.5">
                You have accepted the invitation to review &ldquo;{invitation?.paper_title}&rdquo;.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="self-start bg-[#1B3C53] text-white hover:bg-[#234C6A] text-xs"
            onClick={() => router.push(`/role/reviewer/assignments/${assignmentId}`)}
          >
            Go to Review
          </Button>
        </div>
      </div>
    )
  }

  if (state === "declined") {
    return (
      <div className="py-8 px-12 max-w-xl">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <XCircle className="size-6 text-slate-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-700">Assignment declined</p>
              <p className="text-xs text-slate-500 mt-0.5">
                You have declined the invitation to review &ldquo;{invitation?.paper_title}&rdquo;.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/role/reviewer")}
            className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B3C53] hover:text-[#234C6A]"
          >
            <ArrowLeft className="size-3.5" /> Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {state === "pending" && invitation && (
        <InvitationSubmissionPreview
          invitation={invitation}
          isSubmitting={isSubmitting}
          onBack={() => router.back()}
          onAccept={handleAccept}
          onDeny={() => setState("declining")}
        />
      )}

      {state === "declining" && (
        <div className="mx-4 my-8 flex max-w-2xl flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:mx-12">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null)
              setDeclineReason("")
              setState("pending")
            }}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 self-start"
          >
            <ArrowLeft className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Back to preview</span>
          </button>
          <p className="text-xs font-bold text-slate-700">Tell us why (optional)</p>

          {/* Category chips */}
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
                {cat.label}
              </button>
            ))}
          </div>

          {/* Text reason */}
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Additional comments (optional)..."
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1B3C53] resize-none"
          />

          <div className="flex gap-2">
            <Button
              className="bg-[#1B3C53] text-white hover:bg-[#234C6A] text-xs font-semibold h-9 px-5"
              onClick={handleDecline}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              Confirm Decline
            </Button>
            <Button
              variant="outline"
              className="text-xs font-semibold h-9 px-4 border-slate-200 text-slate-600"
              onClick={() => {
                setSelectedCategory(null)
                setDeclineReason("")
                setState("pending")
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
