import { test, expect } from '@playwright/test';
import { executePhase0 } from '../../phases/phase-0-auth';
import { executePhase1 } from '../../phases/phase-1-conference';
import { executePhase2 } from '../../phases/phase-2-submissions';
import { setupReviewerPhase, executePhase3 } from '../../phases/phase-3-reviewers';
import { StateBuilder, createReadyToReviewState } from '../../utils/state/state-builder';
import { listReviewers, getReviewer } from '../../utils/api/reviewer';

test.describe('Phase 3: Reviewer Management', () => {
  test('should invite reviewers to conference', async ({ request }) => {
    // Create Phase 0, 1, and 2 first
    const phase0State = await executePhase0(request, {
      reviewerCount: 3,
      authorCount: 1,
    });
    const phase1State = await executePhase1(request, phase0State);
    const phase2State = await executePhase2(request, phase1State, {
      submissionsPerAuthor: 1,
    });
    
    // Invite reviewers (without auto-accept)
    const invitations = await setupReviewerPhase(
      request,
      phase2State.conference,
      phase2State.chair,
      phase2State.reviewers,
      { autoAccept: false }
    );
    
    expect(invitations).toHaveLength(3);
    
    invitations.forEach((invitation, index) => {
      expect(invitation.id).toBeGreaterThan(0);
      expect(invitation.email).toBe(phase2State.reviewers[index].email);
      expect(invitation.conference_id).toBe(phase2State.conference.id);
      expect(invitation.status).toBe('pending');
      
      console.log(`✓ Reviewer ${index + 1} invited:`, invitation.email);
    });
  });

  test('should auto-accept all reviewer invitations', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 3,
      authorCount: 1,
    });
    const phase1State = await executePhase1(request, phase0State);
    const phase2State = await executePhase2(request, phase1State, {
      submissionsPerAuthor: 1,
    });
    
    // Invite and auto-accept
    const invitations = await setupReviewerPhase(
      request,
      phase2State.conference,
      phase2State.chair,
      phase2State.reviewers,
      { autoAccept: true }
    );
    
    expect(invitations).toHaveLength(3);
    
    invitations.forEach((invitation, index) => {
      expect(invitation.status).toBe('accepted');
      console.log(`✓ Reviewer ${index + 1} accepted:`, invitation.email);
    });
  });

  test('should accept specific reviewers only', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 4,
      authorCount: 1,
    });
    const phase1State = await executePhase1(request, phase0State);
    const phase2State = await executePhase2(request, phase1State, {
      submissionsPerAuthor: 1,
    });
    
    // Accept only reviewers at index 0 and 2
    const invitations = await setupReviewerPhase(
      request,
      phase2State.conference,
      phase2State.chair,
      phase2State.reviewers,
      { 
        autoAccept: false,
        acceptedReviewers: [0, 2],
      }
    );
    
    expect(invitations).toHaveLength(4);
    expect(invitations[0].status).toBe('accepted');
    expect(invitations[1].status).toBe('pending');
    expect(invitations[2].status).toBe('accepted');
    expect(invitations[3].status).toBe('pending');
    
    console.log('✓ Selective reviewer acceptance successful');
  });

  test('should retrieve reviewer by ID', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 2,
      authorCount: 1,
    });
    const phase1State = await executePhase1(request, phase0State);
    const phase2State = await executePhase2(request, phase1State, {
      submissionsPerAuthor: 1,
    });
    
    const invitations = await setupReviewerPhase(
      request,
      phase2State.conference,
      phase2State.chair,
      phase2State.reviewers,
      { autoAccept: true }
    );
    
    const invitation = invitations[0];
    
    // Retrieve the reviewer
    const retrieved = await getReviewer(
      request,
      phase2State.chair.access_token,
      phase2State.conference.id,
      invitation.id
    );
    
    expect(retrieved.id).toBe(invitation.id);
    expect(retrieved.email).toBe(invitation.email);
    expect(retrieved.status).toBe('accepted');
    
    console.log('✓ Reviewer retrieved:', retrieved.email);
  });

  test('should list reviewers for conference', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 5,
      authorCount: 1,
    });
    const phase1State = await executePhase1(request, phase0State);
    const phase2State = await executePhase2(request, phase1State, {
      submissionsPerAuthor: 1,
    });
    
    await setupReviewerPhase(
      request,
      phase2State.conference,
      phase2State.chair,
      phase2State.reviewers,
      { autoAccept: true }
    );
    
    // List all reviewers
    const { reviewers, total } = await listReviewers(
      request,
      phase2State.chair.access_token,
      phase2State.conference.id
    );
    
    expect(total).toBe(5);
    expect(reviewers.length).toBe(5);
    
    console.log('✓ Total reviewers:', total);
  });

  test('should filter reviewers by status', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 4,
      authorCount: 1,
    });
    const phase1State = await executePhase1(request, phase0State);
    const phase2State = await executePhase2(request, phase1State, {
      submissionsPerAuthor: 1,
    });
    
    // Accept only 2 reviewers
    await setupReviewerPhase(
      request,
      phase2State.conference,
      phase2State.chair,
      phase2State.reviewers,
      { 
        autoAccept: false,
        acceptedReviewers: [0, 1],
      }
    );
    
    // Filter by accepted status
    const { reviewers: accepted, total: acceptedTotal } = await listReviewers(
      request,
      phase2State.chair.access_token,
      phase2State.conference.id,
      { status: 'accepted' }
    );
    
    expect(acceptedTotal).toBe(2);
    expect(accepted.length).toBe(2);
    accepted.forEach(r => expect(r.status).toBe('accepted'));
    
    // Filter by pending status
    const { reviewers: pending, total: pendingTotal } = await listReviewers(
      request,
      phase2State.chair.access_token,
      phase2State.conference.id,
      { status: 'pending' }
    );
    
    expect(pendingTotal).toBe(2);
    expect(pending.length).toBe(2);
    pending.forEach(r => expect(r.status).toBe('pending'));
    
    console.log('✓ Accepted reviewers:', acceptedTotal);
    console.log('✓ Pending reviewers:', pendingTotal);
  });

  test('should execute complete Phase 3 successfully', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 3,
      authorCount: 2,
    });
    const phase1State = await executePhase1(request, phase0State);
    const phase2State = await executePhase2(request, phase1State, {
      submissionsPerAuthor: 2,
    });
    const phase3State = await executePhase3(request, phase2State, {
      autoAccept: true,
    });
    
    // Verify Phase 0, 1, and 2 data preserved
    expect(phase3State.chair).toBeDefined();
    expect(phase3State.reviewers).toHaveLength(3);
    expect(phase3State.authors).toHaveLength(2);
    expect(phase3State.conference).toBeDefined();
    expect(phase3State.submissions).toHaveLength(4); // 2 authors × 2 submissions
    
    // Verify Phase 3 data
    expect(phase3State.reviewerInvitations).toBeDefined();
    expect(phase3State.reviewerInvitations.length).toBe(3);
    
    const acceptedCount = phase3State.reviewerInvitations.filter(
      r => r.status === 'accepted'
    ).length;
    expect(acceptedCount).toBe(3);
    
    console.log('✓ Phase 3 complete:');
    console.log('  Chair:', phase3State.chair.email);
    console.log('  Reviewers:', phase3State.reviewers.length);
    console.log('  Authors:', phase3State.authors.length);
    console.log('  Conference:', phase3State.conference.title);
    console.log('  Submissions:', phase3State.submissions.length);
    console.log('  Reviewer Invitations:', phase3State.reviewerInvitations.length);
    console.log('  Accepted Reviewers:', acceptedCount);
  });

  test('should use StateBuilder to create ready-to-review state', async ({ request }) => {
    const state = await StateBuilder
      .create(request)
      .withUsers({ reviewerCount: 5, authorCount: 3 })
      .withConference({ domain: ['AI', 'ML'] })
      .withSubmissions({ submissionsPerAuthor: 2 })
      .withAcceptedReviewers()
      .build();
    
    const phase3State = state as any;
    
    expect(phase3State.chair).toBeDefined();
    expect(phase3State.reviewers).toHaveLength(5);
    expect(phase3State.authors).toHaveLength(3);
    expect(phase3State.conference).toBeDefined();
    expect(phase3State.submissions).toHaveLength(6);
    expect(phase3State.reviewerInvitations).toBeDefined();
    expect(phase3State.reviewerInvitations.length).toBe(5);
    
    const acceptedCount = phase3State.reviewerInvitations.filter(
      (r: any) => r.status === 'accepted'
    ).length;
    expect(acceptedCount).toBe(5);
    
    console.log('✓ StateBuilder created ready-to-review state');
  });

  test('should use StateBuilder with buildPhase3 method', async ({ request }) => {
    const state = await StateBuilder
      .create(request)
      .withUsers({ reviewerCount: 3, authorCount: 2 })
      .buildPhase3();
    
    expect(state.chair).toBeDefined();
    expect(state.reviewers).toHaveLength(3);
    expect(state.authors).toHaveLength(2);
    expect(state.conference).toBeDefined();
    expect(state.submissions).toBeDefined();
    expect(state.reviewerInvitations).toBeDefined();
    
    console.log('✓ StateBuilder.buildPhase3() successful');
  });

  test('should use createReadyToReviewState helper', async ({ request }) => {
    const state = await createReadyToReviewState(request, {
      reviewerCount: 4,
      authorCount: 2,
      conferenceDomain: ['Cybersecurity'],
      submissionsPerAuthor: 3,
    });
    
    expect(state.chair).toBeDefined();
    expect(state.reviewers).toHaveLength(4);
    expect(state.authors).toHaveLength(2);
    expect(state.conference).toBeDefined();
    expect(state.submissions).toHaveLength(6); // 2 authors × 3 submissions
    expect(state.reviewerInvitations).toHaveLength(4);
    
    const acceptedCount = state.reviewerInvitations.filter(
      r => r.status === 'accepted'
    ).length;
    expect(acceptedCount).toBe(4);
    
    console.log('✓ createReadyToReviewState() helper successful');
  });

  test('should handle API errors gracefully', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 1,
      authorCount: 1,
    });
    const phase1State = await executePhase1(request, phase0State);
    
    // Try to invite with invalid token
    const { batchInviteReviewers } = await import('../../utils/api/reviewer');
    
    await expect(
      batchInviteReviewers(
        request,
        'invalid-token',
        phase1State.conference.id,
        [{ email: phase0State.reviewers[0].email }]
      )
    ).rejects.toThrow();
  });
});
