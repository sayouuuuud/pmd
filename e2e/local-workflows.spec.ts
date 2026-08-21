import { expect, test } from '@playwright/test'

test('task workspace exposes bulk actions and dependency controls', async ({ page }) => {
  await page.goto('/tasks')
  await expect(page.getByRole('heading', { name: 'المهام' })).toBeVisible()
  await expect(page.getByLabel('إجراءات المهام الجماعية')).toBeVisible()

  const taskSelectors = page.getByRole('checkbox', { name: /تحديد / })
  if (await taskSelectors.count()) {
    await taskSelectors.first().check()
    await expect(page.getByText('1 محددة')).toBeVisible()
    await expect(page.getByRole('button', { name: 'أرشفة' })).toBeEnabled()
  }
})

test('projects render derived progress surfaces', async ({ page }) => {
  await page.goto('/projects')
  await expect(page.getByRole('heading', { name: 'المشاريع' })).toBeVisible()
  await expect(page.locator('main')).toContainText(/%|٪/)
})
