"use client"

import { useEffect, useMemo, useState } from "react"

// Import from extracted modules
import { type ReviewFormData, type TabType, INITIAL_FORM_DATA } from "./submission-review/types"
import { MOCK_SUBMISSION } from "./submission-review/mock-data"
import { CriterionScoreCard, ScoreSummary } from "./submission-review/scoring-criteria"
import { ReviewHeaderBar, PaperHeader, TabNavigation } from "./submission-review/review-header"
import { AbstractCard, AIAssistantCard } from "./submission-review/review-sidebar"
import { DetailedFeedbackSection } from "./submission-review/detailed-feedback"
import { FinalRecommendationCard } from "./submission-review/recommendation-selector"
import { DiscussionTab } from "./submission-review/discussion-tab"
import { RebuttalTab } from "./submission-review/rebuttal-tab"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import useAssignmentReview from "@/hooks/use-assignment-review"
import type { Paper } from "@/lib/types"
import type { ReviewData } from "@/lib/api/reviews"

// =============================================================================
// MAIN COMPONENT: SubmissionReviewScreen
// =============================================================================

interface SubmissionReviewScreenProps {
  conferenceId: string
  assignmentId: string
  submissionId: string
  submission?: Paper | null
  onBack?: () => void
}

export function SubmissionReviewScreen({
  conferenceId,
  assignmentId,
  submissionId,
  submission: submissionFromApi,
  onBack,
}: SubmissionReviewScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>("review")
  const [formData, setFormData] = useState<ReviewFormData>(INITIAL_FORM_DATA)
  const [discussionCount] = useState(0)
  const { review, saving, saveReview } = useAssignmentReview(conferenceId, assignmentId)

  useEffect(() => {
    if (!review?.review_data) {
      return
    }

    const reviewData = review.review_data
    setFormData((prev) => ({
      ...prev,
      originality: reviewData.criteria.originality ?? prev.originality,
      technicalQuality: reviewData.criteria.technical_quality ?? prev.technicalQuality,
      clarity: reviewData.criteria.clarity ?? prev.clarity,
      significance: reviewData.criteria.significance ?? prev.significance,
      methodology: reviewData.criteria.methodology ?? prev.methodology,
      strengths: reviewData.feedback.strengths ?? prev.strengths,
      weaknesses: reviewData.feedback.weaknesses ?? prev.weaknesses,
      questions: reviewData.feedback.questions ?? prev.questions,
      recommendation: reviewData.recommendation ?? prev.recommendation,
      confidence:
        reviewData.confidence === "high" ? 5 : reviewData.confidence === "medium" ? 3 : 1,
      summary: reviewData.feedback.strengths ?? prev.summary,
    }))
  }, [review?.review_data])

  const submission = useMemo(
    () => ({
      ...MOCK_SUBMISSION,
      id: assignmentId,
      submissionId,
      title: submissionFromApi?.title || MOCK_SUBMISSION.title,
      abstract: submissionFromApi?.abstract || MOCK_SUBMISSION.abstract,
      keywords: submissionFromApi?.keywords || MOCK_SUBMISSION.keywords,
      track: submissionFromApi?.track_id || MOCK_SUBMISSION.track,
      conference: {
        ...MOCK_SUBMISSION.conference,
        id: conferenceId,
      },
    }),
    [assignmentId, conferenceId, submissionFromApi?.abstract, submissionFromApi?.keywords, submissionFromApi?.title, submissionFromApi?.track_id, submissionId],
  )

  const updateFormField = <K extends keyof ReviewFormData>(field: K, value: ReviewFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toReviewPayload = (status: "draft" | "submitted"): ReviewData & { status: "draft" | "submitted" } => {
    const confidenceValue = formData.confidence >= 4 ? "high" : formData.confidence >= 2 ? "medium" : "low"
    return {
      criteria: {
        originality: formData.originality,
        technical_quality: formData.technicalQuality,
        clarity: formData.clarity,
        significance: formData.significance,
        methodology: formData.methodology,
      },
      feedback: {
        strengths: formData.strengths || formData.summary || "",
        weaknesses: formData.weaknesses || "",
        questions: formData.questions || "",
      },
      recommendation: (formData.recommendation as ReviewData["recommendation"]) || "borderline",
      confidence: confidenceValue,
      status,
    }
  }

  const handleSaveDraft = async () => {
    const now = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    updateFormField("lastSaved", now)

    const payload = toReviewPayload("draft")
    const { success, error } = await saveReview({
      assignment_id: Number(assignmentId),
      conference_id: Number(conferenceId),
      review_score:
        (formData.originality +
          formData.technicalQuality +
          formData.clarity +
          formData.significance +
          formData.methodology) /
        5,
      review_data: payload,
      status: payload.status,
    })

    if (!success) {
      alert(error || "Failed to save draft")
    }
  }

  const handleSubmitReview = async () => {
    // Validation
    if (!formData.recommendation) {
      alert("Please select an overall rating before submitting.")
      return
    }
    if (!formData.summary.trim() || !formData.strengths.trim() || !formData.weaknesses.trim()) {
      alert("Please ensure the summary, strengths, and weaknesses are filled.")
      return
    }

    const payload = toReviewPayload("submitted")
    const { success, error } = await saveReview({
      assignment_id: Number(assignmentId),
      conference_id: Number(conferenceId),
      review_score:
        (formData.originality +
          formData.technicalQuality +
          formData.clarity +
          formData.significance +
          formData.methodology) /
        5,
      review_data: payload,
      status: payload.status,
    })

    if (!success) {
      alert(error || "Failed to submit review")
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
            Back
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
                <AIAssistantCard />
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
                      Scoring Criteria
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
                            Scoring Guide
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
                                <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                              </div>
                              <span className="text-[9px] text-slate-600">
                                8-10: Strong contribution, recommend
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                <span className="w-2 h-2 rounded-full bg-[#84cc16]" />
                                <span className="w-2 h-2 rounded-full bg-[#a3a3a3]" />
                              </div>
                              <span className="text-[9px] text-slate-600">
                                5-7: Acceptable with caveats
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                                <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                              </div>
                              <span className="text-[9px] text-slate-600">
                                1-4: Significant issues present
                              </span>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-slate-100">
                            <a
                              href="#"
                              className="text-[9px] text-[#2563eb] hover:underline font-medium"
                            >
                              View full reviewer guide &rarr;
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
                Last draft saved: {formData.lastSaved || "Not saved"}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {saving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={saving}
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
                  {saving ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab Content: Discussion */}
        {activeTab === "discussion" && <DiscussionTab />}

        {/* Tab Content: Rebuttal */}
        {activeTab === "rebuttal" && <RebuttalTab />}
      </main>
    </div>
  )
}
