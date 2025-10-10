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
import { Sparkles, Download, AlertCircle, TrendingUp, TrendingDown, Lightbulb } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Paper } from "@/lib/types"
import { formatDate } from "@/lib/utils"

interface ReviewFormProps {
  paper: Paper
}

export function ReviewForm({ paper }: ReviewFormProps) {
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

  const handleGetAIAnalysis = () => {
    setShowAIAnalysis(true)
  }

  // Mock AI analysis
  const aiAnalysis = {
    strengths: [
      "Novel approach to transformer architecture optimization",
      "Comprehensive experimental evaluation across multiple datasets",
      "Clear presentation of methodology and results",
    ],
    weaknesses: [
      "Limited discussion of computational overhead in real-world scenarios",
      "Comparison with recent baseline methods could be more thorough",
      "Scalability concerns for larger models not fully addressed",
    ],
    suggestedQuestions: [
      "How does the approach perform on languages with different linguistic properties?",
      "What is the training time comparison with baseline methods?",
      "Can the method be extended to other transformer-based architectures?",
    ],
    consistencyCheck: {
      score: 0.85,
      message: "Your scores are generally consistent with typical reviews for papers of this quality.",
    },
  }

  return (
    <div className="space-y-6">
      {/* Paper Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-3">{paper.title}</CardTitle>
              <CardDescription className="text-base">{paper.abstract}</CardDescription>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span>Submitted {formatDate(paper.submitted_at)}</span>
                <span>•</span>
                <span>Version {paper.version}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-4">
                {paper.keywords.map((keyword) => (
                  <Badge key={keyword} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="size-4" />
              Download PDF
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* AI Analysis */}
      {!showAIAnalysis && (
        <Button onClick={handleGetAIAnalysis} variant="outline" className="w-full bg-transparent" size="lg">
          <Sparkles className="size-4 mr-2" />
          Get AI-Powered Review Assistance
        </Button>
      )}

      {showAIAnalysis && (
        <div className="space-y-4">
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <CardTitle className="text-lg">AI Analysis & Suggestions</CardTitle>
              </div>
              <CardDescription>AI-generated insights to help you write a comprehensive review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="size-4 text-success" />
                  <h4 className="font-semibold">Key Strengths</h4>
                </div>
                <ul className="space-y-2">
                  {aiAnalysis.strengths.map((strength, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-success mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="size-4 text-warning" />
                  <h4 className="font-semibold">Areas for Improvement</h4>
                </div>
                <ul className="space-y-2">
                  {aiAnalysis.weaknesses.map((weakness, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-warning mt-1">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="size-4 text-info" />
                  <h4 className="font-semibold">Suggested Questions for Authors</h4>
                </div>
                <ul className="space-y-2">
                  {aiAnalysis.suggestedQuestions.map((question, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-info mt-1">•</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>Review Scores</CardTitle>
          <CardDescription>Rate the paper on various criteria (1 = Poor, 5 = Excellent)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Overall Score</Label>
                <Badge variant="secondary">{overallScore[0]}/5</Badge>
              </div>
              <Slider value={overallScore} onValueChange={setOverallScore} min={1} max={5} step={1} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Confidence in Review</Label>
                <Badge variant="secondary">{confidence[0]}/5</Badge>
              </div>
              <Slider value={confidence} onValueChange={setConfidence} min={1} max={5} step={1} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Novelty</Label>
                <Badge variant="secondary">{novelty[0]}/5</Badge>
              </div>
              <Slider value={novelty} onValueChange={setNovelty} min={1} max={5} step={1} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Technical Quality</Label>
                <Badge variant="secondary">{technicalQuality[0]}/5</Badge>
              </div>
              <Slider value={technicalQuality} onValueChange={setTechnicalQuality} min={1} max={5} step={1} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Clarity of Presentation</Label>
                <Badge variant="secondary">{clarity[0]}/5</Badge>
              </div>
              <Slider value={clarity} onValueChange={setClarity} min={1} max={5} step={1} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Relevance to Conference</Label>
                <Badge variant="secondary">{relevance[0]}/5</Badge>
              </div>
              <Slider value={relevance} onValueChange={setRelevance} min={1} max={5} step={1} />
            </div>
          </div>

          {showAIAnalysis && (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Consistency Check</AlertTitle>
              <AlertDescription>
                Your scores are {aiAnalysis.consistencyCheck.score >= 0.8 ? "well-aligned" : "somewhat inconsistent"}{" "}
                with typical reviews. Consider if your ratings match your written feedback.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Review Comments</CardTitle>
          <CardDescription>Provide detailed feedback for the authors and program committee</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="authors">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="authors">Comments to Authors</TabsTrigger>
              <TabsTrigger value="pc">Comments to PC</TabsTrigger>
            </TabsList>

            <TabsContent value="authors" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="comments-authors">Detailed Feedback for Authors</Label>
                <Textarea
                  id="comments-authors"
                  placeholder="Provide constructive feedback on strengths, weaknesses, and suggestions for improvement..."
                  rows={12}
                  value={commentsToAuthors}
                  onChange={(e) => setCommentsToAuthors(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {commentsToAuthors.split(" ").filter(Boolean).length} words
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pc" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="comments-pc">Confidential Comments to Program Committee</Label>
                <Textarea
                  id="comments-pc"
                  placeholder="Share any concerns or additional context that should not be visible to authors..."
                  rows={12}
                  value={commentsToPC}
                  onChange={(e) => setCommentsToPC(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{commentsToPC.split(" ").filter(Boolean).length} words</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle>Final Recommendation</CardTitle>
          <CardDescription>Your recommendation for this paper</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={recommendation} onValueChange={setRecommendation}>
            <SelectTrigger>
              <SelectValue placeholder="Select your recommendation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="accept">Accept</SelectItem>
              <SelectItem value="minor_revision">Accept with Minor Revisions</SelectItem>
              <SelectItem value="major_revision">Major Revisions Required</SelectItem>
              <SelectItem value="reject">Reject</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 bg-transparent">
          Save Draft
        </Button>
        <Button className="flex-1" size="lg">
          Submit Review
        </Button>
      </div>
    </div>
  )
}
