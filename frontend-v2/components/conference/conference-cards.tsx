import type { Conference } from "./types"
import { ConferenceCardBase, ActionButton } from "./conference-card-base"
import {
  ProgressSection,
  SetupStatusSection,
  DraftStatusSection,
  CompletedStatsSection,
} from "./event-sections"

interface ConferenceCardProps {
  conference: Conference
  onNavigate: (id: string) => void
}

// -------------------------------------------------------------------------
// Active Conference Card
// -------------------------------------------------------------------------

export function ActiveConferenceCard({ conference, onNavigate }: ConferenceCardProps) {
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
            }}
          >
            Settings
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={(e) => {
              e?.stopPropagation()
              onNavigate(conference.id)
            }}
          >
            Dashboard
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
            }}
          >
            Edit Details
          </ActionButton>
          <ActionButton
            variant="secondary"
            onClick={(e) => {
              e?.stopPropagation()
              onNavigate(conference.id)
            }}
          >
            Setup
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
          Continue Editing
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
          View Archive
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
