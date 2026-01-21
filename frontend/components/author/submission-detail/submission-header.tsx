"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import type { Submission } from "@/lib/api/submissions"

interface SubmissionHeaderProps {
  submission: Submission
  conferenceId: string
  conferenceName?: string
  onDecision?: (decision: "accepted" | "rejected") => void
}

export function SubmissionHeader({
  submission,
  conferenceId,
  conferenceName,
  onDecision,
}: SubmissionHeaderProps) {
  const { t } = useTranslation()
  const { user, currentRole } = useAuth()
  const isAuthor = user?.email === submission.author
  const isChair = currentRole === "chair"

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: {
        label: t("draft"),
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      published: {
        label: t("published"),
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      under_review: {
        label: "Under Review",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      accepted: {
        label: t("accepted", { defaultValue: "Accepted" }),
        className: "bg-green-100 text-green-800 border-green-200",
      },
      rejected: {
        label: t("rejected", { defaultValue: "Rejected" }),
        className: "bg-red-100 text-red-800 border-red-200",
      },
    }

    const config = statusConfig[status] || {
      label: status,
      className: "bg-slate-100 text-slate-800 border-slate-200",
    }

    return (
      <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/dashboard/author/submissions" className="hover:text-[#1e3a8a] hover:underline">
          My Submissions
        </Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-[#141414] font-medium">Submission #{submission.id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {getStatusBadge(submission.status)}
            <span className="text-sm font-mono text-neutral-400">#{submission.id}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#141414] tracking-tight">
            {submission.title}
          </h1>
          <p className="text-neutral-500 mt-1 text-sm">
            Submitted to{" "}
            <Link
              href={`/dashboard/conference/${conferenceId}`}
              className="font-semibold text-[#1e3a8a] hover:underline"
            >
              {conferenceName || "Conference"}
            </Link>
            {submission.information?.track_name && (
              <>
                {" "}
                • Track: <span className="font-medium">{submission.information.track_name}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          {/* Chair Decision Dropdown */}
          {isChair && onDecision && (
            <Select
              value={
                ["accepted", "rejected"].includes(submission.status)
                  ? submission.status
                  : "__current"
              }
              onValueChange={(value) => onDecision(value as "accepted" | "rejected")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("dashboard.chair.submissions.decision")} />
              </SelectTrigger>
              <SelectContent>
                {!["accepted", "rejected"].includes(submission.status) && (
                  <SelectItem value="__current" disabled>
                    {t(`dashboard.submissions.status.${submission.status}`, {
                      defaultValue: submission.status,
                    })}
                  </SelectItem>
                )}
                <SelectItem value="accepted">
                  <span className="font-bold text-green-700">
                    {t("common.actions.accept", { defaultValue: "Accept" })}
                  </span>
                </SelectItem>
                <SelectItem value="rejected">
                  <span className="font-bold text-red-700">
                    {t("common.actions.decline", { defaultValue: "Reject" })}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {isAuthor && submission.status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:text-[#141414] shadow-sm"
              asChild
            >
              <Link
                href={`/dashboard/author/submit?conference=${conferenceId}&edit=${submission.id}`}
              >
                <span className="material-symbols-outlined text-[20px]">edit_document</span>
                Edit Submission
              </Link>
            </Button>
          )}
          <Button className="bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">upload</span>
            Upload Revision
          </Button>
        </div>
      </div>
    </>
  )
}
