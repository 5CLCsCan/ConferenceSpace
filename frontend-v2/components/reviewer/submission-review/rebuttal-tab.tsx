"use client"

import { useState } from "react"

import {
  MOCK_POINTS,
  MOCK_REVIEWERS,
  MOCK_SETTINGS,
  MOCK_SUBMISSION,
  RebuttalPanel,
  type ResponseStatus,
} from "@/components/shared/rebuttal"

/**
 * Reviewer-specific Rebuttal Tab
 *
 * This is a thin wrapper around the shared RebuttalPanel component.
 * It provides reviewer-specific defaults and handles the data fetching/state management
 * that would typically come from an API.
 *
 * The shared RebuttalPanel component in @/components/shared/rebuttal can be used
 * directly by other roles (author, chair) with their specific configurations.
 */
export function RebuttalTab() {
  const [settings] = useState(MOCK_SETTINGS)
  const [reviewers] = useState(MOCK_REVIEWERS)
  const [points, setPoints] = useState(MOCK_POINTS)
  const [submission] = useState(MOCK_SUBMISSION)

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
    // TODO: API call to persist status change
  }

  const handleUpdateReview = () => {
    console.log("[Update review]")
    // TODO: Navigate to review update form or trigger modal
  }

  return (
    <RebuttalPanel
      settings={settings}
      reviewers={reviewers}
      points={points}
      submission={submission}
      userRole="reviewer"
      onPointStatusChange={handlePointStatusChange}
      onUpdateReview={handleUpdateReview}
    />
  )
}
