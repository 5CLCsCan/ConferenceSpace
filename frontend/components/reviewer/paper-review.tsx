"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { typography, spacing, iconSizes } from "@/lib/typography"

// Giả lập API
interface ApiResponse {
  success: boolean
}

async function saveDraftReview(paperId: string, reviewData: any): Promise<ApiResponse> {
  return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
}

async function submitReview(paperId: string, reviewData: any): Promise<ApiResponse> {
  return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
}

interface PaperReviewProps {
  paper: Paper
  onBack: () => void
  onReviewSubmitted?: () => void // Callback để cập nhật dashboard
}

// Mock data for discussion and rebuttal (giữ nguyên)
const mockDiscussion = [
  {
    id: 1,
    user: { name: "Alex Ray", avatar: "/avatars/01.png" },
    comment:
      "I'm leaning towards acceptance, but the novelty is a bit borderline. The experimental setup is solid though. What are your thoughts?",
    timestamp: "2 days ago",
  },
  {
    id: 2,
    user: { name: "Jordan Lee", avatar: "/avatars/02.png" },
    comment:
      "I agree, Alex. The technical quality is high, but I've seen similar approaches in last year's NeurIPS. I've asked the authors to clarify the key differences in my review.",
    timestamp: "1 day ago",
  },
]

const mockRebuttal = {
  author: "Sam Author",
  timestamp: "4 hours ago",
  content:
    "Thank you for your valuable feedback. We'd like to address the concerns regarding novelty. Our work differs from prior art (e.g., NeurIPS 2024) in its unique application of cross-attention mechanisms, which results in a 15% efficiency gain on the benchmarked tasks. We have updated Section 3.2 to highlight this distinction more clearly and added a new ablation study in Appendix A.",
}

export function PaperReview({ paper, onBack, onReviewSubmitted }: PaperReviewProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"review" | "discussion" | "rebuttal">("review")
  const [overallScore, setOverallScore] = useState([3])
  const [confidence, setConfidence] = useState([3])
  const [novelty, setNovelty] = useState([3])
  const [technicalQuality, setTechnicalQuality] = useState([3])
  const [clarity, setClarity] = useState([3])
  const [relevance, setRelevance] = useState([3])
  const [commentsToAuthors, setCommentsToAuthors] = useState("")
  const [commentsToPC, setCommentsToPC] = useState("")
  const [recommendation, setRecommendation] = useState("")
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [discussionMessage, setDiscussionMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGetAIAnalysis = () => {
    setShowAIAnalysis(true)
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      const reviewData = {
        overallScore: overallScore[0],
        confidence: confidence[0],
        novelty: novelty[0],
        technicalQuality: technicalQuality[0],
        clarity: clarity[0],
        relevance: relevance[0],
        commentsToAuthors,
        commentsToPC,
        recommendation,
      }
      const response = await saveDraftReview(paper.id, reviewData)
      if (response.success) {
        toast({
          title: t("dashboard.roles.reviewer.review.saveDraftSuccess"),
          description: t("dashboard.roles.reviewer.review.saveDraftDescription"),
        })
      } else {
        toast({
          title: t("dashboard.roles.reviewer.review.saveDraftFailed"),
          description: t("dashboard.roles.reviewer.review.saveDraftFailedDescription"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("dashboard.roles.reviewer.review.saveDraftFailed"),
        description: t("dashboard.roles.reviewer.review.saveDraftFailedDescription"),
        variant: "destructive",
      })
    }
    setIsSaving(false)
  }

  const handleSubmitReview = async () => {
    if (!recommendation) {
      toast({
        title: t("dashboard.roles.reviewer.review.recommendationRequired"),
        description: t("dashboard.roles.reviewer.review.recommendationRequiredDescription"),
        variant: "destructive",
      })
      return
    }
    if (commentsToAuthors.trim().length < 50) {
      toast({
        title: t("dashboard.roles.reviewer.review.commentsTooShort"),
        description: t("dashboard.roles.reviewer.review.commentsTooShortDescription"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const reviewData = {
        overallScore: overallScore[0],
        confidence: confidence[0],
        novelty: novelty[0],
        technicalQuality: technicalQuality[0],
        clarity: clarity[0],
        relevance: relevance[0],
        commentsToAuthors,
        commentsToPC,
        recommendation,
      }
      const response = await submitReview(paper.id, reviewData)
      if (response.success) {
        toast({
          title: t("dashboard.roles.reviewer.review.submitSuccess"),
          description: t("dashboard.roles.reviewer.review.submitSuccessDescription"),
        })
        onReviewSubmitted?.()
      } else {
        toast({
          title: t("dashboard.roles.reviewer.review.submitFailed"),
          description: t("dashboard.roles.reviewer.review.submitFailedDescription"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("dashboard.roles.reviewer.review.submitFailed"),
        description: t("dashboard.roles.reviewer.review.submitFailedDescription"),
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const handleModifyReview = () => {
    setActiveTab("review")
    toast({
      title: t("dashboard.roles.reviewer.review.rebuttal.modifyReviewStarted"),
      description: t("dashboard.roles.reviewer.review.rebuttal.modifyReviewStartedDescription"),
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
      <div className={`flex items-center ${spacing.gap.md}`}>
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className={iconSizes.sm} />
        </Button>
        <h1 className={`${typography.h3} ${typography.semibold}`}>
          {t("dashboard.roles.reviewer.review.reviewing")}: {paper.title}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="review">
            <MessageSquare className={`${iconSizes.sm} mr-2`} />
            {t("dashboard.roles.reviewer.review.tabs.review")}
          </TabsTrigger>
          <TabsTrigger value="discussion">
            <Users className={`${iconSizes.sm} mr-2`} />
            {t("dashboard.roles.reviewer.review.tabs.discussion")}
          </TabsTrigger>
          <TabsTrigger value="rebuttal">
            <Reply className={`${iconSizes.sm} mr-2`} />
            {t("dashboard.roles.reviewer.review.tabs.rebuttal")}
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
                      {t("dashboard.roles.reviewer.review.submittedOn", {
                        date: formatDate(paper.submitted_at),
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      {t("dashboard.roles.reviewer.review.version", {
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
                  {t("dashboard.roles.reviewer.review.downloadPDF")}
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
              {t("dashboard.roles.reviewer.review.ai.getAssistance")}
            </Button>
          )}

          {showAIAnalysis && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <div className={`flex items-center ${spacing.gap.sm}`}>
                  <Sparkles className={`${iconSizes.md} text-primary`} />
                  <CardTitle className={typography.h4}>
                    {t("dashboard.roles.reviewer.review.ai.title")}
                  </CardTitle>
                </div>
                <CardDescription className={typography.body}>
                  {t("dashboard.roles.reviewer.review.ai.description")}
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
              <CardTitle>{t("dashboard.roles.reviewer.review.scores.title")}</CardTitle>
              <CardDescription>
                {t("dashboard.roles.reviewer.review.scores.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className={spacing.section}>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${spacing.gap.lg}`}>
                <div className={spacing.gap.md}>
                  <div className="flex items-center justify-between">
                    <Label className={typography.label}>
                      {t("dashboard.roles.reviewer.review.scores.overallScore")}
                    </Label>
                    <Badge variant="secondary" className={typography.bodySmall}>
                      {overallScore[0]}/5
                    </Badge>
                  </div>
                  <Slider
                    value={overallScore}
                    onValueChange={setOverallScore}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
                <div className={spacing.gap.md}>
                  <div className="flex items-center justify-between">
                    <Label className={typography.label}>
                      {t("dashboard.roles.reviewer.review.scores.confidence")}
                    </Label>
                    <Badge variant="secondary" className={typography.bodySmall}>
                      {confidence[0]}/5
                    </Badge>
                  </div>
                  <Slider
                    value={confidence}
                    onValueChange={setConfidence}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
                <div className={spacing.gap.md}>
                  <div className="flex items-center justify-between">
                    <Label className={typography.label}>
                      {t("dashboard.roles.reviewer.review.scores.novelty")}
                    </Label>
                    <Badge variant="secondary" className={typography.bodySmall}>
                      {novelty[0]}/5
                    </Badge>
                  </div>
                  <Slider value={novelty} onValueChange={setNovelty} min={1} max={5} step={1} />
                </div>
                <div className={spacing.gap.md}>
                  <div className="flex items-center justify-between">
                    <Label className={typography.label}>
                      {t("dashboard.roles.reviewer.review.scores.technicalQuality")}
                    </Label>
                    <Badge variant="secondary" className={typography.bodySmall}>
                      {technicalQuality[0]}/5
                    </Badge>
                  </div>
                  <Slider
                    value={technicalQuality}
                    onValueChange={setTechnicalQuality}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
                <div className={spacing.gap.md}>
                  <div className="flex items-center justify-between">
                    <Label className={typography.label}>
                      {t("dashboard.roles.reviewer.review.scores.clarity")}
                    </Label>
                    <Badge variant="secondary" className={typography.bodySmall}>
                      {clarity[0]}/5
                    </Badge>
                  </div>
                  <Slider value={clarity} onValueChange={setClarity} min={1} max={5} step={1} />
                </div>
                <div className={spacing.gap.md}>
                  <div className="flex items-center justify-between">
                    <Label className={typography.label}>
                      {t("dashboard.roles.reviewer.review.scores.relevance")}
                    </Label>
                    <Badge variant="secondary" className={typography.bodySmall}>
                      {relevance[0]}/5
                    </Badge>
                  </div>
                  <Slider value={relevance} onValueChange={setRelevance} min={1} max={5} step={1} />
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
              <CardTitle>{t("dashboard.roles.reviewer.review.comments.title")}</CardTitle>
              <CardDescription>
                {t("dashboard.roles.reviewer.review.comments.description")}
              </CardDescription>
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
                    <Label htmlFor="comments-authors">
                      {t("dashboard.roles.reviewer.review.comments.toAuthors.label")}
                    </Label>
                    <Textarea
                      id="comments-authors"
                      placeholder={t(
                        "dashboard.roles.reviewer.review.comments.toAuthors.placeholder",
                      )}
                      rows={12}
                      value={commentsToAuthors}
                      onChange={(e) => setCommentsToAuthors(e.target.value)}
                    />
                    <p className={`${typography.bodySmall} text-muted-foreground`}>
                      {t("dashboard.roles.reviewer.review.comments.wordCount", {
                        count: commentsToAuthors.split(/\s+/).filter(Boolean).length,
                      })}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="pc" className={`${spacing.subsection} mt-6`}>
                  <div className={spacing.item}>
                    <Label htmlFor="comments-pc">
                      {t("dashboard.roles.reviewer.review.comments.toPC.label")}
                    </Label>
                    <Textarea
                      id="comments-pc"
                      placeholder={t("dashboard.roles.reviewer.review.comments.toPC.placeholder")}
                      rows={12}
                      value={commentsToPC}
                      onChange={(e) => setCommentsToPC(e.target.value)}
                    />
                    <p className={`${typography.bodySmall} text-muted-foreground`}>
                      {t("dashboard.roles.reviewer.review.comments.wordCount", {
                        count: commentsToPC.split(/\s+/).filter(Boolean).length,
                      })}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.roles.reviewer.review.recommendation.title")}</CardTitle>
              <CardDescription>
                {t("dashboard.roles.reviewer.review.recommendation.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={recommendation} onValueChange={setRecommendation}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("dashboard.roles.reviewer.review.recommendation.placeholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accept">
                    {t("dashboard.roles.reviewer.review.recommendation.options.accept")}
                  </SelectItem>
                  <SelectItem value="minor_revision">
                    {t("dashboard.roles.reviewer.review.recommendation.options.minor")}
                  </SelectItem>
                  <SelectItem value="major_revision">
                    {t("dashboard.roles.reviewer.review.recommendation.options.major")}
                  </SelectItem>
                  <SelectItem value="reject">
                    {t("dashboard.roles.reviewer.review.recommendation.options.reject")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className={`flex ${spacing.gap.md}`}>
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              {isSaving
                ? t("dashboard.roles.reviewer.review.saving")
                : t("dashboard.roles.reviewer.review.saveDraft")}
            </Button>
            <Button
              className="flex-1"
              size="lg"
              onClick={handleSubmitReview}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("dashboard.roles.reviewer.review.submitting")
                : t("dashboard.roles.reviewer.review.submitReview")}
            </Button>
          </div>
        </TabsContent>

        {/* DISCUSSION TAB */}
        <TabsContent value="discussion" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.roles.reviewer.review.discussion.title")}</CardTitle>
              <CardDescription>
                {t("dashboard.roles.reviewer.review.discussion.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className={spacing.subsection}>
              <div className={spacing.subsection}>
                {mockDiscussion.map((msg) => (
                  <div key={msg.id} className={`flex items-start ${spacing.gap.md}`}>
                    <Avatar>
                      <AvatarImage src={msg.user.avatar} />
                      <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={typography.semibold}>{msg.user.name}</p>
                        <p className={`${typography.bodySmall} text-muted-foreground`}>
                          {msg.timestamp}
                        </p>
                      </div>
                      <p className={`${typography.body} text-muted-foreground`}>{msg.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`flex items-center ${spacing.gap.sm} pt-4 border-t`}>
                <Avatar>
                  <AvatarImage src="/avatars/03.png" />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <Input
                  placeholder={t("dashboard.roles.reviewer.review.discussion.placeholder")}
                  value={discussionMessage}
                  onChange={(e) => setDiscussionMessage(e.target.value)}
                />
                <Button>{t("dashboard.roles.reviewer.review.discussion.send")}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REBUTTAL TAB */}
        <TabsContent value="rebuttal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.roles.reviewer.review.rebuttal.title")}</CardTitle>
              <CardDescription>
                {t("dashboard.roles.reviewer.review.rebuttal.description")}
              </CardDescription>
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
                          {mockRebuttal.author} (
                          {t("dashboard.roles.reviewer.review.rebuttal.author")})
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
                    <AlertTitle>
                      {t("dashboard.roles.reviewer.review.rebuttal.actionRequired")}
                    </AlertTitle>
                    <AlertDescription>
                      {t("dashboard.roles.reviewer.review.rebuttal.actionDescription")}
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleModifyReview} className="w-full">
                    {t("dashboard.roles.reviewer.review.rebuttal.modifyReview")}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {t("dashboard.roles.reviewer.review.rebuttal.notAvailable")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
