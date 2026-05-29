"use client"

import type { Author } from "./types"
import type { Conflict } from "./conflicts-step"
import type { PrecheckResult } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ReviewStepProps {
  title: string
  abstract: string
  selectedTrack: string
  keywords: string[]
  authors: Author[]
  uploadedFile: File | null
  existingFile?: {
    name: string
    size: number
    type: string
  }
  precheckResult: PrecheckResult | null
  precheckError: string | null
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
  existingFile,
  precheckResult,
  precheckError,
  conflicts,
  coiConfirmed,
  submissionConfirmed,
  onStepChange,
  onSubmissionConfirmedChange,
}: ReviewStepProps) {
  const { t } = useTranslation()

  const hasPrecheckApproval = precheckResult?.decision === "accept_for_review"
  const precheckFailed = !!precheckError || (precheckResult && !hasPrecheckApproval)
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Paper Details Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">article</span>
            {t("runtime.components.author.submit.review-step.text_paper_details")}{" "}
          </h3>
          <button
            className="text-[10px] font-medium text-[#1B3C53] hover:text-[#234C6A] dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
            onClick={() => onStepChange("paper")}
          >
            {t("runtime.components.author.submit.review-step.text_edit")}{" "}
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
        </div>
        <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {t("runtime.components.author.submit.review-step.text_title")}{" "}
            </label>
            <p className="text-sm font-bold text-[#141414] dark:text-white">
              {title || t("runtime.components.author.submit.review-step.text_no_title_provided")}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {t("runtime.components.author.submit.review-step.text_abstract")}{" "}
            </label>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
              {abstract ||
                t("runtime.components.author.submit.review-step.text_no_abstract_provided")}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {t("runtime.components.author.submit.review-step.text_track")}{" "}
              </label>
              {selectedTrack ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 uppercase tracking-wide">
                  {selectedTrack}
                </span>
              ) : (
                <span className="text-slate-400 text-xs">
                  {t("runtime.components.author.submit.review-step.text_not_selected")}
                </span>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {t("runtime.components.author.submit.review-step.text_keywords")}{" "}
              </label>
              <div className="flex flex-wrap gap-1">
                {keywords.length > 0 ? (
                  keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs">
                    {t("runtime.components.author.submit.review-step.text_no_keywords")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authors Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">group</span>
            {t("runtime.components.author.submit.review-step.text_authors")}{" "}
          </h3>
          <button
            className="text-[10px] font-medium text-[#1B3C53] hover:text-[#234C6A] dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
            onClick={() => onStepChange("authors")}
          >
            {t("runtime.components.author.submit.review-step.text_edit")}{" "}
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
        </div>
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-3 py-2.5 font-bold text-[10px] text-slate-400 uppercase tracking-widest rounded-l-lg">
                    {t("runtime.components.author.submit.review-step.text_name")}{" "}
                  </th>
                  <th className="px-3 py-2.5 font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                    {t("runtime.components.author.submit.review-step.text_affiliation")}{" "}
                  </th>
                  <th className="px-3 py-2.5 font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                    {t("runtime.components.author.submit.review-step.text_role")}{" "}
                  </th>
                  <th className="px-3 py-2.5 font-bold text-[10px] text-slate-400 uppercase tracking-widest rounded-r-lg text-right">
                    {t("runtime.components.author.submit.review-step.text_email")}{" "}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {authors.map((author, index) => (
                  <tr key={author.id} className="bg-white dark:bg-slate-800">
                    <td className="px-3 py-2.5 font-medium text-[#141414] dark:text-white">
                      {author.firstName} {author.lastName}
                      {author.isCorresponding && (
                        <span className="ml-1 text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded dark:bg-blue-900/30 dark:text-blue-300 uppercase tracking-wide">
                          {t("runtime.components.author.submit.review-step.text_contact")}{" "}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                      {author.affiliation}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {index === 0
                        ? t("runtime.components.author.submit.review-step.text_primary")
                        : t("runtime.components.author.submit.review-step.text_co_author")}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{author.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manuscript and Declarations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manuscript Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-full">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">attach_file</span>
              {t("runtime.components.author.submit.review-step.text_manuscript")}{" "}
            </h3>
            <button
              className="text-[10px] font-medium text-[#1B3C53] hover:text-[#234C6A] dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
              onClick={() => onStepChange("file")}
            >
              {t("runtime.components.author.submit.review-step.text_edit")}{" "}
              <span className="material-symbols-outlined text-[14px]">edit</span>
            </button>
          </div>
          <div className="px-4 py-3">
            {uploadedFile || existingFile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                <div className="size-9 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#141414] dark:text-white truncate">
                    {uploadedFile?.name || existingFile?.name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {(((uploadedFile?.size || existingFile?.size || 0) / 1024) / 1024).toFixed(1)}{" "}
                    {t("runtime.components.author.submit.review-step.text_mb")}{" "}
                  </p>
                </div>
                {precheckFailed ? (
                  <span
                    className="material-symbols-outlined text-red-500 text-[18px]"
                    title={precheckError || t("runtime.components.author.submit.review-step.title_failed_validation")}
                  >
                    cancel
                  </span>
                ) : hasPrecheckApproval ? (
                  <span
                    className="material-symbols-outlined text-green-500 text-[18px]"
                    title={t("runtime.components.author.submit.review-step.title_passed_validation")}
                  >
                    check_circle
                  </span>
                ) : (
                  <span
                    className="material-symbols-outlined text-amber-500 text-[18px]"
                    title={t("runtime.components.author.submit.review-step.title_pending_validation")}
                  >
                    pending
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  upload_file
                </span>
                <p className="text-xs text-slate-500">
                  {t("runtime.components.author.submit.review-step.text_no_manuscript_uploaded")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Declarations Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-full">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              {t("runtime.components.author.submit.review-step.text_declarations")}{" "}
            </h3>
            <button
              className="text-[10px] font-medium text-[#1B3C53] hover:text-[#234C6A] dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
              onClick={() => onStepChange("coi")}
            >
              {t("runtime.components.author.submit.review-step.text_edit")}{" "}
              <span className="material-symbols-outlined text-[14px]">edit</span>
            </button>
          </div>
          <div className="px-4 py-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span
                  className={`material-symbols-outlined text-[16px] mt-0.5 ${coiConfirmed ? "text-green-500" : "text-slate-400"}`}
                >
                  {coiConfirmed ? "check_box" : "check_box_outline_blank"}
                </span>
                <span>
                  {conflicts.length > 0
                    ? conflicts.length === 1
                      ? t(
                          "runtime.components.author.submit.review-step.text_one_conflict_of_interest_declared",
                        )
                      : t(
                          "runtime.components.author.submit.review-step.text_multiple_conflicts_of_interest_declared",
                          { count: conflicts.length },
                        )
                    : t(
                        "runtime.components.author.submit.review-step.text_no_conflicts_of_interest_declared",
                      )}
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span
                  className={`material-symbols-outlined text-[16px] mt-0.5 ${coiConfirmed ? "text-green-500" : "text-slate-400"}`}
                >
                  {coiConfirmed ? "check_box" : "check_box_outline_blank"}
                </span>
                <span>
                  {t(
                    "runtime.components.author.submit.review-step.text_conflict_disclosure_confirmed",
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Confirmation Checkbox */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            className="mt-0.5 size-4 rounded border-slate-300 text-[#1B3C53] focus:ring-[#1B3C53] transition-all"
            type="checkbox"
            checked={submissionConfirmed}
            onChange={(e) => onSubmissionConfirmedChange(e.target.checked)}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#141414] dark:text-white">
              {t(
                "runtime.components.author.submit.review-step.text_i_certify_that_the_information_provided",
              )}{" "}
            </span>
            <span className="text-[10px] text-slate-400 font-light">
              {t(
                "runtime.components.author.submit.review-step.text_by_checking_this_box_i_confirm",
              )}{" "}
            </span>
          </div>
        </label>
      </div>
    </div>
  )
}
