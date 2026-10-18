import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, 'Define E2E_EMAIL y E2E_PASSWORD');
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL!);
  await page.locator('#password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/dashboard/);
});
test('core client pages fit the viewport', async ({ page }) => {
  for (const path of ['/dashboard', '/recipes', '/meal-plan', '/shopping', '/pantry', '/settings']) {
    await page.goto(path); await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), path).toBe(true);
  }
});
test('settings expose clear subsections and export', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByRole('navigation', { name: /secciones de ajustes/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /descargar mis datos/i })).toBeVisible();
});
test('weekly plan compact actions remain touchable', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Control táctil móvil'); await page.goto('/meal-plan');
  const controls = page.locator('.meal-plan-week-daypill, .meal-plan-mobile-add-slot');
  for (let index = 0; index < Math.min(await controls.count(), 8); index += 1) expect((await controls.nth(index).boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(40);
});
