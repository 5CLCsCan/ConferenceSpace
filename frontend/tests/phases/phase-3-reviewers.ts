import { APIRequestContext } from "@playwright/test"
import { RegisteredUser } from "../utils/api/auth"
import { Conference } from "../utils/api/conference"
import { Submission } from "../utils/api/submission"
import {
  batchInviteReviewers,
  acceptInvitation,
  Reviewer,
  ReviewerInvite,
} from "../utils/api/reviewer"

export interface Phase3State {
  chair: RegisteredUser
  reviewers: RegisteredUser[]
  authors: RegisteredUser[]
  conference: Conference
  submissions: Submission[]
  reviewerInvitations: Reviewer[]
}

export interface Phase3Config {
  autoAccept?: boolean // Default: true
  acceptedReviewers?: number[] // Indices of reviewers to accept (if not autoAccept)
}

/**
 * Setup reviewer phase - invites reviewers and handles acceptances
 * @param request - Playwright APIRequestContext
 * @param conference - Conference from Phase 1
 * @param chair - Chair user from Phase 0
 * @param reviewers - Reviewer users from Phase 0
 * @param config - Optional configuration
 * @returns Array of reviewer invitations
 */
export async function setupReviewerPhase(
  request: APIRequestContext,
  conference: Conference,
  chair: RegisteredUser,
  reviewers: RegisteredUser[],
  config?: Phase3Config,
): Promise<Reviewer[]> {
  const autoAccept = config?.autoAccept !== false // Default true

  console.log(`Inviting ${reviewers.length} reviewers to conference: ${conference.title}`)

  // Prepare reviewer invitations (backend expects user_id, not email)
  const reviewerInvites: ReviewerInvite[] = reviewers.map((reviewer) => ({
    user_id: reviewer.id,
    domain: reviewer.domain,
  }))

  // Batch invite all reviewers
  const inviteResult = await batchInviteReviewers(
    request,
    chair.access_token,
    conference.id,
    reviewerInvites,
  )

  if (inviteResult.failed.length > 0) {
    console.warn(`Failed to invite ${inviteResult.failed.length} reviewers:`)
    inviteResult.failed.forEach((failure) => {
      console.warn(`  - ${failure.email}: ${failure.error}`)
    })
  }

  console.log(`✓ Successfully invited ${inviteResult.success.length} reviewers`)

  const reviewerInvitations = inviteResult.success

  // Handle acceptances
  if (autoAccept) {
    console.log("Auto-accepting all reviewer invitations...")

    for (let i = 0; i < reviewerInvitations.length; i++) {
      const invitation = reviewerInvitations[i]
      const reviewer = reviewers.find((r) => r.email === invitation.email)

      if (!reviewer) {
        console.warn(`Could not find reviewer user for ${invitation.email}`)
        continue
      }

      try {
        const accepted = await acceptInvitation(
          request,
          reviewer.access_token,
          conference.id,
          invitation.id,
        )

        // Update the invitation in the array
        reviewerInvitations[i] = accepted

        console.log(`✓ Reviewer ${i + 1}/${reviewerInvitations.length} accepted: ${reviewer.email}`)
      } catch (error) {
        console.error(`Failed to accept invitation for ${reviewer.email}:`, error)
        throw error
      }
    }
  } else if (config?.acceptedReviewers) {
    // Accept only specified reviewers
    console.log(`Accepting ${config.acceptedReviewers.length} specific reviewers...`)

    for (const index of config.acceptedReviewers) {
      if (index < 0 || index >= reviewerInvitations.length) {
        console.warn(`Invalid reviewer index: ${index}`)
        continue
      }

      const invitation = reviewerInvitations[index]
      const reviewer = reviewers[index]

      try {
        const accepted = await acceptInvitation(
          request,
          reviewer.access_token,
          conference.id,
          invitation.id,
        )

        // Update the invitation in the array
        reviewerInvitations[index] = accepted

        console.log(`✓ Reviewer ${index + 1} accepted: ${reviewer.email}`)
      } catch (error) {
        console.error(`Failed to accept invitation for ${reviewer.email}:`, error)
        throw error
      }
    }
  }

  return reviewerInvitations
}

/**
 * Execute Phase 3: Invite and accept reviewers from Phase 2 state
 * @param request - Playwright APIRequestContext
 * @param phase2State - State from Phase 2 (users + conference + submissions)
 * @param config - Optional configuration
 * @returns Phase 3 state with reviewer invitations
 */
export async function executePhase3(
  request: APIRequestContext,
  phase2State: {
    chair: RegisteredUser
    reviewers: RegisteredUser[]
    authors: RegisteredUser[]
    conference: Conference
    submissions: Submission[]
  },
  config?: Phase3Config,
): Promise<Phase3State> {
  console.log("=== Phase 3: Review Ready ===")

  const startTime = Date.now()

  const reviewerInvitations = await setupReviewerPhase(
    request,
    phase2State.conference,
    phase2State.chair,
    phase2State.reviewers,
    config,
  )

  const duration = Date.now() - startTime
  console.log(`Phase 3 completed in ${duration}ms`)
  console.log(`Invited ${reviewerInvitations.length} reviewers`)

  const acceptedCount = reviewerInvitations.filter((r) => r.status === "accepted").length
  console.log(`Accepted: ${acceptedCount}/${reviewerInvitations.length}`)

  return {
    ...phase2State,
    reviewerInvitations,
  }
}
