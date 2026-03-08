import type { Conference, ConferenceConfigTemplatePayload } from "@/lib/types"
import { initialFormData, type ConferenceFormData } from "@/components/wizard/creation/types"

function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function splitSubmissionFormats(value?: string): string[] {
  if (!value) {
    return initialFormData.fileFormats
  }

  const formats = value
    .split(",")
    .map((item) => item.trim()) 
    .filter(Boolean)

  return formats.length > 0 ? formats : initialFormData.fileFormats
}

function toISOString(value?: Date): string | undefined {
  return value ? value.toISOString() : undefined
}

function buildOrganizersFromEmails(emails?: string[]) {
  return (emails || []).map((email) => ({
    id: email,
    name: email.split("@")[0].replace(/[._-]/g, " "),
    email,
    role: "co-chair",
  }))
}

export type ConferenceTemplateSection =
  | "basics"
  | "topics_tracks"
  | "deadlines"
  | "submission_policy"
  | "review_policy"
  | "rebuttal_timeline"
  | "cfp"
  | "co_chairs"

export const DEFAULT_CONFERENCE_TEMPLATE_SECTIONS: ConferenceTemplateSection[] = [
  "topics_tracks",
  "deadlines",
  "submission_policy",
  "review_policy",
  "rebuttal_timeline",
  "cfp",
]

export interface ConferenceMutationPayload {
  title: string
  acronym: string
  description: string
  domain: string[]
  tracks: string[]
  venue: string
  co_chairs: string[]
  configurations: {
    start_date?: string
    end_date?: string
    abstract_submission_deadline?: string
    full_paper_submission_deadline?: string
    camera_ready_deadline?: string
    format: string
    review_type: string
    have_coi: boolean
    maximum_pages: number
    submission_format: string
    require_complete_author_profile: boolean
    allow_paper_withdrawls: boolean
    call_for_paper_text?: string
    desk_rejection_settings?: Record<string, unknown>
    discussion_settings?: Record<string, unknown>
    rebuttal_settings?: Record<string, unknown>
    workflow_settings?: Record<string, unknown>
  }
}

export function mapConferenceToFormData(conference: Conference): ConferenceFormData {
  const config = conference.configurations
  const deskSettings = config?.desk_rejection_settings
  const normalizedReviewType = (config?.review_type || "").replace(/_/g, "-").toLowerCase()

  return {
    ...initialFormData,
    title: conference.name || "",
    acronym: conference.acronym || "",
    description: conference.description || "",
    location: conference.location || "",
    locationType:
      config?.format === "virtual" || config?.format === "hybrid" || config?.format === "in-person"
        ? config.format
        : initialFormData.locationType,
    conferenceStartDate: parseDate(config?.start_date),
    conferenceEndDate: parseDate(config?.end_date),
    topics: conference.domain || [],
    tracks: conference.tracks || [],
    abstractDeadline: parseDate(config?.abstract_submission_deadline),
    fullPaperDeadline: parseDate(config?.full_paper_submission_deadline),
    cameraReadyDeadline: parseDate(config?.camera_ready_deadline),
    maxPages: config?.maximum_pages || initialFormData.maxPages,
    minKeywords: deskSettings?.min_references || initialFormData.minKeywords,
    maxKeywords: initialFormData.maxKeywords,
    abstractMaxWords: initialFormData.abstractMaxWords,
    supplementaryTypes: initialFormData.supplementaryTypes,
    allowSupplementary: (deskSettings?.custom_rules?.min_datasets || 0) > 0,
    strictDeadlines:
      config?.workflow_settings?.strict_deadlines ?? initialFormData.strictDeadlines,
    organizers: buildOrganizersFromEmails(conference.co_chairs),
    anonymity: normalizedReviewType === "single-blind" ? "single-blind" : "double-blind",
    rebuttalStartDate: parseDate(config?.rebuttal_settings?.start_at),
    rebuttalEndDate: parseDate(config?.rebuttal_settings?.end_at),
    finalDecisionDate: parseDate(config?.discussion_settings?.end_at),
    confirmed: true,
    dateRange: {
      from: parseDate(config?.start_date),
      to: parseDate(config?.end_date),
    },
    venue: conference.location || "",
    submissionsOpen: parseDate(config?.abstract_submission_deadline),
    submissionDeadline: parseDate(config?.full_paper_submission_deadline),
    authorNotification: parseDate(config?.discussion_settings?.end_at),
    fileFormats: splitSubmissionFormats(config?.submission_format),
    callForPaperText: conference.call_for_paper_text || "",
  }
}

export function mapTemplatePayloadToFormData(
  payload: ConferenceConfigTemplatePayload,
): ConferenceFormData {
  const normalizedReviewType = (payload.review_type || "").replace(/_/g, "-").toLowerCase()

  return {
    ...initialFormData,
    description: payload.description || "",
    location: payload.location || "",
    locationType:
      payload.location_type === "virtual" ||
      payload.location_type === "hybrid" ||
      payload.location_type === "in-person"
        ? payload.location_type
        : initialFormData.locationType,
    conferenceStartDate: parseDate(payload.conference_start_date),
    conferenceEndDate: parseDate(payload.conference_end_date),
    topics: payload.topics || [],
    tracks: payload.tracks || [],
    abstractDeadline: parseDate(payload.abstract_deadline),
    fullPaperDeadline: parseDate(payload.full_paper_deadline),
    cameraReadyDeadline: parseDate(payload.camera_ready_deadline),
    maxPages: payload.max_pages || initialFormData.maxPages,
    abstractMaxWords: payload.abstract_max_words || initialFormData.abstractMaxWords,
    minKeywords: payload.min_keywords || initialFormData.minKeywords,
    maxKeywords: payload.max_keywords || initialFormData.maxKeywords,
    allowSupplementary: payload.allow_supplementary ?? initialFormData.allowSupplementary,
    supplementaryTypes: payload.supplementary_types || initialFormData.supplementaryTypes,
    strictDeadlines: payload.strict_deadlines ?? initialFormData.strictDeadlines,
    organizers: buildOrganizersFromEmails(payload.co_chairs),
    anonymity: normalizedReviewType === "single-blind" ? "single-blind" : "double-blind",
    rebuttalStartDate: parseDate(payload.rebuttal_start_date),
    rebuttalEndDate: parseDate(payload.rebuttal_end_date),
    finalDecisionDate: parseDate(payload.final_decision_date),
    confirmed: true,
    dateRange: {
      from: parseDate(payload.conference_start_date),
      to: parseDate(payload.conference_end_date),
    },
    venue: payload.location || "",
    submissionsOpen: parseDate(payload.abstract_deadline),
    submissionDeadline: parseDate(payload.full_paper_deadline),
    authorNotification: parseDate(payload.final_decision_date),
    fileFormats: payload.file_formats || initialFormData.fileFormats,
    callForPaperText: payload.call_for_paper_text || "",
  }
}

export function buildConferenceConfigTemplatePayload(
  formData: ConferenceFormData,
): ConferenceConfigTemplatePayload {
  const coChairs = Array.from(
    new Set(
      formData.organizers
        .filter((organizer) => organizer.role === "co-chair")
        .map((organizer) => organizer.email.trim().toLowerCase())
        .filter(Boolean),
    ),
  )

  return {
    description: formData.description || undefined,
    location: formData.location || formData.venue || undefined,
    location_type: formData.locationType,
    topics: formData.topics,
    tracks: formData.tracks,
    conference_start_date: toISOString(formData.conferenceStartDate || formData.dateRange.from),
    conference_end_date: toISOString(formData.conferenceEndDate || formData.dateRange.to),
    abstract_deadline: toISOString(formData.abstractDeadline || formData.submissionsOpen),
    full_paper_deadline: toISOString(formData.fullPaperDeadline || formData.submissionDeadline),
    camera_ready_deadline: toISOString(formData.cameraReadyDeadline),
    max_pages: formData.maxPages,
    abstract_max_words: formData.abstractMaxWords,
    min_keywords: formData.minKeywords,
    max_keywords: formData.maxKeywords,
    allow_supplementary: formData.allowSupplementary,
    supplementary_types: formData.supplementaryTypes,
    strict_deadlines: formData.strictDeadlines,
    review_type: formData.anonymity,
    rebuttal_start_date: toISOString(formData.rebuttalStartDate),
    rebuttal_end_date: toISOString(formData.rebuttalEndDate),
    final_decision_date: toISOString(formData.finalDecisionDate || formData.authorNotification),
    file_formats: formData.fileFormats,
    call_for_paper_text: formData.callForPaperText || undefined,
    co_chairs: coChairs,
  }
}

export function applyConferenceTemplateSections(
  current: ConferenceFormData,
  source: ConferenceFormData,
  sections: ConferenceTemplateSection[],
): ConferenceFormData {
  const selected = new Set(sections)
  const next: ConferenceFormData = {
    ...current,
    organizers: current.organizers.map((organizer) => ({ ...organizer })),
    dateRange: { ...current.dateRange },
    topics: [...current.topics],
    tracks: [...current.tracks],
    fileFormats: [...current.fileFormats],
    supplementaryTypes: [...current.supplementaryTypes],
  }

  if (selected.has("basics")) {
    next.description = source.description
    next.location = source.location
    next.locationType = source.locationType
    next.venue = source.venue
  }

  if (selected.has("topics_tracks")) {
    next.topics = [...source.topics]
    next.tracks = [...source.tracks]
  }

  if (selected.has("deadlines")) {
    next.conferenceStartDate = source.conferenceStartDate
    next.conferenceEndDate = source.conferenceEndDate
    next.dateRange = { ...source.dateRange }
    next.abstractDeadline = source.abstractDeadline
    next.submissionsOpen = source.submissionsOpen
    next.fullPaperDeadline = source.fullPaperDeadline
    next.submissionDeadline = source.submissionDeadline
    next.cameraReadyDeadline = source.cameraReadyDeadline
  }

  if (selected.has("submission_policy")) {
    next.maxPages = source.maxPages
    next.abstractMaxWords = source.abstractMaxWords
    next.minKeywords = source.minKeywords
    next.maxKeywords = source.maxKeywords
    next.allowSupplementary = source.allowSupplementary
    next.supplementaryTypes = [...source.supplementaryTypes]
    next.fileFormats = [...source.fileFormats]
    next.strictDeadlines = source.strictDeadlines
  }

  if (selected.has("review_policy")) {
    next.anonymity = source.anonymity
  }

  if (selected.has("rebuttal_timeline")) {
    next.rebuttalStartDate = source.rebuttalStartDate
    next.rebuttalEndDate = source.rebuttalEndDate
    next.finalDecisionDate = source.finalDecisionDate
    next.authorNotification = source.authorNotification
  }

  if (selected.has("cfp")) {
    next.callForPaperText = source.callForPaperText
  }

  if (selected.has("co_chairs")) {
    next.organizers = source.organizers.map((organizer) => ({ ...organizer }))
  }

  return next
}

export function buildConferenceMutationPayload(
  formData: ConferenceFormData,
  existingConference?: Conference | null,
): ConferenceMutationPayload {
  const existingConfig = existingConference?.configurations
  const existingDeskSettings = existingConfig?.desk_rejection_settings
  const existingDiscussionSettings = existingConfig?.discussion_settings
  const existingRebuttalSettings = existingConfig?.rebuttal_settings
  const existingWorkflowSettings = existingConfig?.workflow_settings

  const fullPaperDeadline = formData.fullPaperDeadline || formData.submissionDeadline
  const abstractDeadline = formData.abstractDeadline || formData.submissionsOpen
  const startDate = formData.conferenceStartDate || formData.dateRange.from
  const endDate = formData.conferenceEndDate || formData.dateRange.to
  const location =
    formData.locationType === "virtual" ? formData.website || formData.location : formData.location

  const coChairs = Array.from(
    new Set(
      formData.organizers
        .filter((organizer) => organizer.role === "co-chair")
        .map((organizer) => organizer.email.trim().toLowerCase())
        .filter(Boolean),
    ),
  )

  return {
    title: formData.title.trim(),
    acronym: formData.acronym.trim(),
    description: formData.description,
    domain: formData.topics,
    tracks: formData.tracks,
    venue: location || formData.venue || existingConference?.location || "",
    co_chairs: coChairs,
    configurations: {
      start_date: startDate?.toISOString() || existingConfig?.start_date,
      end_date: endDate?.toISOString() || existingConfig?.end_date,
      abstract_submission_deadline:
        abstractDeadline?.toISOString() || existingConfig?.abstract_submission_deadline,
      full_paper_submission_deadline:
        fullPaperDeadline?.toISOString() || existingConfig?.full_paper_submission_deadline,
      camera_ready_deadline:
        formData.cameraReadyDeadline?.toISOString() || existingConfig?.camera_ready_deadline,
      format: formData.locationType || existingConfig?.format,
      review_type:
        formData.anonymity === "single-blind" ? "single-blind" : "double-blind",
      have_coi: existingConfig?.have_coi ?? true,
      maximum_pages: formData.maxPages || existingConfig?.maximum_pages || 8,
      submission_format:
        (formData.fileFormats.length > 0 ? formData.fileFormats.join(", ") : undefined) ||
        existingConfig?.submission_format ||
        "PDF",
      require_complete_author_profile: existingConfig?.require_complete_author_profile ?? true,
      allow_paper_withdrawls: existingConfig?.allow_paper_withdrawls ?? true,
      call_for_paper_text: formData.callForPaperText || existingConference?.call_for_paper_text,
      desk_rejection_settings: {
        enabled: existingDeskSettings?.enabled ?? true,
        required_sections: existingDeskSettings?.required_sections || [
          "Abstract",
          "Introduction",
          "Methods",
          "Results",
          "Conclusions",
        ],
        title_max_words: existingDeskSettings?.title_max_words || 15,
        max_sentence_words: existingDeskSettings?.max_sentence_words || 25,
        min_references:
          formData.minKeywords || existingDeskSettings?.min_references || 1,
        thresholds: existingDeskSettings?.thresholds || {
          desk_reject_score: 0.3,
          accept_score: 0.7,
        },
        weights: existingDeskSettings?.weights,
        custom_rules: {
          ...existingDeskSettings?.custom_rules,
          min_datasets: formData.allowSupplementary
            ? Math.max(existingDeskSettings?.custom_rules?.min_datasets || 0, 1)
            : 0,
        },
        scope_keywords:
          formData.topics.length > 0
            ? formData.topics
            : existingDeskSettings?.scope_keywords || [],
        prompt_fragments:
          existingDeskSettings?.prompt_fragments?.length
            ? existingDeskSettings.prompt_fragments
            : formData.callForPaperText
              ? [`Conference scope and emphasis:\n${formData.callForPaperText}`]
              : [],
      },
      discussion_settings: {
        enabled: existingDiscussionSettings?.enabled ?? true,
        allow_author_response: existingDiscussionSettings?.allow_author_response ?? true,
        start_at:
          fullPaperDeadline?.toISOString() || existingDiscussionSettings?.start_at,
        end_at:
          formData.finalDecisionDate?.toISOString() || existingDiscussionSettings?.end_at,
      },
      rebuttal_settings: {
        enabled:
          Boolean(formData.rebuttalStartDate && formData.rebuttalEndDate) ||
          existingRebuttalSettings?.enabled ||
          false,
        start_at:
          formData.rebuttalStartDate?.toISOString() || existingRebuttalSettings?.start_at,
        end_at: formData.rebuttalEndDate?.toISOString() || existingRebuttalSettings?.end_at,
        character_limit: existingRebuttalSettings?.character_limit || 10000,
        allow_revisions: existingRebuttalSettings?.allow_revisions ?? true,
        allow_new_results: existingRebuttalSettings?.allow_new_results ?? true,
        require_response_to_all:
          existingRebuttalSettings?.require_response_to_all ?? false,
      },
      workflow_settings: {
        ...existingWorkflowSettings,
        strict_deadlines: formData.strictDeadlines,
      },
    },
  }
}
