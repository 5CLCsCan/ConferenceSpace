"use client"

import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { InvitationData } from "@/lib/api/suggestions"
import { AbstractCard, AIAssistantCard } from "./submission-review/review-sidebar"
import { PaperHeader } from "./submission-review/review-header"
import type { SubmissionDetails } from "./submission-review/types"

interface InvitationSubmissionPreviewProps {
  invitation: InvitationData
  isSubmitting: boolean
  onBack: () => void
  onAccept: () => void
  onDeny: () => void
}

export function InvitationSubmissionPreview({
  invitation,
  isSubmitting,
  onBack,
  onAccept,
  onDeny,
}: InvitationSubmissionPreviewProps) {
  const scorePercent =
    invitation.evidence?.score != null
      ? Math.min(100, Math.max(0, Math.round(invitation.evidence.score * 100)))
      : null
  const hasDecisionContext = Boolean(invitation.conference_id && invitation.submission_id)

  if (!hasDecisionContext) {
    return (
      <div className="px-8 py-8 md:px-12">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <div className="max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-amber-900">Submission preview is unavailable</p>
          <p className="mt-2 text-xs leading-relaxed text-amber-800">
            This invitation is missing the conference or submission context required to show the
            reviewer detail and analysis tools.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button
              className="h-9 bg-[#1B3C53] px-4 text-[11px] font-bold text-white hover:bg-[#234C6A]"
              onClick={onAccept}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
              Accept
            </Button>
            <Button
              variant="outline"
              className="h-9 border-slate-200 px-4 text-[11px] font-bold text-slate-600 hover:text-slate-900"
              onClick={onDeny}
              disabled={isSubmitting}
            >
              Deny
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const submission: SubmissionDetails = {
    id: String(invitation.submission_id),
    submissionId: String(invitation.submission_id),
    title: invitation.paper_title,
    abstract: invitation.paper_abstract || "No abstract available.",
    keywords: invitation.keywords ?? [],
    track: invitation.track || "Unassigned",
    status: "pending",
    dueDate: "",
    daysLeft: 0,
    conference: {
      id: String(invitation.conference_id),
      acronym: invitation.conference_name,
      name: invitation.conference_name,
    },
    supplementaryMaterial: invitation.file_name
      ? {
          name: invitation.file_name,
          size: formatFileSize(invitation.file_size),
        }
      : undefined,
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7]">
      <div className="px-4 pt-4 md:px-8 xl:px-12">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      </div>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 md:px-8 xl:px-12">
        <PaperHeader
          submission={submission}
          actions={
            <div className="flex items-center gap-2">
              <Button
                className="h-9 bg-[#1B3C53] px-4 text-[11px] font-bold text-white hover:bg-[#234C6A]"
                onClick={onAccept}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                Accept
              </Button>
              <Button
                variant="outline"
                className="h-9 border-slate-200 px-4 text-[11px] font-bold text-slate-600 hover:text-slate-900"
                onClick={onDeny}
                disabled={isSubmitting}
              >
                Deny
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-4">
          <div className="xl:col-span-3">
            <AbstractCard submission={submission} />
          </div>

          <div className="space-y-4 xl:col-span-1">
            <AIAssistantCard
              conferenceId={String(invitation.conference_id)}
              assignmentId={String(invitation.assignment_id)}
              submissionId={String(invitation.submission_id)}
              submissionTitle={invitation.paper_title}
            />

            <InvitationEvidenceCard invitation={invitation} scorePercent={scorePercent} />
          </div>
        </div>
      </main>
    </div>
  )
}

function InvitationEvidenceCard({
  invitation,
  scorePercent,
}: {
  invitation: InvitationData
  scorePercent: number | null
}) {
  const evidence = invitation.evidence
  const matchedKeywords = evidence?.matched_keywords ?? []
  const hasEvidence = evidence && (matchedKeywords.length > 0 || scorePercent != null)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Why you're a great match
      </p>

      {hasEvidence ? (
        <div className="mt-4 space-y-3">
          {scorePercent != null && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500">Match Score</span>
                <span className="text-[10px] font-bold text-green-700">{scorePercent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
            </div>
          )}

          {matchedKeywords.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium text-slate-500">Matched Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {matchedKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-slate-400">
            You currently have{" "}
            <span className="font-semibold text-slate-600">
              {evidence.assignment_count} paper{evidence.assignment_count !== 1 ? "s" : ""}
            </span>{" "}
            assigned in this conference.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          You were selected by the program committee based on your expertise and research
          background.
        </p>
      )}
    </div>
  )
}

function formatFileSize(size?: number) {
  if (!size || size <= 0) {
    return "file attached"
  }
  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
