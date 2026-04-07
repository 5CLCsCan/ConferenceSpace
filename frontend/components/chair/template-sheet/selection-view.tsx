"use client"

import { useMemo } from "react"
import { ArrowLeft, CheckCircle2, Copy, LayoutTemplate, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { ConferenceTemplateSection } from "@/lib/conference-form"
import type { SharedActionProps, SectionMeta, SourceData } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface SelectionViewProps extends SharedActionProps {
  flow: "templates" | "conferences"
  searchQuery: string
  onSearchChange: (query: string) => void
  isLoading: boolean
  error: string | null
  sources: SourceData[]
  selectedSourceId: string | null
  onSelectSource: (id: string) => void
  sectionMeta: SectionMeta[]
  selectedSections: ConferenceTemplateSection[]
  onSectionToggle: (section: ConferenceTemplateSection, checked: boolean) => void
  onSelectAllSections: () => void
  onSelectRecommendedSections: () => void
  onClearSections: () => void
  onApply: () => void
  formatDate: Intl.DateTimeFormat
}

export function SelectionView({
  flow,
  onFlowChange,
  searchQuery,
  onSearchChange,
  isLoading,
  error,
  sources,
  selectedSourceId,
  onSelectSource,
  sectionMeta,
  selectedSections,
  onSectionToggle,
  onSelectAllSections,
  onSelectRecommendedSections,
  onClearSections,
  onApply,
  formatDate,
  t,
}: SelectionViewProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const showEmptyState = !isLoading && sources.length === 0

  const selectedSource = useMemo(
    () => sources.find((s) => s.id === selectedSourceId),
    [sources, selectedSourceId],
  )

  const flowTitle =
    flow === "templates"
      ? t("runtime.components.chair.conference-template-sheet.text_saved_templates")
      : t("runtime.components.chair.conference-template-sheet.text_copy_from_conference")

  const flowSearchPlaceholder =
    flow === "templates"
      ? t("runtime.components.chair.conference-template-sheet.placeholder_search_templates")
      : t("runtime.components.chair.conference-template-sheet.placeholder_search_conferences")

  return (
    <div className="flex h-full flex-col min-h-0">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4 bg-white z-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 rounded-full border-slate-200 text-slate-500 hover:text-[#1B3C53] hover:bg-slate-50"
              onClick={() => onFlowChange("home")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-[#1B3C53]">{flowTitle}</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                {t(
                  "runtime.components.chair.conference-template-sheet.text_pick_source_description",
                )}
              </p>
            </div>
          </div>

          <div className="relative w-full lg:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-9 w-full rounded-full border-slate-200 bg-slate-50 pl-10 text-xs focus:bg-white focus:ring-[#1B3C53]"
              placeholder={flowSearchPlaceholder}
            />
          </div>
        </div>
      </div>

      {/* Split Pane Content */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left Sidebar: List */}
        <div className="flex min-h-[300px] flex-col border-b border-slate-200 lg:w-[45%] lg:border-b-0 lg:border-r bg-slate-50/50">
          <ScrollArea className="min-h-0 flex-1 px-4 py-4">
            <div className="space-y-3 pb-4">
              {isLoading && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-slate-300 py-12 text-slate-500 bg-white/50">
                  <Loader2 className="size-5 animate-spin text-[#1B3C53]" />
                  <span className="text-xs font-medium">
                    {flow === "templates"
                      ? t(
                          "runtime.components.chair.conference-template-sheet.text_loading_templates",
                        )
                      : t(
                          "runtime.components.chair.conference-template-sheet.text_loading_conferences",
                        )}
                  </span>
                </div>
              )}

              {error && (
                <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-4 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              {showEmptyState && (
                <Card className="rounded-[24px] border-dashed border-slate-300 bg-white/50 shadow-none">
                  <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                    <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                      {flow === "templates" ? (
                        <LayoutTemplate className="size-6" />
                      ) : (
                        <Copy className="size-6" />
                      )}
                    </div>
                    <div className="space-y-1.5 max-w-[240px]">
                      <h3 className="text-sm font-bold text-slate-900">
                        {flow === "templates"
                          ? t(
                              "runtime.components.chair.conference-template-sheet.text_no_templates_yet",
                            )
                          : t(
                              "runtime.components.chair.conference-template-sheet.text_no_conferences_found",
                            )}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {flow === "templates"
                          ? t(
                              "runtime.components.chair.conference-template-sheet.text_no_templates_yet_description",
                            )
                          : t(
                              "runtime.components.chair.conference-template-sheet.text_no_conferences_found_description",
                            )}
                      </p>
                    </div>
                    {flow === "templates" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-9 rounded-full text-[11px] font-bold tracking-wide uppercase px-5"
                        onClick={() => {
                          router.push("/role/chair/templates/new")
                        }}
                      >
                        {t(
                          "runtime.components.chair.conference-template-sheet.text_create_new_template",
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {!isLoading &&
                sources.map((source) => {
                  const isSelected = source.id === selectedSourceId
                  return (
                    <button
                      key={source.id}
                      type="button"
                      className="w-full text-left outline-none group"
                      onClick={() => onSelectSource(source.id)}
                    >
                      <Card
                        className={cn(
                          "gap-0 rounded-[20px] border transition-all duration-200",
                          isSelected
                            ? "border-[#1B3C53] bg-white shadow-sm ring-1 ring-[#1B3C53]/10"
                            : "border-slate-200 bg-white hover:border-[#1B3C53]/30 hover:bg-slate-50/50",
                        )}
                      >
                        <CardContent className="px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3
                                  className={cn(
                                    "truncate text-[13px] font-bold",
                                    isSelected ? "text-[#1B3C53]" : "text-slate-900",
                                  )}
                                >
                                  {source.name}
                                </h3>
                                {source.acronym && (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-md bg-slate-100 px-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-600"
                                  >
                                    {source.acronym}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                {source.description ||
                                  (flow === "templates"
                                    ? t(
                                        "runtime.components.chair.conference-template-sheet.text_no_template_description",
                                      )
                                    : t(
                                        "runtime.components.chair.conference-template-sheet.text_no_conference_description",
                                      ))}
                              </p>
                            </div>
                            <div className="shrink-0 pt-0.5">
                              {isSelected ? (
                                <CheckCircle2 className="size-5 text-[#1B3C53]" />
                              ) : (
                                <div className="size-5 rounded-full border-2 border-slate-200 group-hover:border-[#1B3C53]/40" />
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                            <div className="flex flex-wrap gap-1.5">
                              <Badge
                                variant="secondary"
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 tracking-wider"
                              >
                                {source.topicsCount} {t("runtime.components.chair.template-sheet.selection-view.text_topics")}{" "}</Badge>
                              <Badge
                                variant="secondary"
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 tracking-wider"
                              >
                                {source.tracksCount} {t("runtime.components.chair.template-sheet.selection-view.text_tracks")}{" "}</Badge>
                              {source.hasDates && (
                                <Badge
                                  variant="secondary"
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 tracking-wider"
                                >
                                  {t("runtime.components.chair.template-sheet.selection-view.text_schedule")}{" "}</Badge>
                              )}
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">
                              {formatDate.format(new Date(source.updatedAt))}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  )
                })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Main Area: Section Picker */}
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <ScrollArea className="min-h-0 flex-1 px-8 py-6">
            <div className="mx-auto max-w-2xl space-y-6 pb-20">
              {/* Preview Banner */}
              <div className="rounded-[20px] bg-slate-50 p-5 ring-1 ring-inset ring-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {t("runtime.components.chair.conference-template-sheet.text_selected_source")}
                </p>
                <h3 className="mt-2 text-sm font-bold text-[#1B3C53]">
                  {selectedSource?.name ||
                    t("runtime.components.chair.conference-template-sheet.text_select_a_template")}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {selectedSource?.description ||
                    t(
                      "runtime.components.chair.conference-template-sheet.text_selected_source_description",
                    )}
                </p>
              </div>

              {/* Section Header */}
              <div className="flex items-end justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t("runtime.components.chair.conference-template-sheet.text_what_to_apply")}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedSections.length}{" "}
                    {t("runtime.components.chair.conference-template-sheet.text_sections")} selected
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-[10px] font-bold tracking-wider uppercase rounded-md"
                    onClick={onSelectRecommendedSections}
                  >
                    {t("runtime.components.chair.conference-template-sheet.text_recommended")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-[10px] font-bold tracking-wider uppercase rounded-md"
                    onClick={onSelectAllSections}
                  >
                    {t("runtime.components.chair.conference-template-sheet.text_select_all")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-3 text-[10px] font-bold tracking-wider uppercase rounded-md text-slate-500"
                    onClick={onClearSections}
                  >
                    {t("runtime.components.chair.conference-template-sheet.text_clear")}
                  </Button>
                </div>
              </div>

              {/* Sections Layout grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sectionMeta.map((section) => {
                  const checked = selectedSections.includes(section.id)
                  const Icon = section.icon

                  return (
                    <label
                      key={section.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-4 rounded-[16px] border p-4 transition-all duration-200",
                        checked
                          ? "border-[#1B3C53] bg-white ring-1 ring-[#1B3C53]/10"
                          : "border-slate-200 bg-slate-50/50 hover:border-[#1B3C53]/30 hover:bg-white",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => onSectionToggle(section.id, Boolean(value))}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={cn("size-4", checked ? "text-[#1B3C53]" : "text-slate-400")}
                          />
                          <span
                            className={cn(
                              "text-xs font-bold tracking-tight",
                              checked ? "text-[#1B3C53]" : "text-slate-900",
                            )}
                          >
                            {section.title}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                          {section.description}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </ScrollArea>

          {/* Action Bar */}
          <div className="border-t border-slate-200 bg-white p-5 px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            <div className="mx-auto flex max-w-2xl items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {selectedSource ? "Ready to map settings" : "Select a source to continue"}
              </span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-full px-5 text-[11px] font-bold uppercase tracking-wide"
                  onClick={() => onFlowChange("home")}
                >
                  {t("runtime.components.chair.conference-template-sheet.text_cancel")}
                </Button>
                <Button
                  type="button"
                  className="h-9 rounded-full bg-[#1B3C53] px-6 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-[#1B3C53]/90"
                  disabled={!selectedSource || selectedSections.length === 0}
                  onClick={onApply}
                >
                  {t("runtime.components.chair.conference-template-sheet.text_apply_selection")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
