// Conference creation wizard types

export interface WizardStep {
  number: number
  id: string
  title: string
  description: string
}

export interface ConferenceFormData {
  // Step 1: Basic Details - Identity
  title: string
  acronym: string
  website: string
  contactEmail: string
  description: string

  // Step 1: Basic Details - Location
  location: string
  locationType: "in-person" | "virtual" | "hybrid"

  // Step 1: Basic Details - Conference Dates
  conferenceStartDate: Date | undefined
  conferenceEndDate: Date | undefined

  // Step 2: Topics & Tracks
  topics: string[]
  tracks: string[]

  // Step 3: Committees
  organizers: Array<{
    id: string
    name: string
    email: string
    role: string
  }>

  // Step 4: Review Policy - Submission Deadlines
  abstractDeadline: Date | undefined
  fullPaperDeadline: Date | undefined
  supplementaryDeadline: Date | undefined

  // Step 4: Review Policy - Review Process
  anonymity: "single-blind" | "double-blind"
  authorNotificationDate: Date | undefined
  rebuttalStartDate: Date | undefined
  rebuttalEndDate: Date | undefined
  finalDecisionDate: Date | undefined

  // Step 4: Review Policy - Post-Acceptance
  cameraReadyDeadline: Date | undefined
  copyrightFormDeadline: Date | undefined

  // Step 4: Review Policy - Registration
  earlyBirdDeadline: Date | undefined
  regularRegistrationDeadline: Date | undefined
  authorRegistrationDeadline: Date | undefined

  // Step 5: Final Review
  confirmed: boolean

  // Legacy fields for API compatibility
  dateRange: { from: Date | undefined; to: Date | undefined }
  venue: string
  submissionsOpen: Date | undefined
  submissionDeadline: Date | undefined
  reviewDeadline: Date | undefined
  authorNotification: Date | undefined
  cameraReadyDeadline: Date | undefined
  fileFormats: string[]
  callForPaperText: string
}

export const WIZARD_STEPS: WizardStep[] = [
  { number: 1, id: "basic-details", title: "Basic Details", description: "Name, acronym, dates" },
  { number: 2, id: "topics-tracks", title: "Topics & Tracks", description: "Define scope" },
  { number: 3, id: "committees", title: "Committees", description: "Add members" },
  { number: 4, id: "review-policy", title: "Review Policy", description: "Deadlines & rules" },
  { number: 5, id: "final-review", title: "Final Review", description: "Publish conference" },
]

export const initialFormData: ConferenceFormData = {
  // Identity
  title: "",
  acronym: "",
  website: "",
  contactEmail: "",
  description: "",

  // Location
  location: "",
  locationType: "in-person",

  // Conference Dates
  conferenceStartDate: undefined,
  conferenceEndDate: undefined,

  // Topics & Tracks
  topics: [],
  tracks: [],

  // Committees
  organizers: [],

  // Submission Deadlines
  abstractDeadline: undefined,
  fullPaperDeadline: undefined,
  supplementaryDeadline: undefined,

  // Review Process
  anonymity: "double-blind",
  authorNotificationDate: undefined,
  rebuttalStartDate: undefined,
  rebuttalEndDate: undefined,
  finalDecisionDate: undefined,

  // Post-Acceptance
  cameraReadyDeadline: undefined,
  copyrightFormDeadline: undefined,

  // Registration
  earlyBirdDeadline: undefined,
  regularRegistrationDeadline: undefined,
  authorRegistrationDeadline: undefined,

  // Final Review
  confirmed: false,

  // Legacy API compatibility
  dateRange: { from: undefined, to: undefined },
  venue: "",
  submissionsOpen: undefined,
  submissionDeadline: undefined,
  reviewDeadline: undefined,
  authorNotification: undefined,
  cameraReadyDeadline: undefined,
  fileFormats: ["PDF"],
  callForPaperText: "",
}
