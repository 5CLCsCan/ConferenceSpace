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

  // Step 2: Topics & Deadlines
  topics: string[]
  tracks: string[]
  abstractDeadline: Date | undefined
  fullPaperDeadline: Date | undefined
  authorNotificationDate: Date | undefined
  cameraReadyDeadline: Date | undefined

  // Step 3: Call for Papers
  maxPages: number
  abstractMaxWords: number
  minKeywords: number
  maxKeywords: number
  allowSupplementary: boolean
  supplementaryTypes: string[]
  strictDeadlines: boolean
  gatingEnabled: boolean
  gatingMinReferences: number | null
  gatingRequiredSections: string[]
  gatingAnonymizationRequired: boolean
  gatingBannedPhrases: string[]
  gatingPrompt: string

  // Step 4: Committees
  organizers: Array<{
    id: string
    name: string
    email: string
    role: string
  }>

  // Step 5: Review Policy - Review Process
  anonymity: "single-blind" | "double-blind"
  rebuttalStartDate: Date | undefined
  rebuttalEndDate: Date | undefined
  finalDecisionDate: Date | undefined
  supplementaryDeadline: Date | undefined
  copyrightFormDeadline: Date | undefined
  earlyBirdDeadline: Date | undefined
  regularRegistrationDeadline: Date | undefined
  authorRegistrationDeadline: Date | undefined

  // Step 6: Final Review
  confirmed: boolean

  // Legacy fields for API compatibility
  dateRange: { from: Date | undefined; to: Date | undefined }
  venue: string
  submissionsOpen: Date | undefined
  submissionDeadline: Date | undefined
  reviewDeadline: Date | undefined
  authorNotification: Date | undefined
  fileFormats: string[]
  callForPaperText: string
}

export const WIZARD_STEPS: WizardStep[] = [
  { number: 1, id: "basic-details", title: "Basic Details", description: "Name, acronym, dates" },
  {
    number: 2,
    id: "topics-deadlines",
    title: "Topics & Deadlines",
    description: "Scope & timeline",
  },
  {
    number: 3,
    id: "policy-guidelines",
    title: "Policy & Guidelines",
    description: "Format & rules",
  },
  { number: 4, id: "call-for-papers", title: "Call for Papers", description: "CFP content" },
  { number: 5, id: "committees", title: "Committees", description: "Add members" },
  { number: 6, id: "final-review", title: "Final Review", description: "Publish conference" },
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

  // Topics & Deadlines
  topics: [],
  tracks: [],
  abstractDeadline: undefined,
  fullPaperDeadline: undefined,
  authorNotificationDate: undefined,
  cameraReadyDeadline: undefined,

  // Call for Papers
  maxPages: 8,
  abstractMaxWords: 250,
  minKeywords: 3,
  maxKeywords: 5,
  allowSupplementary: true,
  supplementaryTypes: ["code", "data"],
  strictDeadlines: false,
  gatingEnabled: false,
  gatingMinReferences: null,
  gatingRequiredSections: [],
  gatingAnonymizationRequired: false,
  gatingBannedPhrases: [],
  gatingPrompt: "",

  // Committees
  organizers: [],

  // Review Policy
  anonymity: "double-blind",
  rebuttalStartDate: undefined,
  rebuttalEndDate: undefined,
  finalDecisionDate: undefined,
  supplementaryDeadline: undefined,
  copyrightFormDeadline: undefined,
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
  fileFormats: ["PDF"],
  callForPaperText: "",
}
