// =============================================================================
// Shared Discussion Components
// Used across reviewer, author, and chair roles
// =============================================================================

// Main component
export { DiscussionPanel } from "./DiscussionPanel"

// Types
export type {
  ReviewMode,
  MessageVisibility,
  ParticipantRole,
  ThreadStatus,
  ThreadCategory,
  Participant,
  Attachment,
  DiscussionMessage,
  DiscussionThread,
  ConferenceSettings,
  CreateThreadData,
  DiscussionPanelProps,
  MessageItemProps,
  ThreadCardProps,
  NewThreadModalProps,
} from "./types"

// Config
export { VISIBILITY_CONFIG, CATEGORY_CONFIG, ROLE_STYLES, STATUS_STYLES } from "./config"

// Child components (for advanced customization)
export {
  VisibilityIndicator,
  StatusBadge,
  CategoryTag,
  ParticipantAvatar,
  ReviewModeIndicator,
  MessageItem,
  ThreadCard,
  NewThreadModal,
} from "./components"

// Mock data (for development)
export { MOCK_SETTINGS, MOCK_CURRENT_USER, MOCK_THREADS } from "./mock-data"
