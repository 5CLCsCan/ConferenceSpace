"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { publishPaper, submitPaper, updatePaper } from "@/lib/api/papers"
import { useAuth } from "@/lib/auth-context"
import { ROUTES } from "@/lib/routes"
import type { Conference, PrecheckBlockedError, PrecheckResult } from "@/lib/types"
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
import { useTranslation } from "@/lib/i18n/translation-context"
import { getManuscriptUploadError, isAcceptedManuscriptFile } from "./submission-file-validation"

interface PaperSubmissionFormProps {
  conference?: Conference | null
  submission?: Submission | null
}

type AutosaveStatus = "idle" | "saving" | "saved" | "error"
const AUTOSAVE_INTERVAL_MS = 2 * 60 * 1000

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
  const [successMessage, setSuccessMessage] = useState("")
  const lastSavedSignatureRef = useRef<string>("")

  useEffect(() => {
    if (initialSubmission?.id) {
      setDraftSubmissionId(initialSubmission.id.toString())
      if (initialSubmission.updated_at) {
        setLastSavedAt(new Date(initialSubmission.updated_at))
      }
    }
  }, [initialSubmission?.id, initialSubmission?.updated_at])

  // Paper Details state
  const [title, setTitle] = useState(initialSubmission?.title || "")
  const [abstract, setAbstract] = useState(initialSubmission?.abstract || "")
  const [keywords, setKeywords] = useState<string[]>(
    initialSubmission?.information?.keywords || ["Machine Learning", "Neural Networks"],
  )
  const [keywordInput, setKeywordInput] = useState("")
  const [selectedTrack, setSelectedTrack] = useState<string>(
    initialSubmission?.information?.track_name || "",
  )
  const [isStudentPaper, setIsStudentPaper] = useState(false)

  // Authors state
  const [authors, setAuthors] = useState<Author[]>([
    {
      id: "1",
      firstName: user?.first_name || user?.name?.split(" ")[0] || "",
      lastName: user?.last_name || user?.name?.split(" ").slice(1).join(" ") || "",
      email: user?.email || "",
      affiliation: user?.affiliation || "",
      country: "",
      isCorresponding: true,
    },
  ])
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
  const [lastPrecheckBlock, setLastPrecheckBlock] = useState<PrecheckBlockedError | null>(null)
  const [fileValidation, setFileValidation] = useState<{
    format: boolean
    fonts: boolean
  }>({ format: false, fonts: false })

  // Conflicts of Interest state
  const [conflictDomains, setConflictDomains] = useState<string[]>(["mit.edu", "csail.mit.edu"])
  const [domainInput, setDomainInput] = useState("")
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [newConflict, setNewConflict] = useState({
    firstName: "",
    lastName: "",
    email: "",
    reason: "advisor",
  })
  const [coiConfirmed, setCoiConfirmed] = useState(false)
  const [submissionConfirmed, setSubmissionConfirmed] = useState(false)

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

  const isNewSubmissionBlocked = !initialSubmission && conference?.status !== "open"
  const submissionDeadline = conference?.configurations?.full_paper_submission_deadline
    ? new Date(conference.configurations.full_paper_submission_deadline)
    : null
  const isDeadlinePassed = submissionDeadline !== null && new Date() > submissionDeadline

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
        return "Unable to submit due to an unknown error."
      }

      const normalized = errorMessage.toLowerCase()
      if (
        normalized.includes("submissions are not allowed") ||
        normalized.includes("status is") ||
        normalized.includes("forbidden") ||
        normalized.includes("403")
      ) {
        return "This conference is not currently accepting submissions. Please submit during the open phase."
      }

      return errorMessage
    },
    [],
  )

  const buildSubmissionData = useCallback(
    (status: "draft" | "published") => ({
      title,
      abstract,
      link: "",
      domain: [],
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
          language: "en",
          page_count: 0,
        },
      },
    }),
    [abstract, authors, conflicts, isStudentPaper, keywords, selectedTrack, title, uploadedFile],
  )

  const draftSignature = useMemo(
    () =>
      JSON.stringify({
        payload: buildSubmissionData("draft"),
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

  const saveDraft = useCallback(
    async ({ manual = false, force = false }: { manual?: boolean; force?: boolean } = {}) => {
      if (!user || !conference) {
        return
      }
      if (isNewSubmissionBlocked) {
        if (manual) {
          toast({
            title: t("runtime.components.author.submit.paper-submission-form.prop_title_submissions_are_closed"),
            description:
              t("runtime.components.author.submit.paper-submission-form.prop_description_draft_creation_is_disabled_because_this"),
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
        const submissionData = buildSubmissionData("draft")

        const response = draftSubmissionId
          ? await updatePaper(draftSubmissionId, conference.id, submissionData)
          : await submitPaper({ conference_id: conference.id, ...submissionData })

        if (response.error) {
          setAutosaveStatus("error")
          if (manual) {
            toast({
              title: t("runtime.components.author.submit.paper-submission-form.prop_title_failed_to_save_draft"),
              description: mapSubmissionError(response.error),
              variant: "destructive",
            })
          }
          return
        }

        if (!draftSubmissionId && response.data?.id) {
          setDraftSubmissionId(response.data.id)
        }

        lastSavedSignatureRef.current = draftSignature
        const now = new Date()
        setLastSavedAt(now)
        setAutosaveStatus("saved")

        if (manual) {
          toast({
            title: t("runtime.components.author.submit.paper-submission-form.prop_title_draft_saved_successfully"),
            description: t("runtime.components.author.submit.paper-submission-form.prop_description_your_draft_has_been_saved_you"),
          })
        }
      } catch {
        setAutosaveStatus("error")
        if (manual) {
          toast({
            title: t("runtime.components.author.submit.paper-submission-form.prop_title_error_saving_draft"),
            description: t("runtime.components.author.submit.paper-submission-form.prop_description_an_unexpected_error_occurred_please_try"),
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
        description: t("runtime.components.author.submit.paper-submission-form.prop_description_please_upload_a_pdf_docx_or"),
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
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setUploadProgress(0)
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
    if (!conference || !user || isNewSubmissionBlocked) {
      return
    }

    const interval = window.setInterval(() => {
      if (hasUnsavedChanges && !savingDraft && !submitting) {
        void saveDraft()
      }
    }, AUTOSAVE_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [
    conference,
    hasUnsavedChanges,
    isNewSubmissionBlocked,
    saveDraft,
    savingDraft,
    submitting,
    user,
  ])

  // Save draft handler
  const handleSaveDraft = async () => {
    await saveDraft({ manual: true, force: true })
  }

  // Submit handler
  const handleSubmit = async () => {
    if (!user || !conference) return
    if (isNewSubmissionBlocked) {
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
    if (isDeadlinePassed) {
      toast({
        title: t("runtime.components.author.submit.paper-submission-form.prop_title_submission_deadline_has_passed"),
        description:
          t("runtime.components.author.submit.paper-submission-form.prop_description_publishing_is_no_longer_available_because"),
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
                buildSubmissionData("draft"),
              )
              if (draftUpdate.error) {
                return draftUpdate
              }
              return publishPaper(draftSubmissionId, conference.id)
            })()
          : await submitPaper({
              conference_id: conference.id,
              ...buildSubmissionData("published"),
            })

      if (response.error) {
        setLastPrecheckBlock(response.precheckBlocked || null)
        toast({
          title: t("runtime.components.author.submit.paper-submission-form.prop_title_submission_failed"),
          description: mapSubmissionError(response.error, response.precheckBlocked),
          variant: "destructive",
        })
      } else {
        if (response.data?.id) {
          setDraftSubmissionId(response.data.id)
        }
        lastSavedSignatureRef.current = draftSignature
        setLastSavedAt(new Date())
        setAutosaveStatus("saved")
        setLastPrecheckBlock(null)
        setSuccessMessage("Your paper has been submitted successfully!")
        setShowSuccessDialog(true)
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
    !isNewSubmissionBlocked &&
    !isDeadlinePassed &&
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
      ? "Autosaving..."
      : autosaveStatus === "error"
        ? "Autosave failed"
        : autosaveStatus === "saved"
          ? `Saved${lastSavedAt ? ` ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`
          : hasUnsavedChanges
            ? "Unsaved changes"
            : "Ready"

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
                    {t("runtime.components.author.submit.paper-submission-form.text_submission_deadline_has_passed")}{" "}</p>
                  <p className="text-[11px] text-red-600 dark:text-red-500">
                    {t("runtime.components.author.submit.paper-submission-form.text_the_deadline_was")}{" "}
                    {submissionDeadline!.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {t("runtime.components.author.submit.paper-submission-form.text_new_submissions_and_publishing_are_no")}{" "}</p>
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
                onTitleChange={setTitle}
                onAbstractChange={setAbstract}
                onKeywordInputChange={setKeywordInput}
                onAddKeyword={handleAddKeyword}
                onRemoveKeyword={handleRemoveKeyword}
                onTrackChange={setSelectedTrack}
                onStudentPaperChange={setIsStudentPaper}
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
                onFileUpload={handleFileUpload}
                onRemoveFile={handleRemoveFile}
                onPrecheckUpdate={(result, error) => {
                  setPrecheckResult(result)
                  setPrecheckError(error)
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
                    ? `Precheck failed: ${precheckError}`
                    : lastPrecheckBlock
                      ? mapSubmissionError(null, lastPrecheckBlock)
                      : "Final submit is blocked until precheck decision is Accept for Review."}
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
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          canSubmit={canSubmit}
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
