"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"
import { useTranslation } from "@/lib/i18n/translation-context"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface PaperDetailsStepProps {
  title: string
  abstract: string
  keywords: string[]
  keywordInput: string
  selectedTrack: string
  isStudentPaper: boolean
  availableTracks: string[]
  onTitleChange: (value: string) => void
  onAbstractChange: (value: string) => void
  onKeywordInputChange: (value: string) => void
  onAddKeyword: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onRemoveKeyword: (keyword: string) => void
  onTrackChange: (value: string) => void
  onStudentPaperChange: (checked: boolean) => void
}

export function PaperDetailsStep({
  title,
  abstract,
  keywords,
  keywordInput,
  selectedTrack,
  isStudentPaper,
  availableTracks,
  onTitleChange,
  onAbstractChange,
  onKeywordInputChange,
  onAddKeyword,
  onRemoveKeyword,
  onTrackChange,
  onStudentPaperChange,
}: PaperDetailsStepProps) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()

  return (
    <form className="flex flex-col gap-4 w-full" onSubmit={(e) => e.preventDefault()}>
      {/* Track Selection Card */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
            {t("runtime.components.author.submit.paper-details-step.text_conference_track")}{" "}
          </h3>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
            {t("runtime.components.author.submit.paper-details-step.text_select_track")}{" "}
            <span className="text-red-500 ml-0.5">*</span>
          </span>
          <div className="relative">
            <select
              value={selectedTrack}
              onChange={(e) => onTrackChange(e.target.value)}
              className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all appearance-none cursor-pointer"
            >
              <option value="">
                {t("runtime.components.author.submit.paper-details-step.text_select_a_track")}
              </option>
              {availableTracks.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-light">
            {t(
              "runtime.components.author.submit.paper-details-step.text_select_the_most_relevant_track_for",
            )}{" "}
          </p>
        </div>
      </div>

      {/* Paper Information Card */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
            {t("runtime.components.author.submit.paper-details-step.text_paper_information")}{" "}
          </h3>
        </div>

        {/* Title Field */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
            {t("runtime.components.author.submit.paper-details-step.text_paper_title")}{" "}
            <span className="text-red-500 ml-0.5">*</span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t(
              "runtime.components.author.submit.paper-details-step.placeholder_e_g_optimizing_neural_networks_for",
            )}
            className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
          />
        </div>

        {/* Abstract Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              {t("runtime.components.author.submit.paper-details-step.text_abstract")}{" "}
              <span className="text-red-500 ml-0.5">*</span>
            </span>
            <span className="text-[9px] font-light text-slate-400 uppercase tracking-wider">
              {abstract.split(/\s+/).filter(Boolean).length}{" "}
              {t("runtime.components.author.submit.paper-details-step.text_500_words")}{" "}
            </span>
          </div>
          <div
            data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
            className="rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-[#1B3C53] focus-within:border-[#1B3C53] transition-all [&_.w-md-editor]:bg-transparent [&_.w-md-editor-text]:bg-transparent [&_.w-md-editor-text-textarea]:text-[#141414] [&_.w-md-editor-text-textarea]:dark:text-white [&_.w-md-editor-text-textarea]:placeholder:text-slate-400 [&_.w-md-editor-text-textarea]:text-xs [&_.w-md-editor-preview]:text-xs [&_.w-md-editor-preview_*]:text-xs [&_.w-md-editor-toolbar]:h-10 [&_.w-md-editor-toolbar_button]:w-7 [&_.w-md-editor-toolbar_button]:h-7 [&_.w-md-editor-toolbar_button_svg]:w-3 [&_.w-md-editor-toolbar_button_svg]:h-3"
          >
            <MDEditor
              value={abstract}
              onChange={(val) => onAbstractChange(val || "")}
              preview="live"
              height={240}
              textareaProps={{
                placeholder: "Enter your paper abstract here... You can use markdown formatting.",
              }}
              visibleDragbar={false}
            />
          </div>
        </div>

        {/* Keywords Field */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
            {t("runtime.components.author.submit.paper-details-step.text_keywords")}{" "}
            <span className="text-red-500 ml-0.5">*</span>
          </span>
          <div className="w-full min-h-10 text-xs pl-2 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus-within:ring-2 focus-within:ring-[#1B3C53] focus-within:border-[#1B3C53] transition-all flex flex-wrap gap-2 items-center">
            {keywords.map((keyword) => (
              <div
                key={keyword}
                className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md text-xs"
              >
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                  {keyword}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveKeyword(keyword)}
                  aria-label={`Remove keyword ${keyword}`}
                  className="flex items-center justify-center size-4 rounded-full hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-500 dark:text-slate-400 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => onKeywordInputChange(e.target.value)}
              onKeyDown={onAddKeyword}
              placeholder={keywords.length === 0 ? "Type keyword and press Enter..." : ""}
              className="flex-1 min-w-[180px] h-6 border-none bg-transparent focus:outline-none text-xs px-2 placeholder:text-slate-400"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-light">
            {t(
              "runtime.components.author.submit.paper-details-step.text_provide_3_5_keywords_separated_by",
            )}{" "}
          </p>
        </div>
      </div>

      {/* Additional Options */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <label className="flex items-start justify-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isStudentPaper}
            onChange={(e) => onStudentPaperChange(e.target.checked)}
            className="mt-0.5 size-4 rounded border-slate-300 text-[#1B3C53] focus:ring-[#1B3C53] transition-all"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#141414] dark:text-white">
              {t("runtime.components.author.submit.paper-details-step.text_student_paper")}
            </span>
            <span className="text-[10px] text-slate-400 font-light">
              {t(
                "runtime.components.author.submit.paper-details-step.text_check_this_box_if_the_primary",
              )}{" "}
            </span>
          </div>
        </label>
      </div>
    </form>
  )
}
