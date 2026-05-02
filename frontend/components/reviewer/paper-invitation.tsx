"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getInvitation, respondToInvitation, type InvitationData } from "@/lib/api/suggestions"
import { useTranslation } from "@/lib/i18n/translation-context"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from "lucide-react"

const DECLINE_CATEGORIES = [
  { id: "not_my_expertise" },
  { id: "too_busy" },
  { id: "schedule_conflict" },
  { id: "conflict_of_interest" },
  { id: "other" },
] as const

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
  const { t } = useTranslation()

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
        setError(
          error || t("runtime.components.reviewer.paper-invitation.text_failed_to_load_invitation"),
        )
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
  }, [assignmentId, t, user?.email])

  const handleAccept = async () => {
    if (!user?.email) return
    setIsSubmitting(true)
    const { data, error } = await respondToInvitation(user.email, assignmentId, {
      action: "accept",
    })
    setIsSubmitting(false)
    if (error || !data) {
      setError(error || t("runtime.components.reviewer.paper-invitation.text_failed_to_accept"))
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
      setError(error || t("runtime.components.reviewer.paper-invitation.text_failed_to_decline"))
      return
    }
    setState("declined")
  }

  const scorePercent =
    invitation?.evidence?.score != null ? Math.round(invitation.evidence.score * 100) : null
  const declineCategoryLabels = {
    not_my_expertise: t(
      "runtime.components.reviewer.paper-invitation.text_decline_reason_not_my_expertise",
    ),
    too_busy: t("runtime.components.reviewer.paper-invitation.text_decline_reason_too_busy"),
    schedule_conflict: t(
      "runtime.components.reviewer.paper-invitation.text_decline_reason_schedule_conflict",
    ),
    conflict_of_interest: t(
      "runtime.components.reviewer.paper-invitation.text_decline_reason_conflict_of_interest",
    ),
    other: t("runtime.components.reviewer.paper-invitation.text_decline_reason_other"),
  } as const

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
            {t("runtime.components.reviewer.paper-invitation.text_failed_to_load_invitation")}
          </p>
          <p className="text-xs text-red-500">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" />{" "}
            {t("runtime.components.reviewer.paper-invitation.text_go_back")}
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
              <p className="text-sm font-bold text-green-800">
                {t("runtime.components.reviewer.paper-invitation.text_assignment_accepted")}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {t(
                  "runtime.components.reviewer.paper-invitation.text_assignment_accepted_description",
                  {
                    title: invitation?.paper_title ?? "",
                  },
                )}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="self-start bg-[#1B3C53] text-white hover:bg-[#234C6A] text-xs"
            onClick={() => router.push(`/role/reviewer/assignments/${assignmentId}`)}
          >
            {t("runtime.components.reviewer.paper-invitation.text_go_to_review")}
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
              <p className="text-sm font-bold text-slate-700">
                {t("runtime.components.reviewer.paper-invitation.text_assignment_declined")}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  "runtime.components.reviewer.paper-invitation.text_assignment_declined_description",
                  {
                    title: invitation?.paper_title ?? "",
                  },
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/role/reviewer")}
            className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B3C53] hover:text-[#234C6A]"
          >
            <ArrowLeft className="size-3.5" />{" "}
            {t("runtime.components.reviewer.paper-invitation.text_back_to_dashboard")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-8 px-12 max-w-2xl">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 self-start"
      >
        <ArrowLeft className="size-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {t("runtime.components.reviewer.paper-invitation.text_back")}
        </span>
      </button>

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          {invitation?.conference_name}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[#1B3C53] leading-tight">
          {t("runtime.components.reviewer.paper-invitation.text_review_invitation")}
        </h1>
      </div>

      {/* Paper card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {t("runtime.components.reviewer.paper-invitation.text_paper")}
          </p>
          <p className="text-sm font-bold text-[#1B3C53]">{invitation?.paper_title}</p>
        </div>
        {invitation?.paper_abstract && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {t("runtime.components.reviewer.paper-invitation.text_abstract")}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
              {invitation.paper_abstract}
            </p>
          </div>
        )}
      </div>

      {/* Evidence card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {t("runtime.components.reviewer.paper-invitation.text_why_you_are_a_great_match")}
        </p>

        {invitation?.evidence &&
        (invitation.evidence.matched_keywords.length > 0 || invitation.evidence.score != null) ? (
          <div className="flex flex-col gap-3">
            {/* Score bar */}
            {scorePercent != null && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-slate-500">
                    {t("runtime.components.reviewer.paper-invitation.text_match_score")}
                  </span>
                  <span className="text-[10px] font-bold text-green-700">{scorePercent}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Matched keywords */}
            {invitation.evidence.matched_keywords.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-slate-500 mb-1.5">
                  {t("runtime.components.reviewer.paper-invitation.text_matched_keywords")}
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

            {/* Assignment load */}
            <p className="text-[10px] text-slate-400">
              {t("runtime.components.reviewer.paper-invitation.text_you_currently_have")}{" "}
              <span className="font-semibold text-slate-600">
                {invitation.evidence.assignment_count} paper
                {invitation.evidence.assignment_count !== 1 ? "s" : ""}
              </span>{" "}
              {t("runtime.components.reviewer.paper-invitation.text_assigned_in_this_conference")}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            {t("runtime.components.reviewer.paper-invitation.text_selected_based_on_expertise")}
          </p>
        )}
      </div>

      {/* Actions */}
      {state === "pending" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              className="bg-[#1B3C53] text-white hover:bg-[#234C6A] text-xs font-semibold h-9 px-5"
              onClick={handleAccept}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              {t("runtime.components.reviewer.paper-invitation.text_accept_assignment")}
            </Button>
            <Button
              variant="outline"
              className="text-xs font-semibold h-9 px-5 border-slate-200 text-slate-600 hover:text-slate-900"
              onClick={() => setState("declining")}
              disabled={isSubmitting}
            >
              {t("runtime.components.reviewer.paper-invitation.text_decline")}
            </Button>
          </div>
        </div>
      )}

      {/* Decline dialog */}
      {state === "declining" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-4">
          <p className="text-xs font-bold text-slate-700">
            {t("runtime.components.reviewer.paper-invitation.text_tell_us_why_optional")}
          </p>

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
                {declineCategoryLabels[cat.id]}
              </button>
            ))}
          </div>

          {/* Text reason */}
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder={t(
              "runtime.components.reviewer.paper-invitation.placeholder_additional_comments_optional",
            )}
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
              {t("runtime.components.reviewer.paper-invitation.text_confirm_decline")}
            </Button>
            <Button
              variant="outline"
              className="text-xs font-semibold h-9 px-4 border-slate-200 text-slate-600"
              onClick={() => setState("pending")}
              disabled={isSubmitting}
            >
              {t("runtime.components.reviewer.paper-invitation.text_cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
