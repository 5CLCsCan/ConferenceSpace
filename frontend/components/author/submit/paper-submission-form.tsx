"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Info } from "lucide-react"
import { submitPaper, updatePaper } from "@/lib/api/papers"
import { useAuth } from "@/lib/auth-context"
import type { Conference } from "@/lib/types"
import { PaperTab } from "./paper-tab"
import { AuthorsTab } from "./authors-tab"
import { FileTab } from "./file-tab"
import { COITab } from "./coi-tab"
import { CoverLetterTab } from "./cover-letter-tab"
import { SubmissionSidebar } from "./submission-sidebar"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getConferenceSubmissions, type Submission } from "@/lib/api/submissions"
import { typography, spacing } from "@/lib/typography"
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

interface PaperSubmissionFormProps {
  conference?: Conference | null
  submission?: Submission | null
}

type TabType = "paper" | "authors" | "file" | "coi" | "cover-letter"

interface Author {
  name: string
  email: string
  affiliation: string
}

interface Checklist {
  titleProvided: boolean
  abstractLength: boolean
  subjectAreas: boolean
  keywords: boolean
  pdfUploaded: boolean
  coAuthorsListed: boolean
  coiDeclared: boolean
}

export function PaperSubmissionForm({
  conference,
  submission: initialSubmission,
}: PaperSubmissionFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>("paper")
  const [submitting, setSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(!!initialSubmission)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [redirectPath, setRedirectPath] = useState("")
  // Paper tab state
  const [title, setTitle] = useState("")
  const [abstract, setAbstract] = useState("")
  const [subjectAreas, setSubjectAreas] = useState<string[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  // Authors tab state
  const [authors, setAuthors] = useState<Author[]>([
    { name: "", email: "", affiliation: "" },
    { name: "", email: "", affiliation: "" },
    { name: "", email: "", affiliation: "" },
  ])
  const [isCorresponding, setIsCorresponding] = useState(false)
  // File tab state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [validationStatus, setValidationStatus] = useState<
    "pending" | "validating" | "success" | "error"
  >("pending")
  // COI tab state
  const [coiPeople, setCoiPeople] = useState<string[]>([])
  const [coiPersonInput, setCoiPersonInput] = useState("")
  // Cover letter tab state
  const [coverLetter, setCoverLetter] = useState<File | null>(null)
  // Track selection state
  const [selectedTrack, setSelectedTrack] = useState<string>("")
  // Extract track names from conference tracks (backend returns array of strings)
  const availableTracks: string[] = Array.isArray(conference?.tracks)
    ? conference.tracks.map((t) => (typeof t === "string" ? t : (t as any).name || String(t)))
    : []
  // Checklist state
  const checklist: Checklist = {
    titleProvided: title.trim().length > 0,
    abstractLength: abstract.trim().length > 0,
    subjectAreas: subjectAreas.length >= 1,
    keywords: keywords.length >= 3,
    // In edit mode, allow submission if original submission has a file OR new file is uploaded
    pdfUploaded: uploadedFile !== null || (isEditMode && initialSubmission?.file !== undefined),
    coAuthorsListed: authors.some((a) => a.name.trim().length > 0),
    coiDeclared: coiPeople.length > 0,
  }

  const tabs = [
    { id: "paper" as TabType, label: t("dashboard.author.submit.tabs.paper") },
    { id: "authors" as TabType, label: t("dashboard.author.submit.tabs.authors") },
    { id: "file" as TabType, label: t("dashboard.author.submit.tabs.file") },
    { id: "coi" as TabType, label: t("dashboard.author.submit.tabs.coi") },
    { id: "cover-letter" as TabType, label: t("dashboard.submission.tabs.coverLetter") },
  ]

  // Pre-fill form with submission data if in edit mode
  useEffect(() => {
    if (!initialSubmission) return

    // Pre-fill paper tab data immediately (doesn't depend on user)
    setTitle(initialSubmission.title || "")
    setAbstract(initialSubmission.abstract || "")
    setSubjectAreas(initialSubmission.domain || [])
    setKeywords(initialSubmission.information?.keywords || [])
    setSelectedTrack(initialSubmission.information?.track_name || "")

    // Pre-fill authors
    // Load co-authors from submission first
    const coAuthors: Author[] = []
    if (
      initialSubmission.information?.co_authors &&
      initialSubmission.information.co_authors.length > 0
    ) {
      initialSubmission.information.co_authors.forEach((email) => {
        coAuthors.push({
          name: "", // Name not stored in submission, only email
          email: email,
          affiliation: "", // Affiliation not stored in submission
        })
      })
    }

    // First author: use user info if available, otherwise use submission author email
    if (user) {
      const firstAuthor = {
        name: user.name || "",
        email: user.email || initialSubmission.author || "",
        affiliation: user.affiliation || "",
      }
      // Set authors array: first author (current user) + co-authors + one empty slot
      setAuthors([firstAuthor, ...coAuthors, { name: "", email: "", affiliation: "" }])
    } else {
      // Fallback: at least set the email from submission
      const firstAuthor = {
        name: "",
        email: initialSubmission.author || "",
        affiliation: "",
      }
      setAuthors([firstAuthor, ...coAuthors, { name: "", email: "", affiliation: "" }])
    }

    // Pre-fill COI data from declared_conflicts
    // Note: Backend stores conflicts as {email, reason}, but frontend has separate arrays for people/orgs/domains
    // For now, we'll map all declared conflicts to the people array
    // Users can manually reorganize if needed
    if (initialSubmission.information?.declared_conflicts) {
      const people: string[] = []

      initialSubmission.information.declared_conflicts.forEach((conflict) => {
        // Add the email/identifier to people list
        people.push(conflict.email)
      })

      setCoiPeople(people)
      // Note: Orgs and domains would need to be stored separately in the backend
      // For now, they remain empty and user needs to re-enter them
    }

    // Note: File cannot be pre-loaded from URL, user needs to re-upload if they want to change it
  }, [initialSubmission, user])

  // Auto-load existing draft on component mount (only if not in edit mode)
  useEffect(() => {
    if (isEditMode) return // Skip draft loading in edit mode

    const loadDraft = async () => {
      if (!user || !conference) return

      try {
        const response = await getConferenceSubmissions(conference.id, {
          author: user.email,
          status: "draft",
          limit: 1,
        })

        if (response.data && response.data.submissions.length > 0) {
          const draft = response.data.submissions[0]
          // Don't load draft if we're editing a different submission
          if (!initialSubmission || draft.id !== initialSubmission.id) {
            console.log("[PaperSubmissionForm] Auto-loading existing draft:", draft)
            
            // Auto-populate form fields with draft data
            setTitle(draft.title || "")
            setAbstract(draft.abstract || "")
            setSubjectAreas(draft.domain || [])
            setKeywords(draft.information?.keywords || [])

            // Load co-authors if available
            if (draft.information?.co_authors && draft.information.co_authors.length > 0) {
              const coAuthors = draft.information.co_authors.map((email) => ({
                name: "",
                email: email,
                affiliation: "",
              }))
              // Keep the first author slot empty and add co-authors
              setAuthors([
                { name: "", email: "", affiliation: "" },
                ...coAuthors,
                { name: "", email: "", affiliation: "" },
              ])
            }
            
            // Redirect to edit mode for the draft
            router.push(`/dashboard/author/submit?conference=${conference.id}&edit=${draft.id}`)
          }
        }
      } catch (error) {
        console.error("[PaperSubmissionForm] Error loading draft:", error)
      }
    }

    loadDraft()
  }, [user, conference, isEditMode, initialSubmission, router])

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput("")
    }
  }

  const handleSaveAsDraft = async () => {
    if (!user || !conference) return

    setSubmitting(true)
    try {
      // Build COI declarations from coiPeople array
      const declaredConflicts = coiPeople
        .filter((person) => person.trim())
        .map((person) => ({
          email: person.trim(),
          reason: "Declared conflict of interest",
        }))

      const submissionData = {
        title,
        abstract,
        link: "",
        domain: subjectAreas,
        file: uploadedFile || undefined, // Include uploaded file
        cover_letter: coverLetter || undefined, // Include cover letter
        status: "draft" as const, // Explicitly set status to draft
        track: selectedTrack,
        information: {
          keywords,
          co_authors: authors
            .filter((a, index) => index > 0 && a.email.trim()) // Skip first author, filter by email
            .map((a) => a.email.trim()),
          declared_conflicts: declaredConflicts, // Include COI declarations
          paper_type: "research",
          track_name: selectedTrack,
          additional_notes: "",
          metadata: {
            language: "en",
            page_count: 0,
          },
        },
      }

      let response
      if (isEditMode && initialSubmission) {
        // Update existing submission as draft
        response = await updatePaper(initialSubmission.id.toString(), conference.id, submissionData)
        if (response.error) {
          toast({
            title: t("dashboard.author.submit.draftSaveFailed") || "Failed to save draft",
            description: response.error,
            variant: "destructive",
          })
        } else {
          toast({
            title: t("dashboard.author.submit.draftSaveSuccess") || "Draft saved successfully",
            description: "Your draft has been saved. You can continue editing anytime.",
          })
          // Stay on the same page - no redirect
        }
      } else {
        // Create new draft
        response = await submitPaper({
          conference_id: conference.id,
          ...submissionData,
        })
        if (response.error) {
          toast({
            title: t("dashboard.author.submit.draftSaveFailed") || "Failed to save draft",
            description: response.error,
            variant: "destructive",
          })
        } else if (response.data) {
          toast({
            title: t("dashboard.author.submit.draftSaveSuccess") || "Draft saved successfully",
            description: "Your draft has been saved. You can continue editing anytime.",
          })
          // Redirect to edit mode for the newly created draft
          router.push(`/dashboard/author/submit?conference=${conference.id}&edit=${response.data.id}`)
        }
      }
    } catch (error) {
      toast({
        title: t("dashboard.author.submit.draftSaveError") || "Error saving draft",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !conference) return

    setSubmitting(true)
    try {
      // Build COI declarations from coiPeople array
      const declaredConflicts = coiPeople
        .filter((person) => person.trim())
        .map((person) => ({
          email: person.trim(),
          reason: "Declared conflict of interest",
        }))

      const submissionData = {
        title,
        abstract,
        link: "",
        domain: subjectAreas,
        file: uploadedFile || undefined,
        cover_letter: coverLetter || undefined,
        status: "published" as const,
        track: selectedTrack,
        information: {
          keywords,
          co_authors: authors
            .filter((a, index) => index > 0 && a.email.trim())
            .map((a) => a.email.trim()),
          declared_conflicts: declaredConflicts,
          paper_type: "research",
          track_name: selectedTrack,
          additional_notes: "",
          metadata: {
            language: "en",
            page_count: 0,
          },
        },
      }

      let response
      if (isEditMode && initialSubmission) {
        response = await updatePaper(initialSubmission.id.toString(), conference.id, submissionData)
        if (response.error) {
          toast({
            title: t("dashboard.author.submit.updateFailed") || "Update failed",
            description: response.error,
            variant: "destructive",
          })
        } else if (response.data) {
          setSuccessMessage(
            t("dashboard.author.submit.updateSuccess") ||
              "Your submission has been updated successfully!"
          )
          setRedirectPath(`/dashboard/conference/${conference.id}`)
          setShowSuccessDialog(true)
        }
      } else {
        response = await submitPaper({
          conference_id: conference.id,
          ...submissionData,
        })
        if (response.error) {
          toast({
            title: t("dashboard.author.submit.submissionFailed") || "Submission failed",
            description: response.error,
            variant: "destructive",
          })
        } else if (response.data) {
          setSuccessMessage(
            t("dashboard.author.submit.submissionSuccess") ||
              "Your paper has been submitted successfully!"
          )
          setRedirectPath(`/dashboard/conference/${conference.id}`)
          setShowSuccessDialog(true)
        }
      }
    } catch (error) {
      toast({
        title: t("dashboard.author.submit.submissionError") || "Submission error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = Object.values(checklist).every((v) => v === true)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border border-[#0056A3] text-[#0056A3] bg-transparent hover:bg-[#0056A3]/10 px-4 py-2 rounded-[4px] flex items-center gap-2"
            title={t("dashboard.author.submit.backTooltip")}
          >
            <ArrowLeft className="size-6" />
            {t("dashboard.author.submit.backButton")}
          </Button>
          <div>
            <h1 className={`${typography.h1} ${typography.bold} text-[#212529] font-arial`}>
              {t("dashboard.author.submit.title")}
            </h1>
            <p className={`text-[#6C757D] mt-1 ${typography.bodyLarge} font-arial`}>
              {t("dashboard.author.submit.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSaveAsDraft}
            disabled={submitting}
            className={`border border-[#0056A3] text-[#0056A3] bg-transparent hover:bg-[#0056A3]/10 px-4 py-2 rounded-[4px] ${typography.bodyLarge} ${typography.medium} font-arial`}
          >
            {t("dashboard.author.submit.saveDraft")}
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`bg-[#0056A3] text-white hover:bg-[#0056A3]/90 px-4 py-2 rounded-[4px] ${typography.bodyLarge} ${typography.medium} font-arial`}
          >
            {submitting
              ? t("dashboard.author.submit.submitting")
              : t("dashboard.author.submit.submit")}
          </Button>
        </div>
      </div>
      <div className="flex gap-8">
        <div className="flex-1">
          <div className="bg-[#F8F9FA] rounded-lg p-1 mb-6 flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-3 rounded-[4px] ${typography.body} ${typography.medium} font-arial transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-[#212529] shadow-sm"
                    : "text-[#6C757D] hover:text-[#212529]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Card className="border border-[#DEE2E6] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
            <CardContent className="p-8">
              {activeTab === "paper" && (
                <PaperTab
                  title={title}
                  setTitle={setTitle}
                  abstract={abstract}
                  setAbstract={setAbstract}
                  subjectAreas={subjectAreas}
                  setSubjectAreas={setSubjectAreas}
                  keywords={keywords}
                  setKeywords={setKeywords}
                  keywordInput={keywordInput}
                  setKeywordInput={setKeywordInput}
                  handleAddKeyword={handleAddKeyword}
                  selectedTrack={selectedTrack}
                  setSelectedTrack={setSelectedTrack}
                  availableTracks={availableTracks}
                />
              )}
              {activeTab === "authors" && (
                <AuthorsTab
                  authors={authors}
                  setAuthors={setAuthors}
                  isCorresponding={isCorresponding}
                  setIsCorresponding={setIsCorresponding}
                />
              )}
              {activeTab === "file" && (
                <FileTab
                  uploadedFile={uploadedFile}
                  setUploadedFile={setUploadedFile}
                  validationStatus={validationStatus}
                  setValidationStatus={setValidationStatus}
                  conference={conference}
                  submissionId={initialSubmission?.id?.toString()}
                  conferenceId={conference?.id}
                  existingFile={
                    isEditMode && initialSubmission?.file
                      ? {
                          name: initialSubmission.file.original_name,
                          size: initialSubmission.file.size,
                          type: initialSubmission.file.mime_type,
                        }
                      : undefined
                  }
                />
              )}
              {activeTab === "coi" && (
                <COITab
                  coiPeople={coiPeople}
                  setCoiPeople={setCoiPeople}
                  coiPersonInput={coiPersonInput}
                  setCoiPersonInput={setCoiPersonInput}
                />
              )}
              {activeTab === "cover-letter" && (
                <CoverLetterTab
                  coverLetter={coverLetter}
                  setCoverLetter={setCoverLetter}
                  submissionId={initialSubmission?.id?.toString()}
                  conferenceId={conference?.id}
                  existingCoverLetter={
                    isEditMode && initialSubmission?.cover_letter
                      ? {
                          name: initialSubmission.cover_letter.original_name,
                          size: initialSubmission.cover_letter.size,
                          type: initialSubmission.cover_letter.mime_type,
                        }
                      : undefined
                  }
                />
              )}
            </CardContent>
          </Card>
          <div
            className={`mt-4 flex items-center ${spacing.gap.sm} ${typography.body} text-[#6C757D] font-arial`}
          >
            <Info className="size-4" />
            <span>{t("dashboard.author.submit.draftAutoSave")}</span>
          </div>
        </div>
        <SubmissionSidebar checklist={checklist} />
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Success!</AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccessDialog(false)
                router.push(redirectPath)
              }}
            >
              Continue to Conference
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
