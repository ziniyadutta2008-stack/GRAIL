import { expect, test } from '@playwright/test'

import { APPLICATION_ROUTES } from '../../src/app/deepLinks'

test('direct navigation and refresh open every nested route', async ({ page }) => {
  // Every nested route is visited twice (goto + reload); allow time for a cold Vite server.
  test.setTimeout(180_000)

  await page.goto('/sign-in')
  await page.getByLabel('Persona').selectOption('persona-governance')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()

  for (const path of APPLICATION_ROUTES) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response?.ok(), path).toBeTruthy()
    await expect(page.getByText('Access Denied'), path).toHaveCount(0)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1').first(), path).toBeVisible()
    await expect(page.getByText('Access Denied'), `${path} after refresh`).toHaveCount(0)
  }

  await page.goto('/assess/iso42001/financeguard-ai/controls/iso-fg-6.1.2')
  await expect(page.getByRole('heading', { name: /6\.1\.2/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: /6\.1\.2/ })).toBeVisible()
})
