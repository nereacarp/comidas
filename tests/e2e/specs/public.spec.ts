import { expect, test } from '@playwright/test';
test('login and password recovery are accessible without horizontal overflow', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await page.getByRole('link', { name: /olvidado/i }).click();
  await expect(page).toHaveURL(/forgot-password/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});
test('registration has labelled controls', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByLabel(/nombre/i)).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/^contraseña/i)).toBeVisible();
});
