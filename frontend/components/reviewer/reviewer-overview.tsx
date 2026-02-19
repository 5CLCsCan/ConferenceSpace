"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle2, Clock, ChevronRight, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { daysUntilDeadline } from "@/lib/utils"
import { useEffect, useRef } from "react"
import type { ReviewerStats, AssignmentWithPaper } from "@/lib/types"

interface ReviewerOverviewProps {
  stats: ReviewerStats | null
  assignments: AssignmentWithPaper[]
  conferenceCount: number
  onSelectPaper: (paperId: string, conferenceId: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

export function ReviewerOverview({
  stats,
  assignments,
  conferenceCount,
  onSelectPaper,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ReviewerOverviewProps) {
  const { t } = useTranslation()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Infinite scroll observer for todo list
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 },
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [onLoadMore, hasMore, isLoadingMore])

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="py-6">
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

        <Card className="py-6">
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

        <Card className="py-6">
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

      <Card className="py-6">
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
                      <p className="text-sm text-muted-foreground">{assignment.conference_name}</p>
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
                      onClick={() =>
                        onSelectPaper(
                          String(assignment.assignment_id),
                          String(assignment.conference_id),
                        )
                      }
                    >
                      {t("dashboard.roles.reviewer.todo.reviewNow")}
                      <ChevronRight className="ml-2 size-4" />
                    </Button>
                  </div>
                )
              })
          )}
          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isLoadingMore && <Loader2 className="size-6 animate-spin text-muted-foreground" />}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
