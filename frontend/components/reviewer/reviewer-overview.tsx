"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle2, Clock, ChevronRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { daysUntilDeadline } from "@/lib/utils"
import type { ReviewerStats, AssignmentWithPaper } from "@/lib/types"

interface ReviewerOverviewProps {
  stats: ReviewerStats | null
  assignments: AssignmentWithPaper[]
  conferenceCount: number
  onSelectPaper: (paperId: string, conferenceId: string) => void
}

export function ReviewerOverview({
  stats,
  assignments,
  conferenceCount,
  onSelectPaper,
}: ReviewerOverviewProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.roles.reviewer.stats.totalConferences")}
            </CardTitle>
            <BookOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conferenceCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.roles.reviewer.stats.activeReviewing")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.roles.reviewer.stats.completedReviews")}
            </CardTitle>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.roles.reviewer.stats.papersCompleted")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.roles.reviewer.stats.pendingReviews")}
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.roles.reviewer.stats.papersToDo")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.roles.reviewer.todo.title")}</CardTitle>
          <CardDescription>{t("dashboard.roles.reviewer.todo.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("dashboard.roles.reviewer.todo.noAssignments") || "No pending assignments"}
            </p>
          ) : (
            assignments
              .filter((a) => a.status !== "completed")
              .map((assignment) => {
                const daysLeft = assignment.due_date ? daysUntilDeadline(assignment.due_date) : 0
                return (
                  <div
                    key={assignment.assignment_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold">{assignment.paper_title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {assignment.conference_name}
                      </p>
                      {assignment.due_date && (
                        <p className="text-sm text-muted-foreground">
                          {t("dashboard.roles.reviewer.todo.deadline")}:{" "}
                          {new Date(assignment.due_date).toLocaleDateString()} (
                          {t("dashboard.roles.reviewer.todo.daysLeft", {
                            count: daysLeft,
                          })}
                          )
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectPaper(String(assignment.paper_id), String(assignment.conference_id))}
                    >
                      {t("dashboard.roles.reviewer.todo.reviewNow")}
                      <ChevronRight className="ml-2 size-4" />
                    </Button>
                  </div>
                )
              })
          )}
        </CardContent>
      </Card>
    </>
  )
}
