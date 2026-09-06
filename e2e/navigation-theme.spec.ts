import { test, expect } from './fixtures/electron-app'

test.describe('Navigation and Theme Settings', () => {
  test.beforeEach(async ({ mainWindow }) => {
    // Set up initial workspace for navigation tests
    await mainWindow.locator('#workspace-name').fill('Dev Central')
    await mainWindow.locator('button[type="submit"]:has-text("Save")').click()
    await expect(mainWindow.locator('.app-shell')).toBeVisible()
  })

  test('navigates across sidebar views (Overview, Git, Tickets, Integrations)', async ({
    mainWindow
  }) => {
    // 1. Initial view is Overview
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Overview')
    await expect(mainWindow.locator('.attention-section')).toBeVisible()

    // 2. Navigate to Git (GitHub)
    await mainWindow.locator('nav.primary-nav button:has-text("Git")').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Git')
    await expect(mainWindow.locator('.integration-empty h2')).toContainText(
      'Bring GitHub into this workspace'
    )

    // 3. Navigate to Tickets (Jira)
    await mainWindow.locator('nav.primary-nav button:has-text("Tickets")').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Tickets')
    await expect(mainWindow.locator('.integration-empty h2')).toContainText(
      'Bring Jira into this workspace'
    )

    // 4. Navigate to Integrations catalog
    await mainWindow.locator('.tools-heading button:has-text("Integrations")').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Integrations')
    await expect(mainWindow.locator('.integration-directory h1')).toHaveText('Integrations')
    await expect(mainWindow.locator('.integration-grid')).toBeVisible()

    // 5. Navigate back to Overview
    await mainWindow.locator('nav.primary-nav button:has-text("Overview")').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Overview')
  })

  test('toggles theme between dark and light modes via the workspace rail', async ({
    mainWindow
  }) => {
    // 1. Initial theme is dark
    const initialTheme = await mainWindow.evaluate(() => document.documentElement.dataset.theme)
    expect(initialTheme).toBe('dark')

    const themeButton = mainWindow.locator('.rail-theme-button')
    await expect(themeButton).toHaveAttribute('aria-label', 'Use light mode')

    // 2. Click to toggle to light mode
    await themeButton.click()

    const lightTheme = await mainWindow.evaluate(() => document.documentElement.dataset.theme)
    expect(lightTheme).toBe('light')
    await expect(themeButton).toHaveAttribute('aria-label', 'Use dark mode')

    // 3. Click again to toggle back to dark mode
    await themeButton.click()

    const toggledBackTheme = await mainWindow.evaluate(
      () => document.documentElement.dataset.theme
    )
    expect(toggledBackTheme).toBe('dark')
    await expect(themeButton).toHaveAttribute('aria-label', 'Use light mode')
  })
})
