import { APIRequestContext } from '@playwright/test';
import { RegisteredUser } from '../api/auth';
import { Conference } from '../api/conference';
import { Submission } from '../api/submission';
import { Reviewer } from '../api/reviewer';
import { executePhase0, Phase0State } from '../../phases/phase-0-auth';
import { executePhase1, Phase1State, Phase1Config } from '../../phases/phase-1-conference';
import { executePhase2, Phase2State, Phase2Config } from '../../phases/phase-2-submissions';
import { executePhase3, Phase3State, Phase3Config } from '../../phases/phase-3-reviewers';

/**
 * StateBuilder - Fluent API for building test states
 * 
 * Example usage:
 * ```typescript
 * const state = await StateBuilder
 *   .create(request)
 *   .withUsers({ reviewers: 5, authors: 3 })
 *   .withConference({ domain: ['AI', 'ML'] })
 *   .withSubmissions({ submissionsPerAuthor: 2 })
 *   .build();
 * ```
 */
export class StateBuilder {
  private request: APIRequestContext;
  private phase0Config: {
    reviewerCount?: number;
    authorCount?: number;
    reviewerDomains?: string[][];
    authorDomains?: string[][];
  } = {};
  private phase1Config?: Phase1Config;
  private phase2Config?: Phase2Config;
  private phase3Config?: Phase3Config;
  private shouldCreateConference = false;
  private shouldCreateSubmissions = false;
  private shouldInviteReviewers = false;

  private constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Create a new StateBuilder instance
   * @param request - Playwright APIRequestContext
   * @returns StateBuilder instance
   */
  static create(request: APIRequestContext): StateBuilder {
    return new StateBuilder(request);
  }

  /**
   * Configure users to be created (Phase 0)
   * @param config - User configuration
   * @returns StateBuilder instance for chaining
   */
  withUsers(config: {
    reviewerCount?: number;
    authorCount?: number;
    reviewerDomains?: string[][];
    authorDomains?: string[][];
  }): StateBuilder {
    this.phase0Config = config;
    return this;
  }

  /**
   * Configure conference to be created (Phase 1)
   * @param config - Conference configuration
   * @returns StateBuilder instance for chaining
   */
  withConference(config?: Phase1Config): StateBuilder {
    this.shouldCreateConference = true;
    this.phase1Config = config;
    return this;
  }

  /**
   * Configure submissions to be created (Phase 2)
   * @param config - Submission configuration
   * @returns StateBuilder instance for chaining
   */
  withSubmissions(config?: Phase2Config): StateBuilder {
    this.shouldCreateSubmissions = true;
    this.shouldCreateConference = true; // Submissions require conference
    this.phase2Config = config;
    return this;
  }

  /**
   * Configure reviewer invitations and acceptances (Phase 3)
   * @param config - Reviewer configuration
   * @returns StateBuilder instance for chaining
   */
  withAcceptedReviewers(config?: Phase3Config): StateBuilder {
    this.shouldInviteReviewers = true;
    this.shouldCreateSubmissions = true; // Reviewers typically need submissions
    this.shouldCreateConference = true; // Reviewers require conference
    this.phase3Config = config;
    return this;
  }

  /**
   * Build the test state by executing configured phases
   * @returns Built state object
   */
  async build(): Promise<Phase0State | Phase1State | Phase2State | Phase3State> {
    console.log('=== StateBuilder: Building Test State ===');
    const startTime = Date.now();

    // Phase 0: Create users
    const phase0State = await executePhase0(this.request, this.phase0Config);

    // Phase 1: Create conference (if configured)
    if (this.shouldCreateConference) {
      const phase1State = await executePhase1(this.request, phase0State, this.phase1Config);
      
      // Phase 2: Create submissions (if configured)
      if (this.shouldCreateSubmissions) {
        const phase2State = await executePhase2(this.request, phase1State, this.phase2Config);
        
        // Phase 3: Invite and accept reviewers (if configured)
        if (this.shouldInviteReviewers) {
          const phase3State = await executePhase3(this.request, phase2State, this.phase3Config);
          
          const duration = Date.now() - startTime;
          console.log(`=== StateBuilder: Complete in ${duration}ms ===`);
          
          return phase3State;
        }
        
        const duration = Date.now() - startTime;
        console.log(`=== StateBuilder: Complete in ${duration}ms ===`);
        
        return phase2State;
      }
      
      const duration = Date.now() - startTime;
      console.log(`=== StateBuilder: Complete in ${duration}ms ===`);
      
      return phase1State;
    }

    const duration = Date.now() - startTime;
    console.log(`=== StateBuilder: Complete in ${duration}ms ===`);
    
    return phase0State;
  }

  /**
   * Build only Phase 0 (users only)
   * @returns Phase 0 state
   */
  async buildPhase0(): Promise<Phase0State> {
    return await executePhase0(this.request, this.phase0Config);
  }

  /**
   * Build up to Phase 1 (users + conference)
   * @returns Phase 1 state
   */
  async buildPhase1(): Promise<Phase1State> {
    const phase0State = await executePhase0(this.request, this.phase0Config);
    return await executePhase1(this.request, phase0State, this.phase1Config);
  }

  /**
   * Build up to Phase 2 (users + conference + submissions)
   * @returns Phase 2 state
   */
  async buildPhase2(): Promise<Phase2State> {
    const phase0State = await executePhase0(this.request, this.phase0Config);
    const phase1State = await executePhase1(this.request, phase0State, this.phase1Config);
    return await executePhase2(this.request, phase1State, this.phase2Config);
  }

  /**
   * Build up to Phase 3 (users + conference + submissions + reviewers)
   * @returns Phase 3 state
   */
  async buildPhase3(): Promise<Phase3State> {
    const phase0State = await executePhase0(this.request, this.phase0Config);
    const phase1State = await executePhase1(this.request, phase0State, this.phase1Config);
    const phase2State = await executePhase2(this.request, phase1State, this.phase2Config);
    return await executePhase3(this.request, phase2State, this.phase3Config);
  }
}

/**
 * Quick helper to create a basic test state with users and conference
 * @param request - Playwright APIRequestContext
 * @param config - Optional configuration
 * @returns Phase 1 state
 */
export async function createBasicTestState(
  request: APIRequestContext,
  config?: {
    reviewerCount?: number;
    authorCount?: number;
    conferenceDomain?: string[];
  }
): Promise<Phase1State> {
  return await StateBuilder
    .create(request)
    .withUsers({
      reviewerCount: config?.reviewerCount || 5,
      authorCount: config?.authorCount || 3,
    })
    .withConference({
      domain: config?.conferenceDomain,
    })
    .build() as Phase1State;
}

/**
 * Quick helper to create a complete test state with users, conference, and submissions
 * @param request - Playwright APIRequestContext
 * @param config - Optional configuration
 * @returns Phase 2 state
 */
export async function createCompleteTestState(
  request: APIRequestContext,
  config?: {
    reviewerCount?: number;
    authorCount?: number;
    conferenceDomain?: string[];
    submissionsPerAuthor?: number;
  }
): Promise<Phase2State> {
  return await StateBuilder
    .create(request)
    .withUsers({
      reviewerCount: config?.reviewerCount || 5,
      authorCount: config?.authorCount || 3,
    })
    .withConference({
      domain: config?.conferenceDomain,
    })
    .withSubmissions({
      submissionsPerAuthor: config?.submissionsPerAuthor || 2,
    })
    .build() as Phase2State;
}

/**
 * Quick helper to create a ready-to-review test state with accepted reviewers
 * @param request - Playwright APIRequestContext
 * @param config - Optional configuration
 * @returns Phase 3 state
 */
export async function createReadyToReviewState(
  request: APIRequestContext,
  config?: {
    reviewerCount?: number;
    authorCount?: number;
    conferenceDomain?: string[];
    submissionsPerAuthor?: number;
    autoAccept?: boolean;
  }
): Promise<Phase3State> {
  return await StateBuilder
    .create(request)
    .withUsers({
      reviewerCount: config?.reviewerCount || 5,
      authorCount: config?.authorCount || 3,
    })
    .withConference({
      domain: config?.conferenceDomain,
    })
    .withSubmissions({
      submissionsPerAuthor: config?.submissionsPerAuthor || 2,
    })
    .withAcceptedReviewers({
      autoAccept: config?.autoAccept !== false, // Default true
    })
    .build() as Phase3State;
}
