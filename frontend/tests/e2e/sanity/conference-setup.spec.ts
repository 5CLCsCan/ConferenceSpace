import { test, expect } from '@playwright/test';
import { createChair } from '../../phases/phase-0-auth';
import { setupConferencePhase, executePhase1 } from '../../phases/phase-1-conference';
import { StateBuilder, createBasicTestState } from '../../utils/state/state-builder';
import { getConference } from '../../utils/api/conference';

test.describe('Phase 1: Conference Setup', () => {
  test('should create a conference successfully', async ({ request }) => {
    // Create a chair user
    const chair = await createChair(request);
    
    // Create conference
    const conference = await setupConferencePhase(request, chair);
    
    expect(conference).toBeDefined();
    expect(conference.id).toBeGreaterThan(0);
    expect(conference.title).toBeTruthy();
    expect(conference.acronym).toBeTruthy();
    expect(conference.chair).toBe(chair.email);
    expect(conference.domain).toBeDefined();
    expect(conference.domain.length).toBeGreaterThan(0);
    
    // Verify configurations
    expect(conference.configurations).toBeDefined();
    expect(conference.configurations.start_date).toBeTruthy();
    expect(conference.configurations.end_date).toBeTruthy();
    expect(conference.configurations.abstract_submission_deadline).toBeTruthy();
    expect(conference.configurations.full_paper_submission_deadline).toBeTruthy();
    expect(conference.configurations.format).toMatch(/^(in-person|virtual|hybrid)$/);
    expect(conference.configurations.review_type).toMatch(/^(single-blind|double-blind|open)$/);
    
    console.log('✓ Conference created:', conference.title);
    console.log('  Acronym:', conference.acronym);
    console.log('  Chair:', conference.chair);
    console.log('  Format:', conference.configurations.format);
  });

  test('should create conference with custom domain', async ({ request }) => {
    const chair = await createChair(request);
    
    const customDomain = ['Quantum Computing', 'Physics', 'Mathematics'];
    const conference = await setupConferencePhase(request, chair, {
      domain: customDomain,
    });
    
    expect(conference.domain).toEqual(customDomain);
    console.log('✓ Conference created with custom domain:', conference.domain);
  });

  test('should create conference with custom format', async ({ request }) => {
    const chair = await createChair(request);
    
    const conference = await setupConferencePhase(request, chair, {
      format: 'virtual',
    });
    
    expect(conference.configurations.format).toBe('virtual');
    console.log('✓ Conference created with virtual format');
  });

  test('should retrieve conference by ID', async ({ request }) => {
    const chair = await createChair(request);
    const conference = await setupConferencePhase(request, chair);
    
    // Retrieve the conference
    const retrievedConference = await getConference(request, chair.access_token, conference.id);
    
    expect(retrievedConference.id).toBe(conference.id);
    expect(retrievedConference.title).toBe(conference.title);
    expect(retrievedConference.acronym).toBe(conference.acronym);
    expect(retrievedConference.chair).toBe(conference.chair);
    
    console.log('✓ Conference retrieved successfully:', retrievedConference.title);
  });

  test('should execute complete Phase 1 successfully', async ({ request }) => {
    // Create Phase 0 state first
    const { executePhase0 } = await import('../../phases/phase-0-auth');
    const phase0State = await executePhase0(request, {
      reviewerCount: 3,
      authorCount: 2,
    });
    
    // Execute Phase 1
    const phase1State = await executePhase1(request, phase0State);
    
    // Verify Phase 0 data is preserved
    expect(phase1State.chair).toBeDefined();
    expect(phase1State.reviewers).toHaveLength(3);
    expect(phase1State.authors).toHaveLength(2);
    
    // Verify Phase 1 data
    expect(phase1State.conference).toBeDefined();
    expect(phase1State.conference.id).toBeGreaterThan(0);
    expect(phase1State.conference.chair).toBe(phase1State.chair.email);
    
    console.log('✓ Phase 1 complete:');
    console.log('  Chair:', phase1State.chair.email);
    console.log('  Reviewers:', phase1State.reviewers.length);
    console.log('  Authors:', phase1State.authors.length);
    console.log('  Conference:', phase1State.conference.title);
  });

  test('should use StateBuilder to create users and conference', async ({ request }) => {
    const state = await StateBuilder
      .create(request)
      .withUsers({ reviewerCount: 5, authorCount: 3 })
      .withConference({ domain: ['AI', 'Machine Learning'] })
      .build();
    
    // Type assertion since we know we created a conference
    const phase1State = state as any;
    
    expect(phase1State.chair).toBeDefined();
    expect(phase1State.reviewers).toHaveLength(5);
    expect(phase1State.authors).toHaveLength(3);
    expect(phase1State.conference).toBeDefined();
    expect(phase1State.conference.domain).toContain('AI');
    expect(phase1State.conference.domain).toContain('Machine Learning');
    
    console.log('✓ StateBuilder created complete test state:');
    console.log('  Users:', 1 + phase1State.reviewers.length + phase1State.authors.length);
    console.log('  Conference:', phase1State.conference.title);
  });

  test('should use StateBuilder with buildPhase1 method', async ({ request }) => {
    const state = await StateBuilder
      .create(request)
      .withUsers({ reviewerCount: 2, authorCount: 1 })
      .buildPhase1();
    
    expect(state.chair).toBeDefined();
    expect(state.reviewers).toHaveLength(2);
    expect(state.authors).toHaveLength(1);
    expect(state.conference).toBeDefined();
    
    console.log('✓ StateBuilder.buildPhase1() successful');
  });

  test('should use createBasicTestState helper', async ({ request }) => {
    const state = await createBasicTestState(request, {
      reviewerCount: 4,
      authorCount: 2,
      conferenceDomain: ['Cybersecurity', 'Network Security'],
    });
    
    expect(state.chair).toBeDefined();
    expect(state.reviewers).toHaveLength(4);
    expect(state.authors).toHaveLength(2);
    expect(state.conference).toBeDefined();
    expect(state.conference.domain).toContain('Cybersecurity');
    
    console.log('✓ createBasicTestState() helper successful');
  });

  test('should handle API errors gracefully', async ({ request }) => {
    const chair = await createChair(request);
    
    // Try to create conference with invalid token
    const { createConference, generateConferenceData } = await import('../../utils/api/conference');
    const conferenceData = generateConferenceData(chair.email);
    
    await expect(
      createConference(request, 'invalid-token', conferenceData)
    ).rejects.toThrow();
  });
});
