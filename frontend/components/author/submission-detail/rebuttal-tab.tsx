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

  return (
    <div className="space-y-3">
      {/*
      BACKEND REQUEST: <Implement rebuttal persistence APIs for reviewer acknowledgment and author rebuttal state transitions; frontend rebuttal actions are now explicitly disabled because backend write contract is unavailable; expose idempotent role-aware endpoints with allowed status enums, audit metadata, and reload-consistent state across author/reviewer/chair views.>
      */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Rebuttal submission is currently read-only. The backend rebuttal persistence contract is not
        available yet, so draft and submit actions are disabled to avoid unsaved changes (conference{" "}
        {conferenceId}, submission {submissionId}).
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
