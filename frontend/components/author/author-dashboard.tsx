"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp, Sparkles } from "lucide-react"
import { mockConference, getPapersByUser } from "@/lib/mock-data"
import { formatDate, daysUntilDeadline, getStatusBadgeVariant } from "@/lib/utils"
import Link from "next/link"
import type { Paper } from "@/lib/types"

export function AuthorDashboard() {
  const currentUserId = "user-1"
  const userPapers = getPapersByUser(currentUserId)

  const stats = {
    total: userPapers.length,
    submitted: userPapers.filter((p) => p.status === "submitted" || p.status === "under_review").length,
    accepted: userPapers.filter((p) => p.status === "accepted").length,
    inReview: userPapers.filter((p) => p.status === "under_review").length,
  }

  return (
    <div className="space-y-8">
      {/* Conference Info Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{mockConference.name}</h2>
              <p className="text-muted-foreground mb-4">{mockConference.description}</p>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Submission Deadline: </span>
                  <span className="font-medium">{formatDate(mockConference.submission_deadline)}</span>
                  <Badge variant="outline" className="ml-2">
                    {daysUntilDeadline(mockConference.submission_deadline)} days left
                  </Badge>
                </div>
              </div>
            </div>
            <Button asChild>
              <Link href="/author/submit">
                <Plus className="size-4 mr-2" />
                Submit New Paper
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Papers</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Papers List */}
      <Card>
        <CardHeader>
          <CardTitle>My Papers</CardTitle>
          <CardDescription>Manage and track your paper submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Papers</TabsTrigger>
              <TabsTrigger value="in_review">Under Review</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {userPapers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </TabsContent>

            <TabsContent value="in_review" className="space-y-4 mt-6">
              {userPapers
                .filter((p) => p.status === "under_review")
                .map((paper) => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-4 mt-6">
              {userPapers
                .filter((p) => p.status === "accepted")
                .map((paper) => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function PaperCard({ paper }: { paper: Paper }) {
  const statusIcons = {
    draft: AlertCircle,
    submitted: Clock,
    under_review: Clock,
    revision_requested: AlertCircle,
    accepted: CheckCircle2,
    rejected: XCircle,
    camera_ready: CheckCircle2,
  }

  const StatusIcon = statusIcons[paper.status]

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <StatusIcon className="size-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <Link href={`/author/papers/${paper.id}`} className="hover:underline">
                  <h3 className="font-semibold text-lg mb-2">{paper.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{paper.abstract}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Submitted {formatDate(paper.submitted_at)}</span>
                  <span>•</span>
                  <span>Version {paper.version}</span>
                  {paper.reviews.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{paper.reviews.length} reviews</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getStatusBadgeVariant(paper.status)}>{paper.status.replace("_", " ")}</Badge>
              {paper.keywords.slice(0, 3).map((keyword) => (
                <Badge key={keyword} variant="outline">
                  {keyword}
                </Badge>
              ))}
              {paper.ai_suggestions && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="size-3" />
                  AI Insights Available
                </Badge>
              )}
            </div>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href={`/author/papers/${paper.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
