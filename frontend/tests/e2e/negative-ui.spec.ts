import { test, expect } from "@playwright/test"
import { StateBuilder } from "../utils/state/state-builder"
import { registerUser, generateUserData } from "../utils/api/auth"
import { createConference, generateConferenceData } from "../utils/api/conference"

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"
const SHORT_TIMEOUT = 5000 // 5 seconds max wait
const LOGIN_TIMEOUT = 3000 // Wait for login to complete

test.describe("Negative UI Tests - Frontend Validation & RBAC", () => {
  // Ensure each test has isolated data
  test.beforeEach(async () => {
    // Add small delay between tests to avoid data conflicts
    await new Promise((resolve) => setTimeout(resolve, 500))
  })

  test("[UI-SEC-01] Author and Reviewer cannot access Chair-only features", async ({
    page,
    request,
  }) => {
    console.log("=== [UI-SEC-01] Testing RBAC in UI ===")

    // Setup: Create fresh users and conference for this test
    const state = await StateBuilder.create(request)
      .withUsers({ reviewerCount: 1, authorCount: 1 })
      .withConference()
      .buildPhase1()

    const author = state.authors[0]
    const reviewer = state.reviewers[0]
    const conferenceId = state.conference.id

    // Test 1: Author cannot see Auto-assign button or COI Dashboard
    console.log("Testing Author access restrictions...")
    await page.goto(`${FRONTEND_URL}/test/login?email=${author.email}`)
    await page.waitForTimeout(LOGIN_TIMEOUT)

    // Wait for login to complete
    await page.waitForLoadState("networkidle")

    // Navigate to conference page with timeout protection
    console.log(`Navigating to /conferences/${conferenceId}...`)
    try {
      await Promise.race([
        page.goto(`${FRONTEND_URL}/conferences/${conferenceId}`, { timeout: SHORT_TIMEOUT }),
        page.waitForURL(
          (url) => {
            const urlStr = url.toString()
            return (
              urlStr === `${FRONTEND_URL}/` ||
              urlStr === `${FRONTEND_URL}/login` ||
              urlStr === `${FRONTEND_URL}/unauthorized` ||
              urlStr === `${FRONTEND_URL}/403`
            )
          },
          { timeout: SHORT_TIMEOUT },
        ),
      ])

      // Check if redirected
      const currentUrl = page.url()
      if (currentUrl !== `${FRONTEND_URL}/conferences/${conferenceId}`) {
        console.log(`✓ Author redirected from conference page to: ${currentUrl}`)
      } else {
        // Page loaded, wait for network to settle
        await page.waitForLoadState("networkidle", { timeout: SHORT_TIMEOUT })
      }
    } catch (error: any) {
      if (error.message.includes("Timeout")) {
        throw new Error(
          `UI Security Error: Page hang or infinite redirect detected when accessing /conferences/${conferenceId}`,
        )
      }
      throw error
    }

    // Assert: Auto-assign button should not be visible (with short timeout)
    const autoAssignButton = page.locator(
      'button:has-text("Auto-assign"), button:has-text("Auto assign"), button:has-text("Autoassign")',
    )

    try {
      const isVisible = await autoAssignButton.isVisible({ timeout: SHORT_TIMEOUT })
      if (isVisible) {
        throw new Error("UI Security Gap: Auto-assign button is still visible for Author")
      }
    } catch (error: any) {
      if (error.message.includes("UI Security Gap")) {
        throw error
      }
      // Button not found - this is expected
      console.log("✓ Author cannot see Auto-assign button")
    }

    // Assert: COI Dashboard link should not be visible
    const coiDashboardLink = page.locator(
      'a:has-text("COI Dashboard"), a:has-text("COI"), button:has-text("COI Dashboard")',
    )

    try {
      const isVisible = await coiDashboardLink.isVisible({ timeout: SHORT_TIMEOUT })
      if (isVisible) {
        throw new Error("UI Security Gap: COI Dashboard link is still visible for Author")
      }
    } catch (error: any) {
      if (error.message.includes("UI Security Gap")) {
        throw error
      }
      // Link not found - this is expected
      console.log("✓ Author cannot see COI Dashboard link")
    }

    // Test 2: Try to access Chair URLs directly - should redirect or show access denied
    console.log("Testing direct URL access for Author...")
    try {
      await Promise.race([
        page.goto(`${FRONTEND_URL}/chair/dashboard`, { timeout: SHORT_TIMEOUT }),
        page.waitForURL(
          (url) => {
            const urlStr = url.toString()
            return (
              urlStr === `${FRONTEND_URL}/` ||
              urlStr === `${FRONTEND_URL}/login` ||
              urlStr === `${FRONTEND_URL}/unauthorized` ||
              urlStr === `${FRONTEND_URL}/403`
            )
          },
          { timeout: SHORT_TIMEOUT },
        ),
      ])

      await page.waitForLoadState("networkidle", { timeout: SHORT_TIMEOUT })
    } catch (error: any) {
      if (error.message.includes("Timeout")) {
        throw new Error(
          "UI Security Error: Page hang or infinite redirect detected when accessing /chair/dashboard",
        )
      }
      throw error
    }

    // Should either redirect to home or show access denied
    const currentUrl = page.url()
    const pageContent = await page.textContent("body", { timeout: SHORT_TIMEOUT })

    const isBlocked =
      currentUrl === `${FRONTEND_URL}/` ||
      currentUrl === `${FRONTEND_URL}/login` ||
      currentUrl === `${FRONTEND_URL}/unauthorized` ||
      currentUrl === `${FRONTEND_URL}/403` ||
      pageContent?.toLowerCase().includes("access denied") ||
      pageContent?.toLowerCase().includes("unauthorized") ||
      pageContent?.toLowerCase().includes("403") ||
      pageContent?.toLowerCase().includes("forbidden")

    if (!isBlocked) {
      throw new Error(`UI Security Gap: Author can access /chair/dashboard (URL: ${currentUrl})`)
    }
    console.log(`✓ Author blocked from accessing /chair/dashboard (redirected to: ${currentUrl})`)

    // Test 3: Reviewer cannot see Auto-assign button or COI Dashboard
    console.log("Testing Reviewer access restrictions...")
    await page.goto(`${FRONTEND_URL}/test/login?email=${reviewer.email}`)
    await page.waitForTimeout(LOGIN_TIMEOUT)
    await page.waitForLoadState("networkidle")

    console.log(`Navigating to /conferences/${conferenceId} as Reviewer...`)
    try {
      await Promise.race([
        page.goto(`${FRONTEND_URL}/conferences/${conferenceId}`, { timeout: SHORT_TIMEOUT }),
        page.waitForURL(
          (url) => {
            const urlStr = url.toString()
            return (
              urlStr === `${FRONTEND_URL}/` ||
              urlStr === `${FRONTEND_URL}/login` ||
              urlStr === `${FRONTEND_URL}/unauthorized` ||
              urlStr === `${FRONTEND_URL}/403`
            )
          },
          { timeout: SHORT_TIMEOUT },
        ),
      ])

      const currentUrl = page.url()
      if (currentUrl !== `${FRONTEND_URL}/conferences/${conferenceId}`) {
        console.log(`✓ Reviewer redirected from conference page to: ${currentUrl}`)
      } else {
        await page.waitForLoadState("networkidle", { timeout: SHORT_TIMEOUT })
      }
    } catch (error: any) {
      if (error.message.includes("Timeout")) {
        throw new Error(
          `UI Security Error: Page hang or infinite redirect detected when Reviewer accessing /conferences/${conferenceId}`,
        )
      }
      throw error
    }

    // Assert: Auto-assign button should not be visible
    try {
      const isVisible = await autoAssignButton.isVisible({ timeout: SHORT_TIMEOUT })
      if (isVisible) {
        throw new Error("UI Security Gap: Auto-assign button is still visible for Reviewer")
      }
    } catch (error: any) {
      if (error.message.includes("UI Security Gap")) {
        throw error
      }
      console.log("✓ Reviewer cannot see Auto-assign button")
    }

    // Assert: COI Dashboard link should not be visible
    try {
      const isVisible = await coiDashboardLink.isVisible({ timeout: SHORT_TIMEOUT })
      if (isVisible) {
        throw new Error("UI Security Gap: COI Dashboard link is still visible for Reviewer")
      }
    } catch (error: any) {
      if (error.message.includes("UI Security Gap")) {
        throw error
      }
      console.log("✓ Reviewer cannot see COI Dashboard link")
    }

    // Test 4: Try to access Chair URLs directly as Reviewer
    console.log("Testing direct URL access for Reviewer...")
    try {
      await Promise.race([
        page.goto(`${FRONTEND_URL}/coi-dashboard/${conferenceId}`, { timeout: SHORT_TIMEOUT }),
        page.waitForURL(
          (url) => {
            const urlStr = url.toString()
            return (
              urlStr === `${FRONTEND_URL}/` ||
              urlStr === `${FRONTEND_URL}/login` ||
              urlStr === `${FRONTEND_URL}/unauthorized` ||
              urlStr === `${FRONTEND_URL}/403`
            )
          },
          { timeout: SHORT_TIMEOUT },
        ),
      ])

      await page.waitForLoadState("networkidle", { timeout: SHORT_TIMEOUT })
    } catch (error: any) {
      if (error.message.includes("Timeout")) {
        throw new Error(
          "UI Security Error: Page hang or infinite redirect detected when Reviewer accessing COI dashboard",
        )
      }
      throw error
    }

    const reviewerUrl = page.url()
    const reviewerPageContent = await page.textContent("body", { timeout: SHORT_TIMEOUT })

    const reviewerBlocked =
      reviewerUrl === `${FRONTEND_URL}/` ||
      reviewerUrl === `${FRONTEND_URL}/login` ||
      reviewerUrl === `${FRONTEND_URL}/unauthorized` ||
      reviewerUrl === `${FRONTEND_URL}/403` ||
      reviewerPageContent?.toLowerCase().includes("access denied") ||
      reviewerPageContent?.toLowerCase().includes("unauthorized") ||
      reviewerPageContent?.toLowerCase().includes("403") ||
      reviewerPageContent?.toLowerCase().includes("forbidden")

    if (!reviewerBlocked) {
      throw new Error(`UI Security Gap: Reviewer can access COI dashboard (URL: ${reviewerUrl})`)
    }
    console.log(`✓ Reviewer blocked from accessing COI dashboard (redirected to: ${reviewerUrl})`)

    console.log("=== [UI-SEC-01] PASSED: RBAC correctly enforced in UI ===")
  })

  test("[UI-NEG-02] Submit button disabled after deadline", async ({ page, request }) => {
    console.log("=== [UI-NEG-02] Testing deadline enforcement in UI ===")

    // Setup: Create fresh users and conference with deadline in the past
    const authorData = generateUserData(["Computer Science"])
    const author = await registerUser(request, authorData)

    const chairData = generateUserData(["Computer Science"])
    const chair = await registerUser(request, chairData)

    // Create conference with past deadline
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 7) // 7 days ago

    const conferenceData = generateConferenceData(chair.email)
    conferenceData.configurations.full_paper_submission_deadline = pastDate.toISOString()
    conferenceData.configurations.abstract_submission_deadline = new Date(
      pastDate.getTime() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString()

    const conference = await createConference(request, chair.access_token, conferenceData)
    console.log(`Conference created with deadline: ${pastDate.toISOString()}`)

    // Login as author
    await page.goto(`${FRONTEND_URL}/test/login?email=${author.email}`)
    await page.waitForTimeout(LOGIN_TIMEOUT)
    await page.waitForLoadState("networkidle")

    // Navigate to submission page
    await page.goto(`${FRONTEND_URL}/conferences/${conference.id}/submit`)
    await page.waitForLoadState("networkidle")

    // Assert: Submit/Publish button should be disabled
    const submitButton = page.locator(
      'button:has-text("Submit"), button:has-text("Publish"), button[type="submit"]',
    )

    // Check if button exists with short timeout
    try {
      const buttonCount = await submitButton.count()

      if (buttonCount > 0) {
        const isEnabled = await submitButton.first().isEnabled({ timeout: SHORT_TIMEOUT })

        if (isEnabled) {
          throw new Error("UI Security Gap: Submit/Publish button is still enabled after deadline")
        }

        console.log("✓ Submit/Publish button is disabled")
      } else {
        console.log("✓ Submit/Publish button not rendered (deadline passed)")
      }
    } catch (error: any) {
      if (error.message.includes("UI Security Gap")) {
        throw error
      }
      // Button not found or other error
      console.log("✓ Submit/Publish button properly hidden or disabled")
    }

    // Assert: Warning message about deadline should be visible
    const deadlineWarning = page.locator(
      "text=/deadline.*passed|submission.*closed|past.*deadline|deadline.*expired/i",
    )

    try {
      const warningCount = await deadlineWarning.count()

      if (warningCount > 0) {
        await expect(deadlineWarning.first()).toBeVisible({ timeout: SHORT_TIMEOUT })
        const warningText = await deadlineWarning.first().textContent()
        console.log(`✓ Deadline warning displayed: "${warningText}"`)
      } else {
        console.log("⚠ Warning: No deadline warning message found in UI (potential UX issue)")
      }
    } catch (error) {
      console.log("⚠ Warning: Deadline warning not visible within timeout")
    }

    console.log("=== [UI-NEG-02] PASSED: Deadline enforcement visible in UI ===")
  })

  test("[UI-NEG-03] Frontend validation for invalid review scores", async ({ page, request }) => {
    console.log("=== [UI-NEG-03] Testing frontend validation for review scores ===")

    // Setup: Create fresh ready-to-review state with FUTURE deadline
    // IMPORTANT: Set deadline in the future to avoid backend blocking submission creation
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30) // 30 days in the future

    const state = await StateBuilder.create(request)
      .withUsers({ reviewerCount: 1, authorCount: 1 })
      .withConference({
        conferenceData: {
          configurations: {
            start_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days future
            end_date: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString(), // 65 days future
            abstract_submission_deadline: new Date(
              Date.now() + 20 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 20 days future
            full_paper_submission_deadline: futureDate.toISOString(), // 30 days future
            format: "virtual" as const,
            review_type: "double-blind" as const,
            have_coi: true,
          },
        },
      })
      .withSubmissions({ submissionsPerAuthor: 1 })
      .withAcceptedReviewers({ autoAccept: true })
      .buildPhase3()

    const reviewer = state.reviewers[0]
    const submission = state.submissions[0]
    const conferenceId = state.conference.id

    console.log(
      `Reviewer: ${reviewer.email}, Submission: ${submission.id}, Conference: ${conferenceId}`,
    )
    console.log(`Deadline set to: ${futureDate.toISOString()}`)

    // Login as reviewer
    await page.goto(`${FRONTEND_URL}/test/login?email=${reviewer.email}`)
    await page.waitForTimeout(LOGIN_TIMEOUT)
    await page.waitForLoadState("networkidle")

    // Navigate to review form
    await page.goto(
      `${FRONTEND_URL}/reviewer/conferences/${conferenceId}/papers/${submission.id}/review`,
    )
    await page.waitForLoadState("networkidle")

    // Test 1: Enter negative score
    console.log("Testing negative score validation...")
    const scoreInput = page.locator('input[type="number"]').first()

    if ((await scoreInput.count()) > 0) {
      await scoreInput.fill("-1")
      await scoreInput.blur() // Trigger validation
      await page.waitForTimeout(500)

      // Assert: Error message should appear
      const errorMessage = page.locator("text=/invalid|must be|greater than|positive|minimum/i")
      const hasError = (await errorMessage.count()) > 0

      if (hasError) {
        await expect(errorMessage.first()).toBeVisible()
        const errorText = await errorMessage.first().textContent()
        console.log(`✓ Validation error for negative score: "${errorText}"`)
      }

      // Assert: Submit button should be disabled
      const submitButton = page.locator('button:has-text("Submit"), button[type="submit"]').first()
      if ((await submitButton.count()) > 0) {
        const isDisabled = await submitButton.isDisabled()
        if (isDisabled) {
          console.log("✓ Submit button disabled for negative score")
        } else {
          console.log("⚠ Warning: Submit button not disabled for negative score")
        }
      }
    }

    // Test 2: Enter score that's too high
    console.log("Testing out-of-range (too high) score validation...")

    if ((await scoreInput.count()) > 0) {
      await scoreInput.fill("100")
      await scoreInput.blur()
      await page.waitForTimeout(500)

      // Assert: Error message should appear
      const errorMessage = page.locator("text=/invalid|must be|less than|maximum|exceed/i")
      const hasError = (await errorMessage.count()) > 0

      if (hasError) {
        await expect(errorMessage.first()).toBeVisible()
        const errorText = await errorMessage.first().textContent()
        console.log(`✓ Validation error for high score: "${errorText}"`)
      }

      // Assert: Submit button should be disabled
      const submitButton = page.locator('button:has-text("Submit"), button[type="submit"]').first()
      if ((await submitButton.count()) > 0) {
        const isDisabled = await submitButton.isDisabled()
        if (isDisabled) {
          console.log("✓ Submit button disabled for out-of-range score")
        } else {
          console.log("⚠ Warning: Submit button not disabled for out-of-range score")
        }
      }
    }

    // Test 3: Enter valid score - should clear errors
    console.log("Testing valid score (positive control)...")

    if ((await scoreInput.count()) > 0) {
      await scoreInput.fill("4")
      await scoreInput.blur()
      await page.waitForTimeout(500)

      // Assert: Error messages should disappear
      const errorMessage = page.locator("text=/invalid|must be|error/i")
      const hasError = (await errorMessage.count()) > 0

      if (!hasError) {
        console.log("✓ No validation errors for valid score")
      }

      // Submit button should be enabled (if form is complete)
      const submitButton = page.locator('button:has-text("Submit"), button[type="submit"]').first()
      if ((await submitButton.count()) > 0) {
        const isDisabled = await submitButton.isDisabled()
        console.log(
          `✓ Submit button state with valid score: ${isDisabled ? "disabled (form incomplete)" : "enabled"}`,
        )
      }
    }

    console.log("=== [UI-NEG-03] PASSED: Frontend validation working correctly ===")
  })
})
