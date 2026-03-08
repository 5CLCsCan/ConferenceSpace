import { Page, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Login Page Object Model
 */
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${FRONTEND_URL}/login`);
  }

  async login(email: string, password: string) {
    // Fill in login form
    await this.page.fill('input[name="email"], input[type="email"]', email);
    await this.page.fill('input[name="password"], input[type="password"]', password);
    
    // Click login button
    await this.page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    
    // Wait for navigation to dashboard
    await this.page.waitForURL(/\/dashboard/, { timeout: 10000 });
  }

  async isLoggedIn(): Promise<boolean> {
    return this.page.url().includes('/dashboard');
  }
}

/**
 * Conference Dashboard Page Object Model
 */
export class ConferenceDashboardPage {
  constructor(private page: Page) {}

  async goto(conferenceId: number) {
    await this.page.goto(`${FRONTEND_URL}/dashboard/conference/${conferenceId}`);
  }

  async waitForLoad() {
    // Wait for the page to load (with timeout to avoid hanging on polling requests)
    await this.page.waitForLoadState('domcontentloaded');
    // Give a short time for initial renders
    await this.page.waitForTimeout(1000);
  }

  async getConferenceTitle(): Promise<string> {
    const title = await this.page.locator('h1, h2').first().textContent();
    return title || '';
  }

  async navigateToTab(tabName: string) {
    // Click on tab (Overview, Submissions, Reviewers, etc.) with short timeout
    const tab = this.page.locator(`button:has-text("${tabName}"), a:has-text("${tabName}")`).first();
    await tab.click({ timeout: 3000 });
    await this.page.waitForTimeout(500); // Wait for tab content to load
  }

  async clickAutoAssign() {
    // Look for Auto Assign button with various possible texts
    const autoAssignButton = this.page.locator(
      'button:has-text("Auto Assign"), ' +
      'button:has-text("Auto-Assign"), ' +
      'button:has-text("Assign Reviewers"), ' +
      'button:has-text("Assign"), ' +
      '[data-testid="auto-assign-button"]'
    ).first();

    await autoAssignButton.click();
  }

  async waitForAutoAssignSuccess(timeout: number = 30000) {
    // Wait for success message or notification
    await expect(
      this.page.locator(
        'text=/assigned successfully/i, ' +
        'text=/assignment.*complete/i, ' +
        '[data-testid="auto-assign-success"], ' +
        '.toast:has-text("success"), ' +
        '[role="status"]:has-text("success")'
      ).first()
    ).toBeVisible({ timeout });
  }

  async getAssignmentCount(): Promise<number> {
    // Try to find assignment count in various places
    const assignmentElements = await this.page.locator(
      '.assignment-row, ' +
      '[data-testid="assignment"], ' +
      'tr:has-text("Reviewer")'
    ).count();

    return assignmentElements;
  }

  async getReviewerAssignments(): Promise<Array<{ reviewer: string; paper: string }>> {
    const assignments: Array<{ reviewer: string; paper: string }> = [];
    
    const rows = this.page.locator('.assignment-row, [data-testid="assignment"]');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const reviewer = await row.locator('[data-reviewer], .reviewer-name').textContent() || '';
      const paper = await row.locator('[data-paper], .paper-title').textContent() || '';
      
      assignments.push({ reviewer: reviewer.trim(), paper: paper.trim() });
    }

    return assignments;
  }

  async hasAutoAssignButton(): Promise<boolean> {
    const button = this.page.locator(
      'button:has-text("Auto Assign"), ' +
      'button:has-text("Auto-Assign"), ' +
      'button:has-text("Assign Reviewers"), ' +
      '[data-testid="auto-assign-button"]'
    );

    // Use short timeout to quickly detect if button doesn't exist
    try {
      await button.first().waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Conference Settings Page Object Model
 */
export class ConferenceSettingsPage {
  constructor(private page: Page) {}

  async goto(conferenceId: number) {
    await this.page.goto(`${FRONTEND_URL}/dashboard/conference/${conferenceId}?tab=settings`);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
  }

  async changeStatus(newStatus: 'open' | 'reviewing' | 'completed') {
    // Find and click the status dropdown trigger
    const statusTrigger = this.page.locator('#status, [id="status"]').first();
    await statusTrigger.click({ timeout: 5000 });

    // Wait for dropdown options to appear and select the new status
    const option = this.page.locator(`[role="option"]:has-text("${newStatus}"), [data-value="${newStatus}"]`).first();
    await option.click({ timeout: 5000 });
  }

  async saveSettings() {
    // Click save button
    const saveButton = this.page.locator('button[type="submit"]:has-text("Save"), button:has-text("Save Changes")').first();
    await saveButton.click({ timeout: 5000 });

    // Wait for success toast or confirmation
    try {
      await this.page.waitForSelector('[role="status"]:has-text("success"), .toast:has-text("success"), [data-state="open"]:has-text("updated")', { timeout: 10000 });
    } catch {
      // Toast might have different text, continue
    }
  }

  async getStatusMessage(): Promise<string | null> {
    // Look for any message about auto-assign or status change
    const message = this.page.locator('[role="status"], .toast, [data-state="open"]').first();
    try {
      return await message.textContent({ timeout: 5000 });
    } catch {
      return null;
    }
  }
}

/**
 * Helper function to login as a user
 * @param page - Playwright Page
 * @param email - User email
 * @param password - User password
 */
export async function loginAs(page: Page, email: string, password: string = 'TestPassword123!') {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
}

/**
 * Helper function to navigate to conference dashboard
 * @param page - Playwright Page
 * @param conferenceId - Conference ID
 */
export async function navigateToConference(page: Page, conferenceId: number) {
  const dashboard = new ConferenceDashboardPage(page);
  await dashboard.goto(conferenceId);
  await dashboard.waitForLoad();
}

/**
 * Helper function to perform auto-assign
 * @param page - Playwright Page
 * @param conferenceId - Conference ID
 * @returns Number of assignments created
 */
export async function performAutoAssign(page: Page, conferenceId: number): Promise<number> {
  const dashboard = new ConferenceDashboardPage(page);
  
  // Navigate to conference
  await dashboard.goto(conferenceId);
  await dashboard.waitForLoad();
  
  // Try to navigate to Reviewers or Assignments tab if it exists
  try {
    await dashboard.navigateToTab('Reviewers');
  } catch {
    // Tab might not exist, continue
  }
  
  // Click auto-assign button
  await dashboard.clickAutoAssign();
  
  // Wait for success
  await dashboard.waitForAutoAssignSuccess();
  
  // Get assignment count
  return await dashboard.getAssignmentCount();
}
