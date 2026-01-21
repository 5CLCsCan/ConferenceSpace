"use client"

import type { Submission } from "@/lib/api/submissions"
import { formatDate } from "@/lib/utils"

interface OverviewTabProps {
  submission: Submission
  conferenceId: string
}

interface Author {
  name: string
  isCorresponding: boolean
}

interface StatusStep {
  id: string
  label: string
  date: string
  completed?: boolean
  current?: boolean
  pending?: boolean
}

export function OverviewTab({ submission, conferenceId }: OverviewTabProps) {
  const fileUrl = submission.file
    ? `/api/backend/api/v1/conferences/${conferenceId}/submissions/${submission.id}/file`
    : null

  const isPdfFile =
    submission.file?.mime_type === "application/pdf" ||
    submission.file?.original_name?.toLowerCase().endsWith(".pdf")

  // Authors list
  const authors: Author[] = [
    { name: submission.author, isCorresponding: true },
    ...(submission.information?.co_authors?.map((email) => ({
      name: email,
      isCorresponding: false,
    })) || []),
  ]

  // Status timeline steps
  const statusSteps: StatusStep[] = [
    {
      id: "submitted",
      label: "Submitted",
      date: formatDate(submission.created_at),
      completed: true,
    },
    { id: "bidding", label: "Bidding Phase", date: "Completed", completed: true },
    { id: "rebuttal", label: "Rebuttal Phase", date: "Ends in 3 days", current: true },
    { id: "decision", label: "Final Decision", date: "Expected", pending: true },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {/* Left Column */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Abstract */}
        {submission.abstract && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-bold text-[#141414] mb-3">Abstract</h2>
            <p className="text-neutral-600 leading-relaxed text-sm mb-4">{submission.abstract}</p>
            {submission.information?.keywords && submission.information.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {submission.information.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-full border border-slate-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submission Files */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#141414]">Submission Files</h2>
            <span className="text-xs text-neutral-400">
              Last updated: {formatDate(submission.updated_at)}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {submission.file && (
              <div className="flex items-center gap-4 p-4 border border-neutral-100 rounded-lg bg-neutral-50 hover:border-neutral-200 transition-colors">
                <div className="h-12 w-10 bg-white border border-neutral-200 shadow-sm flex items-center justify-center shrink-0 rounded">
                  <span
                    className={`material-symbols-outlined text-[28px] ${isPdfFile ? "text-red-500" : "text-blue-500"}`}
                  >
                    {isPdfFile ? "picture_as_pdf" : "folder_zip"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#141414] truncate">
                    {submission.file.original_name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {(submission.file.size / 1024 / 1024).toFixed(1)} MB •{" "}
                    {submission.file.mime_type?.split("/")[1]?.toUpperCase() || "File"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {isPdfFile && (
                    <button
                      className="p-2 text-neutral-500 hover:text-[#1e3a8a] hover:bg-white rounded-lg transition-colors"
                      title="Preview"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  )}
                  <a
                    href={fileUrl || ""}
                    download={submission.file.original_name}
                    className="p-2 text-neutral-500 hover:text-[#1e3a8a] hover:bg-white rounded-lg transition-colors"
                    title="Download"
                  >
                    <span className="material-symbols-outlined">download</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cover Letter */}
        <details className="bg-white rounded-xl shadow-sm border border-neutral-200 group overflow-hidden">
          <summary className="flex justify-between items-center p-6 cursor-pointer hover:bg-neutral-50 transition-colors list-none">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-neutral-500 group-open:text-[#1e3a8a]">
                mail
              </span>
              <h2 className="text-lg font-bold text-[#141414]">Cover Letter</h2>
            </div>
            <span className="material-symbols-outlined text-neutral-400 group-open:rotate-180 transition-transform">
              expand_more
            </span>
          </summary>
          <div className="px-6 pb-6 pt-0 text-sm text-neutral-600 border-t border-neutral-100 mt-2 pt-4">
            {submission.cover_letter ? (
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-neutral-400">description</span>
                <div className="flex-1">
                  <p className="font-medium">{submission.cover_letter.original_name}</p>
                  <p className="text-xs text-neutral-400">
                    {(submission.cover_letter.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <a
                  href={`/api/backend/api/v1/conferences/${conferenceId}/submissions/${submission.id}/cover_letter`}
                  download={submission.cover_letter.original_name}
                  className="text-[#1e3a8a] hover:underline text-sm font-medium"
                >
                  Download
                </a>
              </div>
            ) : (
              <p className="text-neutral-400 italic">No cover letter attached.</p>
            )}
          </div>
        </details>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6">
        {/* Submission Meta */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">
            Submission Meta
          </h3>
          <div className="space-y-4">
            {/* Authors */}
            <div>
              <p className="text-xs text-neutral-500 mb-1">Author(s)</p>
              <div className="flex flex-col gap-2">
                {authors.map((author, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                      {author.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#141414]">
                      {author.name}
                      {author.isCorresponding && " (Corr.)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords */}
            {submission.information?.keywords && submission.information.keywords.length > 0 && (
              <div className="border-t border-neutral-100 pt-3">
                <p className="text-xs text-neutral-500 mb-1">Keywords</p>
                <p className="text-sm font-medium text-[#141414]">
                  {submission.information.keywords.join(", ")}
                </p>
              </div>
            )}

            {/* Conflicts of Interest */}
            <div className="border-t border-neutral-100 pt-3">
              <p className="text-xs text-neutral-500 mb-1">Conflicts of Interest</p>
              <p className="text-sm font-medium text-[#141414]">
                {submission.domain && submission.domain.length > 0
                  ? submission.domain.join(", ")
                  : "None declared"}
              </p>
            </div>
          </div>
        </div>

        {/* Submission Status */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">
            Submission Status
          </h3>
          <div className="relative pl-2 space-y-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-neutral-100"></div>
            {statusSteps.map((step) => (
              <div
                key={step.id}
                className={`relative flex gap-4 items-start ${step.pending ? "opacity-50" : ""}`}
              >
                <div
                  className={`relative z-10 size-5 rounded-full shrink-0 mt-0.5 shadow-sm flex items-center justify-center ${
                    step.completed
                      ? "bg-[#1e3a8a]"
                      : step.current
                        ? "bg-white border-4 border-blue-200"
                        : "bg-white border-2 border-neutral-300"
                  }`}
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
                  {step.current && (
                    <div className="size-2 rounded-full bg-blue-500 animate-pulse"></div>
                  )}
                </div>
                <div>
                  <p
                    className={`text-xs font-bold mb-0.5 ${step.completed ? "text-[#1e3a8a]" : step.current ? "text-[#141414]" : "text-neutral-500"}`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-neutral-500">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Withdraw Submission */}
        <div className="border border-red-100 bg-red-50 rounded-xl p-5">
          <h3 className="text-sm font-bold text-red-700 mb-2">Withdraw Submission</h3>
          <p className="text-xs text-red-600 mb-3 leading-relaxed">
            Withdrawing your paper will remove it from consideration. This action cannot be undone.
          </p>
          <button className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold py-2 rounded-lg text-xs transition-colors shadow-sm">
            Withdraw Paper
          </button>
        </div>
      </div>
    </div>
  )
}
