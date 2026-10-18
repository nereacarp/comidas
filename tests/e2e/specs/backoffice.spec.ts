import { expect, test } from '@playwright/test';
test('backoffice login, metrics and mobile layout', async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_SECRET, 'Define E2E_ADMIN_SECRET y abre el túnel del backoffice');
  await page.goto(process.env.E2E_BACKOFFICE_URL ?? 'http://localhost:8080');
  await page.getByLabel(/identificador/i).fill(process.env.E2E_ADMIN_ACTOR ?? 'admin');
  await page.getByLabel(/contraseña/i).fill(process.env.E2E_ADMIN_SECRET!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page.getByRole('heading', { name: /resumen/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await page.getByRole('link', { name: /usuarios/i }).click();
  await expect(page.getByLabel(/buscar/i)).toBeVisible();
});
