"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  getTrackRecommendations,
  precheckPaper,
  publishPaper,
  submitPaper,
  updatePaper,
} from "@/lib/api/papers"
import { updateSubmissionStatus } from "@/lib/api/submissions"
import { useAuth } from "@/lib/auth-context"
import { ROUTES } from "@/lib/routes"
import type {
  Conference,
  PrecheckBlockedError,
  PrecheckResult,
  TrackRecommendation,
} from "@/lib/types"
import type { Submission } from "@/lib/api/submissions"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import type { StepType, Author } from "./types"
import { SubmissionProgressSidebar } from "./submission-progress-sidebar"
import { SubmissionActionBar } from "./submission-action-bar"
import { PaperDetailsStep } from "./paper-details-step"
import { AuthorsStep } from "./authors-step"
import { FileUploadStep } from "./file-upload-step"
import { ConflictsStep, type Conflict } from "./conflicts-step"
import { ReviewStep } from "./review-step"
import { SubmissionAutofillSheet } from "./submission-autofill-sheet"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getSubmissionEligibility } from "@/lib/submission-eligibility"
import { getManuscriptUploadError, isAcceptedManuscriptFile } from "./submission-file-validation"
import type { SubmissionAutofillResponse } from "@/lib/api/submission-autofill"
import { trackUsageEvent } from "@/lib/usage-events"

interface PaperSubmissionFormProps {
  conference?: Conference | null
  submission?: Submission | null
}

type AutosaveStatus = "idle" | "saving" | "saved" | "error"
const AUTOSAVE_INTERVAL_MS = 2 * 60 * 1000

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  }
}

function nameFromEmail(email: string) {
  return splitName(email.split("@")[0]?.replace(/[._-]/g, " ") || "")
}

function normalizeStoredAuthors(submission: Submission | null | undefined, user: any): Author[] {
  const metadata = submission?.information?.metadata as
    | { authors?: Array<Partial<Author> & { corresponding?: boolean }> }
    | undefined
  const storedAuthors = Array.isArray(metadata?.authors) ? metadata.authors : []

  if (storedAuthors.length > 0) {
    const normalized = storedAuthors
      .map((author, index): Author | null => {
        const email = String(author.email || "").trim()
        const fallbackName = email ? nameFromEmail(email) : { firstName: "", lastName: "" }
        const firstName = String(author.firstName || fallbackName.firstName || "").trim()
        const lastName = String(author.lastName || fallbackName.lastName || "").trim()
        if (!email && !firstName && !lastName) return null
        return {
          id: String(author.id || `stored-author-${index}-${email || firstName}`),
          firstName,
          lastName,
          email,
          affiliation: String(author.affiliation || "").trim(),
          country: String(author.country || "").trim(),
          isCorresponding: Boolean(author.isCorresponding ?? author.corresponding ?? index === 0),
        }
      })
      .filter((author): author is Author => Boolean(author))

    if (normalized.length > 0) {
      const hasCorresponding = normalized.some((author) => author.isCorresponding)
      return normalized.map((author, index) => ({
        ...author,
        isCorresponding: hasCorresponding ? author.isCorresponding : index === 0,
      }))
    }
  }

  const primaryEmail = submission?.author || user?.email || ""
  const primaryName =
    user?.first_name || user?.last_name
      ? { firstName: user?.first_name || "", lastName: user?.last_name || "" }
      : user?.name
        ? splitName(user.name)
        : nameFromEmail(primaryEmail)
  const coAuthorEmails = submission?.information?.co_authors || []

  return [
    {
      id: "primary-author",
      firstName: primaryName.firstName,
      lastName: primaryName.lastName,
      email: primaryEmail,
      affiliation: user?.affiliation || "",
      country: "",
      isCorresponding: true,
    },
    ...coAuthorEmails.map((email, index): Author => {
      const fallbackName = nameFromEmail(email)
      return {
        id: `co-author-${index}-${email}`,
        firstName: fallbackName.firstName,
        lastName: fallbackName.lastName,
        email,
        affiliation: "",
        country: "",
        isCorresponding: false,
      }
    }),
  ]
}

function normalizeStoredConflicts(submission: Submission | null | undefined): Conflict[] {
  const metadata = submission?.information?.metadata as
    | {
        conflicts?: Array<{
          id?: string
          firstName?: string
          lastName?: string
          email?: string
          reason?: string
        }>
      }
    | undefined
  const storedConflicts = Array.isArray(metadata?.conflicts) ? metadata.conflicts : []

  if (storedConflicts.length > 0) {
    return storedConflicts.map((conflict, index) => ({
      id: String(conflict.id || `stored-conflict-${index}-${conflict.email || conflict.firstName}`),
      firstName: String(conflict.firstName || "").trim(),
      lastName: String(conflict.lastName || "").trim(),
      email: String(conflict.email || "").trim(),
      reason: String(conflict.reason || "other"),
    }))
  }

  return (submission?.information?.declared_conflicts || []).map((conflict, index) => {
    const fallbackName = conflict.email
      ? nameFromEmail(conflict.email)
      : { firstName: "", lastName: "" }
    return {
      id: `declared-conflict-${index}-${conflict.email}`,
      firstName: fallbackName.firstName,
      lastName: fallbackName.lastName,
      email: conflict.email,
      reason: conflict.reason || "other",
    }
  })
}

function initialConflictDomains(submission: Submission | null | undefined, user: any) {
  if (submission?.domain?.length) {
    return submission.domain
  }
  const emailDomain = typeof user?.email === "string" ? user.email.split("@")[1] : ""
  return emailDomain ? [emailDomain] : []
}

function findAutofillManuscriptFile(
  files: File[],
  result: SubmissionAutofillResponse,
): File | null {
  const manuscriptMaterial = (result.materials || []).find((material) => {
    const role = material.role.toLowerCase()
    return role.includes("manuscript") || role.includes("paper")
  })

  if (manuscriptMaterial) {
    const matchingFile = files.find(
      (file) =>
        file.name === manuscriptMaterial.filename && file.size === manuscriptMaterial.size_bytes,
    )
    if (matchingFile && isAcceptedManuscriptFile(matchingFile)) {
      return matchingFile
    }
  }

  return files.find(isAcceptedManuscriptFile) || null
}

export function PaperSubmissionForm({
  conference,
  submission: initialSubmission,
}: PaperSubmissionFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState<StepType>("paper")
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle")
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialSubmission?.updated_at ? new Date(initialSubmission.updated_at) : null,
  )
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(
    initialSubmission?.id ? initialSubmission.id.toString() : null,
  )
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showDraftSavedDialog, setShowDraftSavedDialog] = useState(false)
  const [showAutofillSheet, setShowAutofillSheet] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const lastSavedSignatureRef = useRef<string>("")
  const lastAutosaveErrorRef = useRef<string | null>(null)
  const hasTrackedSubmissionStartRef = useRef(false)
  const userSubmissionSnapshot = useMemo(
    () => ({
      email: user?.email,
      first_name: user?.first_name,
      last_name: user?.last_name,
      name: user?.name,
      affiliation: user?.affiliation,
    }),
    [user?.affiliation, user?.email, user?.first_name, user?.last_name, user?.name],
  )

  useEffect(() => {
    if (initialSubmission?.id) {
      setDraftSubmissionId(initialSubmission.id.toString())
      if (initialSubmission.updated_at) {
        setLastSavedAt(new Date(initialSubmission.updated_at))
      }
    }
  }, [initialSubmission?.id, initialSubmission?.updated_at])

  useEffect(() => {
    if (initialSubmission?.id) {
      setCoiConfirmed(true)
      setSubmissionConfirmed(true)
    }
  }, [initialSubmission?.id])

  useEffect(() => {
    setTitle(initialSubmission?.title || "")
    setAbstract(initialSubmission?.abstract || "")
    setKeywords(initialSubmission?.information?.keywords || [])
    setSelectedTrack(initialSubmission?.information?.track_name || "")
    setIsStudentPaper(initialSubmission?.information?.paper_type === "student")
    setAuthors(normalizeStoredAuthors(initialSubmission, userSubmissionSnapshot))
    setConflictDomains(initialConflictDomains(initialSubmission, userSubmissionSnapshot))
    setConflicts(normalizeStoredConflicts(initialSubmission))
  }, [initialSubmission, userSubmissionSnapshot])

  // Paper Details state
  const [title, setTitle] = useState(initialSubmission?.title || "")
  const [abstract, setAbstract] = useState(initialSubmission?.abstract || "")
  const [keywords, setKeywords] = useState<string[]>(initialSubmission?.information?.keywords || [])
  const [keywordInput, setKeywordInput] = useState("")
  const [selectedTrack, setSelectedTrack] = useState<string>(
    initialSubmission?.information?.track_name || "",
  )
  const [isStudentPaper, setIsStudentPaper] = useState(
    initialSubmission?.information?.paper_type === "student",
  )
  const [trackRecommendations, setTrackRecommendations] = useState<TrackRecommendation[]>([])
  const [trackRecommendationLoading, setTrackRecommendationLoading] = useState(false)
  const [trackRecommendationError, setTrackRecommendationError] = useState<string | null>(null)
  const [lastRecommendationSignature, setLastRecommendationSignature] = useState<string | null>(
    null,
  )

  // Authors state
  const [authors, setAuthors] = useState<Author[]>(() =>
    normalizeStoredAuthors(initialSubmission, user),
  )
  const [newAuthor, setNewAuthor] = useState({
    firstName: "",
    lastName: "",
    email: "",
    affiliation: "",
    country: "",
  })

  // File Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [precheckResult, setPrecheckResult] = useState<PrecheckResult | null>(null)
  const [precheckError, setPrecheckError] = useState<string | null>(null)
  const [precheckLoading, setPrecheckLoading] = useState(false)
  const [lastPrecheckBlock, setLastPrecheckBlock] = useState<PrecheckBlockedError | null>(null)
  const [fileValidation, setFileValidation] = useState<{
    format: boolean
    fonts: boolean
  }>({ format: false, fonts: false })

  // Conflicts of Interest state
  const [conflictDomains, setConflictDomains] = useState<string[]>(() =>
    initialConflictDomains(initialSubmission, user),
  )
  const [domainInput, setDomainInput] = useState("")
  const [conflicts, setConflicts] = useState<Conflict[]>(() =>
    normalizeStoredConflicts(initialSubmission),
  )
  const [newConflict, setNewConflict] = useState({
    firstName: "",
    lastName: "",
    email: "",
    reason: "advisor",
  })
  const [coiConfirmed, setCoiConfirmed] = useState(Boolean(initialSubmission))
  const [submissionConfirmed, setSubmissionConfirmed] = useState(Boolean(initialSubmission))

  const defaultTracks = [
    "Artificial Intelligence & Machine Learning",
    "Computer Systems & Networks",
    "Software Engineering",
    "Human-Computer Interaction",
  ]

  const availableTracks: string[] =
    Array.isArray(conference?.tracks) && conference.tracks.length > 0
      ? conference.tracks
          .map((t) => (typeof t === "string" ? t : (t as any).name || String(t)))
          .filter((t): t is string => Boolean(t))
      : defaultTracks

  const submissionDeadline = conference?.configurations?.full_paper_submission_deadline
    ? new Date(conference.configurations.full_paper_submission_deadline)
    : null
  const submissionEligibility = getSubmissionEligibility({
    conferenceStatus: conference?.status,
    fullPaperDeadline: conference?.configurations?.full_paper_submission_deadline,
    submission: initialSubmission,
  })
  const isDeadlinePassed = submissionEligibility.isFullPaperDeadlinePassed
  const isNewSubmissionBlocked = !initialSubmission && !submissionEligibility.canStartNewSubmission
  const shouldPublishOnSubmit =
    initialSubmission?.status === "draft" ||
    initialSubmission?.status === "withdrawn" ||
    !initialSubmission
  const isPublishBlocked = isDeadlinePassed && shouldPublishOnSubmit
  const persistedSubmissionStatus =
    initialSubmission && initialSubmission.status !== "draft" ? initialSubmission.status : "draft"
  const persistedMutationStatus: "draft" | "published" =
    persistedSubmissionStatus === "published" ? "published" : "draft"

  const mapSubmissionError = useCallback(
    (errorMessage: string | null, precheckBlocked?: PrecheckBlockedError | null): string => {
      if (precheckBlocked?.code === "PRECHECK_BLOCKED") {
        const firstItem = precheckBlocked.blocking_items?.[0]
        if (firstItem?.description) {
          return `Precheck blocked submission (${precheckBlocked.decision}). ${firstItem.description}`
        }
        return `Precheck blocked submission (${precheckBlocked.decision}). Please resolve blocking issues in the quality check.`
      }

      if (!errorMessage) {
        return t("common.errors.unableToSubmit")
      }

      const normalized = errorMessage.toLowerCase()
      if (
        normalized.includes("submissions are not allowed") ||
        normalized.includes("status is") ||
        normalized.includes("forbidden") ||
        normalized.includes("403")
      ) {
        return t("common.errors.conferenceNotAccepting")
      }

      return errorMessage
    },
    [t],
  )

  const buildSubmissionData = useCallback(
    (status: "draft" | "published" = persistedMutationStatus) => ({
      title,
      abstract,
      link: "",
      domain: conflictDomains,
      status,
      track: selectedTrack,
      file: uploadedFile || undefined,
      information: {
        keywords,
        co_authors: authors.slice(1).map((a) => a.email),
        declared_conflicts: conflicts
          .filter((conflict) => conflict.email?.trim())
          .map((conflict) => ({
            email: conflict.email.trim(),
            reason: conflict.reason || "other",
          })),
        paper_type: isStudentPaper ? "student" : "research",
        track_name: selectedTrack,
        additional_notes: "",
        metadata: {
          ...(initialSubmission?.information?.metadata || {}),
          authors: authors.map((author, index) => ({
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            email: author.email,
            affiliation: author.affiliation,
            country: author.country,
            isCorresponding: author.isCorresponding,
            order: index,
          })),
          conflicts: conflicts.map((conflict) => ({
            id: conflict.id,
            firstName: conflict.firstName,
            lastName: conflict.lastName,
            email: conflict.email,
            reason: conflict.reason || "other",
          })),
          language: "en",
          page_count: 0,
        },
      },
    }),
    [
      abstract,
      authors,
      conflictDomains,
      conflicts,
      initialSubmission?.information?.metadata,
      isStudentPaper,
      keywords,
      persistedMutationStatus,
      selectedTrack,
      title,
      uploadedFile,
    ],
  )

  const draftSignature = useMemo(
    () =>
      JSON.stringify({
        payload: buildSubmissionData(),
        uploaded_file: uploadedFile
          ? {
              name: uploadedFile.name,
              size: uploadedFile.size,
              modified: uploadedFile.lastModified,
            }
          : null,
      }),
    [buildSubmissionData, uploadedFile],
  )

  const hasUnsavedChanges = draftSignature !== lastSavedSignatureRef.current
  const recommendationSignature = useMemo(
    () =>
      JSON.stringify({
        title: title.trim(),
        abstract: abstract.trim(),
        keywords: keywords.map((keyword) => keyword.trim().toLowerCase()).sort(),
      }),
    [abstract, keywords, title],
  )
  const recommendationStale =
    lastRecommendationSignature !== null && lastRecommendationSignature !== recommendationSignature
  const recommendationEligible =
    title.trim().length >= 8 && abstract.trim().split(/\s+/).filter(Boolean).length >= 20

  useEffect(() => {
    if (!conference || initialSubmission || hasTrackedSubmissionStartRef.current) return
    hasTrackedSubmissionStartRef.current = true
    trackUsageEvent("submission_started", {
      role: "author",
      entityType: "conference",
      entityId: conference.id,
    })
  }, [conference, initialSubmission])

  const saveDraft = useCallback(
    async ({ manual = false, force = false }: { manual?: boolean; force?: boolean } = {}) => {
      if (!user || !conference) {
        return
      }
      if (isPublishBlocked) {
        if (manual) {
          toast({
            title: t(
              "runtime.components.author.submit.paper-submission-form.prop_title_submission_deadline_has_passed",
            ),
            description: t(
              "runtime.components.author.submit.paper-submission-form.prop_description_submission_editing_is_locked_after_the_deadline",
            ),
            variant: "destructive",
          })
        }
        return
      }
      if (isNewSubmissionBlocked) {
        if (manual) {
          toast({
            title: t(
              "runtime.components.author.submit.paper-submission-form.prop_title_submissions_are_closed",
            ),
            description: t(
              "runtime.components.author.submit.paper-submission-form.prop_description_draft_creation_is_disabled_because_this",
            ),
            variant: "destructive",
          })
        }
        return
      }
      if (savingDraft || submitting) {
        return
      }
      if (!force && !hasUnsavedChanges) {
        return
      }

      setSavingDraft(true)
      setAutosaveStatus("saving")

      try {
        const submissionData = buildSubmissionData()

        const response = draftSubmissionId
          ? await updatePaper(draftSubmissionId, conference.id, submissionData)
          : await submitPaper({ conference_id: conference.id, ...submissionData })

        if (response.error) {
          setAutosaveStatus("error")
          const description = mapSubmissionError(response.error)
          const shouldShowError = manual || response.error !== lastAutosaveErrorRef.current
          if (manual) {
            toast({
              title: t(
                "runtime.components.author.submit.paper-submission-form.prop_title_failed_to_save_draft",
              ),
              description,
              variant: "destructive",
            })
          } else if (shouldShowError) {
            toast({
              title: t(
                "runtime.components.author.submit.paper-submission-form.prop_title_failed_to_save_draft",
              ),
              description,
              variant: "destructive",
            })
          }
          lastAutosaveErrorRef.current = response.error
          return
        }

        lastAutosaveErrorRef.current = null
        if (!draftSubmissionId && response.data?.id) {
          setDraftSubmissionId(response.data.id)
        }

        lastSavedSignatureRef.current = draftSignature
        const now = new Date()
        setLastSavedAt(now)
        setAutosaveStatus("saved")
        const savedSubmissionId = response.data?.id ?? draftSubmissionId ?? undefined
        trackUsageEvent("submission_draft_saved", {
          role: "author",
          entityType: "submission",
          entityId: savedSubmissionId,
          metadata: {
            conferenceId: conference.id,
            manual,
          },
        })

        if (manual) {
          toast({
            title: t(
              "runtime.components.author.submit.paper-submission-form.prop_title_draft_saved_successfully",
            ),
            description: t(
              "runtime.components.author.submit.paper-submission-form.prop_description_your_draft_has_been_saved_you",
            ),
          })
        }
      } catch {
        setAutosaveStatus("error")
        if (manual) {
          toast({
            title: t(
              "runtime.components.author.submit.paper-submission-form.prop_title_error_saving_draft",
            ),
            description: t(
              "runtime.components.author.submit.paper-submission-form.prop_description_an_unexpected_error_occurred_please_try",
            ),
            variant: "destructive",
          })
        }
      } finally {
        setSavingDraft(false)
      }
    },
    [
      buildSubmissionData,
      conference,
      draftSignature,
      draftSubmissionId,
      isPublishBlocked,
      hasUnsavedChanges,
      isNewSubmissionBlocked,
      mapSubmissionError,
      savingDraft,
      submitting,
      t,
      toast,
      user,
    ],
  )

  // Keyword handlers
  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      e.preventDefault()
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handleFindTrackRecommendations = useCallback(async () => {
    if (!conference || !recommendationEligible || trackRecommendationLoading) {
      return
    }

    setTrackRecommendationLoading(true)
    setTrackRecommendationError(null)
    try {
      const response = await getTrackRecommendations({
        conference_id: conference.id,
        title,
        abstract,
        keywords,
      })
      if (response.error) {
        setTrackRecommendationError(response.error)
        return
      }

      setTrackRecommendations(response.data || [])
      setLastRecommendationSignature(recommendationSignature)
    } finally {
      setTrackRecommendationLoading(false)
    }
  }, [
    abstract,
    conference,
    keywords,
    recommendationEligible,
    recommendationSignature,
    title,
    trackRecommendationLoading,
  ])

  // Author handlers
  const handleAddAuthor = () => {
    if (!newAuthor.firstName || !newAuthor.lastName || !newAuthor.email) {
      toast({
        title: t(
          "runtime.components.author.submit.paper-submission-form.prop_title_missing_information",
        ),
        description: t(
          "runtime.components.author.submit.paper-submission-form.prop_description_please_fill_in_all_required_fields",
        ),
        variant: "destructive",
      })
      return
    }

    const author: Author = {
      id: Date.now().toString(),
      ...newAuthor,
      isCorresponding: false,
    }

    setAuthors([...authors, author])
    setNewAuthor({
      firstName: "",
      lastName: "",
      email: "",
      affiliation: "",
      country: "",
    })
  }

  const handleRemoveAuthor = (id: string) => {
    setAuthors(authors.filter((a) => a.id !== id))
  }

  const handleToggleCorresponding = (id: string) => {
    setAuthors(
      authors.map((a) => ({
        ...a,
        isCorresponding: a.id === id,
      })),
    )
  }

  // File upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isAcceptedManuscriptFile(file)) {
      toast({
        title: t(
          "runtime.components.author.submit.paper-submission-form.prop_title_invalid_file_type",
        ),
        description: t(
          "runtime.components.author.submit.paper-submission-form.prop_description_please_upload_a_pdf_docx_or",
        ),
        variant: "destructive",
      })
      return
    }

    const uploadError = getManuscriptUploadError(file)
    if (uploadError) {
      toast({
        title: t(
          "runtime.components.author.submit.paper-submission-form.prop_title_file_too_large",
        ),
        description: uploadError,
        variant: "destructive",
      })
      return
    }

    setUploadedFile(file)
    setUploadProgress(100)
    setFileValidation({ format: false, fonts: false })
    setPrecheckLoading(false)
  }

  const runAutofillPrecheck = useCallback(
    async (file: File) => {
      if (!conference?.id) {
        setPrecheckResult(null)
        setPrecheckError(null)
        setPrecheckLoading(false)
        return
      }

      setPrecheckResult(null)
      setPrecheckError(null)
      setPrecheckLoading(true)

      try {
        const response = await precheckPaper(String(conference.id), file)
        if (response.error) {
          setPrecheckError(response.error)
        } else if (response.data) {
          setPrecheckResult(response.data)
        }
      } catch (error) {
        setPrecheckError(error instanceof Error ? error.message : t("common.errors.precheckFailed"))
      } finally {
        setPrecheckLoading(false)
      }
    },
    [conference?.id, t],
  )

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setUploadProgress(0)
    setPrecheckLoading(false)
  }

  // Conflict handlers
  const handleAddDomain = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && domainInput.trim() && !conflictDomains.includes(domainInput.trim())) {
      e.preventDefault()
      setConflictDomains([...conflictDomains, domainInput.trim()])
      setDomainInput("")
    }
  }

  const handleRemoveDomain = (domain: string) => {
    setConflictDomains(conflictDomains.filter((d) => d !== domain))
  }

  const handleAddConflict = () => {
    if (!newConflict.firstName || !newConflict.lastName) {
      toast({
        title: t(
          "runtime.components.author.submit.paper-submission-form.prop_title_missing_information",
        ),
        description: t(
          "runtime.components.author.submit.paper-submission-form.prop_description_please_provide_at_least_first_and",
        ),
        variant: "destructive",
      })
      return
    }

    const conflict: Conflict = {
      id: Date.now().toString(),
      ...newConflict,
    }

    setConflicts([...conflicts, conflict])
    setNewConflict({
      firstName: "",
      lastName: "",
      email: "",
      reason: "advisor",
    })
  }

  const handleRemoveConflict = (id: string) => {
    setConflicts(conflicts.filter((c) => c.id !== id))
  }

  const handleApplyAutofill = (result: SubmissionAutofillResponse, sourceFiles: File[] = []) => {
    const nextTitle = result.fields.title.trim()
    const nextAbstract = result.fields.abstract.trim()
    const nextKeywords = result.fields.keywords.map((keyword) => keyword.trim()).filter(Boolean)
    const nextTrack =
      result.selected_track_name?.trim() ||
      result.track_rankings.find((ranking) => availableTracks.includes(ranking.track_name))
        ?.track_name ||
      ""
    const nextPaperType = result.fields.paper_type

    if (nextTitle) setTitle(nextTitle)
    if (nextAbstract) setAbstract(nextAbstract)
    if (nextKeywords.length > 0) setKeywords(Array.from(new Set(nextKeywords)))
    if (nextTrack && availableTracks.includes(nextTrack)) setSelectedTrack(nextTrack)
    if (nextPaperType) setIsStudentPaper(nextPaperType === "student")

    const generatedAuthors = result.authors
      .filter((author) => author.name.trim() || author.email?.trim())
      .map((author, index): Author => {
        const nameParts = author.name.trim().split(/\s+/).filter(Boolean)
        return {
          id: `autofill-${index}-${author.email || author.name}`,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" "),
          email: author.email?.trim() || "",
          affiliation: author.affiliation?.trim() || "",
          country: author.country?.trim() || "",
          isCorresponding:
            Boolean(
              user?.email && author.email?.trim().toLowerCase() === user.email.toLowerCase(),
            ) || index === 0,
        }
      })

    if (generatedAuthors.length > 0) {
      const hasCorresponding = generatedAuthors.some((author) => author.isCorresponding)
      setAuthors(
        generatedAuthors.map((author, index) => ({
          ...author,
          isCorresponding: hasCorresponding ? author.isCorresponding : index === 0,
        })),
      )
    }
    const manuscriptFile = findAutofillManuscriptFile(sourceFiles, result)
    if (manuscriptFile) {
      setUploadedFile(manuscriptFile)
      setUploadProgress(100)
      setFileValidation({ format: false, fonts: false })
      void runAutofillPrecheck(manuscriptFile)
    }

    setCoiConfirmed(false)
    setSubmissionConfirmed(false)
    setCurrentStep(manuscriptFile || uploadedFile || canUseServerSidePrecheck ? "review" : "file")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    if (!lastSavedSignatureRef.current) {
      lastSavedSignatureRef.current = draftSignature
      return
    }
    if (autosaveStatus === "saved" && hasUnsavedChanges) {
      setAutosaveStatus("idle")
    }
  }, [autosaveStatus, draftSignature, hasUnsavedChanges])

  useEffect(() => {
    if (trackRecommendationError) {
      setTrackRecommendationError(null)
    }
  }, [recommendationSignature, trackRecommendationError])

  useEffect(() => {
    if (!conference || !user || isNewSubmissionBlocked) {
      return
    }

    const interval = window.setInterval(() => {
      const hasCurrentUnsavedChanges = draftSignature !== lastSavedSignatureRef.current
      if (hasCurrentUnsavedChanges && !savingDraft && !submitting) {
        void saveDraft()
      }
    }, AUTOSAVE_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [conference, draftSignature, isNewSubmissionBlocked, saveDraft, savingDraft, submitting, user])

  // Save draft handler
  const handleSaveDraft = async () => {
    await saveDraft({ manual: true, force: true })
  }

  // Submit handler
  const handleSubmit = async () => {
    if (!user || !conference) return
    if (isNewSubmissionBlocked) {
      trackUsageEvent("form_error_seen", {
        role: "author",
        entityType: "conference",
        entityId: conference.id,
        metadata: { form: "paper_submission", reason: "submissions_closed" },
      })
      toast({
        title: t(
          "runtime.components.author.submit.paper-submission-form.prop_title_submissions_are_closed",
        ),
        description: t(
          "runtime.components.author.submit.paper-submission-form.prop_description_this_conference_is_not_currently_accepting",
        ),
        variant: "destructive",
      })
      return
    }
    if (isPublishBlocked) {
      trackUsageEvent("form_error_seen", {
        role: "author",
        entityType: "conference",
        entityId: conference.id,
        metadata: { form: "paper_submission", reason: "submission_deadline_passed" },
      })
      toast({
        title: t(
          "runtime.components.author.submit.paper-submission-form.prop_title_submission_deadline_has_passed",
        ),
        description: t(
          "runtime.components.author.submit.paper-submission-form.prop_description_publishing_is_no_longer_available_because",
        ),
        variant: "destructive",
      })
      return
    }
    setSubmitting(true)

    try {
      const response =
        draftSubmissionId !== null
          ? await (async () => {
              const draftUpdate = await updatePaper(
                draftSubmissionId,
                conference.id,
                buildSubmissionData(),
              )
              if (draftUpdate.error) {
                return draftUpdate
              }
              if (initialSubmission?.status === "withdrawn") {
                const resetStatus = await updateSubmissionStatus(
                  conference.id,
                  draftSubmissionId,
                  "draft",
                )
                if (resetStatus.error) {
                  return resetStatus
                }
              }
              if (shouldPublishOnSubmit) {
                return publishPaper(draftSubmissionId, conference.id)
              }
              return draftUpdate
            })()
          : await submitPaper({
              conference_id: conference.id,
              ...buildSubmissionData("published"),
            })

      if (response.error) {
        const precheckBlocked = "precheckBlocked" in response ? response.precheckBlocked : null
        setLastPrecheckBlock(precheckBlocked || null)
        toast({
          title: t(
            "runtime.components.author.submit.paper-submission-form.prop_title_submission_failed",
          ),
          description: mapSubmissionError(response.error, precheckBlocked),
          variant: "destructive",
        })
      } else {
        if (response.data?.id) {
          setDraftSubmissionId(String(response.data.id))
        }
        lastSavedSignatureRef.current = draftSignature
        setLastSavedAt(new Date())
        setAutosaveStatus("saved")
        setLastPrecheckBlock(null)
        setSuccessMessage(t("common.errors.submissionSuccess"))
        setShowSuccessDialog(true)
        const submittedSubmissionId = response.data?.id ?? draftSubmissionId ?? undefined
        trackUsageEvent("submission_submitted", {
          role: "author",
          entityType: "submission",
          entityId: submittedSubmissionId,
          metadata: { conferenceId: conference.id },
        })
      }
    } catch (error) {
      toast({
        title: t(
          "runtime.components.author.submit.paper-submission-form.prop_title_error_submitting_paper",
        ),
        description: t(
          "runtime.components.author.submit.paper-submission-form.prop_description_an_unexpected_error_occurred_please_try",
        ),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const hasPrecheckApproval = precheckResult?.decision === "accept_for_review"
  const canUseServerSidePrecheck = Boolean(
    initialSubmission?.file && !uploadedFile && !precheckError,
  )
  const canSubmit =
    !submitting &&
    !savingDraft &&
    (!isNewSubmissionBlocked || Boolean(initialSubmission)) &&
    !isPublishBlocked &&
    submissionConfirmed &&
    coiConfirmed &&
    (hasPrecheckApproval || canUseServerSidePrecheck) &&
    !precheckError

  // Step header info
  const stepHeaders: Record<StepType, { title: string; description: string }> = {
    paper: {
      title: t("runtime.components.author.submit.paper-submission-form.prop_title_paper_details"),
      description: t(
        "runtime.components.author.submit.paper-submission-form.prop_description_please_provide_the_core_information_about",
      ),
    },
    authors: {
      title: t(
        "runtime.components.author.submit.paper-submission-form.prop_title_authors_affiliations",
      ),
      description: t(
        "runtime.components.author.submit.paper-submission-form.prop_description_add_all_contributing_authors_use_the",
      ),
    },
    file: {
      title: t(
        "runtime.components.author.submit.paper-submission-form.prop_title_upload_manuscript",
      ),
      description: t(
        "runtime.components.author.submit.paper-submission-form.prop_description_please_upload_your_research_paper_in",
      ),
    },
    coi: {
      title: t(
        "runtime.components.author.submit.paper-submission-form.prop_title_conflicts_of_interest",
      ),
      description: t(
        "runtime.components.author.submit.paper-submission-form.prop_description_declare_any_potential_conflicts_of_interest",
      ),
    },
    review: {
      title: t("runtime.components.author.submit.paper-submission-form.prop_title_review_submit"),
      description: t(
        "runtime.components.author.submit.paper-submission-form.prop_description_review_all_information_before_final_submission",
      ),
    },
  }

  const autosaveLabel =
    autosaveStatus === "saving"
      ? t("dashboard.author.submit.autosaving")
      : autosaveStatus === "error"
        ? t("common.errors.autosaveFailed")
        : autosaveStatus === "saved"
          ? `${t("dashboard.author.submit.saved")}${lastSavedAt ? ` ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`
          : hasUnsavedChanges
            ? t("common.errors.unsavedChanges")
            : t("dashboard.author.submit.ready")

  const autosaveDotClass =
    autosaveStatus === "saving"
      ? "bg-amber-500 animate-pulse"
      : autosaveStatus === "error"
        ? "bg-red-500"
        : autosaveStatus === "saved"
          ? "bg-green-500"
          : "bg-slate-400"

  return (
    <div className="font-[Inter] bg-[#f8fafc] dark:bg-[#191919] text-[#141414] dark:text-white flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        <SubmissionProgressSidebar currentStep={currentStep} onStepChange={setCurrentStep} />

        <main className="flex-1 h-full overflow-y-auto bg-[#f8fafc] dark:bg-[#191919] scroll-smooth py-6 md:py-8 px-8 md:px-12">
          <div className="w-full">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
              <div className="flex flex-col gap-1">
                <h1 className="text-[#141414] dark:text-white text-[32px] font-bold tracking-tight leading-[1.1]">
                  {stepHeaders[currentStep].title}
                </h1>
                <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 max-w-xl">
                  {stepHeaders[currentStep].description}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className={`size-1.5 rounded-full ${autosaveDotClass}`} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {autosaveLabel}
                </span>
              </div>
            </div>

            {/* Deadline passed warning */}
            {isDeadlinePassed && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-4 py-3">
                <span
                  className="material-symbols-outlined text-red-500"
                  style={{ fontSize: "18px" }}
                >
                  schedule
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-red-700 dark:text-red-400">
                    {initialSubmission
                      ? t(
                          "runtime.components.author.submit.paper-submission-form.text_new_submissions_are_closed",
                        )
                      : t(
                          "runtime.components.author.submit.paper-submission-form.text_submission_deadline_has_passed",
                        )}{" "}
                  </p>
                  <p className="text-[11px] text-red-600 dark:text-red-500">
                    {initialSubmission
                      ? t(
                          "runtime.components.author.submit.paper-submission-form.text_you_can_still_edit_this_submission_until_final_decision",
                        )
                      : `${t("runtime.components.author.submit.paper-submission-form.text_the_deadline_was")} ${submissionDeadline!.toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}. ${t(
                          "runtime.components.author.submit.paper-submission-form.text_this_conference_no_longer_accepts_new_submissions",
                        )}`}
                  </p>
                </div>
              </div>
            )}

            {/* Step Content */}
            {currentStep === "paper" && (
              <PaperDetailsStep
                title={title}
                abstract={abstract}
                keywords={keywords}
                keywordInput={keywordInput}
                selectedTrack={selectedTrack}
                isStudentPaper={isStudentPaper}
                availableTracks={availableTracks}
                recommendationEligible={recommendationEligible}
                recommendationLoading={trackRecommendationLoading}
                recommendationStale={recommendationStale}
                recommendationError={trackRecommendationError}
                recommendations={trackRecommendations}
                onTitleChange={setTitle}
                onAbstractChange={setAbstract}
                onKeywordInputChange={setKeywordInput}
                onAddKeyword={handleAddKeyword}
                onRemoveKeyword={handleRemoveKeyword}
                onTrackChange={setSelectedTrack}
                onStudentPaperChange={setIsStudentPaper}
                onFindRecommendations={handleFindTrackRecommendations}
              />
            )}

            {currentStep === "authors" && (
              <AuthorsStep
                authors={authors}
                newAuthor={newAuthor}
                onNewAuthorChange={setNewAuthor}
                onAddAuthor={handleAddAuthor}
                onRemoveAuthor={handleRemoveAuthor}
                onToggleCorresponding={handleToggleCorresponding}
                onUpdateAuthor={(id, updates) => {
                  setAuthors((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))
                }}
                onReorder={(from, to) => {
                  setAuthors((prev) => {
                    const next = [...prev]
                    const [moved] = next.splice(from, 1)
                    next.splice(to, 0, moved)
                    return next
                  })
                }}
                currentUserEmail={user?.email}
              />
            )}

            {currentStep === "file" && (
              <FileUploadStep
                uploadedFile={uploadedFile}
                uploadProgress={uploadProgress}
                fileValidation={fileValidation}
                conference={conference}
                submissionId={draftSubmissionId || undefined}
                existingFile={
                  uploadedFile
                    ? undefined
                    : initialSubmission?.file
                      ? {
                          name: initialSubmission.file.original_name,
                          size: initialSubmission.file.size,
                          type: initialSubmission.file.mime_type,
                        }
                      : undefined
                }
                precheckResult={precheckResult}
                precheckError={precheckError}
                precheckLoading={precheckLoading}
                onFileUpload={handleFileUpload}
                onRemoveFile={handleRemoveFile}
                onPrecheckUpdate={(result, error) => {
                  setPrecheckResult(result)
                  setPrecheckError(error)
                  setPrecheckLoading(false)
                  if (result || error) {
                    setLastPrecheckBlock(null)
                  }
                }}
              />
            )}

            {currentStep === "coi" && (
              <ConflictsStep
                conflictDomains={conflictDomains}
                domainInput={domainInput}
                conflicts={conflicts}
                newConflict={newConflict}
                coiConfirmed={coiConfirmed}
                onDomainInputChange={setDomainInput}
                onAddDomain={handleAddDomain}
                onRemoveDomain={handleRemoveDomain}
                onNewConflictChange={setNewConflict}
                onAddConflict={handleAddConflict}
                onRemoveConflict={handleRemoveConflict}
                onCoiConfirmedChange={setCoiConfirmed}
              />
            )}

            {currentStep === "review" && (
              <ReviewStep
                title={title}
                abstract={abstract}
                selectedTrack={selectedTrack}
                keywords={keywords}
                authors={authors}
                uploadedFile={uploadedFile}
                existingFile={
                  uploadedFile
                    ? undefined
                    : initialSubmission?.file
                      ? {
                          name: initialSubmission.file.original_name,
                          size: initialSubmission.file.size,
                          type: initialSubmission.file.mime_type,
                        }
                      : undefined
                }
                precheckResult={precheckResult}
                precheckError={precheckError}
                conflicts={conflicts}
                coiConfirmed={coiConfirmed}
                submissionConfirmed={submissionConfirmed}
                onStepChange={setCurrentStep}
                onSubmissionConfirmedChange={setSubmissionConfirmed}
              />
            )}

            {/* Spacer for bottom action bar */}
            {currentStep === "review" &&
              ((!hasPrecheckApproval && !canUseServerSidePrecheck) ||
                precheckError ||
                lastPrecheckBlock) && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  {precheckError
                    ? `${t("common.errors.precheckFailed")}: ${precheckError}`
                    : lastPrecheckBlock
                      ? mapSubmissionError(null, lastPrecheckBlock)
                      : t("common.errors.finalSubmitBlocked")}
                </div>
              )}
            <div className="h-20" />
          </div>
        </main>

        <SubmissionActionBar
          currentStep={currentStep}
          submitting={submitting}
          savingDraft={savingDraft}
          onStepChange={setCurrentStep}
          onSaveDraft={handleSaveDraft}
          onAutofill={() => setShowAutofillSheet(true)}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          canSubmit={canSubmit}
        />

        <SubmissionAutofillSheet
          open={showAutofillSheet}
          onOpenChange={setShowAutofillSheet}
          conferenceId={conference?.id}
          availableTracks={availableTracks}
          onApply={handleApplyAutofill}
        />

        {/* Draft Saved Dialog */}
        {showDraftSavedDialog && (
          <div
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDraftSavedDialog(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-5 flex flex-col items-center text-center gap-4">
                <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                  <span className="material-symbols-outlined text-emerald-500 text-[28px] icon-filled">
                    check_circle
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
                    {t("runtime.components.author.submit.paper-submission-form.text_draft_saved")}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {t(
                      "runtime.components.author.submit.paper-submission-form.text_your_draft_has_been_saved_successfully_you_can_return_to_edit_it_anytime_from_your_submissions_dashboard",
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDraftSavedDialog(false)}
                    className="flex-1 h-9 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {t(
                      "runtime.components.author.submit.paper-submission-form.text_continue_editing",
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(ROUTES.AUTHOR.CONFERENCE_DETAIL(conference?.id ?? ""))
                    }
                    className="flex-1 h-9 rounded-lg text-[11px] font-bold bg-[#1B3C53] hover:bg-[#234C6A] text-white transition-colors"
                  >
                    {t(
                      "runtime.components.author.submit.paper-submission-form.text_back_to_conference",
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Dialog */}
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("runtime.components.author.submit.paper-submission-form.text_success")}
              </AlertDialogTitle>
              <AlertDialogDescription>{successMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => router.push(ROUTES.AUTHOR.CONFERENCE_DETAIL(conference?.id ?? ""))}
              >
                {t(
                  "runtime.components.author.submit.paper-submission-form.text_continue_to_conference",
                )}{" "}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <style jsx global>{`
          .material-symbols-outlined {
            font-variation-settings:
              "FILL" 0,
              "wght" 400,
              "GRAD" 0,
              "opsz" 24;
            vertical-align: middle;
          }
          .icon-filled {
            font-variation-settings: "FILL" 1;
          }
        `}</style>
      </div>
    </div>
  )
}
