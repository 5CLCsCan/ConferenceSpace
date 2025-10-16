"use client"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Info } from "lucide-react"
import { submitPaper } from "@/lib/api/papers"
import { useAuth } from "@/lib/auth-context"
import type { Conference } from "@/lib/types"
import { PaperTab } from "./paper-tab"
import { AuthorsTab } from "./authors-tab"
import { FileTab } from "./file-tab"
import { COITab } from "./coi-tab"
import { SubmissionSidebar } from "./submission-sidebar"

interface PaperSubmissionFormProps {
  conference?: Conference | null
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

export function PaperSubmissionForm({ conference }: PaperSubmissionFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>("paper")
  const [submitting, setSubmitting] = useState(false)
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
  const [validationStatus, setValidationStatus] = useState<"pending" | "validating" | "success" | "error">("pending")
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
      abstract.split(" ").filter(Boolean).length >= 150 && abstract.split(" ").filter(Boolean).length <= 250,
    subjectAreas: subjectAreas.length >= 2 && subjectAreas.length <= 3,
    keywords: keywords.length >= 3,
    pdfUploaded: uploadedFile !== null,
    coAuthorsListed: authors.some((a) => a.name.trim().length > 0),
    coiDeclared: coiPeople.length > 0 || coiOrgs.length > 0 || coiDomains.length > 0,
  }

  const tabs = [
    { id: "paper" as TabType, label: "Paper" },
    { id: "authors" as TabType, label: "Authors" },
    { id: "file" as TabType, label: "File" },
    { id: "coi" as TabType, label: "COI" },
  ]

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput("")
    }
  }

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)
    const submissionData = {
      title,
      abstract,
      keywords,
      conference_id: conference?.id || "",
      track_id: subjectAreas[0] || "",
      authors: authors
        .filter((a) => a.name.trim())
        .map((author, index) => ({
          user_id: index === 0 ? user.id : `temp-${index}`,
          ...author,
          is_corresponding: index === 0 && isCorresponding,
          order: index + 1,
        })),
      file: uploadedFile,
    }
    const response = await submitPaper(submissionData)
    setSubmitting(false)
    if (response.data) {
      router.push(`/dashboard/author/papers/${response.data.id}`)
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
            title="Back to previous page"
          >
            <ArrowLeft className="size-6" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#212529] font-arial">Submit Paper</h1>
            <p className="text-[#6C757D] mt-1 text-base font-arial">
              Enter details, add co-authors, upload your PDF, and declare conflicts (COI). Save as draft anytime.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="border border-[#0056A3] text-[#0056A3] bg-transparent hover:bg-[#0056A3]/10 px-4 py-2 rounded-[4px] text-base font-medium font-arial"
          >
            Save as Draft
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="bg-[#0056A3] text-white hover:bg-[#0056A3]/90 px-4 py-2 rounded-[4px] text-base font-medium font-arial"
          >
            {submitting ? "Submitting..." : "Submit"}
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
                  activeTab === tab.id ? "bg-white text-[#212529] shadow-sm" : "text-[#6C757D] hover:text-[#212529]"
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
            <span>Draft auto-saves every few seconds</span>
          </div>
        </div>
        <SubmissionSidebar checklist={checklist} />
      </div>
    </div>
  )
}