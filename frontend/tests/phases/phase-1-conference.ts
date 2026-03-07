import { APIRequestContext } from '@playwright/test';
import { RegisteredUser } from '../utils/api/auth';
import {
  createConference,
  generateConferenceData,
  Conference,
  ConferenceData,
} from '../utils/api/conference';

export interface Phase1State {
  chair: RegisteredUser;
  reviewers: RegisteredUser[];
  authors: RegisteredUser[];
  conference: Conference;
}

export interface Phase1Config {
  conferenceData?: Partial<ConferenceData>;
  domain?: string[];
  format?: 'in-person' | 'virtual' | 'hybrid';
  reviewType?: 'single-blind' | 'double-blind' | 'open';
}

/**
 * Setup conference phase - creates a conference with the chair user
 * @param request - Playwright APIRequestContext
 * @param chairUser - Chair user from Phase 0
 * @param config - Optional configuration for conference
 * @returns Created conference object
 */
export async function setupConferencePhase(
  request: APIRequestContext,
  chairUser: RegisteredUser,
  config?: Phase1Config
): Promise<Conference> {
  console.log(`Creating conference for chair: ${chairUser.email}`);

  // Generate dynamic conference data
  const conferenceData = generateConferenceData(chairUser.email, {
    domain: config?.domain,
    format: config?.format,
    reviewType: config?.reviewType,
  });

  // Apply any custom overrides
  if (config?.conferenceData) {
    Object.assign(conferenceData, config.conferenceData);
  }

  try {
    const conference = await createConference(
      request,
      chairUser.access_token,
      conferenceData
    );

    console.log(`✓ Conference created: ${conference.title} (ID: ${conference.id})`);
    return conference;
  } catch (error) {
    console.error('Failed to create conference:', error);
    throw error;
  }
}

/**
 * Execute Phase 1: Create conference from Phase 0 state
 * @param request - Playwright APIRequestContext
 * @param phase0State - State from Phase 0 (users)
 * @param config - Optional configuration for conference
 * @returns Phase 1 state with conference
 */
export async function executePhase1(
  request: APIRequestContext,
  phase0State: { chair: RegisteredUser; reviewers: RegisteredUser[]; authors: RegisteredUser[] },
  config?: Phase1Config
): Promise<Phase1State> {
  console.log('=== Phase 1: Conference Setup ===');

  const startTime = Date.now();

  const conference = await setupConferencePhase(request, phase0State.chair, config);

  const duration = Date.now() - startTime;
  console.log(`Phase 1 completed in ${duration}ms`);
  console.log(`Conference: ${conference.title} (${conference.acronym})`);

  return {
    ...phase0State,
    conference,
  };
}
