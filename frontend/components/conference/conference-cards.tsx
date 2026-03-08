"use client"

import type { Conference } from "./types"
import { ConferenceCardBase, ActionButton } from "./conference-card-base"
import {
  ProgressSection,
  SetupStatusSection,
  DraftStatusSection,
  CompletedStatsSection,
} from "./event-sections"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceCardProps {
  conference: Conference
  onNavigate: (id: string) => void
}

// -------------------------------------------------------------------------
// Active Conference Card
// -------------------------------------------------------------------------

export function ActiveConferenceCard({ conference, onNavigate }: ConferenceCardProps) {
  const { t } = useTranslation()
  return (
    <ConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      footer={
        <div className="flex gap-2">
          <ActionButton
            variant="secondary"
            onClick={(e) => {
              e?.stopPropagation()
              onNavigate(conference.id)
            }}
          >
            {t("runtime.components.conference.conference-cards.text_settings")}{" "}
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={(e) => {
              e?.stopPropagation()
              onNavigate(conference.id)
            }}
          >
            {t("runtime.components.conference.conference-cards.text_dashboard")}{" "}
          </ActionButton>
        </div>
      }
    >
      {conference.reviewProgress && <ProgressSection progress={conference.reviewProgress} />}
    </ConferenceCardBase>
  )
}

// -------------------------------------------------------------------------
// Planning Conference Card
// -------------------------------------------------------------------------

export function PlanningConferenceCard({ conference, onNavigate }: ConferenceCardProps) {
  const { t } = useTranslation()
  return (
    <ConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      footer={
        <div className="flex gap-2">
          <ActionButton
            variant="secondary"
            onClick={(e) => {
              e?.stopPropagation()
              onNavigate(conference.id)
            }}
          >
            {t("runtime.components.conference.conference-cards.text_edit_details")}{" "}
          </ActionButton>
          <ActionButton
            variant="secondary"
            onClick={(e) => {
              e?.stopPropagation()
              onNavigate(conference.id)
            }}
          >
            {t("runtime.components.conference.conference-cards.text_setup")}{" "}
          </ActionButton>
        </div>
      }
    >
      {conference.setupStatus && <SetupStatusSection setup={conference.setupStatus} />}
    </ConferenceCardBase>
  )
}

// -------------------------------------------------------------------------
// Draft Conference Card
// -------------------------------------------------------------------------

export function DraftConferenceCard({ conference, onNavigate }: ConferenceCardProps) {
  const { t } = useTranslation()
  return (
    <ConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      footer={
        <ActionButton
          variant="primary"
          onClick={(e) => {
            e?.stopPropagation()
            onNavigate(conference.id)
          }}
          className="w-full"
        >
          {t("runtime.components.conference.conference-cards.text_continue_editing")}{" "}
        </ActionButton>
      }
    >
      <DraftStatusSection daysAgo={conference.draftSavedDaysAgo || 0} />
    </ConferenceCardBase>
  )
}

// -------------------------------------------------------------------------
// Completed Conference Card
// -------------------------------------------------------------------------

export function CompletedConferenceCard({ conference, onNavigate }: ConferenceCardProps) {
  const { t } = useTranslation()
  return (
    <ConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      footer={
        <ActionButton
          variant="secondary"
          onClick={(e) => {
            e?.stopPropagation()
            onNavigate(conference.id)
          }}
          className="w-full"
        >
          {t("runtime.components.conference.conference-cards.text_view_archive")}{" "}
        </ActionButton>
      }
    >
      <CompletedStatsSection acceptedPapers={conference.acceptedPapers || 0} />
    </ConferenceCardBase>
  )
}

// -------------------------------------------------------------------------
// Conference Card Router - selects the right variant based on status
// -------------------------------------------------------------------------

export function ConferenceCard({ conference, onNavigate }: ConferenceCardProps) {
  switch (conference.status) {
    case "active":
      return <ActiveConferenceCard conference={conference} onNavigate={onNavigate} />
    case "planning":
      return <PlanningConferenceCard conference={conference} onNavigate={onNavigate} />
    case "draft":
      return <DraftConferenceCard conference={conference} onNavigate={onNavigate} />
    case "completed":
      return <CompletedConferenceCard conference={conference} onNavigate={onNavigate} />
    default:
      return null
  }
}
