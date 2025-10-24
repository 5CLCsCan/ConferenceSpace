"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  Edit,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react"
import type { Paper } from "@/lib/types"
import { formatDate, getStatusBadgeVariant } from "@/lib/utils"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PaperDetailViewProps {
  paper: Paper
}

export function PaperDetailView({ paper }: PaperDetailViewProps) {
  const hasReviews = paper.reviews.length > 0
  const avgScore = hasReviews
    ? paper.reviews.reduce((acc, r) => acc + r.overall_score, 0) / paper.reviews.length
    : 0

  // Prepare review scores data for visualization
  const reviewScoresData = hasReviews
    ? [
        { category: "Overall", score: avgScore },
        {
          category: "Novelty",
          score: paper.reviews.reduce((acc, r) => acc + r.novelty, 0) / paper.reviews.length,
        },
        {
          category: "Technical",
          score:
            paper.reviews.reduce((acc, r) => acc + r.technical_quality, 0) / paper.reviews.length,
        },
        {
          category: "Clarity",
          score: paper.reviews.reduce((acc, r) => acc + r.clarity, 0) / paper.reviews.length,
        },
        {
          category: "Relevance",
          score: paper.reviews.reduce((acc, r) => acc + r.relevance, 0) / paper.reviews.length,
        },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Paper Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant={getStatusBadgeVariant(paper.status)}>
                  {paper.status.replace("_", " ")}
                </Badge>
                <Badge variant="outline">Version {paper.version}</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-4">{paper.title}</h1>
              <p className="text-muted-foreground mb-4">{paper.abstract}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>Submitted {formatDate(paper.submitted_at)}</span>
                <span>•</span>
                <span>Last updated {formatDate(paper.updated_at)}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {paper.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="size-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Download className="size-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Timeline</CardTitle>
          <CardDescription>Track your paper progress through the review process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TimelineItem
              icon={CheckCircle2}
              title="Paper Submitted"
              date={formatDate(paper.submitted_at)}
              status="completed"
            />
            <TimelineItem
              icon={paper.status === "under_review" ? Clock : CheckCircle2}
              title="Under Review"
              date={paper.status === "under_review" ? "In progress" : "Completed"}
              status={paper.status === "under_review" ? "in-progress" : "completed"}
            />
            <TimelineItem
              icon={AlertCircle}
              title="Decision Notification"
              date="Pending"
              status={
                paper.status === "accepted" || paper.status === "rejected" ? "completed" : "pending"
              }
            />
            <TimelineItem
              icon={FileText}
              title="Camera Ready"
              date="Pending"
              status={paper.status === "camera_ready" ? "completed" : "pending"}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="reviews">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reviews">Reviews ({paper.reviews.length})</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="authors">Authors</TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6 mt-6">
          {hasReviews ? (
            <>
              {/* Review Summary */}
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle>Review Summary</CardTitle>
                  <CardDescription>Aggregate scores from all reviewers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-center mb-4">
                        <div className="text-5xl font-bold mb-2">{avgScore.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Average Overall Score</div>
                      </div>
                      <Progress value={(avgScore / 5) * 100} className="h-3" />
                    </div>

                    <ChartContainer
                      config={{
                        score: {
                          label: "Score",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[200px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reviewScoresData}>
                          <XAxis
                            dataKey="category"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                          />
                          <YAxis
                            domain={[0, 5]}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                            {reviewScoresData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.score >= 4
                                    ? "hsl(var(--chart-1))"
                                    : entry.score >= 3
                                      ? "hsl(var(--chart-2))"
                                      : "hsl(var(--chart-3))"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Reviews */}
              {paper.reviews.map((review, index) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Review #{index + 1}</CardTitle>
                      <Badge variant="secondary">Score: {review.overall_score}/5</Badge>
                    </div>
                    {review.submitted_at && (
                      <CardDescription>Submitted {formatDate(review.submitted_at)}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Review Scores */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Novelty</span>
                          <span className="font-medium">{review.novelty}/5</span>
                        </div>
                        <Progress value={(review.novelty / 5) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Technical Quality</span>
                          <span className="font-medium">{review.technical_quality}/5</span>
                        </div>
                        <Progress value={(review.technical_quality / 5) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Clarity</span>
                          <span className="font-medium">{review.clarity}/5</span>
                        </div>
                        <Progress value={(review.clarity / 5) * 100} className="h-2" />
                      </div>
                    </div>

                    {/* AI Analysis of Review */}
                    {review.ai_analysis && (
                      <Alert className="border-primary/50 bg-primary/5">
                        <Sparkles className="size-4" />
                        <AlertTitle>AI Analysis of This Review</AlertTitle>
                        <AlertDescription>
                          <div className="space-y-3 mt-3">
                            <div>
                              <div className="font-medium text-sm mb-2 flex items-center gap-2">
                                <TrendingUp className="size-4 text-success" />
                                Key Strengths Identified
                              </div>
                              <ul className="space-y-1">
                                {review.ai_analysis.key_strengths.map((strength, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="text-success mt-1">•</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="font-medium text-sm mb-2 flex items-center gap-2">
                                <TrendingDown className="size-4 text-warning" />
                                Key Weaknesses Identified
                              </div>
                              <ul className="space-y-1">
                                {review.ai_analysis.key_weaknesses.map((weakness, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="text-warning mt-1">•</span>
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Comments */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <MessageSquare className="size-4" />
                          Reviewer Comments
                        </h4>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">
                            {review.comments_to_authors}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline">Confidence: {review.confidence}/5</Badge>
                        <Badge variant="outline">
                          Recommendation: {review.recommendation.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Clock className="size-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                  <p className="text-muted-foreground">Your paper is waiting to be reviewed</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6 mt-6">
          {paper.ai_suggestions && (
            <>
              {/* Quality Assessment */}
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" />
                    <CardTitle>AI Quality Assessment</CardTitle>
                  </div>
                  <CardDescription>Automated analysis of your submission quality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Abstract Clarity</span>
                        <span className="font-medium">
                          {paper.ai_suggestions.quality_assessment.abstract_clarity}/5
                        </span>
                      </div>
                      <Progress
                        value={(paper.ai_suggestions.quality_assessment.abstract_clarity / 5) * 100}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Keyword Relevance</span>
                        <span className="font-medium">
                          {paper.ai_suggestions.quality_assessment.keyword_relevance}/5
                        </span>
                      </div>
                      <Progress
                        value={
                          (paper.ai_suggestions.quality_assessment.keyword_relevance / 5) * 100
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Title Effectiveness</span>
                        <span className="font-medium">
                          {paper.ai_suggestions.quality_assessment.title_effectiveness}/5
                        </span>
                      </div>
                      <Progress
                        value={
                          (paper.ai_suggestions.quality_assessment.title_effectiveness / 5) * 100
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-semibold mb-2">Suggestions</h4>
                    <ul className="space-y-2">
                      {paper.ai_suggestions.quality_assessment.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Track Recommendation */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-5" />
                    <CardTitle>Track Recommendation</CardTitle>
                  </div>
                  <CardDescription>AI-suggested conference track</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertTitle>
                      {paper.ai_suggestions.track_recommendation.track_name} (
                      {Math.round(paper.ai_suggestions.track_recommendation.confidence * 100)}%
                      confidence)
                    </AlertTitle>
                    <AlertDescription>
                      {paper.ai_suggestions.track_recommendation.reasoning}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Similar Papers */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="size-5" />
                    <CardTitle>Similar Published Papers</CardTitle>
                  </div>
                  <CardDescription>Related work for reference</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {paper.ai_suggestions.similar_papers.map((similar) => (
                    <div key={similar.id} className="p-4 border border-border rounded-lg">
                      <div className="font-medium mb-1">{similar.title}</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {similar.authors.join(", ")} • {similar.venue} {similar.year}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {Math.round(similar.similarity_score * 100)}% similar
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{similar.relevance}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recommended Reviewers */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="size-5" />
                    <CardTitle>Suggested Reviewers</CardTitle>
                  </div>
                  <CardDescription>AI-matched experts for your paper</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {paper.ai_suggestions.recommended_reviewers.map((reviewer) => (
                    <div key={reviewer.user_id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{reviewer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {reviewer.affiliation}
                          </div>
                        </div>
                        <Badge variant="secondary">{reviewer.expertise_match}% match</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{reviewer.reasoning}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{reviewer.past_reviews} past reviews</span>
                        <span>•</span>
                        <span>Avg quality: {reviewer.avg_review_quality}/5</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {reviewer.availability} availability
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Authors Tab */}
        <TabsContent value="authors" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Author Information</CardTitle>
              <CardDescription>List of authors for this paper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paper.authors.map((author) => (
                <div
                  key={author.user_id}
                  className="flex items-start justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{author.name}</div>
                    <div className="text-sm text-muted-foreground">{author.affiliation}</div>
                    <div className="text-sm text-muted-foreground">{author.email}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline">Order: {author.order}</Badge>
                    {author.is_corresponding && <Badge variant="secondary">Corresponding</Badge>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TimelineItem({
  icon: Icon,
  title,
  date,
  status,
}: {
  icon: any
  title: string
  date: string
  status: "completed" | "in-progress" | "pending"
}) {
  const statusConfig = {
    completed: "text-success bg-success/10",
    "in-progress": "text-warning bg-warning/10",
    pending: "text-muted-foreground bg-muted",
  }

  return (
    <div className="flex items-start gap-4">
      <div className={`p-2 rounded-lg ${statusConfig[status]}`}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{date}</div>
      </div>
    </div>
  )
}
