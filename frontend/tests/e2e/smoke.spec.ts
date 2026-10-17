import { expect, test } from '@playwright/test'

test('development persona reaches the FinanceGuard gate within two transitions', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Enter governance workspace' }).first().click()
  await page.getByLabel('Persona').selectOption('persona-system-owner')
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()
  await expect(page.getByText('Synthetic demonstration data').first()).toBeVisible()

  await page.getByRole('link', { name: 'FinanceGuard AI', exact: true }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'FinanceGuard AI' })).toBeVisible()
  await expect(page.getByText(/Blocking conditions/)).toBeVisible()
})

test('page never scrolls horizontally', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Enter governance workspace' }).first().click()
  await page.getByRole('button', { name: 'Continue' }).click()
  for (const path of ['/', '/ai-estate/financeguard-ai/controls', '/assess/soc2', '/decisions/exceptions']) {
    await page.evaluate((target) => {
      history.pushState({}, '', target)
      dispatchEvent(new PopStateEvent('popstate'))
    }, path)
    await expect(page.locator('h1').first()).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
