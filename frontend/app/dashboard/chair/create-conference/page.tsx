"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createConference } from "@/lib/api/conferences"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import {
  WizardLayout,
  BasicDetailsStep,
  TopicsDeadlinesStep,
  PolicyGuidelinesStep,
  CallForPapersStep,
  ConferenceFormData,
  initialFormData,
} from "@/components/wizard/creation"

export default function CreateConferencePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [maxStepReached, setMaxStepReached] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [formData, setFormData] = useState<ConferenceFormData>(initialFormData)

  const updateFormData = (data: Partial<ConferenceFormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...data }

      // Sync new date fields with legacy fields for API compatibility
      if (data.conferenceStartDate !== undefined || data.conferenceEndDate !== undefined) {
        updated.dateRange = {
          from: data.conferenceStartDate ?? prev.conferenceStartDate,
          to: data.conferenceEndDate ?? prev.conferenceEndDate,
        }
      }
      if (data.fullPaperDeadline !== undefined) {
        updated.submissionDeadline = data.fullPaperDeadline
      }
      if (data.abstractDeadline !== undefined) {
        updated.submissionsOpen = data.abstractDeadline
      }
      if (data.authorNotificationDate !== undefined) {
        updated.authorNotification = data.authorNotificationDate
      }
      if (data.location !== undefined) {
        updated.venue = data.location
      }

      return updated
    })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!authChecked) return
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [authChecked, isAuthenticated, router])

  const handleNext = () => {
    if (currentStep < 6) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      setMaxStepReached(Math.max(maxStepReached, nextStep))
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/chair")
  }

  const handleSaveDraft = () => {
    toast({
      title: "Draft saved",
      description: "Your conference draft has been saved.",
    })
  }

  const handleStepClick = (step: number) => {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCreateConference = async () => {
    // Validation
    if (!formData.title || !formData.acronym) {
      toast({
        title: "Missing required fields",
        description: "Please provide at least the conference name and acronym.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const conferenceData = {
        title: formData.title,
        acronym: formData.acronym,
        description: formData.description,
        domain: formData.topics,
        tracks: formData.tracks,
        venue: formData.venue || formData.location,
        configurations: {
          start_date:
            formData.conferenceStartDate?.toISOString() ||
            formData.dateRange.from?.toISOString() ||
            "",
          end_date:
            formData.conferenceEndDate?.toISOString() || formData.dateRange.to?.toISOString() || "",
          abstract_submission_deadline:
            formData.abstractDeadline?.toISOString() || formData.submissionsOpen?.toISOString(),
          full_paper_submission_deadline:
            formData.fullPaperDeadline?.toISOString() ||
            formData.submissionDeadline?.toISOString() ||
            "",
          camera_ready_deadline: formData.cameraReadyDeadline?.toISOString(),
          format: formData.locationType,
          review_type: formData.anonymity === "double-blind" ? "double-blind" : "single-blind",
          maximum_pages: formData.maxPages || 8,
          have_coi: true,
          submission_format: formData.fileFormats.join(", "),
          require_complete_author_profile: true,
          allow_paper_withdrawls: true,
          call_for_paper_text: formData.callForPaperText || undefined,
        },
      }

      const response = await createConference(conferenceData)

      if (response.error) {
        toast({
          title: t("dashboard.chair.createConference.error"),
          description: response.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: t("dashboard.chair.createConference.success"),
          description: t("dashboard.chair.createConference.successDescription"),
        })
        router.push("/dashboard/chair")
      }
    } catch {
      toast({
        title: t("dashboard.chair.createConference.error"),
        description: t("dashboard.chair.createConference.errorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const isStepEditable = (step: number) => step <= maxStepReached

  if (!authChecked || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3C53]" />
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicDetailsStep data={formData} updateData={updateFormData} />
      case 2:
        return <TopicsDeadlinesStep data={formData} updateData={updateFormData} />
      case 3:
        return <PolicyGuidelinesStep data={formData} updateData={updateFormData} />
      case 4:
        return <CallForPapersStep data={formData} updateData={updateFormData} />
      case 5:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
              <span className="material-symbols-outlined text-[20px] text-slate-400">groups</span>
            </div>
            <p className="text-sm font-bold text-[#1B3C53] dark:text-white mb-0.5">Committees</p>
            <p className="text-[10px] font-medium text-slate-400">
              Add program committee members and reviewers
            </p>
          </div>
        )
      case 6:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
              <span className="material-symbols-outlined text-[20px] text-slate-400">
                check_circle
              </span>
            </div>
            <p className="text-sm font-bold text-[#1B3C53] dark:text-white mb-0.5">Final Review</p>
            <p className="text-[10px] font-medium text-slate-400">
              Review all details and publish conference
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <WizardLayout
      currentStep={currentStep}
      maxStepReached={maxStepReached}
      onStepClick={handleStepClick}
      onCancel={handleCancel}
      onSaveDraft={handleSaveDraft}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSubmit={handleCreateConference}
      isSubmitting={isCreating}
      canSubmit={formData.confirmed}
    >
      {renderStepContent()}
    </WizardLayout>
  )
}
