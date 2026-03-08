"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  if (!value) {
    return 0
  }

  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function buildSuggestedTemplateName(formData: ConferenceFormData) {
  if (formData.acronym.trim()) {
    return `${formData.acronym.trim()} template`
  }

  if (formData.title.trim()) {
    return `${formData.title.trim()} template`
  }

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
  const [pendingDeleteTemplate, setPendingDeleteTemplate] = useState<ConferenceConfigTemplate | null>(
    null,
  )
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
        description: t(
          "runtime.components.chair.conference-template-sheet.text_basics_and_venue_description",
        ),
        icon: Settings2,
      },
      {
        id: "topics_tracks",
        title: t("runtime.components.chair.conference-template-sheet.text_topics_and_tracks"),
        description: t(
          "runtime.components.chair.conference-template-sheet.text_topics_and_tracks_description",
        ),
        icon: Sparkles,
      },
      {
        id: "deadlines",
        title: t("runtime.components.chair.conference-template-sheet.text_important_dates"),
        description: t(
          "runtime.components.chair.conference-template-sheet.text_important_dates_description",
        ),
        icon: CalendarRange,
      },
      {
        id: "submission_policy",
        title: t("runtime.components.chair.conference-template-sheet.text_submission_policy"),
        description: t(
          "runtime.components.chair.conference-template-sheet.text_submission_policy_description",
        ),
        icon: FileText,
      },
      {
        id: "review_policy",
        title: t("runtime.components.chair.conference-template-sheet.text_review_policy"),
        description: t(
          "runtime.components.chair.conference-template-sheet.text_review_policy_description",
        ),
        icon: Copy,
      },
      {
        id: "rebuttal_timeline",
        title: t("runtime.components.chair.conference-template-sheet.text_rebuttal_and_decision"),
        description: t(
          "runtime.components.chair.conference-template-sheet.text_rebuttal_and_decision_description",
        ),
        icon: CalendarRange,
      },
      {
        id: "cfp",
        title: t("runtime.components.chair.conference-template-sheet.text_cfp_copy"),
        description: t(
          "runtime.components.chair.conference-template-sheet.text_cfp_copy_description",
        ),
        icon: FileText,
      },
      {
        id: "co_chairs",
        title: t("runtime.components.chair.conference-template-sheet.text_co_chairs"),
        description: t(
          "runtime.components.chair.conference-template-sheet.text_co_chairs_description",
        ),
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
    if (!open) {
      return
    }

    setFlow("home")
    setSearchQuery("")
    setSelectedSections(DEFAULT_CONFERENCE_TEMPLATE_SECTIONS)
    setTemplateName(buildSuggestedTemplateName(formData))
    setTemplateDescription("")
    setTemplateLoadError(null)
    setConferenceLoadError(null)
    setPendingDeleteTemplate(null)
  }, [formData, open])

  useEffect(() => {
    if (!open) {
      return
    }

    let active = true
    setIsLoadingTemplates(true)
    setTemplateLoadError(null)

    void listConferenceConfigTemplates(debouncedSearch || undefined).then((response) => {
      if (!active) {
        return
      }

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

    return () => {
      active = false
    }
  }, [debouncedSearch, open, t])

  useEffect(() => {
    if (!open) {
      return
    }

    let active = true
    setIsLoadingConferences(true)
    setConferenceLoadError(null)

    void listConferences({ myConferences: true, role: "chair", limit: 200 }).then((response) => {
      if (!active) {
        return
      }

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
          if (updatedDiff !== 0) {
            return updatedDiff
          }
          return dateValue(right.created_at) - dateValue(left.created_at)
        })

      setConferences(sorted)
      setIsLoadingConferences(false)
    })

    return () => {
      active = false
    }
  }, [currentConferenceId, open, t])

  const filteredConferences = useMemo(() => {
    const normalized = debouncedSearch.trim().toLowerCase()
    if (!normalized) {
      return conferences
    }

    return conferences.filter((conference) => {
      const haystack = [conference.name, conference.acronym, conference.description]
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }, [conferences, debouncedSearch])

  useEffect(() => {
    if (!open) {
      return
    }

    if (templates.length === 0) {
      setSelectedTemplateId(null)
      return
    }

    setSelectedTemplateId((current) =>
      current && templates.some((template) => template.id === current) ? current : templates[0].id,
    )
  }, [open, templates])

  useEffect(() => {
    if (!open) {
      return
    }

    if (filteredConferences.length === 0) {
      setSelectedConferenceId(null)
      return
    }

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
    if (flow === "templates" && selectedTemplate) {
      return mapTemplatePayloadToFormData(selectedTemplate.payload)
    }

    if (flow === "conferences" && selectedConference) {
      return mapConferenceToFormData(selectedConference)
    }

    return null
  }, [flow, selectedConference, selectedTemplate])

  const selectedSourceTitle =
    flow === "templates" ? selectedTemplate?.name || "" : selectedConference?.name || ""

  const selectedSourceDescription =
    flow === "templates"
      ? selectedTemplate?.description || ""
      : selectedConference?.description || ""

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
      if (checked) {
        return current.includes(section) ? current : [...current, section]
      }
      return current.filter((item) => item !== section)
    })
  }

  const handleApply = () => {
    if (!selectedSourceFormData || selectedSections.length === 0) {
      return
    }

    const nextFormData = applyConferenceTemplateSections(formData, selectedSourceFormData, selectedSections)
    onApply(nextFormData)

    toast({
      title: t("runtime.components.chair.conference-template-sheet.text_template_applied"),
      description: t(
        "runtime.components.chair.conference-template-sheet.text_template_applied_description",
        {
          source: selectedSourceTitle,
        },
      ),
    })

    onOpenChange(false)
  }

  const handleSaveTemplate = async () => {
    const normalizedName = templateName.trim()
    if (!normalizedName) {
      toast({
        title: t("runtime.components.chair.conference-template-sheet.text_name_required"),
        description: t(
          "runtime.components.chair.conference-template-sheet.text_name_required_description",
        ),
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
          t(
            "runtime.components.chair.conference-template-sheet.text_failed_to_save_template_description",
          ),
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
        {
          name: response.data.name,
        },
      ),
    })
  }

  const handleDeleteTemplate = async () => {
    if (!pendingDeleteTemplate) {
      return
    }

    setIsDeletingTemplate(true)
    const response = await deleteConferenceConfigTemplate(pendingDeleteTemplate.id)
    setIsDeletingTemplate(false)

    if (response.error) {
      toast({
        title: t("runtime.components.chair.conference-template-sheet.text_failed_to_delete_template"),
        description:
          response.error ||
          t(
            "runtime.components.chair.conference-template-sheet.text_failed_to_delete_template_description",
          ),
        variant: "destructive",
      })
      return
    }

    setTemplates((current) => current.filter((item) => item.id !== pendingDeleteTemplate.id))
    setPendingDeleteTemplate(null)

    toast({
      title: t("runtime.components.chair.conference-template-sheet.text_template_deleted"),
      description: t(
        "runtime.components.chair.conference-template-sheet.text_template_deleted_description",
      ),
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
    const hasDates =
      type === "templates" && isConferenceTemplate(source)
        ? Boolean(source.payload.conference_start_date || source.payload.full_paper_deadline)
        : !isConferenceTemplate(source)
          ? Boolean(source.conference_date || source.submission_deadline)
          : false

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary" className="rounded-full">
          {topicsCount} {t("runtime.components.chair.conference-template-sheet.text_topics")}
        </Badge>
        <Badge variant="secondary" className="rounded-full">
          {tracksCount} {t("runtime.components.chair.conference-template-sheet.text_tracks")}
        </Badge>
        {hasDates && (
          <Badge variant="secondary" className="rounded-full">
            {t("runtime.components.chair.conference-template-sheet.text_schedule_included")}
          </Badge>
        )}
      </div>
    )
  }

  const renderSourceMeta = (
    source: ConferenceConfigTemplate | Conference,
    type: "templates" | "conferences",
  ) => {
    const updatedAt = source.updated_at || source.created_at
    if (!updatedAt) {
      return null
    }

    return (
      <p className="mt-3 text-xs text-slate-500">
        {type === "templates"
          ? t("runtime.components.chair.conference-template-sheet.text_updated")
          : t("runtime.components.chair.conference-template-sheet.text_last_used")}
        : {formatDate.format(new Date(updatedAt))}
      </p>
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full max-w-none border-l px-0 sm:max-w-[calc(100vw-32px)] 2xl:max-w-[1360px]"
        >
          <SheetHeader className="border-b px-6 py-3 pr-14">
            <SheetTitle className="text-lg text-[#1B3C53]">
              {t("runtime.components.chair.conference-template-sheet.text_templates_and_copying")}
            </SheetTitle>
            <SheetDescription className="max-w-xl text-[13px] leading-relaxed">
              {t(
                "runtime.components.chair.conference-template-sheet.text_templates_and_copying_description",
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col">
            {flow === "home" ? (
              <>
                <div className="border-b px-6 py-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    {t("runtime.components.chair.conference-template-sheet.text_choose_action")}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {t(
                      "runtime.components.chair.conference-template-sheet.text_choose_action_description",
                    )}
                  </p>
                </div>

                <ScrollArea className="min-h-0 flex-1 px-6 py-5">
                  <div className="space-y-5 pb-4">
                    <div className="grid gap-4 lg:grid-cols-3">
                      <button type="button" className="group text-left" onClick={() => openFlow("templates")}>
                        <Card className="h-full gap-0 rounded-[28px] border py-0 transition-all hover:border-[#1B3C53]/30 hover:bg-[#1B3C53]/[0.03] hover:shadow-lg">
                          <CardContent className="flex h-full flex-col gap-5 px-5 py-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="rounded-2xl bg-[#1B3C53]/10 p-3 text-[#1B3C53]">
                                <LayoutTemplate className="size-5" />
                              </div>
                              <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base font-semibold text-slate-900">
                                  {t(
                                    "runtime.components.chair.conference-template-sheet.text_saved_templates",
                                  )}
                                </h4>
                                <Badge variant="secondary" className="rounded-full">
                                  {templates.length}
                                </Badge>
                              </div>
                              <p className="text-sm leading-relaxed text-slate-500">
                                {t(
                                  "runtime.components.chair.conference-template-sheet.text_saved_templates_card_description",
                                )}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </button>

                      <button type="button" className="group text-left" onClick={() => openFlow("conferences")}>
                        <Card className="h-full gap-0 rounded-[28px] border py-0 transition-all hover:border-[#1B3C53]/30 hover:bg-[#1B3C53]/[0.03] hover:shadow-lg">
                          <CardContent className="flex h-full flex-col gap-5 px-5 py-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="rounded-2xl bg-[#1B3C53]/10 p-3 text-[#1B3C53]">
                                <Copy className="size-5" />
                              </div>
                              <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base font-semibold text-slate-900">
                                  {t(
                                    "runtime.components.chair.conference-template-sheet.text_copy_from_conference",
                                  )}
                                </h4>
                                <Badge variant="secondary" className="rounded-full">
                                  {conferences.length}
                                </Badge>
                              </div>
                              <p className="text-sm leading-relaxed text-slate-500">
                                {t(
                                  "runtime.components.chair.conference-template-sheet.text_copy_from_conference_card_description",
                                )}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </button>

                      <button type="button" className="group text-left" onClick={() => openFlow("save")}>
                        <Card className="h-full gap-0 rounded-[28px] border py-0 transition-all hover:border-[#1B3C53]/30 hover:bg-[#1B3C53]/[0.03] hover:shadow-lg">
                          <CardContent className="flex h-full flex-col gap-5 px-5 py-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="rounded-2xl bg-[#1B3C53]/10 p-3 text-[#1B3C53]">
                                <Sparkles className="size-5" />
                              </div>
                              <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-base font-semibold text-slate-900">
                                {t(
                                  "runtime.components.chair.conference-template-sheet.text_save_current",
                                )}
                              </h4>
                              <p className="text-sm leading-relaxed text-slate-500">
                                {t(
                                  "runtime.components.chair.conference-template-sheet.text_save_current_configuration_card_description",
                                )}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </button>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-600">
                      {t("runtime.components.chair.conference-template-sheet.text_identity_preserved")}
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : isApplyFlow ? (
              <>
                <div className="border-b px-6 py-3">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full"
                        onClick={() => openFlow("home")}
                      >
                        <ArrowLeft className="size-4" />
                      </Button>
                      <div className="space-y-0.5">
                        <h3 className="text-base font-semibold text-slate-900">{flowTitle}</h3>
                        <p className="text-[13px] text-slate-500">
                          {t(
                            "runtime.components.chair.conference-template-sheet.text_pick_source_description",
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="relative xl:w-[380px] xl:min-w-[380px]">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-11 rounded-2xl border-slate-200 bg-white pl-9"
                        placeholder={flowSearchPlaceholder}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(420px,0.95fr)] 2xl:grid-cols-[minmax(0,1.55fr)_minmax(500px,1fr)]">
                  <div className="flex min-h-0 flex-col border-b xl:border-r xl:border-b-0">
                    <ScrollArea className="min-h-0 flex-1 px-6 py-3">
                      <div className="space-y-3 pb-4">
                        {flow === "templates" && isLoadingTemplates ? (
                          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-sm text-slate-500">
                            <Loader2 className="size-4 animate-spin" />
                            {t(
                              "runtime.components.chair.conference-template-sheet.text_loading_templates",
                            )}
                          </div>
                        ) : null}

                        {flow === "conferences" && isLoadingConferences ? (
                          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-sm text-slate-500">
                            <Loader2 className="size-4 animate-spin" />
                            {t(
                              "runtime.components.chair.conference-template-sheet.text_loading_conferences",
                            )}
                          </div>
                        ) : null}

                        {flow === "templates" && templateLoadError ? (
                          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {templateLoadError}
                          </div>
                        ) : null}

                        {flow === "conferences" && conferenceLoadError ? (
                          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {conferenceLoadError}
                          </div>
                        ) : null}

                        {showApplyEmptyState ? (
                          <Card className="rounded-[24px] border-dashed py-0 shadow-none">
                            <CardContent className="flex flex-col items-start gap-3 px-6 py-6">
                              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                                {flow === "templates" ? (
                                  <LayoutTemplate className="size-5" />
                                ) : (
                                  <Copy className="size-5" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-base font-semibold text-slate-900">
                                  {flow === "templates"
                                    ? t(
                                        "runtime.components.chair.conference-template-sheet.text_no_templates_yet",
                                      )
                                    : t(
                                        "runtime.components.chair.conference-template-sheet.text_no_conferences_found",
                                      )}
                                </h3>
                                <p className="text-sm text-slate-500">
                                  {flow === "templates"
                                    ? t(
                                        "runtime.components.chair.conference-template-sheet.text_no_templates_yet_description",
                                      )
                                    : t(
                                        "runtime.components.chair.conference-template-sheet.text_no_conferences_found_description",
                                      )}
                                </p>
                              </div>
                              {flow === "templates" ? (
                                <Button variant="outline" onClick={() => openFlow("save")}>
                                  {t(
                                    "runtime.components.chair.conference-template-sheet.text_save_current_configuration",
                                  )}
                                </Button>
                              ) : null}
                            </CardContent>
                          </Card>
                        ) : null}

                        {flow === "templates" && !isLoadingTemplates
                          ? templates.map((template) => {
                              const isSelected = template.id === selectedTemplateId
                              return (
                                <Card
                                  key={template.id}
                                  className={cn(
                                    "cursor-pointer gap-0 rounded-[24px] border py-0 transition-all hover:border-slate-300 hover:bg-slate-50/60",
                                    isSelected &&
                                      "border-[#1B3C53] bg-[#1B3C53]/[0.03] shadow-[0_18px_40px_rgba(27,60,83,0.08)]",
                                  )}
                                  onClick={() => setSelectedTemplateId(template.id)}
                                >
                                  <CardContent className="px-4 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h3 className="truncate text-base font-semibold text-slate-900">
                                            {template.name}
                                          </h3>
                                          <Badge variant="outline" className="rounded-full">
                                            {t(
                                              "runtime.components.chair.conference-template-sheet.text_template",
                                            )}
                                          </Badge>
                                        </div>
                                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                                          {template.description ||
                                            t(
                                              "runtime.components.chair.conference-template-sheet.text_no_template_description",
                                            )}
                                        </p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="rounded-full text-slate-400 hover:text-red-600"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setPendingDeleteTemplate(template)
                                        }}
                                      >
                                        <Trash2 className="size-4" />
                                      </Button>
                                    </div>
                                    {renderSourceBadges(template, "templates")}
                                    {renderSourceMeta(template, "templates")}
                                  </CardContent>
                                </Card>
                              )
                            })
                          : null}

                        {flow === "conferences" && !isLoadingConferences
                          ? filteredConferences.map((conference) => {
                              const isSelected = conference.id === selectedConferenceId
                              return (
                                <Card
                                  key={conference.id}
                                  className={cn(
                                    "cursor-pointer gap-0 rounded-[24px] border py-0 transition-all hover:border-slate-300 hover:bg-slate-50/60",
                                    isSelected &&
                                      "border-[#1B3C53] bg-[#1B3C53]/[0.03] shadow-[0_18px_40px_rgba(27,60,83,0.08)]",
                                  )}
                                  onClick={() => setSelectedConferenceId(conference.id)}
                                >
                                  <CardContent className="px-4 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h3 className="truncate text-base font-semibold text-slate-900">
                                            {conference.name}
                                          </h3>
                                          <Badge variant="outline" className="rounded-full">
                                            {conference.acronym}
                                          </Badge>
                                        </div>
                                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                                          {conference.description ||
                                            t(
                                              "runtime.components.chair.conference-template-sheet.text_no_conference_description",
                                            )}
                                        </p>
                                      </div>
                                      <Badge variant="secondary" className="rounded-full">
                                        {t(
                                          "runtime.components.chair.conference-template-sheet.text_conference",
                                        )}
                                      </Badge>
                                    </div>
                                    {renderSourceBadges(conference, "conferences")}
                                    {renderSourceMeta(conference, "conferences")}
                                  </CardContent>
                                </Card>
                              )
                            })
                          : null}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="flex min-h-0 flex-col bg-white">
                    <ScrollArea className="min-h-0 flex-1 px-5 py-3">
                      <div className="space-y-4 pb-4">
                        <Card className="gap-0 rounded-[24px] border-slate-200 py-0 shadow-none">
                          <CardContent className="space-y-4 px-5 py-5">
                            <div className="space-y-2 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  {t(
                                    "runtime.components.chair.conference-template-sheet.text_selected_source",
                                  )}
                                </p>
                                <h3 className="mt-2 text-base font-semibold text-[#1B3C53]">
                                  {selectedSourceTitle ||
                                    t(
                                      "runtime.components.chair.conference-template-sheet.text_select_a_template",
                                    )}
                                </h3>
                                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
                                  {selectedSourceDescription ||
                                    t(
                                      "runtime.components.chair.conference-template-sheet.text_selected_source_description",
                                    )}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs leading-relaxed text-slate-600">
                                {t(
                                  "runtime.components.chair.conference-template-sheet.text_identity_preserved",
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {t("runtime.components.chair.conference-template-sheet.text_what_to_apply")}
                              </h3>
                              <Badge variant="secondary" className="rounded-full">
                                {selectedSections.length}{" "}
                                {t("runtime.components.chair.conference-template-sheet.text_sections")}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedSections(DEFAULT_CONFERENCE_TEMPLATE_SECTIONS)
                                }
                              >
                                {t(
                                  "runtime.components.chair.conference-template-sheet.text_recommended",
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedSections(sectionMeta.map((section) => section.id))
                                }
                              >
                                {t(
                                  "runtime.components.chair.conference-template-sheet.text_select_all",
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSections([])}
                              >
                                {t("runtime.components.chair.conference-template-sheet.text_clear")}
                              </Button>
                            </div>

                            <div className="space-y-2.5">
                              {sectionMeta.map((section) => {
                                const checked = selectedSections.includes(section.id)
                                const Icon = section.icon

                                return (
                                  <label
                                    key={section.id}
                                    className={cn(
                                      "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors",
                                      checked
                                        ? "border-[#1B3C53] bg-white shadow-sm"
                                        : "border-slate-200 bg-white/60 hover:border-slate-300",
                                    )}
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(value) =>
                                        handleSectionToggle(section.id, Boolean(value))
                                      }
                                      className="mt-0.5"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <Icon className="size-4 text-[#1B3C53]" />
                                        <span className="text-sm font-medium text-slate-900">
                                          {section.title}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                                        {section.description}
                                      </p>
                                    </div>
                                  </label>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="border-b px-6 py-3">
                  <div className="flex items-start gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full"
                      onClick={() => openFlow("home")}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <div className="space-y-0.5">
                      <h3 className="text-base font-semibold text-slate-900">{flowTitle}</h3>
                      <p className="text-[13px] text-slate-500">
                        {t(
                          "runtime.components.chair.conference-template-sheet.text_save_current_configuration_description",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="min-h-0 flex-1 px-6 py-5">
                  <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-4">
                    <Card className="gap-0 rounded-[24px] py-0 shadow-none">
                      <CardContent className="space-y-5 px-6 py-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                              {t(
                                "runtime.components.chair.conference-template-sheet.text_template_name",
                              )}
                            </label>
                            <Input
                              value={templateName}
                              onChange={(event) => setTemplateName(event.target.value)}
                              placeholder={t(
                                "runtime.components.chair.conference-template-sheet.placeholder_template_name",
                              )}
                              className="h-11 rounded-2xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                              {t(
                                "runtime.components.chair.conference-template-sheet.text_template_scope",
                              )}
                            </label>
                            <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
                              {t(
                                "runtime.components.chair.conference-template-sheet.text_only_you_can_use_it",
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            {t("runtime.components.chair.conference-template-sheet.text_description")}
                          </label>
                          <Textarea
                            value={templateDescription}
                            onChange={(event) => setTemplateDescription(event.target.value)}
                            placeholder={t(
                              "runtime.components.chair.conference-template-sheet.placeholder_template_description",
                            )}
                            className="min-h-28 rounded-3xl"
                          />
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {t("runtime.components.chair.conference-template-sheet.text_topics")}
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-[#1B3C53]">
                              {formData.topics.length}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {t("runtime.components.chair.conference-template-sheet.text_tracks")}
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-[#1B3C53]">
                              {formData.tracks.length}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {t(
                                "runtime.components.chair.conference-template-sheet.text_file_formats",
                              )}
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-[#1B3C53]">
                              {formData.fileFormats.length}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                          <p className="text-sm font-medium text-slate-900">
                            {t(
                              "runtime.components.chair.conference-template-sheet.text_saved_snapshot_includes",
                            )}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            {t(
                              "runtime.components.chair.conference-template-sheet.text_saved_snapshot_includes_description",
                            )}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </>
            )}
          </div>

          <SheetFooter className="border-t bg-white px-6 py-3">
            {flow === "home" ? (
              <div className="flex w-full justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {t("runtime.components.chair.conference-template-sheet.text_close")}
                </Button>
              </div>
            ) : isApplyFlow ? (
              <div className="flex w-full justify-end">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    {t("runtime.components.chair.conference-template-sheet.text_close")}
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={!selectedSourceFormData || selectedSections.length === 0}
                    className="bg-[#1B3C53] hover:bg-[#234C6A]"
                  >
                    <Copy className="size-4" />
                    {t("runtime.components.chair.conference-template-sheet.text_apply_selection")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full justify-end">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    {t("runtime.components.chair.conference-template-sheet.text_close")}
                  </Button>
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={isSavingTemplate}
                    className="bg-[#1B3C53] hover:bg-[#234C6A]"
                  >
                    {isSavingTemplate ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LayoutTemplate className="size-4" />
                    )}
                    {isSavingTemplate
                      ? t("runtime.components.chair.conference-template-sheet.text_saving_template")
                      : t("runtime.components.chair.conference-template-sheet.text_save_template")}
                  </Button>
                </div>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(pendingDeleteTemplate)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPendingDeleteTemplate(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("runtime.components.chair.conference-template-sheet.text_delete_template")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "runtime.components.chair.conference-template-sheet.text_delete_template_description",
                {
                  name: pendingDeleteTemplate?.name || "",
                },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("runtime.components.chair.conference-template-sheet.text_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={isDeletingTemplate}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingTemplate ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {t("runtime.components.chair.conference-template-sheet.text_delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
