"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Loader2, Sparkles, Upload, X } from "lucide-react"

import {
  generateSubmissionAutofill,
  type AutofillAuthor,
  type AutofillConflict,
  type AutofillField,
  type AutofillTrackRanking,
  type SubmissionAutofillResponse,
} from "@/lib/api/submission-autofill"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/lib/i18n/translation-context"
import { cn } from "@/lib/utils"

interface SubmissionAutofillSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conferenceId?: string
  availableTracks: string[]
  onApply: (result: SubmissionAutofillResponse, files: File[]) => void
}

const ACCEPTED_MATERIALS = ".pdf,.docx,.tex"

export function SubmissionAutofillSheet({
  open,
  onOpenChange,
  conferenceId,
  availableTracks,
  onApply,
}: SubmissionAutofillSheetProps) {
  const { t } = useTranslation()
  const [files, setFiles] = useState<File[]>([])
  const [extraDetails, setExtraDetails] = useState("")
  const [result, setResult] = useState<SubmissionAutofillResponse | null>(null)
  const [selectedTrackName, setSelectedTrackName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasResult = Boolean(result)
  const totalSizeLabel = useMemo(() => {
    const bytes = files.reduce((total, file) => total + file.size, 0)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }, [files])

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
    if (selected.length === 0) return
    setFiles((current) => {
      const seen = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`))
      const next = [...current]
      selected.forEach((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`
        if (!seen.has(key)) {
          seen.add(key)
          next.push(file)
        }
      })
      return next
    })
    event.target.value = ""
  }

  const handleGenerate = async () => {
    if (!conferenceId || files.length === 0) {
      setError(
        t("runtime.components.author.submit.submission-autofill-sheet.error_material_required"),
      )
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)
    const response = await generateSubmissionAutofill({
      conferenceId,
      files,
      extraDetails,
      availableTracks,
    })
    setIsGenerating(false)

    if (response.error || !response.data) {
      setError(
        response.error ||
          t("runtime.components.author.submit.submission-autofill-sheet.error_generate_failed"),
      )
      return
    }
    if (response.data.status === "failed" || response.data.error) {
      setResult(null)
      setError(
        response.data.error?.message ||
          t("runtime.components.author.submit.submission-autofill-sheet.error_extract_failed"),
      )
      return
    }
    setSelectedTrackName(response.data.track_rankings[0]?.track_name || "")
    setResult(response.data)
  }

  const handleApply = () => {
    if (!result) return
    onApply(
      {
        ...result,
        selected_track_name: selectedTrackName,
      },
      files,
    )
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-slate-200 bg-white p-0 sm:max-w-xl dark:border-slate-800 dark:bg-slate-950"
      >
        <SheetHeader className="border-b border-slate-100 px-5 py-4 text-left dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#1B3C53] text-white">
              <Sparkles className="size-4" />
            </span>
            <div>
              <SheetTitle className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-white">
                {t("runtime.components.author.submit.submission-autofill-sheet.title")}
              </SheetTitle>
              <SheetDescription className="text-xs leading-relaxed text-slate-500">
                {t("runtime.components.author.submit.submission-autofill-sheet.description")}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 px-5 py-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-white">
                      {t("runtime.components.author.submit.submission-autofill-sheet.text_input")}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {t(
                        "runtime.components.author.submit.submission-autofill-sheet.text_input_description",
                      )}
                    </p>
                  </div>
                  {files.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {t(
                        "runtime.components.author.submit.submission-autofill-sheet.text_files_summary",
                        {
                          count: files.length,
                          size: totalSizeLabel,
                        },
                      )}
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                        {t(
                          "runtime.components.author.submit.submission-autofill-sheet.text_materials",
                        )}
                      </h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        {t(
                          "runtime.components.author.submit.submission-autofill-sheet.text_materials_description",
                        )}
                      </p>
                    </div>
                  </div>

                  <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center transition-colors hover:border-[#1B3C53]/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-800">
                    <Upload className="size-5 text-[#1B3C53] dark:text-slate-300" />
                    <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#1B3C53] dark:text-white">
                      {t(
                        "runtime.components.author.submit.submission-autofill-sheet.text_upload_materials",
                      )}
                    </span>
                    <span className="mt-1 text-[10px] text-slate-400">
                      {t(
                        "runtime.components.author.submit.submission-autofill-sheet.text_pdf_docx_tex",
                      )}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept={ACCEPTED_MATERIALS}
                      className="sr-only"
                      onChange={handleFilesSelected}
                    />
                  </label>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file) => (
                        <div
                          key={`${file.name}:${file.size}:${file.lastModified}`}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                        >
                          <span className="material-symbols-outlined text-[16px] text-slate-400">
                            draft
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFiles((current) => current.filter((item) => item !== file))
                            }
                            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                            aria-label={t(
                              "runtime.components.author.submit.submission-autofill-sheet.label_remove_file",
                              { name: file.name },
                            )}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                    {t(
                      "runtime.components.author.submit.submission-autofill-sheet.text_manual_guidelines",
                    )}
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    {t(
                      "runtime.components.author.submit.submission-autofill-sheet.text_manual_guidelines_description",
                    )}
                  </p>
                  <Textarea
                    value={extraDetails}
                    onChange={(event) => setExtraDetails(event.target.value)}
                    placeholder={t(
                      "runtime.components.author.submit.submission-autofill-sheet.placeholder_extra_details",
                    )}
                    className="mt-3 min-h-20 resize-none rounded-lg border-slate-300 text-[11px] leading-relaxed placeholder:text-[12px] focus-visible:ring-[#1B3C53]/20"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  {error && (
                    <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                      {error}
                    </p>
                  )}
                  <Button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || files.length === 0}
                    className="h-8 bg-[#1B3C53] px-3 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#234C6A]"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        {t(
                          "runtime.components.author.submit.submission-autofill-sheet.text_generating",
                        )}
                      </>
                    ) : hasResult ? (
                      t(
                        "runtime.components.author.submit.submission-autofill-sheet.text_regenerate",
                      )
                    ) : (
                      t("runtime.components.author.submit.submission-autofill-sheet.text_generate")
                    )}
                  </Button>
                </div>
              </div>
            </section>

            {result && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-white">
                      {t(
                        "runtime.components.author.submit.submission-autofill-sheet.text_suggestions_title",
                      )}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {t(
                        "runtime.components.author.submit.submission-autofill-sheet.text_suggestions_description",
                      )}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {result.status}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <EditableField
                    label={t(
                      "runtime.components.author.submit.submission-autofill-sheet.text_field_title",
                    )}
                    field={result.fields.title}
                    onChange={(value) => updateField(setResult, "title", value)}
                  />
                  <EditableField
                    label={t(
                      "runtime.components.author.submit.submission-autofill-sheet.text_field_abstract",
                    )}
                    field={result.fields.abstract}
                    multiline
                    onChange={(value) => updateField(setResult, "abstract", value)}
                  />
                  <EditableField
                    label={t(
                      "runtime.components.author.submit.submission-autofill-sheet.text_field_keywords",
                    )}
                    field={{
                      ...result.fields.keywords,
                      value: result.fields.keywords.value.join(", "),
                    }}
                    onChange={(value) =>
                      updateField(
                        setResult,
                        "keywords",
                        value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                  <EditableField
                    label={t(
                      "runtime.components.author.submit.submission-autofill-sheet.text_field_additional_notes",
                    )}
                    field={result.fields.additional_notes}
                    multiline
                    onChange={(value) => updateField(setResult, "additional_notes", value)}
                  />
                </div>

                <TrackRankingList
                  title={t(
                    "runtime.components.author.submit.submission-autofill-sheet.text_track_rankings",
                  )}
                  selectedTrackName={selectedTrackName}
                  rankings={result.track_rankings}
                  emptyText={t(
                    "runtime.components.author.submit.submission-autofill-sheet.text_no_track_rankings",
                  )}
                  selectedLabel={t(
                    "runtime.components.author.submit.submission-autofill-sheet.text_selected_track",
                  )}
                  scoreLabel={t(
                    "runtime.components.author.submit.submission-autofill-sheet.text_affinity_score",
                  )}
                  onSelect={setSelectedTrackName}
                />

                <SuggestionList
                  title={t(
                    "runtime.components.author.submit.submission-autofill-sheet.text_authors",
                  )}
                  items={result.authors.map(formatAuthor)}
                  emptyText={t(
                    "runtime.components.author.submit.submission-autofill-sheet.text_no_authors_suggested",
                  )}
                />
                <SuggestionList
                  title={t(
                    "runtime.components.author.submit.submission-autofill-sheet.text_possible_conflicts",
                  )}
                  items={result.possible_conflicts.map(formatConflict)}
                  emptyText={t(
                    "runtime.components.author.submit.submission-autofill-sheet.text_no_conflicts_suggested",
                  )}
                />
              </section>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <Button
            type="button"
            onClick={handleApply}
            disabled={!result}
            className="h-9 bg-[#1B3C53] text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#234C6A]"
          >
            {t("runtime.components.author.submit.submission-autofill-sheet.text_apply_to_draft")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function EditableField({
  label,
  field,
  multiline = false,
  onChange,
}: {
  label: string
  field: AutofillField<string>
  multiline?: boolean
  onChange: (value: string) => void
}) {
  const Input = multiline ? "textarea" : "input"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>
        <ConfidenceBadge confidence={field.confidence} />
      </div>
      <Input
        value={field.value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition-all focus:border-[#1B3C53] focus:ring-1 focus:ring-[#1B3C53]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100",
          multiline ? "min-h-24 resize-none leading-relaxed" : "h-9",
        )}
      />
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-300">
      {confidence.replace("_", " ")}
    </span>
  )
}

function SuggestionList({
  title,
  items,
  emptyText,
}: {
  title: string
  items: string[]
  emptyText: string
}) {
  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</h4>
      {items.length > 0 ? (
        <div className="space-y-1.5">
          {items.map((item) => (
            <p
              key={item}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
            >
              {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">{emptyText}</p>
      )}
    </div>
  )
}

function TrackRankingList({
  title,
  rankings,
  selectedTrackName,
  emptyText,
  selectedLabel,
  scoreLabel,
  onSelect,
}: {
  title: string
  rankings: AutofillTrackRanking[]
  selectedTrackName: string
  emptyText: string
  selectedLabel: string
  scoreLabel: string
  onSelect: (trackName: string) => void
}) {
  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</h4>
      {rankings.length > 0 ? (
        <div className="space-y-2">
          {rankings.map((ranking) => {
            const selected = ranking.track_name === selectedTrackName
            return (
              <button
                key={ranking.track_name}
                type="button"
                onClick={() => onSelect(ranking.track_name)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                  selected
                    ? "border-[#1B3C53] bg-[#1B3C53]/5 dark:bg-slate-800"
                    : "border-slate-200 hover:border-[#1B3C53]/40 dark:border-slate-700",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {ranking.track_name}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {scoreLabel}: {ranking.confidence.toFixed(1)}/10
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {ranking.rationale}
                </p>
                {selected && (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#1B3C53] dark:text-slate-200">
                    {selectedLabel}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400">{emptyText}</p>
      )}
    </div>
  )
}

function updateField<T extends keyof SubmissionAutofillResponse["fields"]>(
  setResult: React.Dispatch<React.SetStateAction<SubmissionAutofillResponse | null>>,
  key: T,
  value: SubmissionAutofillResponse["fields"][T]["value"],
) {
  setResult((current) => {
    if (!current) return current
    return {
      ...current,
      fields: {
        ...current.fields,
        [key]: {
          ...current.fields[key],
          value,
        },
      },
    }
  })
}

function formatAuthor(author: AutofillAuthor) {
  return [author.name, author.email, author.affiliation].filter(Boolean).join(" · ")
}

function formatConflict(conflict: AutofillConflict) {
  return [conflict.name, conflict.email, conflict.institution, conflict.reason]
    .filter(Boolean)
    .join(" · ")
}

export function emptyAutofillResponse(): SubmissionAutofillResponse {
  const emptyField = {
    confidence: "not_found" as const,
    evidence: [],
    warnings: [],
  }

  return {
    run_id: "",
    status: "ready",
    fields: {
      title: { value: "", ...emptyField },
      abstract: { value: "", ...emptyField },
      keywords: { value: [], ...emptyField },
      paper_type: { value: "", ...emptyField },
      additional_notes: { value: "", ...emptyField },
    },
    track_rankings: [],
    authors: [],
    possible_conflicts: [],
    materials: [],
    warnings: [],
  }
}
