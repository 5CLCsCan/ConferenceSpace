"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, AlertCircle, Save, LogOut } from "lucide-react"
import {
  createConference,
  getConferenceById,
  updateConference,
  inviteReviewers,
} from "@/lib/api/conferences"
import { createConferenceConfigTemplate } from "@/lib/api/conference-templates"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ROUTES } from "@/lib/routes"
import { Button } from "@/components/ui/button"
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

// Helper to revive date fields when hydrating from sessionStorage
function reviveConferenceDraftDates(raw: any): Partial<ConferenceFormData> {
  if (!raw || typeof raw !== "object") return raw

  const toDate = (value: any) => {
    if (typeof value === "string") {
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? undefined : d
    }
    return value
  }

  const draft = { ...raw }

  draft.conferenceStartDate = toDate(draft.conferenceStartDate)
  draft.conferenceEndDate = toDate(draft.conferenceEndDate)
  draft.abstractDeadline = toDate(draft.abstractDeadline)
  draft.fullPaperDeadline = toDate(draft.fullPaperDeadline)
  draft.cameraReadyDeadline = toDate(draft.cameraReadyDeadline)
  draft.authorNotificationDate = toDate(draft.authorNotificationDate)

  draft.rebuttalStartDate = toDate(draft.rebuttalStartDate)
  draft.rebuttalEndDate = toDate(draft.rebuttalEndDate)
  draft.finalDecisionDate = toDate(draft.finalDecisionDate)

  if (draft.dateRange && typeof draft.dateRange === "object") {
    draft.dateRange = {
      from: toDate(draft.dateRange.from),
      to: toDate(draft.dateRange.to),
    }
  }

  draft.submissionsOpen = toDate(draft.submissionsOpen)
  draft.submissionDeadline = toDate(draft.submissionDeadline)
  draft.reviewDeadline = toDate(draft.reviewDeadline)
  draft.authorNotification = toDate(draft.authorNotification)

  return draft
}

interface ConferenceFormPageProps {
  mode: "create" | "edit"
  conferenceId?: string
  isTemplateMode?: boolean
}

export function ConferenceFormPage({
  mode,
  conferenceId,
  isTemplateMode = false,
}: ConferenceFormPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { currentRole } = useAuth()
  const isEditMode = mode === "edit"
  const [currentStep, setCurrentStep] = useState(1)
  const [maxStepReached, setMaxStepReached] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingConference, setIsLoadingConference] = useState(isEditMode)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false)
  const [formData, setFormData] = useState<ConferenceFormData>(initialFormData)
  const [existingConference, setExistingConference] = useState<Conference | null>(null)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const lastSavedSignatureRef = useRef<string>("")

  // Get a signature of the current form state to detect changes
  const getFormSignature = useCallback(() => {
    return JSON.stringify({
      title: formData.title,
      acronym: formData.acronym,
      description: formData.description,
      organizers: formData.organizers,
      tracks: formData.tracks,
      venue: formData.venue,
      dateRange: formData.dateRange,
    })
  }, [formData])

  // Initialize reference signature once data is loaded
  useEffect(() => {
    if (!isLoadingConference && !lastSavedSignatureRef.current) {
      lastSavedSignatureRef.current = getFormSignature()
    }
  }, [isLoadingConference, getFormSignature])

  // Hydrate from dashboard templates if present
  useEffect(() => {
    if (isEditMode) return
    const draft = sessionStorage.getItem("conferenceTemplateDraft")
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft)
        const revivedDraft = reviveConferenceDraftDates(parsedDraft)
        setFormData((prev) => ({ ...prev, ...revivedDraft }))
      } catch (err) {
        console.error("Failed to parse conference template draft from session storage", err)
      } finally {
        sessionStorage.removeItem("conferenceTemplateDraft")
      }
    }
  }, [isEditMode])

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
    const dashboardHref =
      isEditMode && conferenceId
        ? ROUTES.CHAIR.CONFERENCE_DETAIL(conferenceId)
        : ROUTES.CHAIR.CONFERENCES

    const hasUnsavedChanges = getFormSignature() !== lastSavedSignatureRef.current
    if (hasUnsavedChanges) {
      setPendingHref(dashboardHref)
      setIsDiscardModalOpen(true)
      return
    }

    router.push(dashboardHref)
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const dashboardHref = currentRole
      ? (ROUTES.ROLE_ROUTE_MAP[currentRole] ?? ROUTES.ROLE_SELECT)
      : ROUTES.ROLE_SELECT

    const hasUnsavedChanges = getFormSignature() !== lastSavedSignatureRef.current
    if (hasUnsavedChanges) {
      setPendingHref(dashboardHref)
      setIsDiscardModalOpen(true)
      return
    }

    router.push(dashboardHref)
  }

  const handleStepClick = (step: number) => {
    setCurrentStep(step)
    setMaxStepReached((prev) => Math.max(prev, step))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSaveDraft = async () => {
    // Create-mode: persist a real draft
    if (!isEditMode) {
      if (!formData.title || !formData.acronym) {
        toast({
          title: t(
            "runtime.app.role.chair.conferences.new.page.prop_title_missing_required_fields",
          ),
          description: t(
            "runtime.app.role.chair.conferences.new.page.prop_description_please_provide_at_least_the_conference",
          ),
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)
      try {
        const payload = buildConferenceMutationPayload(formData)
        const response = await createConference({
          ...(payload as any),
          status: "draft",
        })

        if (response.error || !response.data) {
          toast({
            title: t("dashboard.chair.createConference.error"),
            description: response.error || t("dashboard.chair.createConference.errorDescription"),
            variant: "destructive",
          })
          return
        }

        lastSavedSignatureRef.current = getFormSignature()

        toast({
          title: t("runtime.app.role.chair.conferences.new.page.prop_title_draft_saved"),
          description: t(
            "runtime.app.role.chair.conferences.new.page.prop_description_your_conference_draft_has_been_saved",
          ),
        })

        // Optionally navigate to edit mode for this draft
        router.push(ROUTES.CHAIR.CONFERENCE_DETAIL(response.data.id))
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // Edit-mode: reuse normal submit/update path
    await handleSubmit()
  }

  const handleSubmit = async () => {
    if (!isTemplateMode && (!formData.title || !formData.acronym)) {
      toast({
        title: t("runtime.app.role.chair.conferences.new.page.prop_title_missing_required_fields"),
        description: t(
          "runtime.app.role.chair.conferences.new.page.prop_description_please_provide_at_least_the_conference",
        ),
        variant: "destructive",
      })
      return
    }

    if (isTemplateMode && !formData.title) {
      toast({
        title: t("runtime.app.role.chair.conferences.new.page.prop_title_missing_required_fields"),
        description: t(
          "runtime.components.chair.conference-template-sheet.text_template_name_required",
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
      if (isTemplateMode) {
        const payload = buildConferenceMutationPayload(formData)
        const response = await createConferenceConfigTemplate({
          name: formData.title,
          description: formData.description,
          payload: payload as any, // Cast to any because the shapes are consistent enough for templates
        })

        if (response.error || !response.data) {
          throw new Error(response.error || "Failed to create template")
        }

        toast({
          title: t("runtime.components.chair.conference-template-sheet.text_template_saved_title"),
          description: t(
            "runtime.components.chair.conference-template-sheet.text_template_saved_description",
          ),
        })

        router.push(ROUTES.CHAIR.CONFERENCES)
        return
      }

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
      lastSavedSignatureRef.current = getFormSignature()

      // After creating a new conference, invite reviewers added in the wizard
      if (!isEditMode && response.data?.id) {
        const reviewerOrganizers = formData.organizers.filter((o) => o.role === "reviewer" && o.id)
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
      isSubmitting={isSubmitting}
      canSubmit={isEditMode || isTemplateMode || formData.confirmed}
      onLogoClick={handleLogoClick}
      saveDraftLabel={
        isTemplateMode
          ? undefined
          : isEditMode
            ? t("runtime.components.wizard.creation.wizard-action-bar.text_save_changes")
            : undefined
      }
      submitLabel={
        isTemplateMode
          ? t("runtime.components.chair.conference-template-sheet.text_save_template")
          : isEditMode
            ? t("runtime.components.wizard.creation.wizard-action-bar.text_update_conference")
            : undefined
      }
      submittingLabel={
        isTemplateMode
          ? t("runtime.components.chair.conference-template-sheet.text_saving_template")
          : isEditMode
            ? t("runtime.components.wizard.creation.wizard-action-bar.text_updating")
            : undefined
      }
    >
      <div className="flex flex-col gap-4">
        {!isTemplateMode && (
          <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {t("runtime.components.chair.conference-form-page.text_open_templates")}
              </p>
              <p className="text-sm text-slate-600">
                {t("runtime.components.chair.conference-form-page.text_reuse_settings_description")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTemplateSheetOpen(true)}
              className="h-11 rounded-full border-slate-200 px-5 text-[#1B3C53] hover:border-slate-300 hover:bg-slate-50"
            >
              <Sparkles className="size-4" />
              {t("runtime.components.chair.conference-form-page.text_open_templates")}
            </Button>
          </div>
        )}

        {renderStepContent()}
      </div>

      <ConferenceTemplateSheet
        open={isTemplateSheetOpen}
        onOpenChange={setIsTemplateSheetOpen}
        formData={formData}
        onApply={updateFormData}
        currentConferenceId={conferenceId}
        allowSave={isEditMode}
      />

      {/* Discard Changes Modal */}
      <AlertDialog open={isDiscardModalOpen} onOpenChange={setIsDiscardModalOpen}>
        <AlertDialogContent className="max-w-[400px] rounded-[32px] border-none p-0 overflow-hidden shadow-2xl">
          <div className="bg-white dark:bg-slate-900">
            {/* Header with Icon */}
            <div className="px-6 pt-8 pb-4 flex flex-col items-center text-center">
              <div className="size-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                <AlertCircle className="size-7 text-amber-500" />
              </div>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  {t("runtime.components.chair.conference-form-page.text_unsaved_changes")}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-2">
                  {t(
                    "runtime.components.chair.conference-form-page.text_confirm_discard_changes_desc",
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>

            {/* Actions */}
            <div className="px-6 pb-8 pt-2 flex flex-col gap-2">
              <button
                onClick={async () => {
                  await handleSaveDraft()
                  setIsDiscardModalOpen(false)
                  if (pendingHref) router.push(pendingHref)
                }}
                className="w-full h-12 rounded-full bg-[#1B3C53] hover:bg-[#1B3C53]/90 text-white font-semibold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-slate-200/50 dark:shadow-none"
              >
                <Save className="size-4 opacity-70 group-hover:scale-110 transition-transform" />
                {t("runtime.components.wizard.creation.wizard-action-bar.text_save_changes")}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsDiscardModalOpen(false)
                    if (pendingHref) router.push(pendingHref)
                  }}
                  className="h-11 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors flex items-center justify-center gap-2 group"
                >
                  <LogOut className="size-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  {t("runtime.components.chair.conference-form-page.text_discard_changes")}
                </button>

                <AlertDialogCancel className="h-11 rounded-full border-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium m-0 transition-colors">
                  {t("runtime.common.cancel")}
                </AlertDialogCancel>
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </WizardLayout>
  )
}
