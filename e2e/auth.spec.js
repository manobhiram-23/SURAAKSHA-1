/**
 * SURAAKSHA E2E Tests — Auth UI Flow
 * Tests sign-in, sign-up, and sign-out using the browser.
 */
const { test, expect } = require('@playwright/test');

test.describe('Auth Page — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.sessionStorage.clear();
      window.localStorage.removeItem('suraaksha.registeredAccounts');
    });
    await page.goto('/');
  });

  test('should show the auth page when not logged in', async ({ page }) => {
    await expect(page.locator('text=SURAAKSHA').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Officer Sign In').first()).toBeVisible();
  });

  test('should show Sign In and Create Account tabs', async ({ page }) => {
    await expect(page.locator('button:has-text("Sign In")').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Create Account")').first()).toBeVisible();
  });

  test('should show demo credentials section', async ({ page }) => {
    await expect(page.locator('text=Demo credentials')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=officer@suraaksha.gov')).toBeVisible();
    await expect(page.locator('text=admin@suraaksha.gov')).toBeVisible();
  });

  test('should show error on empty form submit', async ({ page }) => {
    await page.waitForSelector('#signin-email', { timeout: 10000 });
    await page.click('button:has-text("Access SOC Platform")');
    await expect(page.locator('text=Email is required')).toBeVisible({ timeout: 5000 });
  });

  test('should show error on wrong credentials', async ({ page }) => {
    await page.waitForSelector('#signin-email', { timeout: 10000 });
    await page.fill('#signin-email', 'wrong@email.com');
    await page.fill('#signin-password', 'wrongpassword');
    await page.click('button:has-text("Access SOC Platform")');
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Auth Page — Demo Sign In', () => {
  test('should sign in with demo officer credentials', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { window.sessionStorage.clear(); });
    await page.goto('/');

    await page.waitForSelector('#signin-email', { timeout: 10000 });
    await page.fill('#signin-email', 'officer@suraaksha.gov');
    await page.fill('#signin-password', 'SOC@2024');
    await page.click('button:has-text("Access SOC Platform")');

    // Wait for dashboard to appear (the success message may flash quickly)
    await expect(page.locator('text=Threat Intelligence Feed')).toBeVisible({ timeout: 15000 });
  });

  test('should use the "Use" button to fill demo credentials', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { window.sessionStorage.clear(); });
    await page.goto('/');

    await page.waitForSelector('text=Demo credentials', { timeout: 10000 });
    const useButtons = page.locator('button:has-text("Use")');
    await useButtons.first().click();
    const emailValue = await page.inputValue('#signin-email');
    expect(emailValue).toBe('officer@suraaksha.gov');
  });
});

test.describe('Auth Page — Sign Up Flow', () => {
  test('should switch to sign up tab', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.sessionStorage.clear();
      window.localStorage.removeItem('suraaksha.registeredAccounts');
    });
    await page.goto('/');

    await page.waitForSelector('button:has-text("Create Account")', { timeout: 10000 });
    await page.locator('button:has-text("Create Account")').first().click();

    await expect(page.locator('text=Full Name')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Badge / ID')).toBeVisible();
    await expect(page.locator('text=Work Email')).toBeVisible();
  });

  test('should validate required fields on sign up', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.sessionStorage.clear();
      window.localStorage.removeItem('suraaksha.registeredAccounts');
    });
    await page.goto('/');

    await page.waitForSelector('button:has-text("Create Account")', { timeout: 10000 });
    await page.locator('button:has-text("Create Account")').first().click();

    await page.click('button:has-text("Continue")');
    await expect(page.locator('text=Full name is required')).toBeVisible({ timeout: 5000 });
  });

  test('should create a new local account and sign in', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.sessionStorage.clear();
      window.localStorage.removeItem('suraaksha.registeredAccounts');
    });
    await page.goto('/');

    // Switch to Sign Up
    await page.waitForSelector('button:has-text("Create Account")', { timeout: 10000 });
    await page.locator('button:has-text("Create Account")').first().click();

    // Fill the form — use a valid-looking email (no underscores before @)
    const uniqueSuffix = Date.now().toString().slice(-6);
    const testEmail = `e2etest${uniqueSuffix}@testdomain.com`;

    await page.fill('#signup-name', 'E2E Test Officer');
    await page.fill('#signup-badge', 'E2E-9999');
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', 'TestPass123!');
    await page.fill('#signup-confirm', 'TestPass123!');

    // Accept terms checkbox
    const agreeCheckbox = page.locator('input[type="checkbox"]');
    if (await agreeCheckbox.isVisible()) {
      await agreeCheckbox.check();
    }

    // Submit
    await page.click('button:has-text("Continue")');

    // Wait for result banner
    await page.waitForSelector('[class*="alertBanner"]', { timeout: 10000 });
    const bannerText = await page.locator('[class*="alertBanner"]').textContent();

    // Supabase may rate-limit signup emails — that's an infra limit, not an app bug
    if (bannerText.includes('rate limit')) {
      console.log('Supabase rate limit hit — skipping sign-in portion (not an app bug)');
      test.skip();
      return;
    }

    expect(bannerText).toContain('Account created');

    // Switch to sign in tab
    await page.locator('button:has-text("Sign In")').first().click();

    // Sign in with the new account
    await page.fill('#signin-email', testEmail);
    await page.fill('#signin-password', 'TestPass123!');
    await page.click('button:has-text("Access SOC Platform")');

    // Should redirect to dashboard
    await expect(page.locator('text=Threat Intelligence Feed')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Auth Page — Sign Out', () => {
  test('should sign out and return to auth page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { window.sessionStorage.clear(); });
    await page.goto('/');

    await page.waitForSelector('#signin-email', { timeout: 10000 });
    await page.fill('#signin-email', 'officer@suraaksha.gov');
    await page.fill('#signin-password', 'SOC@2024');
    await page.click('button:has-text("Access SOC Platform")');
    await expect(page.locator('text=Threat Intelligence Feed')).toBeVisible({ timeout: 15000 });

    // Click sign out
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('text=Officer Sign In').first()).toBeVisible({ timeout: 10000 });
  });
});
