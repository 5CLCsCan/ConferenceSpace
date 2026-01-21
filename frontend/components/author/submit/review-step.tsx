"use client"

import type { Author } from "./types"
import type { Conflict } from "./conflicts-step"

interface ReviewStepProps {
  title: string
  abstract: string
  selectedTrack: string
  keywords: string[]
  authors: Author[]
  uploadedFile: File | null
  conflicts: Conflict[]
  coiConfirmed: boolean
  submissionConfirmed: boolean
  onStepChange: (step: "paper" | "authors" | "file" | "coi") => void
  onSubmissionConfirmedChange: (checked: boolean) => void
}

export function ReviewStep({
  title,
  abstract,
  selectedTrack,
  keywords,
  authors,
  uploadedFile,
  conflicts,
  coiConfirmed,
  submissionConfirmed,
  onStepChange,
  onSubmissionConfirmedChange,
}: ReviewStepProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Paper Details Card */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/30">
          <h3 className="text-sm font-bold text-[#1e293b] dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">article</span> Paper Details
          </h3>
          <button
            className="text-xs font-medium text-primary hover:text-blue-600 dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center gap-1"
            onClick={() => onStepChange("paper")}
          >
            Edit <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-3">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Title
            </label>
            <p className="text-lg font-bold text-primary dark:text-white">
              {title || "No title provided"}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Abstract
            </label>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-4">
              {abstract || "No abstract provided"}
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Track
              </label>
              {selectedTrack ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                  {selectedTrack}
                </span>
              ) : (
                <span className="text-neutral-400 text-sm">Not selected</span>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Keywords
              </label>
              <div className="flex flex-wrap gap-1.5">
                {keywords.length > 0 ? (
                  keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-2 py-0.5 rounded text-xs bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="text-neutral-400 text-sm">No keywords</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authors Card */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/30">
          <h3 className="text-sm font-bold text-[#1e293b] dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">group</span> Authors
          </h3>
          <button
            className="text-xs font-medium text-primary hover:text-blue-600 dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center gap-1"
            onClick={() => onStepChange("authors")}
          >
            Edit <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Name</th>
                  <th className="px-4 py-3">Affiliation</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {authors.map((author, index) => (
                  <tr key={author.id} className="bg-white dark:bg-[#1e1e1e]">
                    <td className="px-4 py-3 font-medium text-primary dark:text-white">
                      {author.firstName} {author.lastName}
                      {author.isCorresponding && (
                        <span className="ml-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
                          Contact
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                      {author.affiliation}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {index === 0 ? "Primary Author" : "Co-Author"}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-500">{author.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manuscript and Declarations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manuscript Card */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden h-full">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/30">
            <h3 className="text-sm font-bold text-[#1e293b] dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">attach_file</span> Manuscript
            </h3>
            <button
              className="text-xs font-medium text-primary hover:text-blue-600 dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center gap-1"
              onClick={() => onStepChange("file")}
            >
              Edit <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
          <div className="p-6">
            {uploadedFile ? (
              <div className="flex items-center gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                <div className="size-10 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary dark:text-white truncate">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <span
                  className="material-symbols-outlined text-green-500"
                  title="Passed validation"
                >
                  check_circle
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                <span className="material-symbols-outlined text-neutral-400">upload_file</span>
                <p className="text-sm text-neutral-500">No manuscript uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Declarations Card */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden h-full">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/30">
            <h3 className="text-sm font-bold text-[#1e293b] dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">warning</span> Declarations
            </h3>
            <button
              className="text-xs font-medium text-primary hover:text-blue-600 dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center gap-1"
              onClick={() => onStepChange("coi")}
            >
              Edit <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                <span
                  className={`material-symbols-outlined mt-0.5 ${coiConfirmed ? "text-green-500" : "text-neutral-400"}`}
                >
                  {coiConfirmed ? "check_box" : "check_box_outline_blank"}
                </span>
                <span>
                  {conflicts.length > 0
                    ? `${conflicts.length} conflict(s) of interest declared.`
                    : "No conflicts of interest declared."}
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                <span
                  className={`material-symbols-outlined mt-0.5 ${coiConfirmed ? "text-green-500" : "text-neutral-400"}`}
                >
                  {coiConfirmed ? "check_box" : "check_box_outline_blank"}
                </span>
                <span>Conflict disclosure confirmed.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Confirmation Checkbox */}
      <div className="p-6 bg-[#1e293b]/5 dark:bg-[#1e293b]/20 rounded-xl border border-[#1e293b]/10 dark:border-[#1e293b]/30 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            className="mt-1 size-5 rounded border-neutral-300 text-primary focus:ring-primary transition-all"
            type="checkbox"
            checked={submissionConfirmed}
            onChange={(e) => onSubmissionConfirmedChange(e.target.checked)}
          />
          <div className="flex flex-col">
            <span className="text-primary dark:text-white text-sm font-bold">
              I certify that the information provided is correct.
            </span>
            <span className="text-sm text-neutral-500">
              By checking this box, I confirm that all authors have approved the final version of
              the manuscript and agree to the submission.
            </span>
          </div>
        </label>
      </div>
    </div>
  )
}
