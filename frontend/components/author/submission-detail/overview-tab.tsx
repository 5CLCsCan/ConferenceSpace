"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { Submission } from "@/lib/api/submissions"
import { formatDate } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/translation-context"

interface OverviewTabProps {
  submission: Submission
  conferenceId: string
}

// --- File Type Icon (Scholar-Compact) ---
function FileTypeIcon({ type }: { type: "pdf" | "zip" | "doc" | "other" }) {
  const { t } = useTranslation()
  const config: Record<string, { icon: string; bgClass: string; textClass: string }> = {
    pdf: { icon: "picture_as_pdf", bgClass: "bg-red-50", textClass: "text-red-600" },
    zip: { icon: "folder_zip", bgClass: "bg-blue-50", textClass: "text-blue-600" },
    doc: { icon: "description", bgClass: "bg-indigo-50", textClass: "text-indigo-600" },
    other: { icon: "insert_drive_file", bgClass: "bg-slate-100", textClass: "text-slate-600" },
  }
  const { icon, bgClass, textClass } = config[type] || config.other
  return (
    <div
      className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgClass, textClass)}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </div>
  )
}

// --- Author Avatar (Scholar-Compact) ---
function AuthorAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"

  // Generate a consistent color based on name
  const colors = [
    "bg-emerald-100 text-emerald-700",
    "bg-orange-100 text-orange-700",
    "bg-slate-100 text-slate-500",
    "bg-indigo-100 text-indigo-700",
    "bg-pink-100 text-pink-700",
  ]
  const colorIndex = name.charCodeAt(0) % colors.length

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold flex-shrink-0",
        sizeClasses,
        colors[colorIndex],
      )}
    >
      {initials}
    </div>
  )
}

// --- Abstract Card (Scholar-Compact) ---
function AbstractCard({ abstract, keywords }: { abstract: string; keywords: string[] }) {
  const { t } = useTranslation()
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-4 tracking-tight">
        {t("runtime.components.author.submission-detail.overview-tab.text_abstract")}{" "}
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{abstract}</p>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium rounded-full"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Submission Files Card (Scholar-Compact) ---
function SubmissionFilesCard({
  submission,
  conferenceId,
  lastUpdated,
}: {
  submission: Submission
  conferenceId: string
  lastUpdated: string
}) {
  const { t } = useTranslation()
  const fileUrl = submission.file
    ? `/api/backend/api/v1/conferences/${conferenceId}/submissions/${submission.id}/file`
    : null

  const isPdfFile =
    submission.file?.mime_type === "application/pdf" ||
    submission.file?.original_name?.toLowerCase().endsWith(".pdf")

  const fileType: "pdf" | "zip" | "doc" | "other" = isPdfFile ? "pdf" : "zip"

  if (!submission.file) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
          {t("runtime.components.author.submission-detail.overview-tab.text_submission_files")}{" "}
        </h3>
        <span className="text-[10px] text-slate-400">
          {t("runtime.components.author.submission-detail.overview-tab.text_last_updated")}{" "}
          {lastUpdated}
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
          <FileTypeIcon type={fileType} />
          <div className="flex-1 min-w-0 ml-4">
            <h4 className="text-xs font-medium text-[#1B3C53] dark:text-white truncate">
              {submission.file.original_name}
            </h4>
            <p className="text-[10px] text-slate-500">
              {(submission.file.size / 1024 / 1024).toFixed(1)}{" "}
              {t("runtime.components.author.submission-detail.overview-tab.text_mb")}{" "}
              {submission.file.mime_type?.split("/")[1]?.toUpperCase() || "File"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPdfFile && (
              <button
                className="p-2 text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors"
                title={t("runtime.components.author.submission-detail.overview-tab.title_preview")}
                onClick={() => window.open(fileUrl!, "_blank")}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  visibility
                </span>
              </button>
            )}
            <a
              href={fileUrl || ""}
              download={submission.file.original_name}
              className="p-2 text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors"
              title={t("runtime.components.author.submission-detail.overview-tab.title_download")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                download
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Cover Letter Card (Collapsible, Scholar-Compact) ---
function CoverLetterCard({
  submission,
  conferenceId,
}: {
  submission: Submission
  conferenceId: string
}) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "20px" }}>
            mail
          </span>
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            {t("runtime.components.author.submission-detail.overview-tab.text_cover_letter")}{" "}
          </h3>
        </div>
        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "20px" }}>
          {isExpanded ? "expand_less" : "expand_more"}
        </span>
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 pt-0">
          {submission.cover_letter ? (
            <div className="flex items-center gap-4">
              <span
                className="material-symbols-outlined text-slate-400"
                style={{ fontSize: "20px" }}
              >
                description
              </span>
              <div className="flex-1">
                <p className="text-xs font-medium text-[#1B3C53] dark:text-white">
                  {submission.cover_letter.original_name}
                </p>
                <p className="text-[10px] text-slate-400">
                  {(submission.cover_letter.size / 1024 / 1024).toFixed(2)}{" "}
                  {t("runtime.components.author.submission-detail.overview-tab.text_mb_2")}{" "}
                </p>
              </div>
              <a
                href={`/api/backend/api/v1/conferences/${conferenceId}/submissions/${submission.id}/cover_letter`}
                download={submission.cover_letter.original_name}
                className="text-[11px] font-medium text-[#1B3C53] hover:underline"
              >
                {t("runtime.components.author.submission-detail.overview-tab.text_download")}{" "}
              </a>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {t(
                "runtime.components.author.submission-detail.overview-tab.text_no_cover_letter_attached",
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// --- Submission Meta Card (Sidebar, Scholar-Compact) ---
function SubmissionMetaCard({ submission }: { submission: Submission }) {
  const { t } = useTranslation()
  // Build authors list
  const authors = [
    { name: submission.author, isCorresponding: true },
    ...(submission.information?.co_authors?.map((email) => ({
      name: email,
      isCorresponding: false,
    })) || []),
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-4">
        {t("runtime.components.author.submission-detail.overview-tab.text_submission_meta")}{" "}
      </h3>
      <div className="space-y-6">
        {/* Authors */}
        <div>
          <h4 className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {t("runtime.components.author.submission-detail.overview-tab.text_author_s")}{" "}
          </h4>
          <div className="space-y-3">
            {authors.map((author, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <AuthorAvatar name={author.name} />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-[#1B3C53] dark:text-white truncate">
                    {author.name}
                    {author.isCorresponding && " (Corr.)"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conflicts of Interest */}
        <div>
          <h4 className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {t(
              "runtime.components.author.submission-detail.overview-tab.text_conflicts_of_interest",
            )}{" "}
          </h4>
          <div className="flex flex-wrap gap-2">
            {submission.domain && submission.domain.length > 0 ? (
              submission.domain.map((affiliation, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 text-[10px] text-[#1B3C53] dark:text-white font-medium bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  {affiliation}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">
                {t("runtime.components.author.submission-detail.overview-tab.text_none_declared")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Submission Status Card (Sidebar, Scholar-Compact) ---
interface StatusStep {
  id: string
  label: string
  date: string
  completed?: boolean
  current?: boolean
  pending?: boolean
}

export function SubmissionStatusCard({ submission }: { submission: Submission }) {
  const { t } = useTranslation()

  const stepIndex = (step: "submitted" | "bidding" | "rebuttal" | "decision") => {
    // step index in the 4-step timeline: 0=submitted,1=bidding,2=rebuttal,3=decision
    return { submitted: 0, bidding: 1, rebuttal: 2, decision: 3 }[step]
  }
  // Map submission.status to which timeline step is "current" (0-based)
  const currentStepIndex: number =
    {
      draft: 0,
      published: 1,
      reviewing: 2,
      accepted: 3,
      rejected: 3,
    }[submission.status] ?? 0

  const makeStep = (
    id: "submitted" | "bidding" | "rebuttal" | "decision",
    label: string,
    date: string,
  ): StatusStep => {
    const idx = stepIndex(id)
    const isTerminal = submission.status === "accepted" || submission.status === "rejected"
    if (idx < currentStepIndex) return { id, label, date, completed: true }
    if (idx === currentStepIndex) {
      // decision step is "current" only when accepted/rejected — treat as completed
      if (id === "decision" && isTerminal) return { id, label, date, completed: true }
      return { id, label, date, current: true }
    }
    return { id, label, date, pending: true }
  }

  const statusSteps: StatusStep[] = [
    makeStep(
      "submitted",
      t("runtime.components.author.submission-detail.overview-tab.prop_label_submitted"),
      formatDate(submission.created_at),
    ),
    makeStep(
      "bidding",
      t("runtime.components.author.submission-detail.overview-tab.prop_label_bidding_phase"),
      "Completed",
    ),
    makeStep(
      "rebuttal",
      t("runtime.components.author.submission-detail.overview-tab.prop_label_rebuttal_phase"),
      "Ends in 3 days",
    ),
    makeStep(
      "decision",
      t("runtime.components.author.submission-detail.overview-tab.prop_label_final_decision"),
      submission.status === "accepted"
        ? "Accepted"
        : submission.status === "rejected"
          ? "Rejected"
          : "Expected",
    ),
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-4">
        {t("runtime.components.author.submission-detail.overview-tab.text_submission_status")}{" "}
      </h3>
      <div className="relative pl-2 space-y-6">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-700" />
        {statusSteps.map((step) => (
          <div
            key={step.id}
            className={cn("relative flex gap-4 items-start", step.pending && "opacity-50")}
          >
            <div
              className={cn(
                "relative z-10 size-5 rounded-full shrink-0 mt-0.5 shadow-sm flex items-center justify-center",
                step.completed
                  ? "bg-[#1B3C53]"
                  : step.current
                    ? "bg-white border-4 border-blue-200"
                    : "bg-white border-2 border-slate-300",
              )}
            >
              {step.completed && (
                <svg
                  className="size-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {step.current && <div className="size-2 rounded-full bg-blue-500 animate-pulse" />}
            </div>
            <div>
              <p
                className={cn(
                  "text-xs font-bold mb-0.5",
                  step.completed
                    ? "text-[#1B3C53] dark:text-white"
                    : step.current
                      ? "text-[#1B3C53] dark:text-white"
                      : "text-slate-500",
                )}
              >
                {step.label}
              </p>
              <p className="text-[10px] text-slate-500">{step.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Withdraw Submission Card (Sidebar, Scholar-Compact) ---
function WithdrawSubmissionCard() {
  const { t } = useTranslation()
  return (
    <div className="border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-xl p-6">
      <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">
        {t("runtime.components.author.submission-detail.overview-tab.text_withdraw_submission")}
      </h3>
      <p className="text-xs text-red-600 dark:text-red-400/80 mb-3 leading-relaxed">
        {t(
          "runtime.components.author.submission-detail.overview-tab.text_withdrawing_your_paper_will_remove_it",
        )}{" "}
      </p>
      <button className="w-full h-8 bg-white dark:bg-transparent border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 font-bold rounded-md text-[11px] transition-colors shadow-sm">
        {t("runtime.components.author.submission-detail.overview-tab.text_withdraw_paper")}{" "}
      </button>
    </div>
  )
}

// --- Camera-Ready Upload Section ---
function CameraReadySection({
  submission,
  conferenceId,
  onUploaded,
}: {
  submission: Submission
  conferenceId: string
  onUploaded: (updated: Submission) => void
}) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const { submitCameraReady } = await import("@/lib/api/papers")
    const result = await submitCameraReady(conferenceId, String(submission.id), file)
    setUploading(false)
    if (result.error || !result.data) {
      setError(result.error ?? "Upload failed")
    } else {
      onUploaded(result.data)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-4 tracking-tight">
        {t("runtime.components.author.submission-detail.overview-tab.text_camera_ready_version")}{" "}</h3>
      {submission.camera_ready ? (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 text-red-600">
            <span className="material-symbols-outlined">picture_as_pdf</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {submission.camera_ready.original_name}
            </p>
            <p className="text-xs text-slate-500">
              {(submission.camera_ready.size / 1024 / 1024).toFixed(1)} {t("runtime.components.author.submission-detail.overview-tab.text_mb")}{" "}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 mb-4">{t("runtime.components.author.submission-detail.overview-tab.text_no_camera_ready_version_uploaded_yet")}</p>
      )}
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-xs px-3 py-1.5 rounded-lg bg-[#1B3C53] text-white hover:bg-[#1B3C53]/90 disabled:opacity-50"
      >
        {uploading ? "Uploading…" : submission.camera_ready ? "Replace File" : "Upload PDF"}
      </button>
    </div>
  )
}

// --- Main Component ---
export function OverviewTab({ submission, conferenceId }: OverviewTabProps) {
  const [localSubmission, setLocalSubmission] = useState(submission)
  const keywords = localSubmission.information?.keywords || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {/* Main Content (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        {localSubmission.abstract && (
          <AbstractCard abstract={localSubmission.abstract} keywords={keywords} />
        )}
        <SubmissionFilesCard
          submission={localSubmission}
          conferenceId={conferenceId}
          lastUpdated={formatDate(localSubmission.updated_at)}
        />
        <CoverLetterCard submission={localSubmission} conferenceId={conferenceId} />
        {localSubmission.status === "accepted" && (
          <CameraReadySection
            submission={localSubmission}
            conferenceId={conferenceId}
            onUploaded={setLocalSubmission}
          />
        )}
      </div>

      {/* Sidebar (1/3) */}
      <div className="space-y-6">
        <SubmissionMetaCard submission={localSubmission} />
        <SubmissionStatusCard submission={localSubmission} />
        <WithdrawSubmissionCard />
      </div>
    </div>
  )
}
