"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

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
  const { resolvedTheme } = useTheme()

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      {/* Track Selection Card */}
      <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider">
              Conference Track <span className="text-red-500">*</span>
            </span>
            <div className="relative">
              <select
                value={selectedTrack}
                onChange={(e) => onTrackChange(e.target.value)}
                className="w-full h-12 pl-4 pr-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-primary dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a track...</option>
                {availableTracks.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                <span className="material-symbols-outlined">expand_more</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Select the most relevant track for your research to ensure proper reviewer assignment.
            </p>
          </label>
        </div>
      </div>

      {/* Paper Information Card */}
      <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-6">
        {/* Title Field */}
        <label className="flex flex-col gap-2">
          <span className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider">
            Paper Title <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Optimizing Neural Networks for Edge Devices"
            className="w-full h-12 px-4 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-primary dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </label>

        {/* Abstract Field */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider">
              Abstract <span className="text-red-500">*</span>
            </span>
            <span className="text-xs text-neutral-500">
              {abstract.split(/\s+/).filter(Boolean).length} / 500 words
            </span>
          </div>
          <div
            data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-900 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all [&_.w-md-editor]:bg-transparent [&_.w-md-editor-text]:bg-transparent [&_.w-md-editor-text-textarea]:text-primary [&_.w-md-editor-text-textarea]:dark:text-white [&_.w-md-editor-text-textarea]:placeholder:text-neutral-400 [&_.w-md-editor-text-textarea]:text-[16px] [&_.w-md-editor-preview]:text-[16px] [&_.w-md-editor-preview_*]:text-[16px] [&_.w-md-editor-toolbar]:h-12 [&_.w-md-editor-toolbar_button]:w-8 [&_.w-md-editor-toolbar_button]:h-8 [&_.w-md-editor-toolbar_button_svg]:w-3 [&_.w-md-editor-toolbar_button_svg]:h-3"
          >
            <MDEditor
              value={abstract}
              onChange={(val) => onAbstractChange(val || "")}
              preview="live"
              height={300}
              textareaProps={{
                placeholder: "Enter your paper abstract here... You can use markdown formatting.",
              }}
              visibleDragbar={false}
            />
          </div>
        </div>

        {/* Keywords Field */}
        <label className="flex flex-col gap-2">
          <span className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider">
            Keywords <span className="text-red-500">*</span>
          </span>
          <div className="w-full min-h-[56px] px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-primary dark:text-white focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all flex flex-wrap gap-2 items-center">
            {keywords.map((keyword) => (
              <div
                key={keyword}
                className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700"
              >
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {keyword}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveKeyword(keyword)}
                  aria-label={`Remove keyword ${keyword}`}
                  className="flex items-center justify-center size-5 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-500 dark:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <span className="material-symbols-outlined text-[14px] leading-none">close</span>
                </button>
              </div>
            ))}
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => onKeywordInputChange(e.target.value)}
              onKeyDown={onAddKeyword}
              placeholder={keywords.length === 0 ? "Type keyword and press Enter..." : ""}
              className="flex-1 min-w-[200px] h-8 border-none bg-transparent focus:outline-none text-sm px-2 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Provide 3-5 keywords separated by Enter.
          </p>
        </label>
      </div>

      {/* Additional Options */}
      <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isStudentPaper}
            onChange={(e) => onStudentPaperChange(e.target.checked)}
            className="mt-1 size-5 rounded border-neutral-300 text-primary focus:ring-primary transition-all"
          />
          <div className="flex flex-col">
            <span className="text-primary dark:text-white text-sm font-bold">Student Paper</span>
            <span className="text-sm text-neutral-500">
              Check this box if the primary author is a student.
            </span>
          </div>
        </label>
      </div>
    </form>
  )
}
