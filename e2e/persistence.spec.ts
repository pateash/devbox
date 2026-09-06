import { test, expect } from './fixtures/electron-app'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test.describe.serial('Persistence Across Restarts', () => {
  const sharedUserDataDir = mkdtempSync(join(tmpdir(), 'devbox-persistence-'))

  test.use({ customUserDataDir: sharedUserDataDir })

  test.afterAll(() => {
    try {
      rmSync(sharedUserDataDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup error if files are locked
    }
  })

  test('session 1: creates workspace and sets theme preference', async ({ mainWindow }) => {
    // 1. First run: Welcome screen is presented
    await expect(mainWindow.locator('.welcome h1')).toHaveText('Create your first workspace')

    // 2. Create workspace
    await mainWindow.locator('#workspace-name').fill('Persistent Workspace')
    await mainWindow.locator('button[type="submit"]:has-text("Save")').click()
    await expect(mainWindow.locator('.app-shell')).toBeVisible()
    await expect(mainWindow.locator('.workspace-switcher')).toContainText('Persistent Workspace')

    // 3. Toggle theme to light mode
    const themeButton = mainWindow.locator('.rail-theme-button')
    await themeButton.click()
    expect(await mainWindow.evaluate(() => document.documentElement.dataset.theme)).toBe('light')
  })

  test('session 2: restores existing workspace and theme on fresh app launch', async ({
    mainWindow
  }) => {
    // 1. Verify welcome screen is bypassed directly into the app shell
    await expect(mainWindow.locator('.welcome')).not.toBeVisible()
    await expect(mainWindow.locator('.app-shell')).toBeVisible()

    // 2. Verify workspace name is retained from session 1
    await expect(mainWindow.locator('.workspace-switcher')).toContainText('Persistent Workspace')
    await expect(mainWindow.locator('.topbar .breadcrumb')).toContainText('Persistent Workspace')

    // 3. Verify light theme is preserved
    const restoredTheme = await mainWindow.evaluate(() => document.documentElement.dataset.theme)
    expect(restoredTheme).toBe('light')
  })
})
