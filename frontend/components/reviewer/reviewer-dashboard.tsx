"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Sparkles,
  Calendar,
} from "lucide-react"
import { mockReviewAssignments, mockPapers, mockConference } from "@/lib/mock-data"
import { formatDate, daysUntilDeadline } from "@/lib/utils"
import Link from "next/link"
import type { ReviewAssignment, Paper } from "@/lib/types"

export function ReviewerDashboard() {
  const currentReviewerId = "user-2"
  const assignments = mockReviewAssignments.filter((a) => a.reviewer_id === currentReviewerId)

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    inProgress: assignments.filter((a) => a.status === "in_progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
  }

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Deadline Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Review Deadline Approaching</h2>
              <p className="text-muted-foreground mb-4">
                Complete your reviews before {formatDate(mockConference.review_deadline)}
              </p>
              <Badge variant="outline" className="gap-1">
                <Calendar className="size-3" />
                {daysUntilDeadline(mockConference.review_deadline)} days remaining
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-2">
                {stats.completed}/{stats.total}
              </div>
              <p className="text-sm text-muted-foreground">Reviews Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assigned
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <AlertCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Review Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>Track your review completion status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Completed Reviews</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
          <div className="grid md:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-destructive" />
              <div className="text-sm">
                <div className="font-medium">{stats.pending}</div>
                <div className="text-muted-foreground">Pending</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-warning" />
              <div className="text-sm">
                <div className="font-medium">{stats.inProgress}</div>
                <div className="text-muted-foreground">In Progress</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-success" />
              <div className="text-sm">
                <div className="font-medium">{stats.completed}</div>
                <div className="text-muted-foreground">Completed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Papers */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Papers</CardTitle>
          <CardDescription>Papers waiting for your review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignments.map((assignment) => {
            const paper = mockPapers.find((p) => p.id === assignment.paper_id)
            if (!paper) return null
            return <AssignedPaperCard key={assignment.id} assignment={assignment} paper={paper} />
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function AssignedPaperCard({ assignment, paper }: { assignment: ReviewAssignment; paper: Paper }) {
  const daysLeft = daysUntilDeadline(assignment.due_date)
  const isUrgent = daysLeft <= 7

  const statusConfig = {
    pending: {
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      label: "Not Started",
    },
    in_progress: {
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
      label: "In Progress",
    },
    completed: {
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
      label: "Completed",
    },
  }

  const config = statusConfig[assignment.status]
  const StatusIcon = config.icon

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <StatusIcon className={`size-5 ${config.color}`} />
              </div>
              <div className="flex-1">
                <Link href={`/reviewer/papers/${paper.id}`} className="hover:underline">
                  <h3 className="font-semibold text-lg mb-2">{paper.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{paper.abstract}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Due {formatDate(assignment.due_date)}</span>
                  {isUrgent && (
                    <>
                      <span>•</span>
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="size-3" />
                        {daysLeft} days left
                      </Badge>
                    </>
                  )}
                  {assignment.ai_match_score && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="size-3" />
                        {assignment.ai_match_score}% match
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={config.color}>
                {config.label}
              </Badge>
              {paper.keywords.slice(0, 3).map((keyword) => (
                <Badge key={keyword} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            variant={assignment.status === "completed" ? "outline" : "default"}
            size="sm"
            asChild
          >
            <Link href={`/reviewer/papers/${paper.id}`}>
              {assignment.status === "completed" ? "View Review" : "Start Review"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
