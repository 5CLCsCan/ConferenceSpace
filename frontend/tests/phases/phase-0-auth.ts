import { APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { registerUser, generateUserData, RegisteredUser } from '../utils/api/auth';

export interface Phase0State {
  chair: RegisteredUser;
  reviewers: RegisteredUser[];
  authors: RegisteredUser[];
}

/**
 * Create a Chair user with dynamic data
 * @param request - Playwright APIRequestContext
 * @returns Registered chair user
 */
export async function createChair(request: APIRequestContext): Promise<RegisteredUser> {
  const chairData = generateUserData([
    'Computer Science',
    'Conference Management',
    'Academic Publishing',
  ]);
  
  console.log(`Creating Chair: ${chairData.email}`);
  
  try {
    return await registerUser(request, chairData);
  } catch (error) {
    console.error('Failed to create chair:', error);
    throw error;
  }
}

/**
 * Create multiple Reviewer users with dynamic data
 * @param request - Playwright APIRequestContext
 * @param count - Number of reviewers to create
 * @param domains - Optional array of domain specializations
 * @returns Array of registered reviewer users
 */
export async function createReviewers(
  request: APIRequestContext,
  count: number = 5,
  domains?: string[][]
): Promise<RegisteredUser[]> {
  const reviewers: RegisteredUser[] = [];
  
  const defaultDomains = [
    ['Artificial Intelligence', 'Machine Learning'],
    ['Natural Language Processing', 'Deep Learning'],
    ['Computer Vision', 'Image Processing'],
    ['Data Science', 'Big Data'],
    ['Software Engineering', 'Cloud Computing'],
    ['Cybersecurity', 'Network Security'],
    ['Human-Computer Interaction', 'UX Design'],
    ['Database Systems', 'Distributed Systems'],
  ];
  
  for (let i = 0; i < count; i++) {
    const reviewerDomain = domains?.[i] || defaultDomains[i % defaultDomains.length];
    const reviewerData = generateUserData(reviewerDomain);
    
    console.log(`Creating Reviewer ${i + 1}/${count}: ${reviewerData.email}`);
    
    try {
      const reviewer = await registerUser(request, reviewerData);
      reviewers.push(reviewer);
    } catch (error) {
      console.error(`Failed to create reviewer ${i + 1}:`, error);
      throw error;
    }
  }
  
  return reviewers;
}

/**
 * Create multiple Author users with dynamic data
 * @param request - Playwright APIRequestContext
 * @param count - Number of authors to create
 * @param domains - Optional array of domain specializations
 * @returns Array of registered author users
 */
export async function createAuthors(
  request: APIRequestContext,
  count: number = 3,
  domains?: string[][]
): Promise<RegisteredUser[]> {
  const authors: RegisteredUser[] = [];
  
  const defaultDomains = [
    ['Machine Learning', 'Neural Networks'],
    ['Artificial Intelligence', 'Robotics'],
    ['Data Mining', 'Analytics'],
    ['Computer Vision', 'Pattern Recognition'],
    ['Natural Language Processing', 'Computational Linguistics'],
  ];
  
  for (let i = 0; i < count; i++) {
    const authorDomain = domains?.[i] || defaultDomains[i % defaultDomains.length];
    const authorData = generateUserData(authorDomain);
    
    console.log(`Creating Author ${i + 1}/${count}: ${authorData.email}`);
    
    try {
      const author = await registerUser(request, authorData);
      authors.push(author);
    } catch (error) {
      console.error(`Failed to create author ${i + 1}:`, error);
      throw error;
    }
  }
  
  return authors;
}

/**
 * Execute Phase 0: Create all necessary users (Chair, Reviewers, Authors)
 * @param request - Playwright APIRequestContext
 * @param config - Configuration for user creation
 * @returns Phase 0 state with all created users
 */
export async function executePhase0(
  request: APIRequestContext,
  config: {
    reviewerCount?: number;
    authorCount?: number;
    reviewerDomains?: string[][];
    authorDomains?: string[][];
  } = {}
): Promise<Phase0State> {
  console.log('=== Phase 0: Authentication & User Generation ===');
  
  const startTime = Date.now();
  
  // Create users in parallel for better performance
  const [chair, reviewers, authors] = await Promise.all([
    createChair(request),
    createReviewers(request, config.reviewerCount, config.reviewerDomains),
    createAuthors(request, config.authorCount, config.authorDomains),
  ]);
  
  const duration = Date.now() - startTime;
  console.log(`Phase 0 completed in ${duration}ms`);
  console.log(`Created: 1 Chair, ${reviewers.length} Reviewers, ${authors.length} Authors`);
  
  return {
    chair,
    reviewers,
    authors,
  };
}
