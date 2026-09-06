import { test, expect } from './fixtures/electron-app'

test.describe('Workspace Lifecycle', () => {
  test('creates first workspace and renders app shell', async ({ mainWindow }) => {
    // 1. Initial welcome state
    await expect(mainWindow.locator('.welcome h1')).toHaveText('Create your first workspace')

    // 2. Submit new workspace name
    await mainWindow.locator('#workspace-name').fill('Acme Platform')
    await mainWindow.locator('button[type="submit"]:has-text("Save")').click()

    // 3. App shell should now be visible
    await expect(mainWindow.locator('.app-shell')).toBeVisible()

    // 4. Verify sidebar shows workspace name
    const switcher = mainWindow.locator('.workspace-switcher')
    await expect(switcher).toContainText('Acme Platform')

    // 5. Verify topbar breadcrumb contains workspace name
    const breadcrumb = mainWindow.locator('.topbar .breadcrumb')
    await expect(breadcrumb).toContainText('Acme Platform')

    // 6. Verify workspace avatar in the rail
    const avatar = mainWindow.locator('.workspace-avatar.selected')
    await expect(avatar).toBeVisible()
    await expect(avatar).toHaveAttribute('aria-label', 'Switch to Acme Platform')
  })

  test('supports creating multiple workspaces and switching between them', async ({
    mainWindow
  }) => {
    // Create first workspace
    await mainWindow.locator('#workspace-name').fill('Work Alpha')
    await mainWindow.locator('button[type="submit"]:has-text("Save")').click()
    await expect(mainWindow.locator('.app-shell')).toBeVisible()
    await expect(mainWindow.locator('.workspace-switcher')).toContainText('Work Alpha')

    // Open workspace switcher menu
    await mainWindow.locator('.workspace-switcher').click()
    await expect(mainWindow.locator('.workspace-menu')).toBeVisible()

    // Click create workspace in menu
    await mainWindow.locator('.create-workspace-action').click()
    await expect(mainWindow.locator('.workspace-menu[aria-label="Create workspace"]')).toBeVisible()

    // Fill and save second workspace
    const input = mainWindow.locator('.workspace-menu #workspace-name')
    await input.fill('Personal OSS')
    await expect(input).toHaveValue('Personal OSS')
    await input.press('Enter')

    // Current workspace should now be "Personal OSS"
    await expect(mainWindow.locator('.workspace-switcher')).toContainText('Personal OSS')
    await expect(mainWindow.locator('.topbar .breadcrumb')).toContainText('Personal OSS')

    // Switch back to "Work Alpha" via avatar in rail
    const alphaAvatar = mainWindow.locator('.workspace-avatar[aria-label="Switch to Work Alpha"]')
    await expect(alphaAvatar).toBeVisible()
    await alphaAvatar.click()

    // Active workspace should be "Work Alpha" again
    await expect(mainWindow.locator('.workspace-switcher')).toContainText('Work Alpha')
  })

  test('archives workspace and transitions active workspace correctly', async ({ mainWindow }) => {
    // Create first workspace
    await mainWindow.locator('#workspace-name').fill('First Project')
    await mainWindow.locator('button[type="submit"]:has-text("Save")').click()
    await expect(mainWindow.locator('.app-shell')).toBeVisible()

    // Create second workspace
    await mainWindow.locator('.workspace-switcher').click()
    await mainWindow.locator('.create-workspace-action').click()
    const input = mainWindow.locator('.workspace-menu #workspace-name')
    await input.fill('Second Project')
    await expect(input).toHaveValue('Second Project')
    await input.press('Enter')
    await expect(mainWindow.locator('.workspace-switcher')).toContainText('Second Project')

    // Go to Workspace Settings
    await mainWindow.locator('button[aria-label="Workspace settings"]').click()
    await expect(mainWindow.locator('.workspace-settings-view h1')).toHaveText('Workspace settings')

    // Click Archive button
    await mainWindow.locator('.danger-zone button:has-text("Archive")').click()

    // Active workspace should automatically fallback to remaining workspace "First Project"
    await expect(mainWindow.locator('.workspace-switcher')).toContainText('First Project')
  })

  test('rejects whitespace-only workspace names with validation error', async ({ mainWindow }) => {
    // Attempt submitting whitespace name
    await mainWindow.locator('#workspace-name').fill('   ')
    await mainWindow.locator('button[type="submit"]:has-text("Save")').click()

    // Form should show error message and not navigate away
    const errorMessage = mainWindow.locator('.workspace-form .error')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText('Workspace name must be between 1 and 80 characters.')
    await expect(mainWindow.locator('.app-shell')).not.toBeVisible()
  })

  test('rejects duplicate workspace names case-insensitively', async ({ mainWindow }) => {
    // 1. Create first workspace
    await mainWindow.locator('#workspace-name').fill('DevBox Core')
    await mainWindow.locator('button[type="submit"]:has-text("Save")').click()
    await expect(mainWindow.locator('.app-shell')).toBeVisible()

    // 2. Open workspace create form
    await mainWindow.locator('.workspace-switcher').click()
    await mainWindow.locator('.create-workspace-action').click()

    // 3. Try to create duplicate workspace with different case
    const input = mainWindow.locator('.workspace-menu #workspace-name')
    await input.fill('devbox core')
    await input.press('Enter')

    // 4. Form should display duplicate error
    const errorSpan = mainWindow.locator('.workspace-menu .error')
    await expect(errorSpan).toBeVisible()
  })
})

