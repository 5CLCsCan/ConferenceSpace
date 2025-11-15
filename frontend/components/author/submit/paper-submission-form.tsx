"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Info, FileText } from "lucide-react"
import { submitPaper, updatePaper } from "@/lib/api/papers"
import { useAuth } from "@/lib/auth-context"
import type { Conference } from "@/lib/types"
import { PaperTab } from "./paper-tab"
import { AuthorsTab } from "./authors-tab"
import { FileTab } from "./file-tab"
import { COITab } from "./coi-tab"
import { SubmissionSidebar } from "./submission-sidebar"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getConferenceSubmissions, type Submission } from "@/lib/api/submissions"

interface PaperSubmissionFormProps {
  conference?: Conference | null
  submission?: Submission | null
}

type TabType = "paper" | "authors" | "file" | "coi"

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

export function PaperSubmissionForm({ conference, submission: initialSubmission }: PaperSubmissionFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>("paper")
  const [submitting, setSubmitting] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [existingDraft, setExistingDraft] = useState<Submission | null>(null)
  const [isEditMode, setIsEditMode] = useState(!!initialSubmission)
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
  const [coiOrgs, setCoiOrgs] = useState<string[]>([])
  const [coiDomains, setCoiDomains] = useState<string[]>([])
  const [coiPersonInput, setCoiPersonInput] = useState("")
  const [coiOrgInput, setCoiOrgInput] = useState("")
  const [coiDomainInput, setCoiDomainInput] = useState("")
  // Checklist state
  const checklist: Checklist = {
    titleProvided: title.trim().length > 0,
    abstractLength:
      abstract.split(" ").filter(Boolean).length >= 150 &&
      abstract.split(" ").filter(Boolean).length <= 250,
    subjectAreas: subjectAreas.length >= 1,
    keywords: keywords.length >= 3,
    // In edit mode, allow submission if original submission has a file OR new file is uploaded
    pdfUploaded: uploadedFile !== null || (isEditMode && initialSubmission?.file !== undefined),
    coAuthorsListed: authors.some((a) => a.name.trim().length > 0),
    coiDeclared: coiPeople.length > 0 || coiOrgs.length > 0 || coiDomains.length > 0,
  }

  const tabs = [
    { id: "paper" as TabType, label: t("dashboard.author.submit.tabs.paper") },
    { id: "authors" as TabType, label: t("dashboard.author.submit.tabs.authors") },
    { id: "file" as TabType, label: t("dashboard.author.submit.tabs.file") },
    { id: "coi" as TabType, label: t("dashboard.author.submit.tabs.coi") },
  ]

  // Pre-fill form with submission data if in edit mode
  useEffect(() => {
    if (!initialSubmission) return
    
    // Pre-fill paper tab data immediately (doesn't depend on user)
    setTitle(initialSubmission.title || "")
    setAbstract(initialSubmission.abstract || "")
    setSubjectAreas(initialSubmission.domain || [])
    setKeywords(initialSubmission.information?.keywords || [])

    // Pre-fill authors
    // Load co-authors from submission first
    const coAuthors: Author[] = []
    if (initialSubmission.information?.co_authors && initialSubmission.information.co_authors.length > 0) {
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

  // Load existing draft on component mount (only if not in edit mode)
  useEffect(() => {
    if (isEditMode) return // Skip draft loading in edit mode

    const loadDraft = async () => {
      if (!user || !conference) return

      setLoadingDraft(true)
      try {
        const response = await getConferenceSubmissions(conference.id, {
          author: user.email,
          status: "draft",
          limit: 1,
        })

        if (response.data && response.data.submissions.length > 0) {
          const draft = response.data.submissions[0]
          // Don't show draft if we're editing a different submission
          if (!initialSubmission || draft.id !== initialSubmission.id) {
            setExistingDraft(draft)
            console.log("[PaperSubmissionForm] Found existing draft:", draft)
          }
        }
      } catch (error) {
        console.error("[PaperSubmissionForm] Error loading draft:", error)
      } finally {
        setLoadingDraft(false)
      }
    }

    loadDraft()
  }, [user, conference, isEditMode, initialSubmission])

  const handleLoadDraft = () => {
    if (!existingDraft) return

    // Populate form fields with draft data
    setTitle(existingDraft.title || "")
    setAbstract(existingDraft.abstract || "")
    setSubjectAreas(existingDraft.domain || [])
    setKeywords(existingDraft.information?.keywords || [])

    // Load co-authors if available
    if (existingDraft.information?.co_authors && existingDraft.information.co_authors.length > 0) {
      const coAuthors = existingDraft.information.co_authors.map((email) => ({
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

    // Hide the load draft button after loading
    setExistingDraft(null)

    // Show success message
    //alert(t("dashboard.author.submit.draftLoadSuccess") || "Draft loaded successfully!")
  }

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
      const submissionData = {
        title,
        abstract,
        link: "", // TODO: Add file upload URL when implemented
        domain: subjectAreas,
        file: uploadedFile || undefined, // Include uploaded file
        information: {
          keywords,
          co_authors: authors
            .filter((a, index) => index > 0 && a.name.trim()) // Skip first author (current user)
            .map((a) => a.email),
          paper_type: "research", // Default
          track_name: subjectAreas[0] || "",
          additional_notes: "", // TODO: Add notes field
          metadata: {
            language: "en", // Default
            page_count: 0, // TODO: Extract from uploaded file
          },
        },
      }

      let response
      if (isEditMode && initialSubmission) {
        // Update existing submission as draft
        response = await updatePaper(
          initialSubmission.id.toString(),
          conference.id,
          submissionData,
        )
        if (response.error) {
          alert(`${t("dashboard.author.submit.draftSaveFailed")}: ${response.error}`)
        } else {
          alert(t("dashboard.author.submit.draftSaveSuccess"))
          router.push("/dashboard/author")
        }
      } else {
        // Create new draft
        response = await submitPaper({
          conference_id: conference.id,
          ...submissionData,
        })
        if (response.error) {
          alert(`${t("dashboard.author.submit.draftSaveFailed")}: ${response.error}`)
        } else {
          alert(t("dashboard.author.submit.draftSaveSuccess"))
          router.push("/dashboard/author")
        }
      }
    } catch (error) {
      alert(t("dashboard.author.submit.draftSaveError"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !conference) return

    setSubmitting(true)
    try {
      const submissionData = {
        title,
        abstract,
        link: "", // TODO: Add file upload URL when implemented
        domain: subjectAreas,
        file: uploadedFile || undefined, // Include uploaded file
        information: {
          keywords,
          co_authors: authors
            .filter((a, index) => index > 0 && a.name.trim()) // Skip first author (current user)
            .map((a) => a.email),
          paper_type: "research", // Default
          track_name: subjectAreas[0] || "",
          additional_notes: "", // TODO: Add notes field
          metadata: {
            language: "en", // Default
            page_count: 0, // TODO: Extract from uploaded file
          },
        },
      }

      let response
      if (isEditMode && initialSubmission) {
        // Update existing submission
        response = await updatePaper(
          initialSubmission.id.toString(),
          conference.id,
          submissionData,
        )
        if (response.error) {
          alert(`${t("dashboard.author.submit.updateFailed") || "Update failed"}: ${response.error}`)
        } else {
          alert(t("dashboard.author.submit.updateSuccess") || "Submission updated successfully")
          router.push("/dashboard/author")
        }
      } else {
        // Create new submission
        response = await submitPaper({
          conference_id: conference.id,
          ...submissionData,
        })
        if (response.error) {
          alert(`${t("dashboard.author.submit.submissionFailed")}: ${response.error}`)
        } else {
          alert(t("dashboard.author.submit.submissionSuccess"))
          router.push("/dashboard/author")
        }
      }
    } catch (error) {
      alert(t("dashboard.author.submit.submissionError"))
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
            <h1 className="text-3xl font-bold text-[#212529] font-arial">
              {t("dashboard.author.submit.title")}
            </h1>
            <p className="text-[#6C757D] mt-1 text-base font-arial">
              {t("dashboard.author.submit.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {existingDraft && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadDraft}
              disabled={loadingDraft}
              className="border border-[#28A745] text-[#28A745] bg-transparent hover:bg-[#28A745]/10 px-4 py-2 rounded-[4px] text-base font-medium font-arial flex items-center gap-2"
            >
              <FileText className="size-4" />
              {t("Load Draft") || "Load Saved Draft"}
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={handleSaveAsDraft}
            disabled={submitting}
            className="border border-[#0056A3] text-[#0056A3] bg-transparent hover:bg-[#0056A3]/10 px-4 py-2 rounded-[4px] text-base font-medium font-arial"
          >
            {t("dashboard.author.submit.saveDraft")}
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="bg-[#0056A3] text-white hover:bg-[#0056A3]/90 px-4 py-2 rounded-[4px] text-base font-medium font-arial"
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
                className={`flex-1 px-6 py-3 rounded-[4px] text-sm font-medium font-arial transition-colors ${
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
                  existingFile={isEditMode && initialSubmission?.file ? {
                    name: initialSubmission.file.original_name,
                    size: initialSubmission.file.size,
                    type: initialSubmission.file.mime_type,
                  } : undefined}
                />
              )}
              {activeTab === "coi" && (
                <COITab
                  coiPeople={coiPeople}
                  setCoiPeople={setCoiPeople}
                  coiOrgs={coiOrgs}
                  setCoiOrgs={setCoiOrgs}
                  coiDomains={coiDomains}
                  setCoiDomains={setCoiDomains}
                  coiPersonInput={coiPersonInput}
                  setCoiPersonInput={setCoiPersonInput}
                  coiOrgInput={coiOrgInput}
                  setCoiOrgInput={setCoiOrgInput}
                  coiDomainInput={coiDomainInput}
                  setCoiDomainInput={setCoiDomainInput}
                />
              )}
            </CardContent>
          </Card>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#6C757D] font-arial">
            <Info className="size-4" />
            <span>{t("dashboard.author.submit.draftAutoSave")}</span>
          </div>
        </div>
        <SubmissionSidebar checklist={checklist} />
      </div>
    </div>
  )
}
