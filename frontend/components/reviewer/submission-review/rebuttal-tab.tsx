"use client"

import { useEffect, useState } from "react"
import { getConferenceById } from "@/lib/api/conferences"
import {
  MOCK_POINTS,
  MOCK_REVIEWERS,
  MOCK_SETTINGS,
  MOCK_SUBMISSION,
  buildRebuttalSettingsFromConference,
  RebuttalPanel,
} from "@/components/shared/rebuttal"
import { useTranslation } from "@/lib/i18n/translation-context"

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
interface RebuttalTabProps {
  conferenceId: string
  submissionId: string
  assignmentId: string
}

export function RebuttalTab({ conferenceId, submissionId, assignmentId }: RebuttalTabProps) {
  const [settings, setSettings] = useState(MOCK_SETTINGS)

  useEffect(() => {
    void getConferenceById(conferenceId).then((response) => {
      setSettings(buildRebuttalSettingsFromConference(response.data))
    })
  }, [conferenceId])

  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      {/*
      BACKEND REQUEST: <Implement rebuttal persistence APIs for reviewer acknowledgment and author rebuttal state transitions; frontend rebuttal actions are now explicitly disabled because backend write contract is unavailable; expose idempotent role-aware endpoints with allowed status enums, audit metadata, and reload-consistent state across author/reviewer/chair views.>
      */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        {t(
          "runtime.components.reviewer.submission-review.rebuttal-tab.text_rebuttal_write_actions_are_currently_unavailable",
        )}{" "}
        {conferenceId}
        {t("runtime.components.reviewer.submission-review.rebuttal-tab.text_submission")}{" "}
        {submissionId}
        {t("runtime.components.reviewer.submission-review.rebuttal-tab.text_assignment")}{" "}
        {assignmentId}).
      </div>

      <RebuttalPanel
        settings={settings}
        reviewers={MOCK_REVIEWERS}
        points={MOCK_POINTS}
        submission={MOCK_SUBMISSION}
        userRole="reviewer"
        readOnly
      />
    </div>
  )
}
