import { test, expect } from './fixtures/electron-app'

test.describe('Integrations & Provider Setup Views', () => {
  test.beforeEach(async ({ mainWindow }) => {
    // Start with a workspace created
    await mainWindow.locator('#workspace-name').fill('Integrations Test Lab')
    await mainWindow.locator('button[type="submit"]:has-text("Save")').click()
    await expect(mainWindow.locator('.app-shell')).toBeVisible()
  })

  test('navigates to workspace Integrations panel', async ({ mainWindow }) => {
    await mainWindow.locator('.tools-heading button:has-text("Global integrations")').click()

    // Title should be Global integrations
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Global integrations')

    // Should show GitHub workspace integration connection screen
    await expect(mainWindow.locator('.integration-empty h2')).toContainText(
      'Bring GitHub into this workspace'
    )
    await expect(mainWindow.locator('#github-token')).toBeVisible()
  })

  test('navigates to Jira integration screen with Cloud and Data Center options', async ({
    mainWindow
  }) => {
    // Navigate to Jira via Tickets nav item
    await mainWindow.locator('nav.primary-nav button:has-text("Tickets")').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Tickets')

    // Verify Jira setup form
    await expect(mainWindow.locator('.integration-empty h2')).toContainText(
      'Bring Jira into this workspace'
    )

    // Deployment dropdown should have Jira Cloud and Jira Data Center
    const deploymentSelect = mainWindow.locator('.token-form select')
    await expect(deploymentSelect).toBeVisible()
    await expect(deploymentSelect.locator('option')).toHaveCount(2)

    // Verify inputs for Jira Cloud
    await expect(mainWindow.locator('input[placeholder="https://your-site.atlassian.net"]')).toBeVisible()
    await expect(mainWindow.locator('input[type="email"]')).toBeVisible()

    // Switch to Jira Data Center and verify email input disappears
    await deploymentSelect.selectOption('data-center')
    await expect(mainWindow.locator('input[type="email"]')).not.toBeVisible()
  })

  test('displays empty state for Git view when no repository is attached', async ({ mainWindow }) => {
    // From Git view with no repository attached
    await mainWindow.locator('nav.primary-nav button:has-text("Git")').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Git')
    await expect(mainWindow.locator('.empty-state h2')).toHaveText('Attach a repository to Git')
    await expect(mainWindow.locator('.empty-state button')).toHaveText('Choose repository')
  })

  test('navigates to Global Settings and verifies backup controls', async ({ mainWindow }) => {
    // Click global settings button in the rail
    await mainWindow.locator('button[aria-label="Global settings"]').click()
    await expect(mainWindow.locator('.topbar .breadcrumb b')).toHaveText('Global settings')

    // Verify appearance section
    await expect(mainWindow.locator('.settings-view h1')).toHaveText('Global settings')
    await expect(mainWindow.locator('.settings-view h2:has-text("Appearance")')).toBeVisible()

    // Verify backup section
    await expect(mainWindow.locator('.backup-settings h2')).toHaveText('GitHub backup')
    await expect(mainWindow.locator('.backup-warning')).toContainText('Backups are not encrypted')
  })
})
