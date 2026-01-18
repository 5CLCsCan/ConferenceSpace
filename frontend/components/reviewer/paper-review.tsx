"use client"

import { useState, useEffect } from "react"
import { useSWRConfig } from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sparkles,
  Download,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ArrowLeft,
  Users,
  MessageSquare,
  Reply,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Paper } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/translation-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import { typography, spacing, iconSizes } from "@/lib/typography"
import useAssignmentReview from "@/hooks/use-assignment-review"
import { useSearchParams } from "next/navigation"
import type { ReviewData } from "@/lib/api/reviews"
import { DiscussionThreadList } from "@/components/discussion"

interface PaperReviewProps {
  paper: Paper
  onBack: () => void
  onReviewSubmitted?: () => void // Callback để cập nhật dashboard
  readOnly?: boolean
  assignmentId?: string // Assignment ID for saving reviews
}

// Mock data for rebuttal (to be replaced with real API)
const mockRebuttal = {
  author: "Sam Author",
  timestamp: "4 hours ago",
  content:
    "Thank you for your valuable feedback. We'd like to address the concerns regarding novelty. Our work differs from prior art (e.g., NeurIPS 2024) in its unique application of cross-attention mechanisms, which results in a 15% efficiency gain on the benchmarked tasks. We have updated Section 3.2 to highlight this distinction more clearly and added a new ablation study in Appendix A.",
}

export function PaperReview({
  paper,
  onBack,
  onReviewSubmitted,
  readOnly = false,
  assignmentId,
}: PaperReviewProps) {
  const { t } = useTranslation()
  const { mutate: globalMutate } = useSWRConfig()

  // Use assignmentId prop if provided, otherwise fall back to paper.id
  const actualAssignmentId = assignmentId || paper.id

  const {
    review,
    loading: loadingReview,
    saving: savingReview,
    error: reviewError,
    saveReview,
  } = useAssignmentReview(paper.conference_id, actualAssignmentId)

  // Track review status ("draft" | "submitted")
  const [reviewStatus, setReviewStatus] = useState<string>("")
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"draft" | "submit" | "error" | "">("")
  const [modalMessage, setModalMessage] = useState<string>("")

  const [activeTab, setActiveTab] = useState<"review" | "discussion" | "rebuttal">("review")
  const [originality, setOriginality] = useState([5])
  const [technicalQuality, setTechnicalQuality] = useState([5])
  const [clarity, setClarity] = useState([5])
  const [significance, setSignificance] = useState([5])
  const [methodology, setMethodology] = useState([5])
  const [strengths, setStrengths] = useState("")
  const [weaknesses, setWeaknesses] = useState("")
  const [questions, setQuestions] = useState("")
  const [recommendation, setRecommendation] = useState<
    | "strong_accept"
    | "accept"
    | "weak_accept"
    | "borderline"
    | "weak_reject"
    | "reject"
    | "strong_reject"
    | ""
  >("")
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | "">("")
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)

  // Prefill form when review data is loaded
  useEffect(() => {
    if (review?.review_data) {
      const data = review.review_data
      setOriginality([data.criteria.originality || 5])
      setTechnicalQuality([data.criteria.technical_quality || 5])
      setClarity([data.criteria.clarity || 5])
      setSignificance([data.criteria.significance || 5])
      setMethodology([data.criteria.methodology || 5])
      setStrengths(data.feedback.strengths || "")
      setWeaknesses(data.feedback.weaknesses || "")
      setQuestions(data.feedback.questions || "")
      setRecommendation(data.recommendation || "")
      setConfidence(data.confidence || "")
    }
    if (review?.review_status) {
      setReviewStatus(review.review_status)
    }
  }, [review])

  const strengthsWordCount = strengths.trim().split(/\s+/).filter(Boolean).length

  const handleGetAIAnalysis = () => {
    setShowAIAnalysis(true)
  }

  const handleSaveDraft = async () => {
    if (reviewStatus === "submitted") {
      setModalType("error")
      setModalMessage(t("review.form.error.alreadySubmitted"))
      setModalOpen(true)
      return
    }
    if (!actualAssignmentId) {
      setModalType("error")
      setModalMessage(t("review.form.validation.missingAssignmentDescription"))
      setModalOpen(true)
      return
    }
    // Calculate average score
    const avgScore =
      (originality[0] + technicalQuality[0] + clarity[0] + significance[0] + methodology[0]) / 5
    // Always provide valid temp data for required fields when saving draft
    const reviewData: ReviewData = {
      criteria: {
        originality: originality[0] || 5,
        technical_quality: technicalQuality[0] || 5,
        clarity: clarity[0] || 5,
        significance: significance[0] || 5,
        methodology: methodology[0] || 5,
      },
      feedback: {
        strengths: strengths || "(Draft) To be filled.",
        weaknesses: weaknesses || "(Draft) To be filled.",
        questions: questions || "(Draft) To be filled.",
      },
      recommendation: (recommendation as any) || "borderline",
      confidence: (confidence as any) || "medium",
    }
    setModalType("")
    setModalOpen(false)
    const result = await saveReview({
      assignment_id: parseInt(actualAssignmentId, 10),
      conference_id: parseInt(paper.conference_id, 10),
      review_score: avgScore,
      review_data: reviewData,
      status: "draft",
    })
    if (result.success) {
      setReviewStatus("draft")
      setModalType("draft")
      setModalMessage(t("review.form.success.saveDraftDescription"))
      setModalOpen(true)
      // Cập nhật cache SWR để UI tự động refresh cho tất cả các tab
      await globalMutate(
        (key) =>
          Array.isArray(key) && (key[0] === "conference-papers" || key[0] === "reviewer-dashboard"),
      )
      toast({
        title: t("review.form.success.saveDraft"),
        description: t("review.form.success.saveDraftDescription"),
      })
      if (onReviewSubmitted) await onReviewSubmitted()
    } else {
      setModalType("error")
      setModalMessage(result.error || t("review.form.error.saveDraftDescription"))
      setModalOpen(true)
    }
  }

  const handleSubmitReview = async () => {
    if (!actualAssignmentId) {
      setModalType("error")
      setModalMessage(t("review.form.validation.missingAssignmentDescription"))
      setModalOpen(true)
      return
    }
    // Validation for submit - all fields required
    if (!recommendation) {
      setModalType("error")
      setModalMessage(t("review.form.validation.recommendationRequiredDescription"))
      setModalOpen(true)
      return
    }
    if (!confidence) {
      setModalType("error")
      setModalMessage(t("review.form.validation.confidenceRequiredDescription"))
      setModalOpen(true)
      return
    }
    if (strengthsWordCount < 10) {
      setModalType("error")
      setModalMessage(t("review.form.validation.strengthsTooShortDescription"))
      setModalOpen(true)
      return
    }
    if (!weaknesses.trim()) {
      setModalType("error")
      setModalMessage(t("review.form.validation.weaknessesRequired"))
      setModalOpen(true)
      return
    }
    if (!questions.trim()) {
      setModalType("error")
      setModalMessage(t("review.form.validation.questionsRequired"))
      setModalOpen(true)
      return
    }
    // Calculate average score
    const avgScore =
      (originality[0] + technicalQuality[0] + clarity[0] + significance[0] + methodology[0]) / 5
    const reviewData: ReviewData = {
      criteria: {
        originality: originality[0],
        technical_quality: technicalQuality[0],
        clarity: clarity[0],
        significance: significance[0],
        methodology: methodology[0],
      },
      feedback: {
        strengths: strengths,
        weaknesses: weaknesses,
        questions: questions,
      },
      recommendation: recommendation as any,
      confidence: confidence as any,
    }
    setModalType("")
    setModalOpen(false)
    const result = await saveReview({
      assignment_id: parseInt(actualAssignmentId, 10),
      conference_id: parseInt(paper.conference_id, 10),
      review_score: avgScore,
      review_data: reviewData,
      status: "submitted",
    })
    if (result.success) {
      setReviewStatus("submitted")
      setModalType("submit")
      setModalMessage(t("review.form.success.submitReviewDescription"))
      setModalOpen(true)
      // Cập nhật cache SWR để UI tự động refresh cho tất cả các tab
      await globalMutate(
        (key) =>
          Array.isArray(key) && (key[0] === "conference-papers" || key[0] === "reviewer-dashboard"),
      )
      toast({
        title: t("review.form.success.submitReview"),
        description: t("review.form.success.submitReviewDescription"),
      })
      if (onReviewSubmitted) await onReviewSubmitted()
    } else {
      setModalType("error")
      setModalMessage(result.error || t("review.form.error.submitReviewDescription"))
      setModalOpen(true)
    }
  }

  const handleModifyReview = () => {
    setActiveTab("review")
    toast({
      title: t("review.form.rebuttal.modifyReviewStarted"),
      description: t("review.form.rebuttal.modifyReviewStartedDescription"),
    })
  }

  const aiAnalysis = {
    strengths: [
      t("dashboard.roles.reviewer.review.ai.strengths.strength1"),
      t("dashboard.roles.reviewer.review.ai.strengths.strength2"),
      t("dashboard.roles.reviewer.review.ai.strengths.strength3"),
    ],
    weaknesses: [
      t("dashboard.roles.reviewer.review.ai.weaknesses.weakness1"),
      t("dashboard.roles.reviewer.review.ai.weaknesses.weakness2"),
      t("dashboard.roles.reviewer.review.ai.weaknesses.weakness3"),
    ],
    suggestedQuestions: [
      t("dashboard.roles.reviewer.review.ai.questions.question1"),
      t("dashboard.roles.reviewer.review.ai.questions.question2"),
      t("dashboard.roles.reviewer.review.ai.questions.question3"),
    ],
    consistencyCheck: {
      score: 0.85,
    },
  }

  return (
    <div className={spacing.subsection}>
      {/* Modal for feedback */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalType === "draft" && t("review.form.success.saveDraft")}
              {modalType === "submit" && t("review.form.success.submitReview")}
              {modalType === "error" && t("common.messages.error")}
            </DialogTitle>
            <DialogDescription>{modalMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setModalOpen(false)}>{t("common.actions.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={`flex items-center ${spacing.gap.md}`}>
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className={iconSizes.sm} />
        </Button>
        <h1 className={`${typography.h3} ${typography.semibold}`}>
          {t("review.form.reviewing")}: {paper.title}
        </h1>
        {reviewStatus === "submitted" && (
          <Badge variant="success" className="ml-4">
            {t("dashboard.roles.reviewer.todo.status.submitted")}
          </Badge>
        )}
        {reviewStatus === "draft" && (
          <Badge variant="secondary" className="ml-4">
            {t("dashboard.roles.reviewer.todo.status.draft")}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="review">
            <MessageSquare className={`${iconSizes.sm} mr-2`} />
            {t("review.form.tabs.review")}
          </TabsTrigger>
          <TabsTrigger value="discussion">
            <Users className={`${iconSizes.sm} mr-2`} />
            {t("review.form.tabs.discussion")}
          </TabsTrigger>
          <TabsTrigger value="rebuttal">
            <Reply className={`${iconSizes.sm} mr-2`} />
            {t("review.form.tabs.rebuttal")}
          </TabsTrigger>
        </TabsList>

        {/* REVIEW TAB */}
        <TabsContent value="review" className={`${spacing.subsection} mt-6`}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className={`${typography.h2} mb-3`}>{paper.title}</CardTitle>
                  <CardDescription className={typography.bodyLarge}>
                    {paper.abstract}
                  </CardDescription>
                  <div
                    className={`flex items-center ${spacing.gap.md} mt-4 ${typography.body} text-muted-foreground`}
                  >
                    <span>
                      {t("review.form.submittedOn", {
                        date: formatDate(paper.submitted_at),
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      {t("review.form.version", {
                        version: paper.version,
                      })}
                    </span>
                  </div>
                  <div className={`flex items-center ${spacing.gap.sm} flex-wrap mt-4`}>
                    {paper.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" className={`${spacing.gap.sm} bg-transparent`}>
                  <Download className={iconSizes.sm} />
                  {t("review.form.downloadPDF")}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {!showAIAnalysis && (
            <Button
              onClick={handleGetAIAnalysis}
              variant="outline"
              className="w-full bg-transparent"
              size="lg"
            >
              <Sparkles className={`${iconSizes.sm} mr-2`} />
              {t("review.form.ai.getAssistance")}
            </Button>
          )}

          {showAIAnalysis && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <div className={`flex items-center ${spacing.gap.sm}`}>
                  <Sparkles className={`${iconSizes.md} text-primary`} />
                  <CardTitle className={typography.h4}>{t("review.form.ai.title")}</CardTitle>
                </div>
                <CardDescription className={typography.body}>
                  {t("review.form.ai.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className={spacing.subsection}>
                <div>
                  <div className={`flex items-center ${spacing.gap.sm} mb-3`}>
                    <TrendingUp className={`${iconSizes.sm} text-success`} />
                    <h4 className={typography.semibold}>
                      {t("dashboard.roles.reviewer.review.ai.keyStrengths")}
                    </h4>
                  </div>
                  <ul className={spacing.item}>
                    {aiAnalysis.strengths.map((strength, i) => (
                      <li
                        key={i}
                        className={`${typography.body} flex items-start ${spacing.gap.sm}`}
                      >
                        <span className="text-success mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className={`flex items-center ${spacing.gap.sm} mb-3`}>
                    <TrendingDown className={`${iconSizes.sm} text-warning`} />
                    <h4 className={typography.semibold}>
                      {t("dashboard.roles.reviewer.review.ai.areasForImprovement")}
                    </h4>
                  </div>
                  <ul className={spacing.item}>
                    {aiAnalysis.weaknesses.map((weakness, i) => (
                      <li
                        key={i}
                        className={`${typography.body} flex items-start ${spacing.gap.sm}`}
                      >
                        <span className="text-warning mt-1">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className={`flex items-center ${spacing.gap.sm} mb-3`}>
                    <Lightbulb className={`${iconSizes.sm} text-info`} />
                    <h4 className={typography.semibold}>
                      {t("dashboard.roles.reviewer.review.ai.suggestedQuestions")}
                    </h4>
                  </div>
                  <ul className={spacing.item}>
                    {aiAnalysis.suggestedQuestions.map((question, i) => (
                      <li
                        key={i}
                        className={`${typography.body} flex items-start ${spacing.gap.sm}`}
                      >
                        <span className="text-info mt-1">•</span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("review.form.scores.title")}</CardTitle>
              <CardDescription>{t("review.form.scores.description")}</CardDescription>
            </CardHeader>
            <CardContent className={spacing.section}>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${spacing.gap.lg}`}>
                {/* Originality */}
                <div className={spacing.gap.md}>
                  <div className="flex items-center justify-between">
                    <Label className={typography.label}>
                      {t("review.form.scores.originality")}
                    </Label>
                    <Badge variant="secondary" className={typography.bodySmall}>
                      {originality[0]}/10
                    </Badge>
                  </div>
                  {readOnly ? (
                    <Slider value={originality} min={1} max={10} step={1} disabled />
                  ) : (
                    <Slider
                      value={originality}
                      onValueChange={setOriginality}
                      min={1}
                      max={10}
                      step={1}
                    />
                  )}
                </div>
                {/* Technical Quality */}
                <div className={spacing.gap.md}>
                  <div className="flex items-center justify-between">
                    <Label className={typography.label}>
                      {t("review.form.scores.technicalQuality")}
                    </Label>
                    <Badge variant="secondary" className={typography.bodySmall}>
                      {technicalQuality[0]}/10
                    </Badge>
                  </div>
                  {readOnly ? (
                    <Slider value={technicalQuality} min={1} max={10} step={1} disabled />
                  ) : (
                    <Slider
                      value={technicalQuality}
                      onValueChange={setTechnicalQuality}
                      min={1}
                      max={10}
                      step={1}
                    />
                  )}
                </div>
                {/* Clarity */}
                <div className={spacing.gap.md}>
                  <div className="flex items-center justify-between">
                    <Label className={typography.label}>{t("review.form.scores.clarity")}</Label>
                    <Badge variant="secondary" className={typography.bodySmall}>
                      {clarity[0]}/10
                    </Badge>
                  </div>
                  {readOnly ? (
                    <Slider value={clarity} min={1} max={10} step={1} disabled />
                  ) : (
                    <Slider value={clarity} onValueChange={setClarity} min={1} max={10} step={1} />
                  )}
                </div>
                {/* Significance */}
                <div className={spacing.gap.md}>
                  <div className="flex items-center justify-between">
                    <Label className={typography.label}>
                      {t("review.form.scores.significance")}
                    </Label>
                    <Badge variant="secondary" className={typography.bodySmall}>
                      {significance[0]}/10
                    </Badge>
                  </div>
                  {readOnly ? (
                    <Slider value={significance} min={1} max={10} step={1} disabled />
                  ) : (
                    <Slider
                      value={significance}
                      onValueChange={setSignificance}
                      min={1}
                      max={10}
                      step={1}
                    />
                  )}
                </div>
                {/* Methodology */}
                <div className={spacing.gap.md}>
                  <div className="flex items-center justify-between">
                    <Label className={typography.label}>
                      {t("review.form.scores.methodology")}
                    </Label>
                    <Badge variant="secondary" className={typography.bodySmall}>
                      {methodology[0]}/10
                    </Badge>
                  </div>
                  {readOnly ? (
                    <Slider value={methodology} min={1} max={10} step={1} disabled />
                  ) : (
                    <Slider
                      value={methodology}
                      onValueChange={setMethodology}
                      min={1}
                      max={10}
                      step={1}
                    />
                  )}
                </div>
              </div>
              {showAIAnalysis && (
                <Alert>
                  <AlertCircle className="size-4" />
                  <AlertTitle>
                    {t("dashboard.roles.reviewer.review.ai.consistencyCheck")}
                  </AlertTitle>
                  <AlertDescription>
                    {t(
                      aiAnalysis.consistencyCheck.score >= 0.8
                        ? "dashboard.roles.reviewer.review.ai.consistencyAligned"
                        : "dashboard.roles.reviewer.review.ai.consistencyInconsistent",
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("review.form.feedback.title")}</CardTitle>
              <CardDescription>{t("review.form.feedback.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="authors">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="authors">
                    {t("dashboard.roles.reviewer.review.comments.toAuthors.title")}
                  </TabsTrigger>
                  <TabsTrigger value="pc">
                    {t("dashboard.roles.reviewer.review.comments.toPC.title")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="authors" className={`${spacing.subsection} mt-6`}>
                  <div className={spacing.item}>
                    <Label htmlFor="strengths">
                      {t("review.form.feedback.strengths")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    {readOnly ? (
                      <div className="bg-muted/50 rounded px-3 py-2 min-h-[3rem] text-muted-foreground whitespace-pre-line">
                        {strengths}
                      </div>
                    ) : (
                      <Textarea
                        id="strengths"
                        placeholder={t("review.form.feedback.strengthsPlaceholder")}
                        rows={6}
                        value={strengths}
                        onChange={(e) => setStrengths(e.target.value)}
                        className={
                          strengthsWordCount > 0 && strengthsWordCount < 10
                            ? "border-destructive"
                            : ""
                        }
                      />
                    )}
                    <p className={`${typography.bodySmall} text-muted-foreground`}>
                      {t("dashboard.roles.reviewer.review.comments.wordCount", {
                        count: strengthsWordCount,
                      })}
                    </p>
                    {strengths.trim() && strengthsWordCount < 10 && !readOnly && (
                      <p className="text-destructive text-sm mt-2">
                        {t("review.form.validation.strengthsTooShortDescription")} (Hiện tại:{" "}
                        {strengthsWordCount} từ, yêu cầu tối thiểu 10 từ)
                      </p>
                    )}
                  </div>
                  <div className={spacing.item}>
                    <Label htmlFor="weaknesses">
                      {t("review.form.feedback.weaknesses")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    {readOnly ? (
                      <div className="bg-muted/50 rounded px-3 py-2 min-h-[3rem] text-muted-foreground whitespace-pre-line">
                        {weaknesses}
                      </div>
                    ) : (
                      <Textarea
                        id="weaknesses"
                        placeholder={t("review.form.feedback.weaknessesPlaceholder")}
                        rows={6}
                        value={weaknesses}
                        onChange={(e) => setWeaknesses(e.target.value)}
                      />
                    )}
                  </div>
                  <div className={spacing.item}>
                    <Label htmlFor="questions">
                      {t("review.form.feedback.questions")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    {readOnly ? (
                      <div className="bg-muted/50 rounded px-3 py-2 min-h-[2.5rem] text-muted-foreground whitespace-pre-line">
                        {questions}
                      </div>
                    ) : (
                      <Textarea
                        id="questions"
                        placeholder={t("review.form.feedback.questionsPlaceholder")}
                        rows={4}
                        value={questions}
                        onChange={(e) => setQuestions(e.target.value)}
                      />
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="pc" className={`${spacing.subsection} mt-6`}>
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t("dashboard.roles.reviewer.review.comments.toPC.comingSoon")}</p>
                    <p className="text-sm mt-2">
                      {t("dashboard.roles.reviewer.review.comments.toPC.comingSoonDescription")}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("review.form.recommendation.title")} <span className="text-destructive">*</span>
              </CardTitle>
              <CardDescription>{t("review.form.recommendation.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {readOnly ? (
                <div className="bg-muted/50 rounded px-3 py-2 min-h-[2.5rem] text-muted-foreground">
                  {recommendation ? (
                    t(`review.form.recommendation.options.${recommendation}`)
                  ) : (
                    <span className="italic">{t("review.form.recommendation.placeholder")}</span>
                  )}
                </div>
              ) : (
                <Select value={recommendation} onValueChange={(v) => setRecommendation(v as any)}>
                  <SelectTrigger className={!recommendation ? "border-destructive" : ""}>
                    <SelectValue placeholder={t("review.form.recommendation.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong_accept">
                      {t("review.form.recommendation.options.strong_accept")}
                    </SelectItem>
                    <SelectItem value="accept">
                      {t("review.form.recommendation.options.accept")}
                    </SelectItem>
                    <SelectItem value="weak_accept">
                      {t("review.form.recommendation.options.weak_accept")}
                    </SelectItem>
                    <SelectItem value="borderline">
                      {t("review.form.recommendation.options.borderline")}
                    </SelectItem>
                    <SelectItem value="weak_reject">
                      {t("review.form.recommendation.options.weak_reject")}
                    </SelectItem>
                    <SelectItem value="reject">
                      {t("review.form.recommendation.options.reject")}
                    </SelectItem>
                    <SelectItem value="strong_reject">
                      {t("review.form.recommendation.options.strong_reject")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("review.form.confidence.title")} <span className="text-destructive">*</span>
              </CardTitle>
              <CardDescription>{t("review.form.confidence.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {readOnly ? (
                <div className="bg-muted/50 rounded px-3 py-2 min-h-[2.5rem] text-muted-foreground">
                  {confidence ? (
                    t(`review.form.confidence.options.${confidence}`)
                  ) : (
                    <span className="italic">{t("review.form.confidence.placeholder")}</span>
                  )}
                </div>
              ) : (
                <Select value={confidence} onValueChange={(v) => setConfidence(v as any)}>
                  <SelectTrigger className={!confidence ? "border-destructive" : ""}>
                    <SelectValue placeholder={t("review.form.confidence.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">{t("review.form.confidence.options.high")}</SelectItem>
                    <SelectItem value="medium">
                      {t("review.form.confidence.options.medium")}
                    </SelectItem>
                    <SelectItem value="low">{t("review.form.confidence.options.low")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {!readOnly && (
            <div className={`flex ${spacing.gap.md}`}>
              {reviewStatus !== "submitted" && (
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={handleSaveDraft}
                  disabled={savingReview}
                >
                  {savingReview
                    ? t("review.form.actions.saving")
                    : t("review.form.actions.saveDraft")}
                </Button>
              )}
              <Button
                className="flex-1"
                size="lg"
                onClick={handleSubmitReview}
                disabled={
                  savingReview ||
                  !recommendation ||
                  !confidence ||
                  strengthsWordCount < 10 ||
                  !weaknesses.trim() ||
                  !questions.trim() ||
                  reviewStatus === "submitted"
                }
              >
                {savingReview
                  ? t("review.form.actions.submitting")
                  : t("review.form.actions.submitReview")}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* DISCUSSION TAB */}
        <TabsContent value="discussion" className="mt-6">
          <DiscussionThreadList
            conferenceId={Number(paper.conference_id)}
            submissionId={Number(paper.id)}
            canCreateThread={true}
            userRole="reviewer"
          />
        </TabsContent>

        {/* REBUTTAL TAB */}
        <TabsContent value="rebuttal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("review.form.rebuttal.title")}</CardTitle>
              <CardDescription>{t("review.form.rebuttal.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {mockRebuttal ? (
                <div className={spacing.subsection}>
                  <div
                    className={`flex items-start ${spacing.gap.md} ${spacing.padding.card} border rounded-lg bg-muted/50`}
                  >
                    <Avatar>
                      <AvatarFallback>{mockRebuttal.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={typography.semibold}>
                          {mockRebuttal.author} ({t("review.form.rebuttal.author")})
                        </p>
                        <p className={`${typography.bodySmall} text-muted-foreground`}>
                          {mockRebuttal.timestamp}
                        </p>
                      </div>
                      <p className={`${typography.body} mt-2 whitespace-pre-wrap`}>
                        {mockRebuttal.content}
                      </p>
                    </div>
                  </div>
                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertTitle>{t("review.form.rebuttal.actionRequired")}</AlertTitle>
                    <AlertDescription>
                      {t("review.form.rebuttal.actionDescription")}
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleModifyReview} className="w-full">
                    {t("review.form.rebuttal.modifyReview")}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{t("review.form.rebuttal.notAvailable")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
