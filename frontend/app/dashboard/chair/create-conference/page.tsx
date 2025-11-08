"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ConferenceDetailsStep } from "@/components/wizard/conference-details-step"
import { TopicsSubmissionsStep } from "@/components/wizard/topics-submissions-step"
import { OrganizersStep } from "@/components/wizard/organizers-step"
import { ReviewStep } from "@/components/wizard/review-step"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createConference } from "@/lib/api/conferences"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/translation-context"

export type ConferenceFormData = {
  // Step 1: Conference Details
  title: string
  acronym: string
  description: string
  website: string
  dateRange: { from: Date | undefined; to: Date | undefined }
  locationType: "in-person" | "virtual" | "hybrid"
  venue: string
  contactEmail: string

  // Step 2: Topics & Submissions
  submissionsOpen: Date | undefined
  submissionDeadline: Date | undefined
  reviewDeadline: Date | undefined
  authorNotification: Date | undefined
  cameraReadyDeadline: Date | undefined
  topics: string[]
  anonymity: "single-blind" | "double-blind"
  fileFormats: string[]
  submissionGuidelines: string

  // Step 3: Organizers
  organizers: Array<{
    id: string
    name: string
    email: string
    role: string
  }>

  // Step 4: Review
  confirmed: boolean
}

// STEPS will be defined inside component to use translations

export default function CreateConferencePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<ConferenceFormData>({
    title: "",
    acronym: "",
    description: "",
    website: "",
    dateRange: { from: undefined, to: undefined },
    locationType: "in-person",
    venue: "",
    contactEmail: "",
    submissionsOpen: undefined,
    submissionDeadline: undefined,
    reviewDeadline: undefined,
    authorNotification: undefined,
    cameraReadyDeadline: undefined,
    topics: [],
    anonymity: "double-blind",
    fileFormats: ["PDF"],
    submissionGuidelines: "",
    organizers: [
      {
        id: "1",
        name: "Current Admin",
        email: "admin@conferencehub.com",
        role: "General Chair",
      },
    ],
    confirmed: false,
  })

  const updateFormData = (data: Partial<ConferenceFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const STEPS = [
    {
      number: 1,
      title: t("dashboard.chair.createConference.steps.1.title"),
      description: t("dashboard.chair.createConference.steps.1.description"),
    },
    {
      number: 2,
      title: t("dashboard.chair.createConference.steps.2.title"),
      description: t("dashboard.chair.createConference.steps.2.description"),
    },
    {
      number: 3,
      title: t("dashboard.chair.createConference.steps.3.title"),
      description: t("dashboard.chair.createConference.steps.3.description"),
    },
    {
      number: 4,
      title: t("dashboard.chair.createConference.steps.4.title"),
      description: t("dashboard.chair.createConference.steps.4.description"),
    },
  ]

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleCreateConference = async () => {
    if (!formData.title || !formData.acronym || !formData.submissionDeadline) {
      toast({
        title: t("dashboard.chair.createConference.validationError"),
        description: t("dashboard.chair.createConference.validationDescription"),
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      // Transform form data to API format
      const conferenceData = {
        title: formData.title,
        acronym: formData.acronym,
        description: formData.description,
        domain: formData.topics, // Map topics to domain
        configurations: {
          start_date: formData.dateRange.from?.toISOString() || "",
          end_date: formData.dateRange.to?.toISOString() || "",
          abstract_submission_deadline: formData.submissionsOpen?.toISOString(),
          full_paper_submission_deadline: formData.submissionDeadline.toISOString(),
          camera_ready_deadline: formData.cameraReadyDeadline?.toISOString(),
          format: formData.locationType,
          review_type: formData.anonymity === "double-blind" ? "double-blind" : "single-blind",
          maximum_pages: 8, // Default value
          have_coi: true, // Default value
          submission_format: formData.fileFormats.join(", "),
          require_complete_author_profile: true, // Default value
          allow_paper_withdrawls: true, // Default value
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
    } catch (error) {
      toast({
        title: t("dashboard.chair.createConference.error"),
        description: t("dashboard.chair.createConference.errorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const progressPercentage = (currentStep / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            {t("dashboard.chair.createConference.title")}
          </h1>
          <p className="text-muted-foreground">{t("dashboard.chair.createConference.subtitle")}</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                      currentStep >= step.number
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-sm font-medium ${
                        currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      currentStep > step.number ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Form Content */}
        <Card className="p-6 md:p-8 mb-6">
          {currentStep === 1 && (
            <ConferenceDetailsStep data={formData} updateData={updateFormData} />
          )}
          {currentStep === 2 && (
            <TopicsSubmissionsStep data={formData} updateData={updateFormData} />
          )}
          {currentStep === 3 && <OrganizersStep data={formData} updateData={updateFormData} />}
          {currentStep === 4 && (
            <ReviewStep data={formData} updateData={updateFormData} goToStep={goToStep} />
          )}
        </Card>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious} className="gap-2 bg-transparent">
                <ChevronLeft className="w-4 h-4" />
                {t("common.actions.previous")}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} className="gap-2">
                {t("common.actions.nextStep")}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateConference}
                disabled={!formData.confirmed || isCreating}
                className="gap-2"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreating
                  ? t("common.actions.creating")
                  : t("dashboard.chair.createConference.confirmCreate")}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
