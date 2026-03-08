import { test, expect } from '@playwright/test';
import { createChair, createReviewers, createAuthors, executePhase0 } from '../../phases/phase-0-auth';

test.describe('Phase 0: Authentication Setup', () => {
  test('should create a Chair user successfully', async ({ request }) => {
    const chair = await createChair(request);
    
    expect(chair).toBeDefined();
    expect(chair.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/); // Valid email format
    expect(chair.first_name).toBeTruthy();
    expect(chair.last_name).toBeTruthy();
    expect(chair.access_token).toBeTruthy();
    expect(chair.domain).toContain('Computer Science');
    expect(chair.id).toBeGreaterThan(0);
    
    console.log('✓ Chair created:', chair.email);
  });

  test('should create multiple Reviewer users successfully', async ({ request }) => {
    const reviewerCount = 3;
    const reviewers = await createReviewers(request, reviewerCount);
    
    expect(reviewers).toHaveLength(reviewerCount);
    
    reviewers.forEach((reviewer, index) => {
      expect(reviewer.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(reviewer.first_name).toBeTruthy();
      expect(reviewer.last_name).toBeTruthy();
      expect(reviewer.access_token).toBeTruthy();
      expect(reviewer.domain.length).toBeGreaterThan(0);
      expect(reviewer.id).toBeGreaterThan(0);
      
      console.log(`✓ Reviewer ${index + 1} created:`, reviewer.email);
    });
    
    // Verify all emails are unique
    const emails = reviewers.map(r => r.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(reviewerCount);
  });

  test('should create multiple Author users successfully', async ({ request }) => {
    const authorCount = 2;
    const authors = await createAuthors(request, authorCount);
    
    expect(authors).toHaveLength(authorCount);
    
    authors.forEach((author, index) => {
      expect(author.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(author.first_name).toBeTruthy();
      expect(author.last_name).toBeTruthy();
      expect(author.access_token).toBeTruthy();
      expect(author.domain.length).toBeGreaterThan(0);
      expect(author.id).toBeGreaterThan(0);
      
      console.log(`✓ Author ${index + 1} created:`, author.email);
    });
    
    // Verify all emails are unique
    const emails = authors.map(a => a.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(authorCount);
  });

  test('should execute complete Phase 0 successfully', async ({ request }) => {
    const phase0State = await executePhase0(request, {
      reviewerCount: 5,
      authorCount: 3,
    });
    
    // Verify Chair
    expect(phase0State.chair).toBeDefined();
    expect(phase0State.chair.access_token).toBeTruthy();
    
    // Verify Reviewers
    expect(phase0State.reviewers).toHaveLength(5);
    phase0State.reviewers.forEach(reviewer => {
      expect(reviewer.access_token).toBeTruthy();
    });
    
    // Verify Authors
    expect(phase0State.authors).toHaveLength(3);
    phase0State.authors.forEach(author => {
      expect(author.access_token).toBeTruthy();
    });
    
    // Verify all emails are unique across all users
    const allEmails = [
      phase0State.chair.email,
      ...phase0State.reviewers.map(r => r.email),
      ...phase0State.authors.map(a => a.email),
    ];
    const uniqueEmails = new Set(allEmails);
    expect(uniqueEmails.size).toBe(allEmails.length);
    
    console.log('✓ Phase 0 complete with all users created and authenticated');
  });

  test('should handle API errors gracefully', async ({ request }) => {
    // Try to register with invalid data (empty email)
    const { registerUser } = await import('../../utils/api/auth');
    
    await expect(
      registerUser(request, {
        email: '', // Invalid email
        first_name: 'Test',
        last_name: 'User',
        domain: ['Computer Science'],
        password: 'TestPassword123!',
      })
    ).rejects.toThrow();
  });
});
