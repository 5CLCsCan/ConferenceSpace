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

interface PaperSubmissionFormProps {
  conference?: Conference | null
  submission?: Submission | null
}

export function PaperSubmissionForm({
  conference,
  submission: initialSubmission,
}: PaperSubmissionFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState<StepType>("paper")
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
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
  }>({ format: true, fonts: false })

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
        title: "Missing information",
        description: "Please fill in all required fields for the author.",
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
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20MB.",
        variant: "destructive",
      })
      return
    }

    setUploadedFile(file)
    setUploadProgress(100)
    setFileValidation({ format: true, fonts: false })
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
        title: "Missing information",
        description: "Please provide at least first and last name.",
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
        title: "Submissions are closed",
        description: "Draft creation is disabled because this conference is not in open status.",
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
          title: "Failed to save draft",
          description: mapSubmissionError(response.error),
          variant: "destructive",
        })
      } else {
        toast({
          title: "Draft saved successfully",
          description: "Your draft has been saved. You can continue editing anytime.",
        })
      }
    } catch (error) {
      toast({
        title: "Error saving draft",
        description: "An unexpected error occurred. Please try again.",
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
        title: "Submissions are closed",
        description:
          "This conference is not currently accepting submissions. Please submit during the open phase.",
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
          title: "Submission failed",
          description: mapSubmissionError(response.error),
          variant: "destructive",
        })
      } else {
        setSuccessMessage("Your paper has been submitted successfully!")
        setShowSuccessDialog(true)
      }
    } catch (error) {
      toast({
        title: "Error submitting paper",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Step header info
  const stepHeaders: Record<StepType, { title: string; description: string }> = {
    paper: {
      title: "Paper Details",
      description: "Please provide the core information about your research paper.",
    },
    authors: {
      title: "Authors & Affiliations",
      description:
        "Add all contributing authors. Use the drag handles to order them according to their contribution. Ensure one author is marked as the corresponding contact.",
    },
    file: {
      title: "Upload Manuscript",
      description:
        "Please upload your research paper in PDF format. Ensure all personal information is removed for double-blind review.",
    },
    coi: {
      title: "Conflicts of Interest",
      description: "Declare any potential conflicts of interest with reviewers or institutions.",
    },
    review: {
      title: "Review & Submit",
      description: "Review all information before final submission.",
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
                  Autosaving...
                </span>
              </div>
            </div>

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
          onStepChange={setCurrentStep}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />

        {/* Success Dialog */}
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Success!</AlertDialogTitle>
              <AlertDialogDescription>{successMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => router.push(ROUTES.AUTHOR.CONFERENCE_DETAIL(conference?.id ?? ""))}
              >
                Continue to Conference
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
