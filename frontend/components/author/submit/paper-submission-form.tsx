"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { submitPaper, updatePaper } from "@/lib/api/papers"
import { useAuth } from "@/lib/auth-context"
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
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface PaperSubmissionFormProps {
  conference?: Conference | null
  submission?: Submission | null
}

type StepType = "paper" | "authors" | "file" | "coi" | "review"

export function PaperSubmissionForm({
  conference,
  submission: initialSubmission,
}: PaperSubmissionFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { resolvedTheme } = useTheme()

  const [currentStep, setCurrentStep] = useState<StepType>("paper")
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Form state
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

  const availableTracks: string[] = Array.isArray(conference?.tracks)
    ? conference.tracks.map((t) => (typeof t === "string" ? t : (t as any).name || String(t)))
    : [
        "Artificial Intelligence & Machine Learning",
        "Computer Systems & Networks",
        "Software Engineering",
        "Human-Computer Interaction",
      ]

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

  const handleSaveDraft = async () => {
    if (!user || !conference) return
    setSubmitting(true)

    try {
      const submissionData = {
        title,
        abstract,
        link: "",
        domain: [],
        status: "draft" as const,
        track: selectedTrack,
        information: {
          keywords,
          co_authors: [],
          declared_conflicts: [],
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
          description: response.error,
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

  const steps = [
    {
      id: "paper",
      label: "Paper Details",
      description: "Title, abstract, keywords",
      icon: "radio_button_checked",
    },
    {
      id: "authors",
      label: "Authors & Affiliations",
      description: "Add co-authors",
      icon: "radio_button_unchecked",
    },
    {
      id: "file",
      label: "File Upload",
      description: "PDF manuscript",
      icon: "radio_button_unchecked",
    },
    {
      id: "coi",
      label: "Conflicts of Interest",
      description: "Declare conflicts",
      icon: "radio_button_unchecked",
    },
    {
      id: "review",
      label: "Review & Submit",
      description: "Final check",
      icon: "radio_button_unchecked",
    },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#191919]">
      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Progress Sidebar */}
        <aside className="hidden lg:flex w-[280px] flex-col border-r border-[#ededed] dark:border-neutral-800 bg-white dark:bg-[#1e1e1e] h-full overflow-y-auto">
          <div className="p-6">
            {/* Logo in Sidebar */}
            <div className="flex items-center gap-3 text-primary dark:text-white mb-10">
              <div className="size-8 flex items-center justify-center bg-primary text-white rounded-lg">
                <span className="material-symbols-outlined text-[20px]">description</span>
              </div>
              <h2 className="text-primary dark:text-white text-lg font-bold leading-tight tracking-tight">
                ConferenceSpace
              </h2>
            </div>

            <div className="flex flex-col mb-8">
              <h1 className="text-primary dark:text-white text-lg font-bold leading-normal">
                Submission Progress
              </h1>
              <p className="text-neutral-500 text-sm font-normal">ID: #4921</p>
            </div>
            <div className="relative flex flex-col gap-1">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`group flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                    currentStep === step.id
                      ? "bg-primary/5 dark:bg-white/5 border border-transparent"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 opacity-60 hover:opacity-100"
                  }`}
                  onClick={() => setCurrentStep(step.id as StepType)}
                >
                  <div className="flex flex-col items-center gap-2 mt-1">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        currentStep === step.id
                          ? "text-primary dark:text-white icon-filled"
                          : "text-neutral-400"
                      }`}
                    >
                      {currentStep === step.id ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                    {index < steps.length - 1 && (
                      <div className="w-px h-full bg-neutral-200 dark:bg-neutral-700 min-h-[24px]" />
                    )}
                  </div>
                  <div className={index < steps.length - 1 ? "pb-4" : ""}>
                    <p
                      className={`text-sm leading-tight ${
                        currentStep === step.id
                          ? "text-primary dark:text-white font-bold"
                          : "text-primary dark:text-white font-medium"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-neutral-500 text-xs mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto p-6 border-t border-[#ededed] dark:border-neutral-800">
            <div className="flex items-center gap-3 text-neutral-500 text-xs">
              <span className="material-symbols-outlined text-lg">help</span>
              <span>Need help? View Guidelines</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-full overflow-y-auto bg-white dark:bg-black/20 scroll-smooth">
          <div className="max-w-4xl mx-auto p-6 md:p-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      conference?.id
                        ? `/dashboard/conference/${conference.id}`
                        : "/dashboard/author/submissions",
                    )
                  }
                  className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary dark:hover:text-primary transition-colors mb-1 w-fit"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span>Back</span>
                </button>
                <h1 className="text-primary dark:text-white text-3xl font-bold tracking-tight">
                  Paper Details
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Please provide the core information about your research paper.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  Draft auto-saved at 10:42 AM
                </span>
              </div>
            </div>

            {/* Form Content */}
            <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
              {/* Track Selection Card */}
              <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-col gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider">
                      Conference Track <span className="text-red-500">*</span>
                    </span>
                    <div className="relative">
                      <select
                        value={selectedTrack}
                        onChange={(e) => setSelectedTrack(e.target.value)}
                        className="w-full h-12 pl-4 pr-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-primary dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select a track...</option>
                        {availableTracks.map((track) => (
                          <option key={track} value={track}>
                            {track}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                        <span className="material-symbols-outlined">expand_more</span>
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Select the most relevant track for your research to ensure proper reviewer
                      assignment.
                    </p>
                  </label>
                </div>
              </div>

              {/* Paper Information Card */}
              <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-6">
                {/* Title Field */}
                <label className="flex flex-col gap-2">
                  <span className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider">
                    Paper Title <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Optimizing Neural Networks for Edge Devices"
                    className="w-full h-12 px-4 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-primary dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </label>

                {/* Abstract Field */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <span className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider">
                      Abstract <span className="text-red-500">*</span>
                    </span>
                    <span className="text-xs text-neutral-500">
                      {abstract.split(/\s+/).filter(Boolean).length} / 500 words
                    </span>
                  </div>
                  <div
                    data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
                    className="rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-900 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all [&_.w-md-editor]:bg-transparent [&_.w-md-editor-text]:bg-transparent [&_.w-md-editor-text-textarea]:text-primary [&_.w-md-editor-text-textarea]:dark:text-white [&_.w-md-editor-text-textarea]:placeholder:text-neutral-400 [&_.w-md-editor-text-textarea]:text-[16px] [&_.w-md-editor-preview]:text-[16px] [&_.w-md-editor-preview_*]:text-[16px] [&_.w-md-editor-toolbar]:h-12 [&_.w-md-editor-toolbar_button]:w-8 [&_.w-md-editor-toolbar_button]:h-8 [&_.w-md-editor-toolbar_button_svg]:w-3 [&_.w-md-editor-toolbar_button_svg]:h-3"
                  >
                    <MDEditor
                      value={abstract}
                      onChange={(val) => setAbstract(val || "")}
                      preview="live"
                      height={300}
                      textareaProps={{
                        placeholder:
                          "Enter your paper abstract here... You can use markdown formatting.",
                      }}
                      visibleDragbar={false}
                    />
                  </div>
                </div>

                {/* Keywords Field */}
                <label className="flex flex-col gap-2">
                  <span className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider">
                    Keywords <span className="text-red-500">*</span>
                  </span>
                  <div className="w-full min-h-[56px] px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-primary dark:text-white focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all flex flex-wrap gap-2 items-center">
                    {keywords.map((keyword) => (
                      <div
                        key={keyword}
                        className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700"
                      >
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {keyword}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword)}
                          aria-label={`Remove keyword ${keyword}`}
                          className="flex items-center justify-center size-5 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-500 dark:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <span className="material-symbols-outlined text-[14px] leading-none">
                            close
                          </span>
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleAddKeyword}
                      placeholder={keywords.length === 0 ? "Type keyword and press Enter..." : ""}
                      className="flex-1 min-w-[200px] h-8 border-none bg-transparent focus:outline-none text-sm px-2 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Provide 3-5 keywords separated by Enter.
                  </p>
                </label>
              </div>

              {/* Additional Options */}
              <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isStudentPaper}
                    onChange={(e) => setIsStudentPaper(e.target.checked)}
                    className="mt-1 size-5 rounded border-neutral-300 text-primary focus:ring-primary transition-all"
                  />
                  <div className="flex flex-col">
                    <span className="text-primary dark:text-white text-sm font-bold">
                      Student Paper
                    </span>
                    <span className="text-sm text-neutral-500">
                      Check this box if the primary author is a student.
                    </span>
                  </div>
                </label>
              </div>
            </form>
            {/* Spacer for bottom action bar */}
            <div className="h-32" />
          </div>
        </main>

        {/* Fixed Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 lg:left-[280px] right-0 bg-white dark:bg-[#1e1e1e] border-t border-[#ededed] dark:border-neutral-800 p-4 z-30">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              Save Draft
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled
                className="hidden sm:flex px-5 py-2.5 rounded-lg text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors opacity-50 cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep("authors")}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all transform hover:translate-y-px"
              >
                Next: Authors
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
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
                onClick={() => router.push(`/dashboard/conference/${conference?.id}`)}
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
