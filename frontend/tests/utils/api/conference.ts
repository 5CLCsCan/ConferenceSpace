import { APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api/v1';

export interface ConferenceConfigurations {
  start_date: string;
  end_date: string;
  abstract_submission_deadline: string;
  full_paper_submission_deadline: string;
  camera_ready_deadline?: string;
  format: 'in-person' | 'virtual' | 'hybrid';
  estimated_number_of_submission?: number;
  review_type: 'single-blind' | 'double-blind' | 'open';
  submission_type?: string;
  have_coi?: boolean;
  maximum_pages?: number;
  submission_format?: string;
  require_complete_author_profile?: boolean;
  allow_paper_withdrawls?: boolean;
}

export interface ConferenceData {
  title: string;
  acronym: string;
  description: string;
  chair: string;
  primary_contact?: number;
  area_chair?: number;
  domain: string[];
  configurations: ConferenceConfigurations;
}

export interface Conference {
  id: number;
  title: string;
  acronym: string;
  description: string;
  chair: string;
  primary_contact?: number;
  area_chair?: number;
  domain: string[];
  configurations: ConferenceConfigurations;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new conference via API
 * @param token - JWT token of the chair user
 * @param conferenceData - Conference creation data
 * @returns Created conference object
 */
export async function createConference(
  request: APIRequestContext,
  token: string,
  conferenceData: ConferenceData
): Promise<Conference> {
  const response = await request.post(`${API_BASE_URL}/conferences`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      conference: conferenceData,
    },
  });

  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to create conference: ${response.status()} - ${errorBody}`
    );
  }

  const responseData = await response.json();
  return responseData.data;
}

/**
 * Get a conference by ID via API
 * @param request - Playwright APIRequestContext
 * @param token - JWT token for authentication
 * @param conferenceId - Conference ID
 * @returns Conference object
 */
export async function getConference(
  request: APIRequestContext,
  token: string,
  conferenceId: number
): Promise<Conference> {
  const response = await request.get(`${API_BASE_URL}/conferences/${conferenceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to get conference ${conferenceId}: ${response.status()} - ${errorBody}`
    );
  }

  const responseData = await response.json();
  return responseData.data;
}

/**
 * Update a conference via API
 * @param request - Playwright APIRequestContext
 * @param token - JWT token of the chair user
 * @param conferenceId - Conference ID
 * @param updates - Partial conference data to update
 * @returns Updated conference object
 */
export async function updateConference(
  request: APIRequestContext,
  token: string,
  conferenceId: number,
  updates: Partial<ConferenceData>
): Promise<Conference> {
  const response = await request.put(`${API_BASE_URL}/conferences/${conferenceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      conference: updates,
    },
  });

  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to update conference ${conferenceId}: ${response.status()} - ${errorBody}`
    );
  }

  const responseData = await response.json();
  return responseData.data;
}

/**
 * Delete a conference via API
 * @param request - Playwright APIRequestContext
 * @param token - JWT token of the chair user
 * @param conferenceId - Conference ID
 */
export async function deleteConference(
  request: APIRequestContext,
  token: string,
  conferenceId: number
): Promise<void> {
  const response = await request.delete(`${API_BASE_URL}/conferences/${conferenceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to delete conference ${conferenceId}: ${response.status()} - ${errorBody}`
    );
  }
}

/**
 * Generate random conference data using Faker
 * @param chairEmail - Email of the chair user
 * @param config - Optional configuration overrides
 * @returns ConferenceData object
 */
export function generateConferenceData(
  chairEmail: string,
  config?: {
    domain?: string[];
    format?: 'in-person' | 'virtual' | 'hybrid';
    reviewType?: 'single-blind' | 'double-blind' | 'open';
  }
): ConferenceData {
  const year = new Date().getFullYear();
  const conferenceType = faker.helpers.arrayElement([
    'International Conference',
    'Symposium',
    'Workshop',
    'Congress',
  ]);
  
  const topic = faker.helpers.arrayElement([
    'Artificial Intelligence',
    'Machine Learning',
    'Computer Vision',
    'Natural Language Processing',
    'Data Science',
    'Software Engineering',
    'Cybersecurity',
    'Cloud Computing',
  ]);

  const title = `${conferenceType} on ${topic}`;
  const acronym = generateAcronym(conferenceType, topic, year);
  
  // Generate dates (conference in 6 months, deadlines before that)
  const startDate = faker.date.future({ years: 0.5 });
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + faker.number.int({ min: 2, max: 5 }));
  
  const abstractDeadline = new Date(startDate);
  abstractDeadline.setMonth(abstractDeadline.getMonth() - 4);
  
  const fullPaperDeadline = new Date(startDate);
  fullPaperDeadline.setMonth(fullPaperDeadline.getMonth() - 3);
  
  const cameraReadyDeadline = new Date(startDate);
  cameraReadyDeadline.setMonth(cameraReadyDeadline.getMonth() - 1);

  return {
    title,
    acronym,
    description: faker.lorem.paragraph(),
    chair: chairEmail,
    domain: config?.domain || [topic, 'Computer Science', 'Research'],
    configurations: {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      abstract_submission_deadline: abstractDeadline.toISOString(),
      full_paper_submission_deadline: fullPaperDeadline.toISOString(),
      camera_ready_deadline: cameraReadyDeadline.toISOString(),
      format: config?.format || faker.helpers.arrayElement(['in-person', 'virtual', 'hybrid']),
      estimated_number_of_submission: faker.number.int({ min: 100, max: 500 }),
      review_type: config?.reviewType || 'double-blind',
      submission_type: 'full-paper',
      have_coi: true,
      maximum_pages: faker.number.int({ min: 6, max: 12 }),
      submission_format: 'PDF',
      require_complete_author_profile: true,
      allow_paper_withdrawls: true,
    },
  };
}

/**
 * Transition conference status (triggers auto-assign when moving to 'reviewing')
 * @param request - Playwright APIRequestContext
 * @param token - JWT token of the chair user
 * @param conferenceId - Conference ID
 * @param newStatus - New status ('open' | 'reviewing' | 'completed')
 * @returns Status transition response
 */
export async function transitionConferenceStatus(
  request: APIRequestContext,
  token: string,
  conferenceId: number,
  newStatus: 'open' | 'reviewing' | 'completed'
): Promise<{ message: string; status: string }> {
  const response = await request.put(`${API_BASE_URL}/conferences/${conferenceId}/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      conference_id: conferenceId,
      new_status: newStatus,
    },
  });

  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to transition conference ${conferenceId} to ${newStatus}: ${response.status()} - ${errorBody}`
    );
  }

  const responseData = await response.json();
  return responseData.data;
}

/**
 * Trigger auto-assign for a conference
 * @param request - Playwright APIRequestContext
 * @param token - JWT token
 * @param conferenceId - Conference ID
 * @param config - Auto-assign configuration
 * @returns Auto-assign result with assignment details
 */
export interface AutoAssignConfig {
  min_reviewers_per_paper: number;
  max_reviewers_per_paper: number;
  max_papers_per_reviewer?: number;
  min_score_threshold?: number;
  dry_run?: boolean;
}

export interface AutoAssignResult {
  total_submissions: number;
  total_reviewers: number;
  total_assignments: number;
  average_score: number;
  unassigned_papers: number[];
  reviewer_load: Record<number, number>;
  assignments?: any[];
}

export async function triggerAutoAssign(
  request: APIRequestContext,
  token: string,
  conferenceId: number,
  config: AutoAssignConfig = {
    min_reviewers_per_paper: 2,
    max_reviewers_per_paper: 3,
    max_papers_per_reviewer: 10,
    min_score_threshold: 0,
    dry_run: false,
  }
): Promise<AutoAssignResult> {
  const response = await request.post(`${API_BASE_URL}/conferences/${conferenceId}/submissions/auto-assign`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: config,
  });

  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to trigger auto-assign for conference ${conferenceId}: ${response.status()} - ${errorBody}`
    );
  }

  const responseData = await response.json();
  return responseData.data;
}

/**
 * Generate a conference acronym from title components
 * @param conferenceType - Type of conference
 * @param topic - Main topic
 * @param year - Year
 * @returns Acronym string (unique with timestamp)
 */
function generateAcronym(conferenceType: string, topic: string, year: number): string {
  const typeAcronym = conferenceType
    .split(' ')
    .map(word => word[0])
    .join('');
  
  const topicAcronym = topic
    .split(' ')
    .map(word => word[0])
    .join('');
  
  // Add timestamp to ensure uniqueness across test runs
  const timestamp = Date.now().toString().slice(-6);
  
  return `${typeAcronym}${topicAcronym}${year}_${timestamp}`;
}
