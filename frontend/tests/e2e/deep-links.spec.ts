import { expect, test } from '@playwright/test'

import { APPLICATION_ROUTES } from '../../src/app/deepLinks'

test('direct navigation and refresh open every nested route', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Persona').selectOption('persona-governance')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()

  for (const path of APPLICATION_ROUTES) {
    const response = await page.goto(path)
    expect(response?.ok(), path).toBeTruthy()
    await expect(page.getByText('Access Denied'), path).toHaveCount(0)
    await page.reload()
    await expect(page.locator('h1').first(), path).toBeVisible()
    await expect(page.getByText('Access Denied'), `${path} after refresh`).toHaveCount(0)
  }

  await page.goto('/assess/iso42001/financeguard-ai/controls/iso-fg-6.1.2')
  await expect(page.getByRole('heading', { name: /6\.1\.2/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: /6\.1\.2/ })).toBeVisible()
})
