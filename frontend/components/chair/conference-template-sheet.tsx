"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarRange, Copy, FileText, Settings2, Sparkles, Users } from "lucide-react"

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { useTranslation } from "@/lib/i18n/translation-context"
import { listConferences } from "@/lib/api/conferences"
import {
  createConferenceConfigTemplate,
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

import type { ConferenceConfigTemplate, Conference } from "@/lib/types"
import { type ConferenceFormData, initialFormData } from "@/components/wizard/creation"

import type { SectionMeta, SourceData, TemplateFlow } from "./template-sheet/types"
import { HomeView } from "./template-sheet/home-view"
import { SelectionView } from "./template-sheet/selection-view"
import { SaveView } from "./template-sheet/save-view"

interface ConferenceTemplateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData?: ConferenceFormData
  onApply: (data: Partial<ConferenceFormData>) => void
  currentConferenceId?: string
  allowSave?: boolean
}

function isConferenceTemplate(
  source: Conference | ConferenceConfigTemplate,
): source is ConferenceConfigTemplate {
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
  allowSave,
}: ConferenceTemplateSheetProps) {
  const { t, locale } = useTranslation()
  const { toast } = useToast()

  const [flow, setFlow] = useState<TemplateFlow>("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSections, setSelectedSections] = useState<ConferenceTemplateSection[]>(
    DEFAULT_CONFERENCE_TEMPLATE_SECTIONS,
  )

  const currentFormData = formData || initialFormData

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

  const debouncedSearch = useDebounce(searchQuery, 300)

  const sectionMeta: SectionMeta[] = useMemo(
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

  useEffect(() => {
    if (!open) return

    setFlow("home")
    setSearchQuery("")
    setSelectedSections(DEFAULT_CONFERENCE_TEMPLATE_SECTIONS)
    setTemplateName(buildSuggestedTemplateName(currentFormData))
    setTemplateDescription("")
    setTemplateLoadError(null)
    setConferenceLoadError(null)
  }, [currentFormData, open])

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

      setTemplates(response.data.templates || [])
      setIsLoadingTemplates(false)
    })

    return () => {
      active = false
    }
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

      const sorted = [...(response.data.conferences || [])]
        .filter((conference) => conference.id !== currentConferenceId)
        .sort((left, right) => {
          const updatedDiff = dateValue(right.updated_at) - dateValue(left.updated_at)
          if (updatedDiff !== 0) return updatedDiff
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
    if (!normalized) return conferences

    return conferences.filter((conference) => {
      const haystack = [conference.name, conference.acronym, conference.description]
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }, [conferences, debouncedSearch])

  useEffect(() => {
    if (!open) return
    if (templates.length === 0) {
      setSelectedTemplateId(null)
      return
    }
    setSelectedTemplateId((current) =>
      current && templates.some((template) => template.id === current) ? current : templates[0].id,
    )
  }, [open, templates])

  useEffect(() => {
    if (!open) return
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

  const openFlow = (nextFlow: TemplateFlow) => {
    setFlow(nextFlow)
    setSearchQuery("")

    if (nextFlow === "save") {
      setTemplateName((current) => current || buildSuggestedTemplateName(currentFormData))
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

    const nextFormData = applyConferenceTemplateSections(
      currentFormData,
      selectedSourceFormData,
      selectedSections,
    )
    onApply(nextFormData)

    const title = flow === "templates" ? selectedTemplate?.name : selectedConference?.name

    toast({
      title: t("runtime.components.chair.conference-template-sheet.text_template_applied"),
      description: t(
        "runtime.components.chair.conference-template-sheet.text_template_applied_description",
        {
          source: title || "",
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

    // Save using the selected sections, so it only snapshots what the user chooses
    const snapshotData = applyConferenceTemplateSections(
      currentFormData, // Using the current filled-out form data
      currentFormData, // Fallback, we don't need a source as we're saving
      selectedSections,
    )

    // Create the payload exactly from the partial snapshot
    const payload = buildConferenceConfigTemplatePayload(snapshotData)

    const response = await createConferenceConfigTemplate({
      name: normalizedName,
      description: templateDescription.trim(),
      payload,
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

    setTemplates((current) => [
      response.data!,
      ...current.filter((item) => item.id !== response.data!.id),
    ])
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

  // Convert raw API sources into canonical mapped array for SelectionView
  const mapSourceToData = (source: ConferenceConfigTemplate | Conference): SourceData => {
    const isTemplate = isConferenceTemplate(source)
    const topicsCount = isTemplate
      ? source.payload.topics?.length || 0
      : !isTemplate
        ? source.domain?.length || 0
        : 0
    const tracksCount = isTemplate
      ? source.payload.tracks?.length || 0
      : !isTemplate
        ? source.tracks?.length || 0
        : 0
    const hasDates = isTemplate
      ? Boolean(source.payload.conference_start_date || source.payload.full_paper_deadline)
      : !isTemplate
        ? Boolean(source.conference_date || source.submission_deadline)
        : false

    return {
      id: source.id,
      name: source.name,
      description: source.description,
      acronym: !isTemplate ? source.acronym : undefined,
      topicsCount,
      tracksCount,
      hasDates,
      updatedAt: source.updated_at || source.created_at || new Date().toISOString(),
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-none border-l-0 px-0 sm:max-w-[calc(100vw-32px)] 2xl:max-w-[1360px] p-0 flex flex-col bg-slate-50"
      >
        <VisuallyHidden>
          <SheetTitle>
            {t("runtime.components.chair.conference-template-sheet.text_templates_and_copying")}
          </SheetTitle>
          <SheetDescription>Manage reusable conference configurations.</SheetDescription>
        </VisuallyHidden>
        <div className="flex h-full flex-col">
          {flow === "home" ? (
            <HomeView
              onFlowChange={openFlow}
              t={t}
              templatesCount={templates.length}
              conferencesCount={conferences.length}
              allowSave={allowSave !== false}
            />
          ) : flow === "templates" || flow === "conferences" ? (
            <SelectionView
              flow={flow}
              onFlowChange={openFlow}
              t={t}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isLoading={flow === "templates" ? isLoadingTemplates : isLoadingConferences}
              error={flow === "templates" ? templateLoadError : conferenceLoadError}
              sources={(flow === "templates" ? templates : filteredConferences).map(
                mapSourceToData,
              )}
              selectedSourceId={flow === "templates" ? selectedTemplateId : selectedConferenceId}
              onSelectSource={
                flow === "templates" ? setSelectedTemplateId : setSelectedConferenceId
              }
              sectionMeta={sectionMeta}
              selectedSections={selectedSections}
              onSectionToggle={handleSectionToggle}
              onSelectAllSections={() => setSelectedSections(sectionMeta.map((s) => s.id))}
              onSelectRecommendedSections={() =>
                setSelectedSections(DEFAULT_CONFERENCE_TEMPLATE_SECTIONS)
              }
              onClearSections={() => setSelectedSections([])}
              onApply={handleApply}
              formatDate={formatDate}
            />
          ) : (
            <SaveView
              onFlowChange={openFlow}
              t={t}
              templateName={templateName}
              onTemplateNameChange={setTemplateName}
              templateDescription={templateDescription}
              onTemplateDescriptionChange={setTemplateDescription}
              isSaving={isSavingTemplate}
              sectionMeta={sectionMeta}
              selectedSections={selectedSections}
              onSectionToggle={handleSectionToggle}
              onSelectAllSections={() => setSelectedSections(sectionMeta.map((s) => s.id))}
              onClearSections={() => setSelectedSections([])}
              onSave={handleSaveTemplate}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
