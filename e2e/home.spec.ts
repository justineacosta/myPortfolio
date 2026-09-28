import { expect, test } from '@playwright/test'

test("Home shows Kraft's headline, lede and actions", async ({ page }) => {
  await page.goto('/')
  const main = page.locator('#main-content')
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Software that keeps its promises.')
  await expect(main.getByText(/^Full-stack development, AI automation and workflow systems/)).toBeVisible()
  await main.getByRole('link', { name: 'See the work' }).click()
  await expect(page).toHaveURL(/\/projects$/)
})
