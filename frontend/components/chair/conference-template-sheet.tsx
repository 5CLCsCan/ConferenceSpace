"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarRange,
  Check,
  ChevronRight,
  Copy,
  FileText,
  LayoutTemplate,
  Loader2,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { useTranslation } from "@/lib/i18n/translation-context"
import { listConferences } from "@/lib/api/conferences"
import {
  createConferenceConfigTemplate,
  deleteConferenceConfigTemplate,
  listConferenceConfigTemplates,
} from "@/lib/api/conference-templates"
import {
  applyConferenceTemplateSections,
  buildConferenceConfigTemplatePayload,
  DEFAULT_CONFERENCE_TEMPLATE_SECTIONS,
  mapConferenceToFormData,
  mapTemplatePayloadToFormData,
  type ConferenceTemplateSection,
} from "@/lib/conference-form"
import { cn } from "@/lib/utils"
import type { ConferenceConfigTemplate, Conference } from "@/lib/types"
import type { ConferenceFormData } from "@/components/wizard/creation"

interface ConferenceTemplateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ConferenceFormData
  onApply: (data: ConferenceFormData) => void
  currentConferenceId?: string
}

type TemplateFlow = "home" | "templates" | "conferences" | "save"

function isConferenceTemplate(source: Conference | ConferenceConfigTemplate): source is ConferenceConfigTemplate {
  return "payload" in source
}

function dateValue(value?: string) {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function buildSuggestedTemplateName(formData: ConferenceFormData) {
  if (formData.acronym.trim()) return `${formData.acronym.trim()} template`
  if (formData.title.trim()) return `${formData.title.trim()} template`
  return ""
}

export function ConferenceTemplateSheet({
  open,
  onOpenChange,
  formData,
  onApply,
  currentConferenceId,
}: ConferenceTemplateSheetProps) {
  const { t, locale } = useTranslation()
  const { toast } = useToast()
  const [flow, setFlow] = useState<TemplateFlow>("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSections, setSelectedSections] = useState<ConferenceTemplateSection[]>(
    DEFAULT_CONFERENCE_TEMPLATE_SECTIONS,
  )
  const [templates, setTemplates] = useState<ConferenceConfigTemplate[]>([])
  const [conferences, setConferences] = useState<Conference[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedConferenceId, setSelectedConferenceId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null)
  const [conferenceLoadError, setConferenceLoadError] = useState<string | null>(null)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isLoadingConferences, setIsLoadingConferences] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false)
  const [pendingDeleteTemplate, setPendingDeleteTemplate] = useState<ConferenceConfigTemplate | null>(null)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const sectionMeta: Array<{
    id: ConferenceTemplateSection
    title: string
    description: string
    icon: typeof Settings2
  }> = useMemo(
    () => [
      {
        id: "basics",
        title: t("runtime.components.chair.conference-template-sheet.text_basics_and_venue"),
        description: t("runtime.components.chair.conference-template-sheet.text_basics_and_venue_description"),
        icon: Settings2,
      },
      {
        id: "topics_tracks",
        title: t("runtime.components.chair.conference-template-sheet.text_topics_and_tracks"),
        description: t("runtime.components.chair.conference-template-sheet.text_topics_and_tracks_description"),
        icon: Sparkles,
      },
      {
        id: "deadlines",
        title: t("runtime.components.chair.conference-template-sheet.text_important_dates"),
        description: t("runtime.components.chair.conference-template-sheet.text_important_dates_description"),
        icon: CalendarRange,
      },
      {
        id: "submission_policy",
        title: t("runtime.components.chair.conference-template-sheet.text_submission_policy"),
        description: t("runtime.components.chair.conference-template-sheet.text_submission_policy_description"),
        icon: FileText,
      },
      {
        id: "review_policy",
        title: t("runtime.components.chair.conference-template-sheet.text_review_policy"),
        description: t("runtime.components.chair.conference-template-sheet.text_review_policy_description"),
        icon: Copy,
      },
      {
        id: "rebuttal_timeline",
        title: t("runtime.components.chair.conference-template-sheet.text_rebuttal_and_decision"),
        description: t("runtime.components.chair.conference-template-sheet.text_rebuttal_and_decision_description"),
        icon: CalendarRange,
      },
      {
        id: "cfp",
        title: t("runtime.components.chair.conference-template-sheet.text_cfp_copy"),
        description: t("runtime.components.chair.conference-template-sheet.text_cfp_copy_description"),
        icon: FileText,
      },
      {
        id: "co_chairs",
        title: t("runtime.components.chair.conference-template-sheet.text_co_chairs"),
        description: t("runtime.components.chair.conference-template-sheet.text_co_chairs_description"),
        icon: Users,
      },
    ],
    [t],
  )

  const formatDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [locale],
  )

  const isApplyFlow = flow === "templates" || flow === "conferences"

  useEffect(() => {
    if (!open) return
    setFlow("home")
    setSearchQuery("")
    setSelectedSections(DEFAULT_CONFERENCE_TEMPLATE_SECTIONS)
    setTemplateName(buildSuggestedTemplateName(formData))
    setTemplateDescription("")
    setTemplateLoadError(null)
    setConferenceLoadError(null)
    setPendingDeleteTemplate(null)
    setShowSectionPicker(false)
  }, [formData, open])

  useEffect(() => {
    if (!open) return
    let active = true
    setIsLoadingTemplates(true)
    setTemplateLoadError(null)

    void listConferenceConfigTemplates(debouncedSearch || undefined).then((response) => {
      if (!active) return
      if (response.error || !response.data) {
        setTemplateLoadError(
          response.error ||
            t("runtime.components.chair.conference-template-sheet.text_failed_to_load_templates"),
        )
        setTemplates([])
        setIsLoadingTemplates(false)
        return
      }
      setTemplates(response.data.templates)
      setIsLoadingTemplates(false)
    })

    return () => { active = false }
  }, [debouncedSearch, open, t])

  useEffect(() => {
    if (!open) return
    let active = true
    setIsLoadingConferences(true)
    setConferenceLoadError(null)

    void listConferences({ myConferences: true, role: "chair", limit: 200 }).then((response) => {
      if (!active) return
      if (response.error || !response.data) {
        setConferenceLoadError(
          response.error ||
            t("runtime.components.chair.conference-template-sheet.text_failed_to_load_conferences"),
        )
        setConferences([])
        setIsLoadingConferences(false)
        return
      }

      const sorted = [...response.data.conferences]
        .filter((conference) => conference.id !== currentConferenceId)
        .sort((left, right) => {
          const updatedDiff = dateValue(right.updated_at) - dateValue(left.updated_at)
          if (updatedDiff !== 0) return updatedDiff
          return dateValue(right.created_at) - dateValue(left.created_at)
        })

      setConferences(sorted)
      setIsLoadingConferences(false)
    })

    return () => { active = false }
  }, [currentConferenceId, open, t])

  const filteredConferences = useMemo(() => {
    const normalized = debouncedSearch.trim().toLowerCase()
    if (!normalized) return conferences
    return conferences.filter((conference) => {
      const haystack = [conference.name, conference.acronym, conference.description].join(" ").toLowerCase()
      return haystack.includes(normalized)
    })
  }, [conferences, debouncedSearch])

  useEffect(() => {
    if (!open) return
    if (templates.length === 0) { setSelectedTemplateId(null); return }
    setSelectedTemplateId((current) =>
      current && templates.some((template) => template.id === current) ? current : templates[0].id,
    )
  }, [open, templates])

  useEffect(() => {
    if (!open) return
    if (filteredConferences.length === 0) { setSelectedConferenceId(null); return }
    setSelectedConferenceId((current) =>
      current && filteredConferences.some((conference) => conference.id === current)
        ? current
        : filteredConferences[0].id,
    )
  }, [filteredConferences, open])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [selectedTemplateId, templates],
  )

  const selectedConference = useMemo(
    () => filteredConferences.find((conference) => conference.id === selectedConferenceId) || null,
    [filteredConferences, selectedConferenceId],
  )

  const selectedSourceFormData = useMemo(() => {
    if (flow === "templates" && selectedTemplate) return mapTemplatePayloadToFormData(selectedTemplate.payload)
    if (flow === "conferences" && selectedConference) return mapConferenceToFormData(selectedConference)
    return null
  }, [flow, selectedConference, selectedTemplate])

  const selectedSourceTitle =
    flow === "templates" ? selectedTemplate?.name || "" : selectedConference?.name || ""

  const showApplyEmptyState =
    flow === "templates"
      ? !isLoadingTemplates && templates.length === 0
      : flow === "conferences"
        ? !isLoadingConferences && filteredConferences.length === 0
        : false

  const flowTitle =
    flow === "templates"
      ? t("runtime.components.chair.conference-template-sheet.text_saved_templates")
      : flow === "conferences"
        ? t("runtime.components.chair.conference-template-sheet.text_copy_from_conference")
        : t("runtime.components.chair.conference-template-sheet.text_save_current_configuration")

  const flowSearchPlaceholder =
    flow === "templates"
      ? t("runtime.components.chair.conference-template-sheet.placeholder_search_templates")
      : t("runtime.components.chair.conference-template-sheet.placeholder_search_conferences")

  const openFlow = (nextFlow: TemplateFlow) => {
    setFlow(nextFlow)
    setSearchQuery("")
    setShowSectionPicker(false)
    if (nextFlow === "save") {
      setTemplateName((current) => current || buildSuggestedTemplateName(formData))
      return
    }
    if (nextFlow === "templates" || nextFlow === "conferences") {
      setSelectedSections(DEFAULT_CONFERENCE_TEMPLATE_SECTIONS)
    }
  }

  const handleSectionToggle = (section: ConferenceTemplateSection, checked: boolean) => {
    setSelectedSections((current) => {
      if (checked) return current.includes(section) ? current : [...current, section]
      return current.filter((item) => item !== section)
    })
  }

  const handleApply = () => {
    if (!selectedSourceFormData || selectedSections.length === 0) return
    const nextFormData = applyConferenceTemplateSections(formData, selectedSourceFormData, selectedSections)
    onApply(nextFormData)
    toast({
      title: t("runtime.components.chair.conference-template-sheet.text_template_applied"),
      description: t(
        "runtime.components.chair.conference-template-sheet.text_template_applied_description",
        { source: selectedSourceTitle },
      ),
    })
    onOpenChange(false)
  }

  const handleSaveTemplate = async () => {
    const normalizedName = templateName.trim()
    if (!normalizedName) {
      toast({
        title: t("runtime.components.chair.conference-template-sheet.text_name_required"),
        description: t("runtime.components.chair.conference-template-sheet.text_name_required_description"),
        variant: "destructive",
      })
      return
    }

    setIsSavingTemplate(true)
    const response = await createConferenceConfigTemplate({
      name: normalizedName,
      description: templateDescription.trim(),
      payload: buildConferenceConfigTemplatePayload(formData),
    })
    setIsSavingTemplate(false)

    if (response.error || !response.data) {
      toast({
        title: t("runtime.components.chair.conference-template-sheet.text_failed_to_save_template"),
        description:
          response.error ||
          t("runtime.components.chair.conference-template-sheet.text_failed_to_save_template_description"),
        variant: "destructive",
      })
      return
    }

    setTemplates((current) => [response.data!, ...current.filter((item) => item.id !== response.data!.id)])
    setSelectedTemplateId(response.data.id)
    setFlow("templates")
    setSearchQuery("")

    toast({
      title: t("runtime.components.chair.conference-template-sheet.text_template_saved"),
      description: t(
        "runtime.components.chair.conference-template-sheet.text_template_saved_description",
        { name: response.data.name },
      ),
    })
  }

  const handleDeleteTemplate = async () => {
    if (!pendingDeleteTemplate) return
    setIsDeletingTemplate(true)
    const response = await deleteConferenceConfigTemplate(pendingDeleteTemplate.id)
    setIsDeletingTemplate(false)

    if (response.error) {
      toast({
        title: t("runtime.components.chair.conference-template-sheet.text_failed_to_delete_template"),
        description:
          response.error ||
          t("runtime.components.chair.conference-template-sheet.text_failed_to_delete_template_description"),
        variant: "destructive",
      })
      return
    }

    setTemplates((current) => current.filter((item) => item.id !== pendingDeleteTemplate.id))
    setPendingDeleteTemplate(null)

    toast({
      title: t("runtime.components.chair.conference-template-sheet.text_template_deleted"),
      description: t("runtime.components.chair.conference-template-sheet.text_template_deleted_description"),
    })
  }

  const renderSourceBadges = (
    source: ConferenceConfigTemplate | Conference,
    type: "templates" | "conferences",
  ) => {
    const topicsCount =
      type === "templates" && isConferenceTemplate(source)
        ? source.payload.topics?.length || 0
        : !isConferenceTemplate(source)
          ? source.domain?.length || 0
          : 0
    const tracksCount =
      type === "templates" && isConferenceTemplate(source)
        ? source.payload.tracks?.length || 0
        : !isConferenceTemplate(source)
          ? source.tracks?.length || 0
          : 0

    return (
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800">
          {topicsCount} {t("runtime.components.chair.conference-template-sheet.text_topics")}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800">
          {tracksCount} {t("runtime.components.chair.conference-template-sheet.text_tracks")}
        </span>
      </div>
    )
  }

  const renderSourceMeta = (source: ConferenceConfigTemplate | Conference, type: "templates" | "conferences") => {
    const updatedAt = source.updated_at || source.created_at
    if (!updatedAt) return null
    return (
      <p className="mt-1 text-[8px] font-medium text-slate-400">
        {type === "templates"
          ? t("runtime.components.chair.conference-template-sheet.text_updated")
          : t("runtime.components.chair.conference-template-sheet.text_last_used")}
        : {formatDate.format(new Date(updatedAt))}
      </p>
    )
  }

  // --- Action item for home screen ---
  const homeActions: Array<{
    id: TemplateFlow
    icon: typeof LayoutTemplate
    title: string
    description: string
    count?: number
  }> = [
    {
      id: "templates",
      icon: LayoutTemplate,
      title: t("runtime.components.chair.conference-template-sheet.text_saved_templates"),
      description: t("runtime.components.chair.conference-template-sheet.text_saved_templates_card_description"),
      count: templates.length,
    },
    {
      id: "conferences",
      icon: Copy,
      title: t("runtime.components.chair.conference-template-sheet.text_copy_from_conference"),
      description: t("runtime.components.chair.conference-template-sheet.text_copy_from_conference_card_description"),
      count: conferences.length,
    },
    {
      id: "save",
      icon: Sparkles,
      title: t("runtime.components.chair.conference-template-sheet.text_save_current"),
      description: t("runtime.components.chair.conference-template-sheet.text_save_current_configuration_card_description"),
    },
  ]

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full max-w-none flex-col border-l px-0 sm:max-w-[520px]"
        >
          {/* -- Header -- */}
          <SheetHeader className="border-b px-5 py-3 pr-12">
            <SheetTitle className="text-sm font-bold tracking-tight text-[#1B3C53]">
              {t("runtime.components.chair.conference-template-sheet.text_templates_and_copying")}
            </SheetTitle>
            <SheetDescription className="text-[10px] leading-relaxed text-slate-500">
              {t("runtime.components.chair.conference-template-sheet.text_templates_and_copying_description")}
            </SheetDescription>
          </SheetHeader>

          {/* -- Body -- */}
          <div className="flex min-h-0 flex-1 flex-col">
            {flow === "home" ? (
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-3 px-5 py-4">
                  {/* Action List */}
                  <div className="space-y-1.5">
                    {homeActions.map((action) => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.id}
                          type="button"
                          className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition-all hover:border-[#1B3C53]/25 hover:bg-[#1B3C53]/[0.02] hover:shadow-sm dark:border-slate-700 dark:bg-slate-900"
                          onClick={() => openFlow(action.id)}
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1B3C53]/8 text-[#1B3C53]">
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold tracking-tight text-[#1B3C53] dark:text-white">
                                {action.title}
                              </span>
                              {action.count !== undefined && (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-px text-[7px] font-bold text-slate-500 dark:bg-slate-800">
                                  {action.count}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 line-clamp-1">
                              {action.description}
                            </p>
                          </div>
                          <ChevronRight className="size-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                        </button>
                      )
                    })}
                  </div>

                  {/* Info banner */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[10px] leading-relaxed text-slate-500 dark:border-slate-700 dark:bg-slate-800/50">
                    {t("runtime.components.chair.conference-template-sheet.text_identity_preserved")}
                  </div>
                </div>
              </ScrollArea>
            ) : isApplyFlow ? (
              <>
                {/* Sub-header with back + search */}
                <div className="border-b px-5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openFlow("home")}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                      <ArrowLeft className="size-3.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold tracking-tight text-[#1B3C53]">{flowTitle}</h3>
                    </div>
                  </div>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="h-8 rounded-lg border-slate-200 bg-white pl-8 text-[10px]"
                      placeholder={flowSearchPlaceholder}
                    />
                  </div>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                  <div className="space-y-4 px-5 py-3">
                    {/* Loading */}
                    {flow === "templates" && isLoadingTemplates && (
                      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-6 text-[10px] text-slate-500">
                        <Loader2 className="size-3.5 animate-spin" />
                        {t("runtime.components.chair.conference-template-sheet.text_loading_templates")}
                      </div>
                    )}
                    {flow === "conferences" && isLoadingConferences && (
                      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-6 text-[10px] text-slate-500">
                        <Loader2 className="size-3.5 animate-spin" />
                        {t("runtime.components.chair.conference-template-sheet.text_loading_conferences")}
                      </div>
                    )}

                    {/* Errors */}
                    {flow === "templates" && templateLoadError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700">
                        {templateLoadError}
                      </div>
                    )}
                    {flow === "conferences" && conferenceLoadError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700">
                        {conferenceLoadError}
                      </div>
                    )}

                    {/* Empty state */}
                    {showApplyEmptyState && (
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          {flow === "templates" ? <LayoutTemplate className="size-4" /> : <Copy className="size-4" />}
                        </div>
                        <p className="text-xs font-bold text-slate-700">
                          {flow === "templates"
                            ? t("runtime.components.chair.conference-template-sheet.text_no_templates_yet")
                            : t("runtime.components.chair.conference-template-sheet.text_no_conferences_found")}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {flow === "templates"
                            ? t("runtime.components.chair.conference-template-sheet.text_no_templates_yet_description")
                            : t("runtime.components.chair.conference-template-sheet.text_no_conferences_found_description")}
                        </p>
                        {flow === "templates" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 h-7 rounded-full px-3 text-[9px] font-medium"
                            onClick={() => openFlow("save")}
                          >
                            {t("runtime.components.chair.conference-template-sheet.text_save_current_configuration")}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Source list */}
                    <div className="space-y-1.5">
                      {flow === "templates" && !isLoadingTemplates &&
                        templates.map((template) => {
                          const isSelected = template.id === selectedTemplateId
                          return (
                            <div
                              key={template.id}
                              className={cn(
                                "group cursor-pointer rounded-xl border px-3.5 py-2.5 transition-all",
                                isSelected
                                  ? "border-[#1B3C53] bg-[#1B3C53]/[0.03] shadow-sm"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900",
                              )}
                              onClick={() => setSelectedTemplateId(template.id)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className={cn(
                                        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                                        isSelected
                                          ? "border-[#1B3C53] bg-[#1B3C53] text-white"
                                          : "border-slate-300 bg-white",
                                      )}
                                    >
                                      {isSelected && <Check className="size-2.5" />}
                                    </div>
                                    <h4 className="truncate text-xs font-bold tracking-tight text-slate-900 dark:text-white">
                                      {template.name}
                                    </h4>
                                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-px text-[6px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-800">
                                      {t("runtime.components.chair.conference-template-sheet.text_template")}
                                    </span>
                                  </div>
                                  <p className="mt-1 line-clamp-1 pl-5.5 text-[10px] text-slate-500">
                                    {template.description ||
                                      t("runtime.components.chair.conference-template-sheet.text_no_template_description")}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setPendingDeleteTemplate(template)
                                  }}
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                              {renderSourceBadges(template, "templates")}
                              {renderSourceMeta(template, "templates")}
                            </div>
                          )
                        })}

                      {flow === "conferences" && !isLoadingConferences &&
                        filteredConferences.map((conference) => {
                          const isSelected = conference.id === selectedConferenceId
                          return (
                            <div
                              key={conference.id}
                              className={cn(
                                "cursor-pointer rounded-xl border px-3.5 py-2.5 transition-all",
                                isSelected
                                  ? "border-[#1B3C53] bg-[#1B3C53]/[0.03] shadow-sm"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900",
                              )}
                              onClick={() => setSelectedConferenceId(conference.id)}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className={cn(
                                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                                    isSelected
                                      ? "border-[#1B3C53] bg-[#1B3C53] text-white"
                                      : "border-slate-300 bg-white",
                                  )}
                                >
                                  {isSelected && <Check className="size-2.5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="truncate text-xs font-bold tracking-tight text-slate-900 dark:text-white">
                                      {conference.name}
                                    </h4>
                                    {conference.acronym && (
                                      <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-px text-[6px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-800">
                                        {conference.acronym}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">
                                    {conference.description ||
                                      t("runtime.components.chair.conference-template-sheet.text_no_conference_description")}
                                  </p>
                                  {renderSourceBadges(conference, "conferences")}
                                  {renderSourceMeta(conference, "conferences")}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>

                    {/* Section Picker (collapsible) */}
                    {!showApplyEmptyState && (
                      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
                          onClick={() => setShowSectionPicker((v) => !v)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {t("runtime.components.chair.conference-template-sheet.text_what_to_apply")}
                            </span>
                            <span className="rounded-full bg-[#1B3C53]/10 px-1.5 py-px text-[7px] font-bold text-[#1B3C53]">
                              {selectedSections.length}/{sectionMeta.length}
                            </span>
                          </div>
                          <ChevronRight
                            className={cn(
                              "size-3.5 text-slate-400 transition-transform",
                              showSectionPicker && "rotate-90",
                            )}
                          />
                        </button>

                        {showSectionPicker && (
                          <div className="border-t border-slate-100 px-3.5 pb-3 pt-2 dark:border-slate-800">
                            {/* Quick actions */}
                            <div className="mb-2 flex gap-1.5">
                              <button
                                type="button"
                                className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[8px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                                onClick={() => setSelectedSections(DEFAULT_CONFERENCE_TEMPLATE_SECTIONS)}
                              >
                                {t("runtime.components.chair.conference-template-sheet.text_recommended")}
                              </button>
                              <button
                                type="button"
                                className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[8px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                                onClick={() => setSelectedSections(sectionMeta.map((s) => s.id))}
                              >
                                {t("runtime.components.chair.conference-template-sheet.text_select_all")}
                              </button>
                              <button
                                type="button"
                                className="rounded-full px-2 py-0.5 text-[8px] font-medium text-slate-400 transition-colors hover:text-slate-600"
                                onClick={() => setSelectedSections([])}
                              >
                                {t("runtime.components.chair.conference-template-sheet.text_clear")}
                              </button>
                            </div>

                            {/* Checkbox grid */}
                            <div className="grid grid-cols-2 gap-1">
                              {sectionMeta.map((section) => {
                                const checked = selectedSections.includes(section.id)
                                const Icon = section.icon
                                return (
                                  <label
                                    key={section.id}
                                    className={cn(
                                      "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                                      checked
                                        ? "border-[#1B3C53]/40 bg-[#1B3C53]/[0.03]"
                                        : "border-slate-100 bg-white hover:border-slate-200 dark:border-slate-800",
                                    )}
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(value) => handleSectionToggle(section.id, Boolean(value))}
                                      className="size-3.5"
                                    />
                                    <Icon className="size-3 shrink-0 text-[#1B3C53]/60" />
                                    <span className="text-[9px] font-medium leading-tight text-slate-700 dark:text-slate-300">
                                      {section.title}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>

                            {/* Identity preserved note */}
                            <div className="mt-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-[8px] leading-relaxed text-slate-500 dark:bg-slate-800/50">
                              {t("runtime.components.chair.conference-template-sheet.text_identity_preserved")}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              /* Save flow */
              <>
                <div className="border-b px-5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openFlow("home")}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                      <ArrowLeft className="size-3.5" />
                    </button>
                    <div>
                      <h3 className="text-xs font-bold tracking-tight text-[#1B3C53]">{flowTitle}</h3>
                      <p className="text-[8px] text-slate-500">
                        {t("runtime.components.chair.conference-template-sheet.text_save_current_configuration_description")}
                      </p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                  <div className="space-y-4 px-5 py-4">
                    {/* Name + Scope */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {t("runtime.components.chair.conference-template-sheet.text_template_name")}
                        </label>
                        <Input
                          value={templateName}
                          onChange={(event) => setTemplateName(event.target.value)}
                          placeholder={t("runtime.components.chair.conference-template-sheet.placeholder_template_name")}
                          className="h-9 rounded-lg text-[10px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {t("runtime.components.chair.conference-template-sheet.text_template_scope")}
                        </label>
                        <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800">
                          {t("runtime.components.chair.conference-template-sheet.text_only_you_can_use_it")}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {t("runtime.components.chair.conference-template-sheet.text_description")}
                        </label>
                        <Textarea
                          value={templateDescription}
                          onChange={(event) => setTemplateDescription(event.target.value)}
                          placeholder={t("runtime.components.chair.conference-template-sheet.placeholder_template_description")}
                          className="min-h-20 rounded-lg text-[10px]"
                        />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          label: t("runtime.components.chair.conference-template-sheet.text_topics"),
                          value: formData.topics.length,
                        },
                        {
                          label: t("runtime.components.chair.conference-template-sheet.text_tracks"),
                          value: formData.tracks.length,
                        },
                        {
                          label: t("runtime.components.chair.conference-template-sheet.text_file_formats"),
                          value: formData.fileFormats.length,
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                        >
                          <div className="text-[7px] font-bold uppercase tracking-widest text-slate-400">
                            {stat.label}
                          </div>
                          <div className="mt-1 text-base font-bold text-[#1B3C53]">{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Info box */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                      <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300">
                        {t("runtime.components.chair.conference-template-sheet.text_saved_snapshot_includes")}
                      </p>
                      <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
                        {t("runtime.components.chair.conference-template-sheet.text_saved_snapshot_includes_description")}
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </div>

          {/* -- Footer -- */}
          <SheetFooter className="border-t bg-white px-5 py-2.5 dark:bg-slate-900">
            {flow === "home" ? (
              <div className="flex w-full justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-md px-4 text-[9px] font-bold tracking-wider"
                  onClick={() => onOpenChange(false)}
                >
                  {t("runtime.components.chair.conference-template-sheet.text_close")}
                </Button>
              </div>
            ) : isApplyFlow ? (
              <div className="flex w-full items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-md px-4 text-[9px] font-bold tracking-wider"
                  onClick={() => onOpenChange(false)}
                >
                  {t("runtime.components.chair.conference-template-sheet.text_close")}
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 rounded-md bg-[#1B3C53] px-4 text-[9px] font-bold tracking-wider hover:bg-[#234C6A]"
                  onClick={handleApply}
                  disabled={!selectedSourceFormData || selectedSections.length === 0}
                >
                  <Copy className="size-3" />
                  {t("runtime.components.chair.conference-template-sheet.text_apply_selection")}
                </Button>
              </div>
            ) : (
              <div className="flex w-full items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-md px-4 text-[9px] font-bold tracking-wider"
                  onClick={() => onOpenChange(false)}
                >
                  {t("runtime.components.chair.conference-template-sheet.text_close")}
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 rounded-md bg-[#1B3C53] px-4 text-[9px] font-bold tracking-wider hover:bg-[#234C6A]"
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate}
                >
                  {isSavingTemplate ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <LayoutTemplate className="size-3" />
                  )}
                  {isSavingTemplate
                    ? t("runtime.components.chair.conference-template-sheet.text_saving_template")
                    : t("runtime.components.chair.conference-template-sheet.text_save_template")}
                </Button>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(pendingDeleteTemplate)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingDeleteTemplate(null)
        }}
      >
        <AlertDialogContent className="max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xs font-bold text-[#1B3C53]">
              {t("runtime.components.chair.conference-template-sheet.text_delete_template")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[10px] text-slate-500">
              {t("runtime.components.chair.conference-template-sheet.text_delete_template_description", {
                name: pendingDeleteTemplate?.name || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 rounded-md px-4 text-[9px] font-bold tracking-wider">
              {t("runtime.components.chair.conference-template-sheet.text_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={isDeletingTemplate}
              className="h-8 gap-1.5 rounded-md bg-red-600 px-4 text-[9px] font-bold tracking-wider hover:bg-red-700"
            >
              {isDeletingTemplate ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
              {t("runtime.components.chair.conference-template-sheet.text_delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
