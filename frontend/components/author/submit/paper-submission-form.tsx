"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { submitPaper, updatePaper, publishPaper } from "@/lib/api/papers"
import { useAuth } from "@/lib/auth-context"
import { ROUTES } from "@/lib/routes"
import type { Conference } from "@/lib/types"
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

interface PaperSubmissionFormProps {
  conference?: Conference | null
  submission?: Submission | null
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showDraftSavedDialog, setShowDraftSavedDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

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

  const submissionDeadline =
    conference?.configurations?.full_paper_submission_deadline
      ? new Date(conference.configurations.full_paper_submission_deadline)
      : null
  const isDeadlinePassed = submissionDeadline !== null && new Date() > submissionDeadline
  const isSubmitDisabled = isNewSubmissionBlocked || isDeadlinePassed

  const mapSubmissionError = (errorMessage: string | null): string => {
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
  }

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

    if (file.type !== "application/pdf") {
      toast({
        title: t(
          "runtime.components.author.submit.paper-submission-form.prop_title_invalid_file_type",
        ),
        description: t(
          "runtime.components.author.submit.paper-submission-form.prop_description_please_upload_a_pdf_file",
        ),
        variant: "destructive",
      })
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: t(
          "runtime.components.author.submit.paper-submission-form.prop_title_file_too_large",
        ),
        description: t(
          "runtime.components.author.submit.paper-submission-form.prop_description_maximum_file_size_is_20mb",
        ),
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

  // Save draft handler
  const handleSaveDraft = async () => {
    if (!user || !conference) return
    if (isNewSubmissionBlocked) {
      toast({
        title: t(
          "runtime.components.author.submit.paper-submission-form.prop_title_submissions_are_closed",
        ),
        description: t(
          "runtime.components.author.submit.paper-submission-form.prop_description_draft_creation_is_disabled_because_this",
        ),
        variant: "destructive",
      })
      return
    }
    setSubmitting(true)

    try {
      const submissionData = {
        title,
        abstract,
        link: "",
        domain: conflictDomains,
        status: "draft" as const,
        track: selectedTrack,
        file: uploadedFile ?? undefined,
        information: {
          keywords,
          co_authors: authors.slice(1).map((a) => a.email),
          declared_conflicts: conflicts.map((c) => ({ email: c.email, reason: c.reason })),
          paper_type: isStudentPaper ? "student" : "research",
          track_name: selectedTrack,
          additional_notes: "",
          metadata: {
            language: "en",
            page_count: 0,
          },
        },
      }

      const response = initialSubmission
        ? await updatePaper(initialSubmission.id.toString(), conference.id, submissionData)
        : await submitPaper({ conference_id: conference.id, ...submissionData })

      if (response.error) {
        toast({
          title: t(
            "runtime.components.author.submit.paper-submission-form.prop_title_failed_to_save_draft",
          ),
          description: mapSubmissionError(response.error),
          variant: "destructive",
        })
      } else {
        toast({
          title: t(
            "runtime.components.author.submit.paper-submission-form.prop_title_draft_saved_successfully",
          ),
          description: t(
            "runtime.components.author.submit.paper-submission-form.prop_description_your_draft_has_been_saved_you",
          ),
        })
        setShowDraftSavedDialog(true)
      }
    } catch (error) {
      toast({
        title: t(
          "runtime.components.author.submit.paper-submission-form.prop_title_error_saving_draft",
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
    setSubmitting(true)

    try {
      const submissionData = {
        title,
        abstract,
        link: "",
        domain: conflictDomains,
        status: "published" as const,
        track: selectedTrack,
        file: uploadedFile ?? undefined,
        information: {
          keywords,
          co_authors: authors.slice(1).map((a) => a.email),
          declared_conflicts: conflicts.map((c) => ({ email: c.email, reason: c.reason })),
          paper_type: isStudentPaper ? "student" : "research",
          track_name: selectedTrack,
          additional_notes: "",
          metadata: {
            language: "en",
            page_count: 0,
          },
        },
      }

      let response: { data: any; error: string | null }
      if (initialSubmission) {
        // First update metadata/file, then publish
        response = await updatePaper(initialSubmission.id.toString(), conference.id, submissionData)
        if (!response.error && initialSubmission.status === "draft") {
          const publishRes = await publishPaper(initialSubmission.id.toString(), conference.id)
          if (publishRes.error) {
            response = { data: null, error: publishRes.error }
          }
        }
      } else {
        response = await submitPaper({ conference_id: conference.id, ...submissionData })
      }

      if (response.error) {
        toast({
          title: t(
            "runtime.components.author.submit.paper-submission-form.prop_title_submission_failed",
          ),
          description: mapSubmissionError(response.error),
          variant: "destructive",
        })
      } else {
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
                <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {t("runtime.components.author.submit.paper-submission-form.text_autosaving")}{" "}
                </span>
              </div>
            </div>

            {/* Deadline passed warning */}
            {isDeadlinePassed && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-4 py-3">
                <span className="material-symbols-outlined text-red-500" style={{ fontSize: "18px" }}>
                  schedule
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-red-700 dark:text-red-400">
                    Submission deadline has passed
                  </p>
                  <p className="text-[11px] text-red-600 dark:text-red-500">
                    The deadline was {submissionDeadline!.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. New submissions and publishing are no longer accepted.
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
                submissionId={initialSubmission?.id?.toString()}
                existingFile={
                  uploadedFile
                    ? undefined
                    : initialSubmission?.file
                      ? {
                          name: initialSubmission.file.original_name,
                          size: initialSubmission.file.size,
                          type: "application/pdf",
                        }
                      : undefined
                }
                onFileUpload={handleFileUpload}
                onRemoveFile={handleRemoveFile}
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
                conflicts={conflicts}
                coiConfirmed={coiConfirmed}
                submissionConfirmed={submissionConfirmed}
                onStepChange={setCurrentStep}
                onSubmissionConfirmedChange={setSubmissionConfirmed}
              />
            )}

            {/* Spacer for bottom action bar */}
            <div className="h-20" />
          </div>
        </main>

        <SubmissionActionBar
          currentStep={currentStep}
          submitting={submitting}
          canSubmit={!isSubmitDisabled}
          onStepChange={setCurrentStep}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />

        {/* Draft Saved Dialog */}
        {showDraftSavedDialog && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
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
                    Draft Saved
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Your draft has been saved successfully. You can return to edit it anytime from
                    your submissions dashboard.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDraftSavedDialog(false)}
                    className="flex-1 h-9 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Continue Editing
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(ROUTES.AUTHOR.CONFERENCE_DETAIL(conference?.id ?? ""))
                    }
                    className="flex-1 h-9 rounded-lg text-[11px] font-bold bg-[#1B3C53] hover:bg-[#234C6A] text-white transition-colors"
                  >
                    Back to Conference
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
