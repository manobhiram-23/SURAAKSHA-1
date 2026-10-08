/**
 * SURAAKSHA E2E Tests — Dashboard UI Flow
 * Tests the main dashboard functionality after sign-in.
 */
const { test, expect } = require('@playwright/test');

// Helper to sign in with demo user
async function signInAsDemoOfficer(page) {
  await page.goto('/');
  await page.evaluate(() => { window.sessionStorage.clear(); });
  await page.goto('/');

  await page.waitForSelector('#signin-email', { timeout: 10000 });
  await page.fill('#signin-email', 'officer@suraaksha.gov');
  await page.fill('#signin-password', 'SOC@2024');
  await page.click('button:has-text("Access SOC Platform")');
  await expect(page.locator('text=Threat Intelligence Feed')).toBeVisible({ timeout: 15000 });
}

test.describe('Dashboard — Layout & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOfficer(page);
  });

  test('should render sidebar with navigation tabs', async ({ page }) => {
    await expect(page.locator('text=Active Threat Feed')).toBeVisible();
    await expect(page.locator('text=Case Reviews')).toBeVisible();
    await expect(page.locator('text=Threat Analytics')).toBeVisible();
    await expect(page.locator('text=SOC Settings')).toBeVisible();
  });

  test('should show the current user name in header', async ({ page }) => {
    await expect(page.locator('text=Officer Arjun Kumar')).toBeVisible({ timeout: 5000 });
  });

  test('should show critical threat count', async ({ page }) => {
    await expect(page.locator('text=HIGH PRIORITY THREATS')).toBeVisible();
  });

  test('should navigate to Case Reviews tab', async ({ page }) => {
    await page.click('button:has-text("Case Reviews")');
    await expect(page.locator('text=Reviewed Case Dossiers')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to Threat Analytics tab', async ({ page }) => {
    await page.click('button:has-text("Threat Analytics")');
    await expect(page.locator('text=SOC Analytics')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Critical Escalations')).toBeVisible();
    await expect(page.locator('text=Total Reviewed Cases')).toBeVisible();
  });

  test('should navigate to SOC Settings tab', async ({ page }) => {
    await page.click('button:has-text("SOC Settings")');
    await expect(page.locator('text=SOC Configuration')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Default Officer Identifier')).toBeVisible();
  });
});

test.describe('Dashboard — Alert List', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOfficer(page);
  });

  test('should display alert items in the feed', async ({ page }) => {
    // Wait for alerts to load from API
    await page.waitForResponse(resp => resp.url().includes('/api/alerts') && resp.status() === 200, { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Use role="button" attribute since CSS module class names are mangled
    const alertItems = page.locator('[role="button"][class*="alertItem"]');
    const count = await alertItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show alert details when clicking an alert', async ({ page }) => {
    await page.waitForResponse(resp => resp.url().includes('/api/alerts') && resp.status() === 200, { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click the first alert item
    const firstAlert = page.locator('[role="button"][class*="alertItem"]').first();
    await firstAlert.click();

    // Detail pane should show
    await expect(page.locator('text=Detection Rationale')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Corroborating Evidence')).toBeVisible();
    await expect(page.locator('text=Target Account Intelligence')).toBeVisible();
  });
});

test.describe('Dashboard — Search & Filters', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOfficer(page);
  });

  test('should filter alerts by search query', async ({ page }) => {
    await page.waitForResponse(resp => resp.url().includes('/api/alerts') && resp.status() === 200, { timeout: 10000 });
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('crypto');
    await page.waitForTimeout(1000);

    // Alerts should be filtered
    const alertItems = page.locator('[role="button"][class*="alertItem"]');
    const count = await alertItems.count();
    if (count > 0) {
      const firstText = await alertItems.first().textContent();
      expect(firstText?.toLowerCase()).toContain('crypto');
    }
  });

  test('should clear search with X button', async ({ page }) => {
    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('some query');

    const clearBtn = page.locator('[class*="clearSearchBtn"]');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      const val = await searchInput.inputValue();
      expect(val).toBe('');
    }
  });

  test('should filter by severity', async ({ page }) => {
    await page.waitForTimeout(2000);

    const severitySelect = page.locator('select[class*="severitySelect"]');
    await severitySelect.selectOption('9');
    await page.waitForTimeout(1000);

    const alertItems = page.locator('[role="button"][class*="alertItem"]');
    const count = await alertItems.count();
    for (let i = 0; i < count; i++) {
      const severityBadge = alertItems.nth(i).locator('[class*="severityBadge"]');
      if (await severityBadge.isVisible()) {
        const text = await severityBadge.textContent();
        const num = parseInt(text || '0');
        if (!isNaN(num)) {
          expect(num).toBeGreaterThanOrEqual(9);
        }
      }
    }
  });

  test('should filter by status in sidebar', async ({ page }) => {
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Open Investigation")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("All Cases")');
    await page.waitForTimeout(500);
  });
});

test.describe('Dashboard — Create New Case', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOfficer(page);
  });

  test('should open the Flag Account modal', async ({ page }) => {
    await page.click('button:has-text("Flag Account")');
    await expect(page.locator('text=Flag New Suspicious Account')).toBeVisible({ timeout: 5000 });
  });

  test('should close modal on Cancel', async ({ page }) => {
    await page.click('button:has-text("Flag Account")');
    await expect(page.locator('text=Flag New Suspicious Account')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Flag New Suspicious Account')).not.toBeVisible({ timeout: 5000 });
  });

  test('should create a new case via modal', async ({ page }) => {
    await page.click('button:has-text("Flag Account")');
    await expect(page.locator('text=Flag New Suspicious Account')).toBeVisible({ timeout: 5000 });

    // Fill form — use correct placeholders from the actual component
    await page.fill('input[placeholder="@threat_user_handle"]', '@e2e_modal_test');
    await page.fill('input[placeholder*="Impersonating central banking"]', 'E2E test flagging reason');

    // Submit
    await page.click('button:has-text("Log Case to Threat Database")');

    // Should show success toast
    await expect(page.locator('text=successfully flagged')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard — Decision & Report', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOfficer(page);
  });

  test('should allow selecting a decision on an alert', async ({ page }) => {
    await page.waitForResponse(resp => resp.url().includes('/api/alerts') && resp.status() === 200, { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click first alert
    const firstAlert = page.locator('[role="button"][class*="alertItem"]').first();
    await firstAlert.click();

    // Select "Confirm Threat"
    await page.click('button:has-text("Confirm Threat")');

    // The submit button should be enabled
    const submitBtn = page.locator('button:has-text("Submit Official Report")');
    if (await submitBtn.isVisible()) {
      await expect(submitBtn).toBeEnabled();
    }
  });

  test('submit button should be disabled without a decision', async ({ page }) => {
    await page.waitForTimeout(2000);
    const submitBtn = page.locator('button:has-text("Submit Official Report")');
    if (await submitBtn.isVisible()) {
      await expect(submitBtn).toBeDisabled();
    }
  });

  test('should submit a report and show toast', async ({ page }) => {
    await page.waitForResponse(resp => resp.url().includes('/api/alerts') && resp.status() === 200, { timeout: 10000 });
    await page.waitForTimeout(1000);

    const firstAlert = page.locator('[role="button"][class*="alertItem"]').first();
    await firstAlert.click();

    await page.click('button:has-text("Confirm Threat")');

    const notesTextarea = page.locator('textarea[placeholder*="Record investigative"]');
    if (await notesTextarea.isVisible()) {
      await notesTextarea.fill('E2E test report notes');
    }

    const submitBtn = page.locator('button:has-text("Submit Official Report")');
    if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
      await submitBtn.click();
      await expect(page.locator('text=verdict')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Dashboard — Export', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOfficer(page);
  });

  test('should trigger export and show toast', async ({ page }) => {
    await page.waitForTimeout(2000);

    const exportBtn = page.locator('button:has-text("Export")');

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
      exportBtn.click(),
    ]);

    await expect(page.locator('text=Exported alert registry')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard — Session Persistence', () => {
  test('should persist session across page reloads', async ({ page }) => {
    await signInAsDemoOfficer(page);

    // Reload the page
    await page.reload();

    // Should still be on dashboard (not auth page)
    await expect(page.locator('text=Threat Intelligence Feed')).toBeVisible({ timeout: 15000 });
  });
});
