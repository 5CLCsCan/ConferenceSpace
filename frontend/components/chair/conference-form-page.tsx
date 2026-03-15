"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createConference, getConferenceById, updateConference, inviteReviewers } from "@/lib/api/conferences"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ROUTES } from "@/lib/routes"
import { ConferenceTemplateSheet } from "@/components/chair/conference-template-sheet"
import {
  WizardLayout,
  BasicDetailsStep,
  TopicsDeadlinesStep,
  PolicyGuidelinesStep,
  CallForPapersStep,
  CommitteesStep,
  FinalReviewStep,
  type ConferenceFormData,
  initialFormData,
} from "@/components/wizard/creation"
import { buildConferenceMutationPayload, mapConferenceToFormData } from "@/lib/conference-form"
import type { Conference } from "@/lib/types"

interface ConferenceFormPageProps {
  mode: "create" | "edit"
  conferenceId?: string
}

export function ConferenceFormPage({ mode, conferenceId }: ConferenceFormPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const isEditMode = mode === "edit"
  const [currentStep, setCurrentStep] = useState(1)
  const [maxStepReached, setMaxStepReached] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingConference, setIsLoadingConference] = useState(isEditMode)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false)
  const [formData, setFormData] = useState<ConferenceFormData>(initialFormData)
  const [existingConference, setExistingConference] = useState<Conference | null>(null)

  useEffect(() => {
    if (!isEditMode || !conferenceId) {
      return
    }

    let active = true

    async function loadConference() {
      setIsLoadingConference(true)
      setLoadError(null)

      const response = await getConferenceById(conferenceId!)
      if (!active) {
        return
      }

      if (response.error || !response.data) {
        setLoadError(
          response.error ||
            t("runtime.components.chair.conference-form-page.text_failed_to_load_conference"),
        )
        setIsLoadingConference(false)
        return
      }

      setExistingConference(response.data)
      setFormData(mapConferenceToFormData(response.data))
      setMaxStepReached(6)
      setIsLoadingConference(false)
    }

    void loadConference()

    return () => {
      active = false
    }
  }, [conferenceId, isEditMode, t])

  const updateFormData = (data: Partial<ConferenceFormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...data }

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
    if (isEditMode && conferenceId) {
      router.push(ROUTES.CHAIR.CONFERENCE_DETAIL(conferenceId))
      return
    }
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push(ROUTES.CHAIR.CONFERENCES)
  }

  const handleStepClick = (step: number) => {
    setCurrentStep(step)
    setMaxStepReached((prev) => Math.max(prev, step))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSaveDraft = async () => {
    if (!isEditMode) {
      toast({
        title: t("runtime.app.role.chair.conferences.new.page.prop_title_draft_saved"),
        description: t(
          "runtime.app.role.chair.conferences.new.page.prop_description_your_conference_draft_has_been_saved",
        ),
      })
      return
    }

    await handleSubmit()
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.acronym) {
      toast({
        title: t("runtime.app.role.chair.conferences.new.page.prop_title_missing_required_fields"),
        description: t(
          "runtime.app.role.chair.conferences.new.page.prop_description_please_provide_at_least_the_conference",
        ),
        variant: "destructive",
      })
      return
    }

    if (isEditMode && !conferenceId) {
      toast({
        title: t("dashboard.chair.updateConference.error"),
        description: t("dashboard.chair.updateConference.missingConferenceId"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = buildConferenceMutationPayload(formData, existingConference)
      const response = isEditMode
        ? await updateConference(conferenceId!, payload)
        : await createConference(payload)

      if (response.error || !response.data) {
        toast({
          title: isEditMode
            ? t("dashboard.chair.updateConference.error")
            : t("dashboard.chair.createConference.error"),
          description:
            response.error ||
            (isEditMode
              ? t("dashboard.chair.updateConference.errorDescription")
              : t("dashboard.chair.createConference.errorDescription")),
          variant: "destructive",
        })
        return
      }

      setExistingConference(response.data)

      // After creating a new conference, invite reviewers added in the wizard
      if (!isEditMode && response.data?.id) {
        const reviewerOrganizers = formData.organizers.filter(
          (o) => o.role === "reviewer" && o.id,
        )
        if (reviewerOrganizers.length > 0) {
          const toInvite = reviewerOrganizers
            .map((o) => ({ user_id: Number(o.id) }))
            .filter((r) => r.user_id > 0)
          if (toInvite.length > 0) {
            await inviteReviewers(String(response.data.id), toInvite)
          }
        }
      }

      toast({
        title: isEditMode
          ? t("dashboard.chair.updateConference.success")
          : t("dashboard.chair.createConference.success"),
        description: isEditMode
          ? t("dashboard.chair.updateConference.successDescription")
          : t("dashboard.chair.createConference.successDescription"),
      })

      router.push(ROUTES.CHAIR.CONFERENCE_DETAIL(response.data.id))
    } catch {
      toast({
        title: isEditMode
          ? t("dashboard.chair.updateConference.error")
          : t("dashboard.chair.createConference.error"),
        description: isEditMode
          ? t("dashboard.chair.updateConference.errorDescription")
          : t("dashboard.chair.createConference.errorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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

  if (isLoadingConference) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-sm text-slate-500">
        {t("runtime.components.chair.conference-form-page.text_loading_conference")}
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      </div>
    )
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
      onSubmit={handleSubmit}
      onOpenTemplate={() => setIsTemplateSheetOpen(true)}
      isSubmitting={isSubmitting}
      canSubmit={isEditMode || formData.confirmed}
      saveDraftLabel={
        isEditMode
          ? t("runtime.components.wizard.creation.wizard-action-bar.text_save_changes")
          : undefined
      }
      submitLabel={
        isEditMode
          ? t("runtime.components.wizard.creation.wizard-action-bar.text_update_conference")
          : undefined
      }
      submittingLabel={
        isEditMode
          ? t("runtime.components.wizard.creation.wizard-action-bar.text_updating")
          : undefined
      }
    >
      <div className="flex flex-col gap-4">{renderStepContent()}</div>

      <ConferenceTemplateSheet
        open={isTemplateSheetOpen}
        onOpenChange={setIsTemplateSheetOpen}
        formData={formData}
        onApply={setFormData}
        currentConferenceId={conferenceId}
      />
    </WizardLayout>
  )
}
