"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
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

// Import from extracted modules
import {
  type ReviewFormData,
  type TabType,
  INITIAL_FORM_DATA,
  normalizeReviewScore,
} from "./submission-review/types"
import { CriterionScoreCard, ScoreSummary } from "./submission-review/scoring-criteria"
import { ReviewHeaderBar, PaperHeader, TabNavigation } from "./submission-review/review-header"
import { AbstractCard, AIAssistantCard } from "./submission-review/review-sidebar"
import { ReviewAuditPanel } from "./submission-review/review-audit-panel"
import { DetailedFeedbackSection } from "./submission-review/detailed-feedback"
import { FinalRecommendationCard } from "./submission-review/recommendation-selector"
import { DiscussionTab } from "./submission-review/discussion-tab"
import { RebuttalTab } from "./submission-review/rebuttal-tab"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import useAssignmentReview from "@/hooks/use-assignment-review"
import useReviewAudit from "@/hooks/use-review-audit"
import type { Paper } from "@/lib/types"
import type { ReviewAuditFinding, ReviewAuditResponse } from "@/lib/api/review-audit"
import type { ReviewData } from "@/lib/api/reviews"
import { useTranslation } from "@/lib/i18n/translation-context"

// =============================================================================
// MAIN COMPONENT: SubmissionReviewScreen
// =============================================================================

interface SubmissionReviewScreenProps {
  conferenceId: string
  assignmentId: string
  submissionId: string
  submission?: Paper | null
  initialTab?: TabType
  onBack?: () => void
}

export function SubmissionReviewScreen({
  conferenceId,
  assignmentId,
  submissionId,
  submission: submissionFromApi,
  initialTab = "review",
  onBack,
}: SubmissionReviewScreenProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [formData, setFormData] = useState<ReviewFormData>(INITIAL_FORM_DATA)
  const [discussionCount, setDiscussionCount] = useState(0)
  const [auditOverridePrompt, setAuditOverridePrompt] = useState<string | null>(null)
  const { review, saving, saveReview } = useAssignmentReview(conferenceId, assignmentId)
  const {
    audit,
    auditing,
    updatingDismissal,
    error: auditError,
    runAudit,
    dismissFinding,
    undismissFinding,
    replaceAudit,
  } = useReviewAudit(conferenceId, assignmentId)
  const { toast } = useToast()
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!review?.review_data || hasInitialized.current) {
      return
    }
    hasInitialized.current = true

    const reviewData = review.review_data
    const criteria = reviewData.criteria || {}
    const feedback = reviewData.feedback || {}
    setFormData((prev) => ({
      ...prev,
      originality: normalizeReviewScore(criteria.originality, prev.originality),
      technicalQuality: normalizeReviewScore(criteria.technical_quality, prev.technicalQuality),
      clarity: normalizeReviewScore(criteria.clarity, prev.clarity),
      significance: normalizeReviewScore(criteria.significance, prev.significance),
      methodology: normalizeReviewScore(criteria.methodology, prev.methodology),
      summary: feedback.summary ?? prev.summary,
      strengths: feedback.strengths ?? prev.strengths,
      weaknesses: feedback.weaknesses ?? prev.weaknesses,
      questions: feedback.questions ?? prev.questions,
      recommendation: reviewData.recommendation ?? prev.recommendation,
      confidence: reviewData.confidence === "high" ? 5 : reviewData.confidence === "medium" ? 3 : 1,
    }))
  }, [review?.review_data])

  const submission = useMemo(() => {
    return {
      id: assignmentId,
      submissionId,
      title: submissionFromApi?.title || `Submission #${submissionId}`,
      abstract: submissionFromApi?.abstract || "No abstract available.",
      keywords: submissionFromApi?.keywords || [],
      track: submissionFromApi?.track_id || "Unassigned",
      status: "under_review" as const,
      dueDate: "",
      daysLeft: 0,
      supplementaryMaterial: undefined,
      conference: {
        id: conferenceId,
        acronym: `CONF-${conferenceId}`,
        name: "Conference",
      },
    }
  }, [
    assignmentId,
    conferenceId,
    submissionFromApi?.abstract,
    submissionFromApi?.keywords,
    submissionFromApi?.title,
    submissionFromApi?.track_id,
    submissionId,
  ])

  const updateFormField = <K extends keyof ReviewFormData>(field: K, value: ReviewFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const reviewScore =
    (formData.originality +
      formData.technicalQuality +
      formData.clarity +
      formData.significance +
      formData.methodology) /
    5

  const toReviewPayload = (): ReviewData => {
    const confidenceValue =
      formData.confidence >= 4 ? "high" : formData.confidence >= 2 ? "medium" : "low"
    return {
      criteria: {
        originality: formData.originality,
        technical_quality: formData.technicalQuality,
        clarity: formData.clarity,
        significance: formData.significance,
        methodology: formData.methodology,
      },
      feedback: {
        summary: formData.summary,
        strengths: formData.strengths,
        weaknesses: formData.weaknesses,
        questions: formData.questions,
      },
      recommendation: (formData.recommendation as ReviewData["recommendation"]) || "borderline",
      confidence: confidenceValue,
    }
  }

  const parseReviewErrorDetail = (errorData: unknown) => {
    return (
      (
        errorData as {
          data?: {
            code?: string
            message?: string
            override_allowed?: boolean
            audit?: ReviewAuditResponse
          }
        }
      )?.data ?? null
    )
  }

  const handleSaveDraft = async () => {
    const payload = toReviewPayload()
    const auditResult = await runAudit({
      mode: "draft_save",
      review_score: reviewScore,
      review_data: payload,
    })

    const { success, error } = await saveReview({
      review_score: reviewScore,
      review_data: payload,
      status: "draft",
    })

    if (success) {
      const now = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      updateFormField("lastSaved", now)
      toast({
        title: "Draft saved",
        description:
          auditResult.success === false && auditResult.error
            ? `Draft saved at ${now}. Audit was unavailable this time.`
            : `Your review draft was saved at ${now}.`,
      })
    } else {
      toast({
        variant: "destructive",
        title: "Failed to save draft",
        description: error || "An unexpected error occurred. Please try again.",
      })
    }
  }

  const handleSubmitReview = async () => {
    // Validation
    if (!formData.recommendation) {
      toast({
        variant: "destructive",
        title: "Recommendation required",
        description: "Please select an overall rating before submitting.",
      })
      return
    }
    if (!formData.summary.trim() || !formData.strengths.trim() || !formData.weaknesses.trim()) {
      toast({
        variant: "destructive",
        title: "Incomplete review",
        description: "Please fill in the Summary, Strengths, and Weaknesses before submitting.",
      })
      return
    }

    const payload = toReviewPayload()
    const preflight = await runAudit({
      mode: "submit_preflight",
      review_score: reviewScore,
      review_data: payload,
    })
    if (preflight.success && preflight.data?.status === "block") {
      toast({
        variant: "destructive",
        title: "Submission blocked",
        description: "Resolve the active blocking audit findings before submitting.",
      })
      return
    }

    const { success, error, errorData } = await saveReview({
      review_score: reviewScore,
      review_data: payload,
      status: "submitted",
    })

    if (success) {
      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully.",
      })
    } else {
      const detail = parseReviewErrorDetail(errorData)
      if (detail?.code === "review_audit_blocked" && detail.audit) {
        replaceAudit(detail.audit)
        toast({
          variant: "destructive",
          title: "Submission blocked",
          description: "Resolve the active blocking audit findings before submitting.",
        })
        return
      }
      if (detail?.code === "review_audit_failed" && detail.override_allowed) {
        setAuditOverridePrompt(detail.message || "Review audit could not be completed.")
        return
      }
      toast({
        variant: "destructive",
        title: "Failed to submit review",
        description: error || "An unexpected error occurred. Please try again.",
      })
    }
  }

  const handleConfirmAuditOverride = async () => {
    const payload = toReviewPayload()
    const result = await saveReview({
      review_score: reviewScore,
      review_data: payload,
      status: "submitted",
      audit_failure_override_confirmed: true,
    })

    if (result.success) {
      setAuditOverridePrompt(null)
      toast({
        title: "Review submitted",
        description: "Your review was submitted without a completed audit check.",
      })
      return
    }

    toast({
      variant: "destructive",
      title: "Failed to submit review",
      description: result.error || "An unexpected error occurred. Please try again.",
    })
  }

  const handleDismissFinding = async (
    code: "dismiss" | "undismiss",
    finding: ReviewAuditFinding,
  ) => {
    const result =
      code === "dismiss" ? await dismissFinding(finding) : await undismissFinding(finding)
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Failed to update audit finding",
        description: result.error || "An unexpected error occurred. Please try again.",
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f7f7]">
      {/* Top Header Bar */}
      <ReviewHeaderBar submission={submission} />

      {onBack && (
        <div className="px-4 md:px-8 xl:px-12 pt-4">
          <button
            type="button"
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
            onClick={onBack}
          >
            {t("runtime.components.reviewer.submission-review.text_back")}{" "}
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 xl:px-12 py-8 max-w-[1600px] mx-auto w-full">
        {/* Paper Header Section */}
        <PaperHeader submission={submission} />

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          discussionCount={discussionCount}
        />

        {/* Tab Content: Review Form */}
        {activeTab === "review" && (
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            {/* Upper Section: Abstract + Guide/Actionable (75/25) */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
              {/* Abstract Card - 75% */}
              <div className="xl:col-span-3">
                <AbstractCard submission={submission} />
              </div>

              {/* Guide/Actionable Cards - 25% */}
              <div className="xl:col-span-1 space-y-4">
                <AIAssistantCard
                  conferenceId={conferenceId}
                  assignmentId={assignmentId}
                  submissionId={submission.submissionId}
                  submissionTitle={submission.title}
                />
              </div>
            </div>

            {/* Lower Section: Review Form (50/50) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
              {/* Scoring Criteria - Left 50% */}
              <div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mt-3 mb-3 border-b border-slate-100 pb-2">
                    <h2 className="font-bold text-sm text-[#1B3C53] tracking-tight uppercase leading-none">
                      {t(
                        "runtime.components.reviewer.submission-review.text_scoring_criteria",
                      )}{" "}
                    </h2>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <span
                            className="material-symbols-outlined leading-none"
                            style={{
                              fontSize: "16px",
                              width: "16px",
                              height: "16px",
                              maxWidth: "16px",
                              maxHeight: "16px",
                              minWidth: "16px",
                              minHeight: "16px",
                              lineHeight: "1",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transform: "none",
                              boxSizing: "border-box",
                            }}
                          >
                            info
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="bg-white text-slate-900 border border-slate-200 shadow-lg p-4 max-w-[280px]"
                        sideOffset={8}
                      >
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t(
                              "runtime.components.reviewer.submission-review.text_scoring_guide",
                            )}{" "}
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
                                <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                              </div>
                              <span className="text-[9px] text-slate-600">
                                {t(
                                  "runtime.components.reviewer.submission-review.text_8_10_strong_contribution_recommend",
                                )}{" "}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                <span className="w-2 h-2 rounded-full bg-[#84cc16]" />
                                <span className="w-2 h-2 rounded-full bg-[#a3a3a3]" />
                              </div>
                              <span className="text-[9px] text-slate-600">
                                {t(
                                  "runtime.components.reviewer.submission-review.text_5_7_acceptable_with_caveats",
                                )}{" "}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                                <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                              </div>
                              <span className="text-[9px] text-slate-600">
                                {t(
                                  "runtime.components.reviewer.submission-review.text_1_4_significant_issues_present",
                                )}{" "}
                              </span>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-slate-100">
                            <a
                              href="#"
                              className="text-[9px] text-[#2563eb] hover:underline font-medium"
                            >
                              {t(
                                "runtime.components.reviewer.submission-review.text_view_full_reviewer_guide_rarr",
                              )}{" "}
                            </a>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Score Summary */}
                  <ScoreSummary
                    scores={{
                      originality: formData.originality,
                      technicalQuality: formData.technicalQuality,
                      clarity: formData.clarity,
                      significance: formData.significance,
                      methodology: formData.methodology,
                    }}
                  />

                  {/* Individual Criteria Cards */}
                  <div className="space-y-3">
                    <CriterionScoreCard
                      criterionKey="originality"
                      label="Originality"
                      value={formData.originality}
                      onChange={(v) => updateFormField("originality", v)}
                    />
                    <CriterionScoreCard
                      criterionKey="technicalQuality"
                      label="Technical Quality"
                      value={formData.technicalQuality}
                      onChange={(v) => updateFormField("technicalQuality", v)}
                    />
                    <CriterionScoreCard
                      criterionKey="clarity"
                      label="Clarity"
                      value={formData.clarity}
                      onChange={(v) => updateFormField("clarity", v)}
                    />
                    <CriterionScoreCard
                      criterionKey="significance"
                      label="Significance"
                      value={formData.significance}
                      onChange={(v) => updateFormField("significance", v)}
                    />
                    <CriterionScoreCard
                      criterionKey="methodology"
                      label="Methodology"
                      value={formData.methodology}
                      onChange={(v) => updateFormField("methodology", v)}
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Feedback - Right 50% */}
              <DetailedFeedbackSection
                summary={formData.summary}
                strengths={formData.strengths}
                weaknesses={formData.weaknesses}
                questions={formData.questions}
                onSummaryChange={(v) => updateFormField("summary", v)}
                onStrengthsChange={(v) => updateFormField("strengths", v)}
                onWeaknessesChange={(v) => updateFormField("weaknesses", v)}
                onQuestionsChange={(v) => updateFormField("questions", v)}
              />
            </div>

            {/* Final Recommendation - Full Width */}
            <FinalRecommendationCard
              recommendation={formData.recommendation}
              confidence={formData.confidence}
              onRecommendationChange={(v) => updateFormField("recommendation", v)}
              onConfidenceChange={(v) => updateFormField("confidence", v)}
              averageScore={
                (formData.originality +
                  formData.technicalQuality +
                  formData.clarity +
                  formData.significance +
                  formData.methodology) /
                5
              }
              isComplete={
                !!formData.recommendation &&
                !!formData.summary.trim() &&
                !!formData.strengths.trim() &&
                !!formData.weaknesses.trim()
              }
            />

            <ReviewAuditPanel
              audit={audit}
              auditing={auditing}
              updatingDismissal={updatingDismissal}
              error={auditError}
              onDismiss={(finding) => handleDismissFinding("dismiss", finding)}
              onUndismiss={(finding) => handleDismissFinding("undismiss", finding)}
            />

            {/* Sticky Action Bar */}
            <div className="sticky bottom-6 z-20 flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-lg shadow-sm mt-8">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "16px",
                    width: "16px",
                    height: "16px",
                    maxWidth: "16px",
                    maxHeight: "16px",
                    minWidth: "16px",
                    minHeight: "16px",
                    lineHeight: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transform: "none",
                    boxSizing: "border-box",
                  }}
                >
                  schedule
                </span>
                {t("runtime.components.reviewer.submission-review.text_last_draft_saved")}{" "}
                {formData.lastSaved || "Not saved"}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving || auditing}
                  className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {saving || auditing ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={saving || auditing}
                  className="h-8 px-3 rounded-md bg-[#1B3C53] dark:bg-white hover:bg-[#234C6A] dark:hover:bg-slate-200 text-white dark:text-[#1B3C53] font-medium text-[11px] shadow-sm transition-all flex items-center gap-2"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "16px",
                      width: "16px",
                      height: "16px",
                      maxWidth: "16px",
                      maxHeight: "16px",
                      minWidth: "16px",
                      minHeight: "16px",
                      lineHeight: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transform: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    send
                  </span>
                  {saving || auditing ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab Content: Discussion */}
        {activeTab === "discussion" && (
          <DiscussionTab
            conferenceId={conferenceId}
            submissionId={submissionId}
            assignmentId={assignmentId}
            onThreadCountChange={setDiscussionCount}
          />
        )}

        {/* Tab Content: Rebuttal */}
        {activeTab === "rebuttal" && (
          <RebuttalTab
            conferenceId={conferenceId}
            submissionId={submissionId}
            assignmentId={assignmentId}
          />
        )}
      </main>

      <AlertDialog
        open={!!auditOverridePrompt}
        onOpenChange={(open) => !open && setAuditOverridePrompt(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit without completed audit?</AlertDialogTitle>
            <AlertDialogDescription>
              {auditOverridePrompt ||
                "The review audit workflow failed to complete. You can still submit, but this override will be logged."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAuditOverride}>
              Submit anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
