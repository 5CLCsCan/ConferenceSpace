"use client"

import type { ReactNode } from "react"
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
  moreMenu?: ReactNode
}

// -------------------------------------------------------------------------
// Active Conference Card
// -------------------------------------------------------------------------

export function ActiveConferenceCard({ conference, onNavigate, moreMenu }: ConferenceCardProps) {
  const { t } = useTranslation()
  return (
    <ConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      moreMenu={moreMenu}
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

export function PlanningConferenceCard({ conference, onNavigate, moreMenu }: ConferenceCardProps) {
  const { t } = useTranslation()
  return (
    <ConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      moreMenu={moreMenu}
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

export function DraftConferenceCard({ conference, onNavigate, moreMenu }: ConferenceCardProps) {
  const { t } = useTranslation()
  return (
    <ConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      moreMenu={moreMenu}
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

export function CompletedConferenceCard({ conference, onNavigate, moreMenu }: ConferenceCardProps) {
  const { t } = useTranslation()
  return (
    <ConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      moreMenu={moreMenu}
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

export function ConferenceCard({ conference, onNavigate, moreMenu }: ConferenceCardProps) {
  switch (conference.status) {
    case "active":
      return (
        <ActiveConferenceCard conference={conference} onNavigate={onNavigate} moreMenu={moreMenu} />
      )
    case "planning":
      return (
        <PlanningConferenceCard
          conference={conference}
          onNavigate={onNavigate}
          moreMenu={moreMenu}
        />
      )
    case "draft":
      return (
        <DraftConferenceCard conference={conference} onNavigate={onNavigate} moreMenu={moreMenu} />
      )
    case "completed":
      return (
        <CompletedConferenceCard
          conference={conference}
          onNavigate={onNavigate}
          moreMenu={moreMenu}
        />
      )
    default:
      return null
  }
}
