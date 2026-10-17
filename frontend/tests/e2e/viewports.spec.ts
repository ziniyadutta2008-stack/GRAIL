import { expect, test, type Locator, type Page } from '@playwright/test'

const VIEWPORTS = [
  { width: 390, height: 844, label: '390x844' },
  { width: 768, height: 1024, label: '768x1024' },
  { width: 1366, height: 768, label: '1366x768' },
]

async function expectInsideViewport(page: Page, locator: Locator) {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  if (!box || !viewport) return
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe('viewport regression', () => {
  for (const viewport of VIEWPORTS) {
    test(`introduction, lifecycle, mitigation and steward tables at ${viewport.label}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'These sizes are set explicitly')
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')

      const enter = page.getByRole('link', { name: 'Enter governance workspace' }).first()
      const skip = page.getByRole('button', { name: 'Skip introduction' })
      const pause = page.getByRole('button', { name: 'Pause introduction' })
      await expectInsideViewport(page, enter)
      await expectInsideViewport(page, skip)
      await expectInsideViewport(page, pause)
      await expectNoHorizontalOverflow(page)

      await skip.click()
      await page.getByRole('link', { name: 'Enter governance workspace' }).first().click()
      await page.getByLabel('Persona').selectOption('persona-governance')
      await page.getByRole('button', { name: 'Continue' }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()

      await page.goto('/assess/ethics')
      const lifecycle = page.getByRole('table', { name: 'Responsible AI and data activity by lifecycle stage' })
      await expect(lifecycle).toBeVisible()
      await expect(lifecycle.getByText('Prohibited-use screening, affected-party analysis and Responsible AI principle scoring.')).toBeVisible()
      await expectNoHorizontalOverflow(page)

      await page.goto('/assess/ethics/triage')
      await expect(page.getByRole('heading', { name: 'Patient Triage Recommendation Model' })).toBeVisible()
      const mitigation = page.getByRole('table', { name: 'Mitigation options' })
      const tickets = page.getByRole('table', { name: 'Data quality steward tickets' })
      await expect(mitigation).toBeVisible()
      await expect(tickets).toBeVisible()
      await mitigation.scrollIntoViewIfNeeded()
      await expect(mitigation.locator('tbody tr').first()).toBeVisible()
      await tickets.scrollIntoViewIfNeeded()
      await expect(tickets.locator('tbody tr').first()).toBeVisible()
      await expectNoHorizontalOverflow(page)
    })
  }
})
