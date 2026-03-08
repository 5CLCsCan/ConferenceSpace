import { test, expect } from '@playwright/test';
import { executePhase0 } from '../../phases/phase-0-auth';
import { executePhase1 } from '../../phases/phase-1-conference';
import { setupSubmissionPhase, executePhase2 } from '../../phases/phase-2-submissions';
import { StateBuilder, createCompleteTestState } from '../../utils/state/state-builder';
import { getSubmission, listSubmissions } from '../../utils/api/submission';

test.describe('Phase 2: Submission Setup', () => {
  test('should create submissions for authors', async ({ request }) => {
    // Create Phase 0 and Phase 1 first
    const phase0State = await executePhase0(request, {
      reviewerCount: 2,
      authorCount: 2,
    });
    const phase1State = await executePhase1(request, phase0State);
    
    // Create submissions
    const submissions = await setupSubmissionPhase(
      request,
      phase1State.conference,
      phase1State.authors,
      { submissionsPerAuthor: 1 }
    );
    
    expect(submissions).toHaveLength(2); // 2 authors × 1 submission
    
    submissions.forEach((submission, index) => {
      expect(submission.id).toBeGreaterThan(0);
      expect(submission.title).toBeTruthy();
      expect(submission.abstract).toBeTruthy();
      expect(submission.conference_id).toBe(phase1State.conference.id);
      expect(submission.status).toBe('published');
      expect(submission.domain).toBeDefined();
      expect(submission.domain.length).toBeGreaterThan(0);
      
      console.log(`✓ Submission ${index + 1}:`, submission.title);
      console.log('  Author:', submission.author);
      console.log('  Status:', submission.status);
    });
  });

  test('should create multiple submissions per author', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 1,
      authorCount: 2,
    });
    const phase1State = await executePhase1(request, phase0State);
    
    const submissions = await setupSubmissionPhase(
      request,
      phase1State.conference,
      phase1State.authors,
      { submissionsPerAuthor: 3 }
    );
    
    expect(submissions).toHaveLength(6); // 2 authors × 3 submissions
    
    // Verify each author has 3 submissions
    const author1Submissions = submissions.filter(s => s.author === phase1State.authors[0].email);
    const author2Submissions = submissions.filter(s => s.author === phase1State.authors[1].email);
    
    expect(author1Submissions).toHaveLength(3);
    expect(author2Submissions).toHaveLength(3);
    
    console.log('✓ Author 1 submissions:', author1Submissions.length);
    console.log('✓ Author 2 submissions:', author2Submissions.length);
  });

  test('should create draft submissions', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 1,
      authorCount: 1,
    });
    const phase1State = await executePhase1(request, phase0State);
    
    const submissions = await setupSubmissionPhase(
      request,
      phase1State.conference,
      phase1State.authors,
      { 
        submissionsPerAuthor: 1,
        status: 'draft',
        withFiles: false, // Draft doesn't require file
      }
    );
    
    expect(submissions).toHaveLength(1);
    expect(submissions[0].status).toBe('draft');
    
    console.log('✓ Draft submission created:', submissions[0].title);
  });

  test('should retrieve submission by ID', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 1,
      authorCount: 1,
    });
    const phase1State = await executePhase1(request, phase0State);
    const submissions = await setupSubmissionPhase(
      request,
      phase1State.conference,
      phase1State.authors,
      { submissionsPerAuthor: 1 }
    );
    
    const submission = submissions[0];
    
    // Retrieve the submission
    const retrieved = await getSubmission(
      request,
      phase1State.authors[0].access_token,
      phase1State.conference.id,
      submission.id
    );
    
    expect(retrieved.id).toBe(submission.id);
    expect(retrieved.title).toBe(submission.title);
    expect(retrieved.author).toBe(submission.author);
    
    console.log('✓ Submission retrieved:', retrieved.title);
  });

  test('should list submissions for conference', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 1,
      authorCount: 2,
    });
    const phase1State = await executePhase1(request, phase0State);
    await setupSubmissionPhase(
      request,
      phase1State.conference,
      phase1State.authors,
      { submissionsPerAuthor: 2 }
    );
    
    // List all submissions
    const { submissions, total } = await listSubmissions(
      request,
      phase1State.chair.access_token,
      phase1State.conference.id
    );
    
    expect(total).toBe(4); // 2 authors × 2 submissions
    expect(submissions.length).toBe(4);
    
    console.log('✓ Total submissions:', total);
  });

  test('should filter submissions by author', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 1,
      authorCount: 2,
    });
    const phase1State = await executePhase1(request, phase0State);
    await setupSubmissionPhase(
      request,
      phase1State.conference,
      phase1State.authors,
      { submissionsPerAuthor: 2 }
    );
    
    // Filter by first author
    const { submissions, total } = await listSubmissions(
      request,
      phase1State.chair.access_token,
      phase1State.conference.id,
      { author: phase1State.authors[0].email }
    );
    
    expect(total).toBe(2);
    expect(submissions.length).toBe(2);
    submissions.forEach(sub => {
      expect(sub.author).toBe(phase1State.authors[0].email);
    });
    
    console.log('✓ Filtered submissions for author:', phase1State.authors[0].email);
  });

  test('should execute complete Phase 2 successfully', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 3,
      authorCount: 2,
    });
    const phase1State = await executePhase1(request, phase0State);
    const phase2State = await executePhase2(request, phase1State, {
      submissionsPerAuthor: 2,
    });
    
    // Verify Phase 0 and Phase 1 data preserved
    expect(phase2State.chair).toBeDefined();
    expect(phase2State.reviewers).toHaveLength(3);
    expect(phase2State.authors).toHaveLength(2);
    expect(phase2State.conference).toBeDefined();
    
    // Verify Phase 2 data
    expect(phase2State.submissions).toBeDefined();
    expect(phase2State.submissions.length).toBe(4); // 2 authors × 2 submissions
    
    console.log('✓ Phase 2 complete:');
    console.log('  Chair:', phase2State.chair.email);
    console.log('  Reviewers:', phase2State.reviewers.length);
    console.log('  Authors:', phase2State.authors.length);
    console.log('  Conference:', phase2State.conference.title);
    console.log('  Submissions:', phase2State.submissions.length);
  });

  test('should use StateBuilder to create complete test state', async ({ request }) => {
    const state = await StateBuilder
      .create(request)
      .withUsers({ reviewerCount: 3, authorCount: 2 })
      .withConference({ domain: ['AI', 'ML'] })
      .withSubmissions({ submissionsPerAuthor: 2 })
      .build();
    
    const phase2State = state as any;
    
    expect(phase2State.chair).toBeDefined();
    expect(phase2State.reviewers).toHaveLength(3);
    expect(phase2State.authors).toHaveLength(2);
    expect(phase2State.conference).toBeDefined();
    expect(phase2State.submissions).toBeDefined();
    expect(phase2State.submissions.length).toBe(4);
    
    console.log('✓ StateBuilder created complete test state with submissions');
  });

  test('should use StateBuilder with buildPhase2 method', async ({ request }) => {
    const state = await StateBuilder
      .create(request)
      .withUsers({ reviewerCount: 2, authorCount: 1 })
      .buildPhase2();
    
    expect(state.chair).toBeDefined();
    expect(state.reviewers).toHaveLength(2);
    expect(state.authors).toHaveLength(1);
    expect(state.conference).toBeDefined();
    expect(state.submissions).toBeDefined();
    expect(state.submissions.length).toBeGreaterThan(0);
    
    console.log('✓ StateBuilder.buildPhase2() successful');
  });

  test('should use createCompleteTestState helper', async ({ request }) => {
    const state = await createCompleteTestState(request, {
      reviewerCount: 3,
      authorCount: 2,
      conferenceDomain: ['Cybersecurity'],
      submissionsPerAuthor: 3,
    });
    
    expect(state.chair).toBeDefined();
    expect(state.reviewers).toHaveLength(3);
    expect(state.authors).toHaveLength(2);
    expect(state.conference).toBeDefined();
    expect(state.submissions).toHaveLength(6); // 2 authors × 3 submissions
    
    console.log('✓ createCompleteTestState() helper successful');
  });

  test('should handle API errors gracefully', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 1,
      authorCount: 1,
    });
    const phase1State = await executePhase1(request, phase0State);
    
    // Try to create submission with invalid token
    const { createSubmission, generateSubmissionData } = await import('../../utils/api/submission');
    const { getOrCreateDummyPDF } = await import('../../utils/file-helper');
    
    const submissionData = generateSubmissionData(['AI'], 'published');
    const filePath = getOrCreateDummyPDF();
    
    await expect(
      createSubmission(
        request,
        'invalid-token',
        phase1State.conference.id,
        submissionData,
        filePath
      )
    ).rejects.toThrow();
  });
});
