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
import { useTranslation } from "@/lib/i18n/translation-context"

export function ReviewerDashboard() {
  const { t } = useTranslation()
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
              <h2 className="text-2xl font-bold mb-2">{t("dashboard.reviewer.dashboard.deadlineApproaching")}</h2>
              <p className="text-muted-foreground mb-4">
                {t("dashboard.reviewer.dashboard.completeBefore")} {formatDate(mockConference.review_deadline)}
              </p>
              <Badge variant="outline" className="gap-1">
                <Calendar className="size-3" />
                {daysUntilDeadline(mockConference.review_deadline)} {t("dashboard.reviewer.dashboard.daysRemaining")}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-2">
                {stats.completed}/{stats.total}
              </div>
              <p className="text-sm text-muted-foreground">{t("dashboard.reviewer.dashboard.reviewsCompleted")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.reviewer.dashboard.totalAssigned")}
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.reviewer.dashboard.pending")}</CardTitle>
            <AlertCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.reviewer.dashboard.inProgress")}</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.reviewer.dashboard.completionRate")}
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
          <CardTitle>{t("dashboard.reviewer.dashboard.overallProgress")}</CardTitle>
          <CardDescription>{t("dashboard.reviewer.dashboard.trackCompletion")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t("dashboard.reviewer.dashboard.completedReviews")}</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
          <div className="grid md:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-destructive" />
              <div className="text-sm">
                <div className="font-medium">{stats.pending}</div>
                <div className="text-muted-foreground">{t("dashboard.reviewer.dashboard.pending")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-warning" />
              <div className="text-sm">
                <div className="font-medium">{stats.inProgress}</div>
                <div className="text-muted-foreground">{t("dashboard.reviewer.dashboard.inProgress")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-success" />
              <div className="text-sm">
                <div className="font-medium">{stats.completed}</div>
                <div className="text-muted-foreground">{t("dashboard.reviewer.dashboard.completed")}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Papers */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.reviewer.dashboard.assignedPapers")}</CardTitle>
          <CardDescription>{t("dashboard.reviewer.dashboard.papersWaiting")}</CardDescription>
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

  const { t } = useTranslation()
  
  const statusConfig = {
    pending: {
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      label: t("dashboard.reviewer.dashboard.notStarted"),
    },
    in_progress: {
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
      label: t("dashboard.reviewer.dashboard.inProgress"),
    },
    completed: {
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
      label: t("dashboard.reviewer.dashboard.completed"),
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
                  <span>{t("dashboard.reviewer.dashboard.due")} {formatDate(assignment.due_date)}</span>
                  {isUrgent && (
                    <>
                      <span>•</span>
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="size-3" />
                        {daysLeft} {t("dashboard.reviewer.dashboard.daysLeft")}
                      </Badge>
                    </>
                  )}
                  {assignment.ai_match_score && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="size-3" />
                        {assignment.ai_match_score}% {t("dashboard.reviewer.dashboard.match")}
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
              {assignment.status === "completed" ? t("dashboard.reviewer.dashboard.viewReview") : t("dashboard.reviewer.dashboard.startReview")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
