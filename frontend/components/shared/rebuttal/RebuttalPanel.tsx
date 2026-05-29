"use client"

import { useEffect, useState } from "react"

import {
  ActionBar,
  GeneralResponseSection,
  PhaseHeader,
  ReviewerResponseGroup,
  ScoreSummaryPanel,
} from "./components"
import type { RebuttalPanelProps, ResponseStatus } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

export function RebuttalPanel({
  settings,
  reviewers,
  points: initialPoints,
  submission,
  userRole,
  currentUserId,
  onPointStatusChange,
  onUpdateReview,
  onStartDiscussion,
  onSubmitRebuttal,
  readOnly = false,
  className = "",
}: RebuttalPanelProps) {
  const { t } = useTranslation()
  const [points, setPoints] = useState(initialPoints)

  const handlePointStatusChange = (pointId: string, status: ResponseStatus, note?: string) => {
    setPoints((prev) =>
      prev.map((p) =>
        p.id === pointId
          ? {
              ...p,
              status,
              reviewerAcknowledgment: {
                acknowledged: true,
                satisfactory: status === "addressed",
                note,
              },
            }
          : p,
      ),
    )
    onPointStatusChange?.(pointId, status, note)
  }
 
  const handleAuthorResponseChange = (pointId: string, response: string) => {
    setPoints((prev) =>
      prev.map((p) => (p.id === pointId ? { ...p, authorResponse: response } : p)),
    )
  }

  // Synchronize internal state with initialPoints when they change (e.g. after a load)
  useEffect(() => {
    setPoints(initialPoints)
  }, [initialPoints])

  // For reviewers, identify their own points
  const currentUserReviewer = reviewers.find((r) => {
    if (currentUserId) return r.id === currentUserId
    return r.isCurrentUser
  })

  const currentUserPoints = currentUserReviewer
    ? points.filter((p) => p.reviewerId === currentUserReviewer.id)
    : []

  const otherReviewerGroups = reviewers
    .filter((r) => {
      if (currentUserId) return r.id !== currentUserId
      return !r.isCurrentUser
    })
    .map((r) => ({
      reviewer: r,
      points: points.filter((p) => p.reviewerId === r.id),
    }))
    .filter(({ points }) => points.length > 0)

  const hasPendingAcknowledgments = currentUserPoints.some((p) => p.status === "pending_review")

  // For authors, show all points grouped by reviewer
  const allReviewerGroups =
    userRole === "author"
      ? reviewers
          .map((r) => ({
            reviewer: r,
            points: points.filter((p) => p.reviewerId === r.id),
          }))
          .filter(({ points }) => points.length > 0)
      : null

  return (
    <div className={`w-full ${className}`}>
      {/* Phase Header */}
      <PhaseHeader settings={settings} userRole={userRole} />

      {/* Score Summary */}
      <ScoreSummaryPanel reviewers={reviewers} userRole={userRole} />

      {/* General Response */}
      {submission && <GeneralResponseSection submission={submission} userRole={userRole} />}

      {/* Per-Reviewer Responses */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {t("runtime.components.shared.rebuttal.RebuttalPanel.text_point_by_point_responses")}{" "}
        </h3>

        {userRole === "author" ? (
          // Author view: show all reviewer groups
          allReviewerGroups?.map(({ reviewer, points: reviewerPoints }) => (
            <ReviewerResponseGroup
              key={reviewer.id}
              reviewer={reviewer}
              points={reviewerPoints}
              userRole={userRole}
              onPointStatusChange={handlePointStatusChange}
              onAuthorResponseChange={handleAuthorResponseChange}
              readOnly={readOnly}
            />
          ))
        ) : (
          <>
            {/* Current User's Points First (for reviewers) */}
            {currentUserReviewer && currentUserPoints.length > 0 && (
              <ReviewerResponseGroup
                reviewer={currentUserReviewer}
                points={currentUserPoints}
                userRole={userRole}
                onPointStatusChange={handlePointStatusChange}
                onAuthorResponseChange={handleAuthorResponseChange}
                readOnly={readOnly}
              />
            )}

            {/* Other Reviewers */}
            {otherReviewerGroups.map(({ reviewer, points: reviewerPoints }) => (
              <ReviewerResponseGroup
                key={reviewer.id}
                reviewer={reviewer}
                points={reviewerPoints}
                userRole={userRole}
                onPointStatusChange={handlePointStatusChange}
                onAuthorResponseChange={handleAuthorResponseChange}
                readOnly={readOnly}
              />
            ))}
          </>
        )}
      </div>

      {/* Action Bar */}
      {!readOnly && (
        <ActionBar
          hasUpdates={hasPendingAcknowledgments}
          userRole={userRole}
          onUpdateReview={onUpdateReview}
          onSubmitRebuttal={() =>
            onSubmitRebuttal?.({
              generalResponse: "", // Parent handles general response
              perReviewerResponses: [],
              points, // Pass the updated points back
            } as any)
          }
          onStartDiscussion={onStartDiscussion}
        />
      )}
    </div>
  )
}
