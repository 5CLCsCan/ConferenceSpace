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

interface RebuttalTabProps {
  conferenceId: string
  submissionId: string
}

export function RebuttalTab({ conferenceId, submissionId }: RebuttalTabProps) {
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
          "runtime.components.author.submission-detail.rebuttal-tab.text_rebuttal_submission_is_currently_read_only",
        )}{" "}
        {conferenceId}
        {t("runtime.components.author.submission-detail.rebuttal-tab.text_submission")}{" "}
        {submissionId}).
      </div>

      <RebuttalPanel
        settings={settings}
        reviewers={MOCK_REVIEWERS}
        points={MOCK_POINTS}
        submission={MOCK_SUBMISSION}
        userRole="author"
        readOnly
      />
    </div>
  )
}
