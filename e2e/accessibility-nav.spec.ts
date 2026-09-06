import { test, expect } from './fixtures/electron-app'

test.describe('Keyboard Accessibility & Sidebar Resizing', () => {
  test.beforeEach(async ({ mainWindow }) => {
    // Create workspace to enter app shell
    await expect(mainWindow.locator('.welcome h1')).toHaveText('Create your first workspace')
    await mainWindow.locator('#workspace-name').fill('Accessibility Studio')
    await mainWindow.locator('button[type="submit"]:has-text("Save")').click()
    await expect(mainWindow.locator('.app-shell')).toBeVisible()
  })

  test('resizes sidebar via keyboard arrow keys on separator', async ({ mainWindow }) => {
    const resizer = mainWindow.locator('.sidebar-resizer[role="separator"]')
    await expect(resizer).toBeVisible()

    // Default width is 308
    await expect(resizer).toHaveAttribute('aria-valuenow', '308')

    // Focus resizer and press ArrowRight to increase width (+16px -> 324)
    await resizer.focus()
    await resizer.press('ArrowRight')
    await expect(resizer).toHaveAttribute('aria-valuenow', '324')

    // Press ArrowLeft to decrease width (-16px -> 308)
    await resizer.press('ArrowLeft')
    await expect(resizer).toHaveAttribute('aria-valuenow', '308')

    // Verify localStorage persistence
    const savedWidth = await mainWindow.evaluate(() =>
      window.localStorage.getItem('devbox:sidebar-width:v1')
    )
    expect(savedWidth).toBe('308')
  })
})
