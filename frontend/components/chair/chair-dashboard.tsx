"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Users, TrendingUp, Clock, BarChart3, Sparkles } from "lucide-react"
import { mockConferenceStats, mockPapers } from "@/lib/mock-data"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import Link from "next/link"

export function ChairDashboard() {
  const stats = mockConferenceStats

  // Prepare chart data
  const submissionTrendData = stats.submissions_over_time.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    submissions: item.count,
  }))

  const trackDistributionData = stats.submissions_by_track.map((item) => ({
    name: item.track,
    value: item.count,
  }))

  const reviewProgressData = [
    { name: "Completed", value: stats.review_progress.completed, color: "hsl(var(--chart-1))" },
    { name: "In Progress", value: stats.review_progress.in_progress, color: "hsl(var(--chart-2))" },
    { name: "Pending", value: stats.review_progress.pending, color: "hsl(var(--chart-3))" },
  ]

  const keywordData = stats.top_keywords.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Conference Overview</h1>
        <p className="text-muted-foreground">Monitor submissions, reviews, and make data-driven decisions</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_submissions}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all tracks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_reviews}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg {stats.avg_reviews_per_paper.toFixed(1)} per paper</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Acceptance Rate</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.acceptance_rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Target: 25-30%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Review Progress</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(
                (stats.review_progress.completed /
                  (stats.review_progress.completed +
                    stats.review_progress.in_progress +
                    stats.review_progress.pending)) *
                  100,
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.review_progress.completed} completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Submission Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Trend</CardTitle>
            <CardDescription>Papers submitted over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                submissions: {
                  label: "Submissions",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={submissionTrendData}>
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="submissions"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Review Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Review Progress</CardTitle>
            <CardDescription>Current status of all reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: {
                  label: "Completed",
                  color: "hsl(var(--chart-1))",
                },
                in_progress: {
                  label: "In Progress",
                  color: "hsl(var(--chart-2))",
                },
                pending: {
                  label: "Pending",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reviewProgressData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reviewProgressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Track Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions by Track</CardTitle>
            <CardDescription>Distribution across conference tracks</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Submissions",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trackDistributionData}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Trending Keywords</CardTitle>
            <CardDescription>Most common research topics</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Papers",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keywordData} layout="vertical">
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="keyword" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2 bg-transparent" asChild>
              <Link href="/chair/papers">
                <FileText className="size-5" />
                <div className="text-left">
                  <div className="font-semibold">Manage Papers</div>
                  <div className="text-xs text-muted-foreground">View and organize submissions</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2 bg-transparent" asChild>
              <Link href="/chair/reviewers">
                <Users className="size-5" />
                <div className="text-left">
                  <div className="font-semibold">Assign Reviewers</div>
                  <div className="text-xs text-muted-foreground">AI-powered matching</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-2 bg-transparent" asChild>
              <Link href="/chair/analytics">
                <BarChart3 className="size-5" />
                <div className="text-left">
                  <div className="font-semibold">Advanced Analytics</div>
                  <div className="text-xs text-muted-foreground">Deep insights and reports</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Papers</CardTitle>
          <CardDescription>Latest submissions requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="completed">Review Complete</TabsTrigger>
              <TabsTrigger value="decisions">Needs Decision</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 mt-6">
              {mockPapers
                .filter((p) => p.status === "submitted" || p.status === "under_review")
                .slice(0, 3)
                .map((paper) => (
                  <PaperStatusCard key={paper.id} paper={paper} />
                ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-6">
              {mockPapers
                .filter((p) => p.reviews.length > 0)
                .slice(0, 3)
                .map((paper) => (
                  <PaperStatusCard key={paper.id} paper={paper} />
                ))}
            </TabsContent>

            <TabsContent value="decisions" className="space-y-4 mt-6">
              {mockPapers
                .filter((p) => p.reviews.length >= 2)
                .slice(0, 3)
                .map((paper) => (
                  <PaperStatusCard key={paper.id} paper={paper} showDecisionButton />
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function PaperStatusCard({ paper, showDecisionButton }: { paper: any; showDecisionButton?: boolean }) {
  const reviewCount = paper.reviews.length
  const avgScore =
    reviewCount > 0 ? paper.reviews.reduce((acc: number, r: any) => acc + r.overall_score, 0) / reviewCount : 0

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div>
              <Link href={`/chair/papers/${paper.id}`} className="hover:underline">
                <h3 className="font-semibold text-lg mb-2">{paper.title}</h3>
              </Link>
              <p className="text-sm text-muted-foreground line-clamp-2">{paper.abstract}</p>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline">{paper.status.replace("_", " ")}</Badge>
              <span className="text-muted-foreground">{reviewCount} reviews</span>
              {avgScore > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">Avg score: {avgScore.toFixed(1)}/5</span>
                </>
              )}
              {paper.ai_suggestions && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="size-3" />
                    AI Insights
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/chair/papers/${paper.id}`}>View Details</Link>
            </Button>
            {showDecisionButton && (
              <Button size="sm" asChild>
                <Link href={`/chair/papers/${paper.id}/decision`}>Make Decision</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
