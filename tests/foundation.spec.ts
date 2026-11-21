import { test, expect } from '@playwright/test';
test('owner signs in, updates preferences, and revokes the session', async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Email or username').fill('owner');
  await page.getByLabel('Password', { exact: true }).fill('test-password-not-for-production');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: /A little more clarity/ })).toBeVisible();
  await expect(page.getByText('A clear page for today')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
  await page.getByRole('link', { name: 'Personalize workspace' }).click();
  await page.getByLabel('Display name').fill('My private workspace');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByText('Profile updated', { exact: true })).toBeVisible();
  await page.getByLabel('Timezone', { exact: true }).selectOption('UTC');
  await page.getByLabel('Theme', { exact: true }).selectOption('light');
  await page.getByRole('button', { name: 'Save preferences', exact: true }).click();
  await expect(page.getByText('Preferences saved', { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.getByLabel('Display name')).toHaveValue('My private workspace');
  await expect(page.getByLabel('Timezone', { exact: true })).toHaveValue('UTC');
  if (testInfo.project.name === 'mobile')
    await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  expect(browserErrors).toEqual([]);
});
