"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createConference } from "@/lib/api/conferences"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ROUTES } from "@/lib/routes"
import {
  WizardLayout,
  BasicDetailsStep,
  TopicsDeadlinesStep,
  PolicyGuidelinesStep,
  CallForPapersStep,
  CommitteesStep,
  FinalReviewStep,
  ConferenceFormData,
  initialFormData,
} from "@/components/wizard/creation"

export default function CreateConferencePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1)
  const [maxStepReached, setMaxStepReached] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
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
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push(ROUTES.CHAIR.CONFERENCES)
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
          desk_rejection_settings: {
            enabled: true,
            required_sections: ["Abstract", "Introduction", "Methods", "Results", "Conclusions"],
            title_max_words: 15,
            max_sentence_words: 25,
            min_references: Math.max(formData.minKeywords, 1),
            thresholds: {
              desk_reject_score: 0.3,
              accept_score: 0.7,
            },
            custom_rules: {
              min_datasets: formData.allowSupplementary ? 1 : 0,
            },
            scope_keywords: formData.topics,
            prompt_fragments: formData.callForPaperText
              ? [`Conference scope and emphasis:\n${formData.callForPaperText}`]
              : [],
          },
          discussion_settings: {
            enabled: true,
            allow_author_response: true,
            start_at: formData.fullPaperDeadline?.toISOString(),
            end_at: formData.finalDecisionDate?.toISOString(),
          },
          rebuttal_settings: {
            enabled: Boolean(formData.rebuttalStartDate && formData.rebuttalEndDate),
            start_at: formData.rebuttalStartDate?.toISOString(),
            end_at: formData.rebuttalEndDate?.toISOString(),
            character_limit: 10000,
            allow_revisions: true,
            allow_new_results: true,
            require_response_to_all: false,
          },
          workflow_settings: {
            strict_deadlines: formData.strictDeadlines,
          },
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
        router.push(ROUTES.CHAIR.CONFERENCES)
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
        return <CommitteesStep data={formData} updateData={updateFormData} />
      case 6:
        return (
          <FinalReviewStep
            data={formData}
            updateData={updateFormData}
            onEditStep={handleStepClick}
          />
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
