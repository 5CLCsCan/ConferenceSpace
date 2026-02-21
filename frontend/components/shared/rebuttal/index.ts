// Main component
export { RebuttalPanel } from "./RebuttalPanel"

// Sub-components
export {
  ActionBar,
  GeneralResponseSection,
  PhaseHeader,
  PointCard,
  ReviewerResponseGroup,
  ReviewerScoreCard,
  ScoreSummaryPanel,
  StatusBadge,
} from "./components"

// Types
export type {
  ActionBarProps,
  GeneralResponseSectionProps,
  PhaseHeaderProps,
  PointCardProps,
  PointCategory,
  RebuttalAttachment,
  RebuttalPanelProps,
  RebuttalPhase,
  RebuttalPoint,
  RebuttalSettings,
  RebuttalSubmission,
  RebuttalSubmissionData,
  ResponseStatus,
  ReviewerInfo,
  ReviewerResponseGroupProps,
  ReviewerScoreCardProps,
  ScoreSummaryPanelProps,
  StatusBadgeProps,
  UserRole,
} from "./types"

// Config
export {
  ATTACHMENT_TYPE_CONFIG,
  CATEGORY_CONFIG,
  PHASE_CONFIG,
  PHASE_DESCRIPTIONS_BY_ROLE,
  STATUS_CONFIG,
} from "./config"

// Mock data (for development)
export { MOCK_POINTS, MOCK_REVIEWERS, MOCK_SETTINGS, MOCK_SUBMISSION } from "./mock-data"
