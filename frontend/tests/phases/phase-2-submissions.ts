import { APIRequestContext } from "@playwright/test"
import { RegisteredUser } from "../utils/api/auth"
import { Conference } from "../utils/api/conference"
import {
  createSubmission,
  generateSubmissionData,
  Submission,
  SubmissionData,
} from "../utils/api/submission"
import { getOrCreateDummyPDF } from "../utils/file-helper"

export interface Phase2State {
  chair: RegisteredUser
  reviewers: RegisteredUser[]
  authors: RegisteredUser[]
  conference: Conference
  submissions: Submission[]
}

export interface Phase2Config {
  submissionsPerAuthor?: number
  status?: "draft" | "published"
  withFiles?: boolean
  customDomains?: string[][]
  tracks?: string[]
}

/**
 * Setup submission phase - creates submissions for authors
 * @param request - Playwright APIRequestContext
 * @param conference - Conference from Phase 1
 * @param authors - Author users from Phase 0
 * @param config - Optional configuration for submissions
 * @returns Array of created submissions
 */
export async function setupSubmissionPhase(
  request: APIRequestContext,
  conference: Conference,
  authors: RegisteredUser[],
  config?: Phase2Config,
): Promise<Submission[]> {
  const submissionsPerAuthor = config?.submissionsPerAuthor || 1
  const status = config?.status || "published"
  const withFiles = config?.withFiles !== false // Default true
  const tracks = config?.tracks || conference.domain.slice(0, 3)

  console.log(`Creating submissions for ${authors.length} authors (${submissionsPerAuthor} each)`)

  const submissions: Submission[] = []
  const filePath = withFiles ? getOrCreateDummyPDF() : undefined

  // Create submissions for each author
  for (let i = 0; i < authors.length; i++) {
    const author = authors[i]

    for (let j = 0; j < submissionsPerAuthor; j++) {
      const submissionIndex = i * submissionsPerAuthor + j + 1

      // Use custom domain or author's domain
      const domain = config?.customDomains?.[submissionIndex - 1] || author.domain

      // Select a track
      const track = tracks[submissionIndex % tracks.length]

      // Generate submission data
      const submissionData = generateSubmissionData(domain, status, track)

      console.log(
        `Creating submission ${submissionIndex}/${authors.length * submissionsPerAuthor}: ` +
          `"${submissionData.title}" by ${author.email}`,
      )

      try {
        const submission = await createSubmission(
          request,
          author.access_token,
          conference.id,
          submissionData,
          filePath,
        )

        submissions.push(submission)
        console.log(`✓ Submission ${submissionIndex} created (ID: ${submission.id})`)
      } catch (error) {
        console.error(`Failed to create submission ${submissionIndex}:`, error)
        throw error
      }
    }
  }

  return submissions
}

/**
 * Execute Phase 2: Create submissions from Phase 1 state
 * @param request - Playwright APIRequestContext
 * @param phase1State - State from Phase 1 (users + conference)
 * @param config - Optional configuration for submissions
 * @returns Phase 2 state with submissions
 */
export async function executePhase2(
  request: APIRequestContext,
  phase1State: {
    chair: RegisteredUser
    reviewers: RegisteredUser[]
    authors: RegisteredUser[]
    conference: Conference
  },
  config?: Phase2Config,
): Promise<Phase2State> {
  console.log("=== Phase 2: Submission Ready ===")

  const startTime = Date.now()

  const submissions = await setupSubmissionPhase(
    request,
    phase1State.conference,
    phase1State.authors,
    config,
  )

  const duration = Date.now() - startTime
  console.log(`Phase 2 completed in ${duration}ms`)
  console.log(`Created ${submissions.length} submissions`)

  return {
    ...phase1State,
    submissions,
  }
}
